"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/error";
import { serializeData } from "@/app/utils/serializers";

// Generate commission reference number
function generateCommissionRef() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `STAT-${year}-${random}`;
}

// Get employee commissions
export async function getEmployeeCommissions(empNo: number) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: Number(empNo) },
    });

    const commissions = await prisma.commission.findMany({
      where: { memberEmpNo: member?.empNo },
      include: {
        investment: true,
      },
    });

    return { commissions: serializeData(commissions) };
  } catch (error) {
    console.error("Error fetching employee commissions:", error);
    throw new Error("Failed to fetch employee commissions");
  }
}

// Get eligible commissions for employee
export async function getEligibleCommissions(empNo: string, branchId: number) {
  try {
    const advisor = await prisma.member.findUnique({
      where: { empNo },
      include: {
        position: {
          include: { orc: true },
        },
      },
    });

    if (!advisor) {
      throw new Error("Advisor not found");
    }

    const uplines = await prisma.member.findMany({
      where: {
        branchId,
        position: {
          rank: {
            gt: advisor.position?.rank || 0,
          },
        },
      },
      include: {
        position: {
          include: { orc: true },
        },
      },
    });

    return serializeData({ advisor, upperMember: uplines });
  } catch (error) {
    console.error("Error fetching eligible commissions:", error);
    throw error;
  }
}

// Process commissions for an investment
export async function processCommissions(data: {
  investmentId: number;
  empNo: string;
  branchId: number;
}) {
  const { investmentId, empNo, branchId } = data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const createdCommissions: any[] = [];

      // Load investment
      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
      });

      if (!investment) {
        throw new ApiError("INVESTMENT_NOT_FOUND", "Investment not found", 404);
      }

      if (investment.commissionsProcessed) {
        const existingCommissions = await tx.commission.findMany({
          where: { investmentId },
          include: {
            member: {
              select: {
                empNo: true,
                name: true,
                position: true,
              },
            },
          },
        });

        return serializeData({
          alreadyProcessed: true,
          investment,
          commissions: existingCommissions,
        });
      }

      const updatedInvestment = await tx.investment.update({
        where: { id: investmentId },
        data: { commissionsProcessed: true },
      });

      const advisor = await tx.member.findUnique({
        where: { empNo },
        include: {
          position: {
            include: { orc: true },
          },
        },
      });

      if (!advisor) {
        throw new ApiError("ADVISOR_NOT_FOUND", "Advisor not found", 404);
      }

      if (!advisor.position) {
        throw new ApiError("POSITION_MISSING", "Advisor has no position");
      }

      if (!advisor.position.orc) {
        throw new ApiError("ORC_NOT_SET", "Advisor ORC not set");
      }

      // PERSONAL commission
      const personalTier = await tx.personalCommissionTier.findFirst({
        where: { positionId: advisor.positionId },
      });

      if (!personalTier) {
        throw new ApiError("NO_TIER", "No personal commission tier found");
      }

      const personalRate = Number(personalTier.rate) / 100;

      if (personalRate > 10) {
        throw new ApiError(
          "PERSONAL_RATE_TOO_HIGH",
          "Personal commission rate too high! Possible config error."
        );
      }

      const personalCommissionAmount = investment.amount * personalRate;

      const updatedAdvisor = await tx.member.update({
        where: { empNo },
        data: {
          totalCommission: {
            increment: personalCommissionAmount,
          },
        },
      });

      const personalCommRecord = await tx.commission.create({
        data: {
          investmentId,
          memberEmpNo: empNo,
          branchId: branchId,
          amount: personalCommissionAmount,
          type: "PERSONAL",
          refNumber: generateCommissionRef(),
        } as any,
        include: {
          member: {
            include: {
              position: true,
            },
          },
        },
      });

      createdCommissions.push(personalCommRecord);

      // UPLINE commissions
      const uplines = await tx.member.findMany({
        where: {
          branchId,
          position: {
            rank: {
              gt: advisor.position.rank,
            },
          },
        },
        include: {
          position: {
            include: { orc: true },
          },
        },
      });

      for (const upline of uplines) {
        if (!upline.position?.orc) continue;

        const uplineRate = Number(upline.position.orc.rate) / 100;

        if (uplineRate > 1) {
          throw new ApiError(
            "ORC_RATE_TOO_HIGH",
            "ORC Commission rate too high! Possible config error."
          );
        }

        const uplineCommissionAmount = investment.amount * uplineRate;

        await tx.member.update({
          where: { empNo: upline.empNo },
          data: {
            totalCommission: {
              increment: uplineCommissionAmount,
            },
          },
        });

        const uplineCommRecord = await tx.commission.create({
          data: {
            investmentId,
            memberEmpNo: upline.empNo,
            amount: uplineCommissionAmount,
            type: "UPLINE",
            refNumber: generateCommissionRef(),
          } as any,
          include: {
            member: {
              include: {
                position: true,
              },
            },
          },
        });

        createdCommissions.push(uplineCommRecord);
      }

      return serializeData({
        alreadyProcessed: false,
        investment: updatedInvestment,
        advisor: updatedAdvisor,
        commissions: createdCommissions,
      });
    });

    revalidatePath("/features/commissions");
    return { success: true, receipt: serializeData(result) };
  } catch (err: any) {
    console.error("Error processing commissions:", err);

    if (err instanceof ApiError) {
      return {
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong",
      },
    };
  }
}


export async function getCommissionByBranch(branchId: number) {
  try {
    const commissions = await prisma.commission.findMany({
      where: { branchId },
      include: {
        member: true, investment: {include:{plan:true, }}, Branch: true
      },
      orderBy: { createdAt: "desc" },

    });

    return serializeData(commissions);
  } catch (error) {
    console.error("Error fetching commissions by branch:", error);
    throw new Error("Failed to fetch commissions by branch");
  }
}

export async function getCommissionDetails() {
  try {
    const investments = await prisma.commission.findMany({
      select: {
        id: true,
        amount: true,
        Branch: true,
        investment: {include:{plan: true}},
        member: true,
        

      },
    });

    return serializeData(investments);
  } catch (error) {
    console.error("Error fetching investment details:", error);
    throw new Error("Failed to fetch investment details");
  }
}