"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/error";
import { serializeData } from "@/app/utils/serializers";

// Generate commission reference number
function generateCommissionRef() {
  return `COM-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
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
        position: { include: { orc: true } },
        branches: { include: { branch: true, member:true } },
      },
    });

    if (!advisor) throw new Error("Advisor not found");

    const uplines = await getUplineChain(advisor.position?.rank ?? 0, branchId);

    return serializeData({ advisor, upperMember: uplines });
  } catch (error) {
    console.error("Error fetching eligible commissions:", error);
    throw error;
  }
}
// Process commissions for an investment

// ── processCommissions ────────────────────────────────────────────────────────
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

      if (!investment) throw new ApiError("INVESTMENT_NOT_FOUND", "Investment not found", 404);

      // Already processed — return existing
      if (investment.commissionsProcessed) {
        const existingCommissions = await tx.commission.findMany({
          where: { investmentId },
          include: {
            member: {
              select: { empNo: true, nameWithInitials: true, position: true },
            },
          },
        });
        return serializeData({ alreadyProcessed: true, investment, commissions: existingCommissions });
      }

      await tx.investment.update({
        where: { id: investmentId },
        data: { commissionsProcessed: true },
      });

      // Load advisor
      const advisor = await tx.member.findUnique({
        where: { empNo },
        include: {
          position: {
            include: {
              orc: true,
              personalCommissionTiers: true,
            },
          },
        },
      });

      if (!advisor) throw new ApiError("ADVISOR_NOT_FOUND", "Advisor not found", 404);
      if (!advisor.position) throw new ApiError("POSITION_MISSING", "Advisor has no position");

      // Personal commission
      const personalTier = await tx.personalCommissionTier.findFirst({
        where: { positionId: advisor.positionId },
      });

      if (!personalTier) throw new ApiError("NO_TIER", "No personal commission tier found");

      const personalRate = Number(personalTier.rate) / 100;
      if (personalRate > 10) throw new ApiError("PERSONAL_RATE_TOO_HIGH", "Personal commission rate too high");

      const personalAmount = investment.amount * personalRate;

      const updatedAdvisor = await tx.member.update({
        where: { empNo },
        data: { totalCommission: { increment: personalAmount } },
      });

      const personalRecord = await tx.commission.create({
        data: {
          investmentId,
          memberEmpNo: empNo,
          branchId,
          amount: personalAmount,
          type: "PERSONAL",
          refNumber: generateCommissionRef(),
        } as any,
        include: { member: { include: { position: true } } },
      });

      createdCommissions.push(personalRecord);

      // Upline commissions — cross-branch aware
      const uplines = await getUplineChain(advisor.position.rank, branchId);

      for (const upline of uplines) {
        if (!upline.position?.orc) continue;

        const uplineRate = Number(upline.position.orc.rate) / 100;
        if (uplineRate > 1) throw new ApiError("ORC_RATE_TOO_HIGH", "ORC rate too high");

        const uplineAmount = investment.amount * uplineRate;

        await tx.member.update({
          where: { empNo: upline.empNo },
          data: { totalCommission: { increment: uplineAmount } },
        });

        const uplineRecord = await tx.commission.create({
          data: {
            investmentId,
            memberEmpNo: upline.empNo,
            amount: uplineAmount,
            type: "UPLINE",
            refNumber: generateCommissionRef(),
          } as any,
          include: { member: { include: { position: true } } },
        });

        createdCommissions.push(uplineRecord);
      }

      return serializeData({
        alreadyProcessed: false,
        investment,
        advisor: updatedAdvisor,
        commissions: createdCommissions,
      });
    });

    revalidatePath("/features/commissions");
    return { success: true, receipt: serializeData(result) };
  } catch (err: any) {
    console.error("Error processing commissions:", err);

    if (err instanceof ApiError) {
      return { success: false, error: { code: err.code, message: err.message } };
    }

    return { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } };
  }
}

export async function getCommissionByBranch(branchId: number) {
  try {
    const commissions = await prisma.commission.findMany({
      where: { branchId },
      include: {
        member: true, investment: { include: { plan: true, } }, Branch: true
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
        investment: { include: { plan: true } },
        member: true,


      },
    });

    return serializeData(investments);
  } catch (error) {
    console.error("Error fetching investment details:", error);
    throw new Error("Failed to fetch investment details");
  }
}


// ── Helper: get full upline chain for an employee ─────────────────────────────
// Walks up by rank — first within branch (FA→TL→BM), then cross-branch (RM→ZM→AGM)
async function getUplineChain(advisorRank: number, branchId: number) {
  // Step 1: find all members in the same branch with higher rank
  const branchUplines = await prisma.member.findMany({
    where: {
      branches: { some: { branchId } },
      position: { rank: { gt: advisorRank } },
    },
    include: {
      position: { include: { orc: true } },
      branches: { include: { branch: true } },
    },
    orderBy: { position: { rank: "asc" } },
  });

  // Step 2: find cross-branch seniors (RM, ZM, AGM) who manage this branch
  // They're in MemberBranch for this branchId but have higher rank than any BM
  const highestBranchRank = branchUplines.length > 0
    ? Math.max(...branchUplines.map(m => m.position?.rank ?? 0))
    : advisorRank;

  const crossBranchUplines = await prisma.member.findMany({
    where: {
      branches: { some: { branchId } },
      position: { rank: { gt: highestBranchRank } },
    },
    include: {
      position: { include: { orc: true } },
      branches: { include: { branch: true } },
    },
    orderBy: { position: { rank: "asc" } },
  });

  // Merge, deduplicate by empNo, preserve rank order
  const seen = new Set<string>();
  const all = [...branchUplines, ...crossBranchUplines].filter(m => {
    if (seen.has(m.empNo)) return false;
    seen.add(m.empNo);
    return true;
  });

  return all.sort((a, b) => (a.position?.rank ?? 0) - (b.position?.rank ?? 0));
}


export async function runMonthlyEvaluation(data: {
  memberId: number;
  year: number;
  month: number; // 1–12
}) {
  const { memberId, year, month } = data;

  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        position: true,
        clients: {
          include: {
            investments: true,
          },
        },
      },
    });

    if (!member) return { success: false, error: "Member not found" };
    if (!member.probationStartDate) return { success: false, error: "Probation start date not set" };

    // Calculate which probation month this is
    const start = new Date(member.probationStartDate);
    const evalDate = new Date(year, month - 1, 1);
    const monthsElapsed = (evalDate.getFullYear() - start.getFullYear()) * 12
      + (evalDate.getMonth() - start.getMonth());

    // Only run probation bonuses for months 0–5 (first 6 months)
    let periodNumber: number | null = null;
    let monthInPeriod: number | null = null;

    if (member.status === "PROBATION" && monthsElapsed >= 0 && monthsElapsed < 6) {
      periodNumber = monthsElapsed < 3 ? 1 : 2;
      monthInPeriod = (monthsElapsed % 3) + 1;
    }

    // Sum investment volume for this employee's clients in the given month
    const volumeAchieved = member.clients.reduce((sum, client) => {
      return sum + client.investments
        .filter(inv => {
          const d = new Date(inv.investmentDate);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        })
        .reduce((s, inv) => s + inv.amount, 0);
    }, 0);

    let bonusEarned = 0;
    let excessBonus = 0;
    let targetHit = false;
    let targetAmount = 0;

    // Fetch position target if in probation
    if (periodNumber && monthInPeriod && member.positionId) {
      const target = await prisma.positionTarget.findUnique({
        where: {
          positionId_periodNumber_monthNumber: {
            positionId: member.positionId,
            periodNumber,
            monthNumber: monthInPeriod,
          },
        },
      });

      if (target) {
        targetAmount = target.targetAmount;
        targetHit = volumeAchieved >= targetAmount;

        if (targetHit) {
          bonusEarned = target.bonusAmount;

          // Period 2 excess commission
          if (periodNumber === 2 && target.excessRate > 0) {
            const excess = volumeAchieved - targetAmount;
            excessBonus = excess * target.excessRate;
          }
        }
      }
    }

    // Upsert evaluation record
    const evaluation = await prisma.monthlyEvaluation.upsert({
      where: { memberId_year_month: { memberId, year, month } },
      update: { volumeAchieved, targetAmount, bonusEarned, excessBonus, targetHit, periodNumber, monthInPeriod },
      create: { memberId, year, month, periodNumber, monthInPeriod, volumeAchieved, targetAmount, bonusEarned, excessBonus, targetHit },
    });

    // Auto-promote to PERMANENT after 6 months probation
    if (member.status === "PROBATION" && monthsElapsed >= 5) {
      await prisma.member.update({
        where: { id: memberId },
        data: { status: "PERMANENT" },
      });
    }

    revalidatePath("/features/hr/evaluations");
    return { success: true, evaluation: serializeData(evaluation) };
  } catch (err) {
    console.error("Monthly evaluation error:", err);
    return { success: false, error: "Failed to run evaluation" };
  }
}
