"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/error";
import { serializeData } from "@/app/utils/serializers";
import { logActivity } from "@/lib/logActivity";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { ActivityAction, ActivityEntity } from "@prisma/client";

// Generate commission reference number
function generateCommissionRef() {
  return `COM-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function getCommissionStats() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const last7Days = new Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const [
      totalSum,
      monthlySum,
      count,
      heatmapRaw,
      recentCommissions
    ] = await Promise.all([
      prisma.commission.aggregate({
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.commission.count(),
      prisma.commission.groupBy({
        by: ['createdAt'],
        _count: { id: true },
        where: {
          createdAt: { gte: last7Days[0] }
        }
      }),
      prisma.commission.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          member: true,
          investment: {
            include: { client: true, plan: true }
          },
          Branch: true
        }
      })
    ]);

    const heatmap = last7Days.map(date => {
      const match = heatmapRaw.find(d =>
        new Date(d.createdAt).toDateString() === date.toDateString()
      );
      return match ? match._count.id : 0;
    });

    return {
      totalSum: totalSum._sum.amount || 0,
      monthlySum: monthlySum._sum.amount || 0,
      count,
      heatmap,
      recentCommissions: serializeData(recentCommissions)
    };
  } catch (error) {
    console.error("Error fetching commission stats:", error);
    throw new Error("Failed to fetch commission stats");
  }
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
        investment: { include: { plan: true, client: true } },

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
    const advisor = await prisma.member.findFirst({
      where: { empNo, isActive: true },
      include: {
        position: { include: { salary: true } },
        branches: { include: { branch: true, member: true } },
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



// ── process commissions ────────────────────────────────────────────────────────
export async function processCommissions(data: {
  investmentId: number;
  empNo: string;
  branchId: number;
  disabledEmpNos?: string[];   // members toggled off in UI — fully skipped
  manualEmpNos?: string[];     // manually added members to receive ORC
}) {
  const {
    investmentId,
    empNo,
    branchId,
    disabledEmpNos = [],
    manualEmpNos = [],
  } = data;

  const disabledSet = new Set(disabledEmpNos);

  try {
    const currentUser = await getCurrentUserWithRole();

    const advisor = await prisma.member.findUnique({
      where: { empNo },
      include: {
        position: {
          include: {
            orc: true,
            salary: true,
          },
        },
      },
    });

    if (!advisor) throw new ApiError("ADVISOR_NOT_FOUND", "Advisor not found", 404);

    // Fetch upline chain for the advisor
    const uplines = await getUplineChain(advisor.position.rank, branchId);

    // Fetch manually added members with their ORC config
    const manualMembers =
      manualEmpNos.length > 0
        ? await prisma.member.findMany({
            where: { empNo: { in: manualEmpNos } },
            include: {
              position: {
                include: { orc: true, salary: true },
              },
            },
          })
        : [];

    const result = await prisma.$transaction(async (tx) => {
      const createdCommissions: any[] = [];

      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
      });

      if (!investment)
        throw new ApiError("INVESTMENT_NOT_FOUND", "Investment not found", 404);

      if (investment.commissionsProcessed) {
        const existingCommissions = await tx.commission.findMany({
          where: { investmentId },
          include: {
            member: {
              select: { empNo: true, nameWithInitials: true, position: true },
            },
          },
        });
        return serializeData({
          alreadyProcessed: true,
          investment,
          commissions: existingCommissions,
        });
      }

      if (!advisor.position)
        throw new ApiError("POSITION_MISSING", "Advisor has no position");

      if (advisor.status !== "PROBATION" && !advisor.position.salary) {
        throw new ApiError(
          "SALARY_CONFIG_MISSING",
          "No salary config for position"
        );
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const commThreshold = Number(
        advisor.position.salary?.commThreshold ?? 500000
      );
      const isPermanent = advisor.status === "PERMANENT";
      const isHighRate = investment.amount >= commThreshold;

      const commRate = isPermanent
        ? isHighRate
          ? Number(advisor.position.salary?.commRateHigh ?? 0.08)
          : Number(advisor.position.salary?.commRateLow ?? 0.05)
        : isHighRate
          ? 0.1
          : 0.07;

      const personalCommissionAmount = investment.amount * commRate;

      await tx.investment.update({
        where: { id: investmentId },
        data: { commissionsProcessed: true, advisorId: advisor.id },
      });

      await tx.monthlyPayroll.upsert({
        where: { memberId_year_month: { memberId: advisor.id, year, month } },
        update: { volumeAchieved: { increment: investment.amount } },
        create: {
          memberId: advisor.id,
          year,
          month,
          basicSalaryPermanent: 0,
          monthlyTarget: 0,
          volumeAchieved: investment.amount,
        },
      });

      const updatedAdvisor = await tx.member.update({
        where: { empNo },
        data: { totalCommission: { increment: personalCommissionAmount } },
      });

      const personalCommissionRecord = await tx.commission.create({
        data: {
          investmentId,
          memberEmpNo: empNo,
          branchId,
          amount: personalCommissionAmount,
          type: "PERSONAL",
          refNumber: generateCommissionRef(),
        } as any,
        include: { member: { include: { position: true } } },
      });

      createdCommissions.push(personalCommissionRecord);

      // --- Upline commissions (hierarchy chain) ---
      for (const upline of uplines) {
        // Fully skip disabled members — no volume, no commission
        if (disabledSet.has(upline.empNo)) continue;

        await tx.monthlyPayroll.upsert({
          where: {
            memberId_year_month: { memberId: upline.id, year, month },
          },
          update: { volumeAchieved: { increment: investment.amount } },
          create: {
            memberId: upline.id,
            year,
            month,
            basicSalaryPermanent: 0,
            monthlyTarget: 0,
            volumeAchieved: investment.amount,
          },
        });

        if (!upline.position?.orc) continue;

        const orcRate =
          upline.status === "PERMANENT"
            ? upline.position.orc.ratePermanent
            : upline.position.orc.rateNonPermanent;

        const uplineRate = Number(orcRate);
        if (uplineRate === 0) continue;
        if (uplineRate > 1)
          throw new ApiError("ORC_RATE_TOO_HIGH", "ORC rate too high");

        const uplineAmount = investment.amount * uplineRate;

        await tx.member.update({
          where: { empNo: upline.empNo },
          data: { totalCommission: { increment: uplineAmount } },
        });

        const uplineCommissionRecord = await tx.commission.create({
          data: {
            investmentId,
            memberEmpNo: upline.empNo,
            amount: uplineAmount,
            type: "UPLINE",
            refNumber: generateCommissionRef(),
            branchId,
          } as any,
          include: { member: { include: { position: true } } },
        });

        createdCommissions.push(uplineCommissionRecord);
      }

      // --- Manually added members (flat, same ORC formula) ---
      for (const manual of manualMembers) {
        // Already filtered to enabled-only before passing in, but guard anyway
        if (disabledSet.has(manual.empNo)) continue;

        await tx.monthlyPayroll.upsert({
          where: {
            memberId_year_month: { memberId: manual.id, year, month },
          },
          update: { volumeAchieved: { increment: investment.amount } },
          create: {
            memberId: manual.id,
            year,
            month,
            basicSalaryPermanent: 0,
            monthlyTarget: 0,
            volumeAchieved: investment.amount,
          },
        });

        if (!manual.position?.orc) continue;

        const orcRate =
          manual.status === "PERMANENT"
            ? manual.position.orc.ratePermanent
            : manual.position.orc.rateNonPermanent;

        const manualRate = Number(orcRate);
        if (manualRate === 0) continue;
        if (manualRate > 1)
          throw new ApiError("ORC_RATE_TOO_HIGH", "ORC rate too high");

        const manualAmount = investment.amount * manualRate;

        await tx.member.update({
          where: { empNo: manual.empNo },
          data: { totalCommission: { increment: manualAmount } },
        });

        const manualCommissionRecord = await tx.commission.create({
          data: {
            investmentId,
            memberEmpNo: manual.empNo,
            amount: manualAmount,
            type: "UPLINE",
            refNumber: generateCommissionRef(),
            branchId,
          } as any,
          include: { member: { include: { position: true } } },
        });

        createdCommissions.push(manualCommissionRecord);
      }

      return serializeData({
        alreadyProcessed: false,
        investment,
        advisor: updatedAdvisor,
        commissions: createdCommissions,
      });
    });

    revalidatePath("/features/commissions");

    void logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.COMMISSION,
      entityId: investmentId,
      performedById: currentUser?.member?.id ?? 0,
      branchId,
      metadata: {
        investmentId,
        advisorEmpNo: empNo,
        processedAt: new Date().toISOString(),
        disabledEmpNos,
        manualEmpNos,
      },
    });

    return { success: true, receipt: serializeData(result) };
  } catch (err: any) {
    console.error("Error processing commissions:", err);

    if (err instanceof ApiError) {
      return {
        success: false,
        error: { code: err.code, message: err.message },
      };
    }

    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    };
  }
}

export async function getCommissionByBranch(branchId: number) {
  try {
    const commissions = await prisma.commission.findMany({
      where: { branchId },
      include: {
        member: true, investment: { include: { plan: true, client: true } }, Branch: true
      },
      orderBy: { createdAt: "desc" },

    });

    console.log(commissions);


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

        investment: { include: { plan: true, client: true } },
        member: true,


      },
    });

    return serializeData(investments);
  } catch (error) {
    console.error("Error fetching investment details:", error);
    throw new Error("Failed to fetch investment details");
  }
}

async function getUplineChain(advisorRank: number, branchId: number) {

  const branchUplines = await prisma.member.findMany({
    where: {
      isActive: true,
      branches: { some: { branchId } },
      position: { rank: { gt: advisorRank } },
    },
    include: {
      position: { include: { salary: true, orc: true } },
      branches: { include: { branch: true } },
    },
    orderBy: { position: { rank: "asc" } },
  });

  console.log("branch Uplines : ", branchUplines);


  const highestBranchRank = branchUplines.length > 0
    ? Math.max(...branchUplines.map(m => m.position?.rank ?? 0))
    : advisorRank;

  const crossBranchUplines = await prisma.member.findMany({
    where: {
      branches: { some: { branchId } },
      position: { rank: { gt: highestBranchRank } },
    },
    include: {
      position: { include: { salary: true, orc: true } },
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
