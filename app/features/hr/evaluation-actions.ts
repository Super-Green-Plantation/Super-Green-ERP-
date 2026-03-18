"use server";

import { prisma } from "@/lib/prisma";
import { serializeData } from "@/app/utils/serializers";
import { revalidatePath } from "next/cache";

// ── getEvaluationPreview ──────────────────────────────────────────────────────
// Returns a preview of what the evaluation would produce for all members
// in a branch for a given month/year — without writing anything to DB.

export async function getEvaluationPreview(branchId: number, year: number, month: number) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const memberBranches = await prisma.memberBranch.findMany({
      where: { branchId },
      include: {
        member: {
          include: {
            position: {
              include: {
                positionTargets: true,
              },
            },
            monthlyEvaluations: {
              where: { year, month },
            },
            clients: {
              include: {
                investments: {
                  where: {
                    investmentDate: {
                      gte: startDate,
                      lt: endDate,
                    },
                  },
                  select: { amount: true },
                },
              },
            },
          },
        },
      },
    });

    const previews = memberBranches.map(({ member }) => {
      const volumeAchieved = member.clients.reduce((sum, client) =>
        sum + client.investments.reduce((s, inv) => s + inv.amount, 0), 0
      );

      let periodNumber: number | null = null;
      let monthInPeriod: number | null = null;
      let targetAmount = 0;
      let bonusAmount = 0;
      let excessRate = 0;
      let targetHit = false;
      let bonusEarned = 0;
      let excessBonus = 0;

      console.log("probation check:", member.empNo, member.status, member.probationStartDate);

      if (member.status === "PROBATION" && member.probationStartDate) {
        const start = new Date(member.probationStartDate);
        const evalDate = new Date(year, month - 1, 1);
        const monthsElapsed =
          (evalDate.getFullYear() - start.getFullYear()) * 12 +
          (evalDate.getMonth() - start.getMonth());

        if (monthsElapsed >= 0 && monthsElapsed < 6) {
          periodNumber = monthsElapsed < 3 ? 1 : 2;
          monthInPeriod = (monthsElapsed % 3) + 1;

          const target = member.position?.positionTargets?.find(
            (t) =>
              Number(t.periodNumber) === periodNumber &&
              Number(t.monthNumber) === monthInPeriod
          );

          if (target) {
            targetAmount = target.targetAmount;
            bonusAmount = target.bonusAmount;
            excessRate = target.excessRate;
            targetHit = volumeAchieved >= targetAmount;

            if (targetHit) {
              bonusEarned = bonusAmount;
              if (periodNumber === 2 && excessRate > 0) {
                excessBonus = (volumeAchieved - targetAmount) * excessRate;
              }
            } else if (
              target.partialThreshold > 0 &&
              volumeAchieved >= target.partialThreshold
            ) {
              bonusEarned = target.partialBonus;
            }
          }
        }
      }

      const alreadyEvaluated = member.monthlyEvaluations.length > 0;

      return {
        memberId: member.id,
        name: member.nameWithInitials,
        empNo: member.empNo,
        positionTitle: member.position?.title ?? "N/A",
        status: member.status,
        periodNumber,
        monthInPeriod,
        volumeAchieved,
        targetAmount,
        bonusEarned,
        excessBonus,
        targetHit,
        alreadyEvaluated,
        totalPayout: bonusEarned + excessBonus,
      };
    });

    return { success: true, previews: serializeData(previews) };
  } catch (err) {
    console.error("getEvaluationPreview error:", err);
    return { success: false, error: "Failed to load preview" };
  }
}

// ── runBatchEvaluation ────────────────────────────────────────────────────────
// Runs evaluation for all members in a branch for a given month/year.
// Skips members already evaluated unless force=true.

export async function runBatchEvaluation(
  branchId: number,
  year: number,
  month: number,
  force = false
) {
  try {
    const memberBranches = await prisma.memberBranch.findMany({
      where: { branchId },
      include: {
        member: {
          include: {
            position: { include: { positionTargets: true } },
            monthlyEvaluations: { where: { year, month } },
            // Replace clients include with this:
            advisorInvestments: {
              where: {
                investmentDate: {
                  gte: new Date(year, month - 1, 1),
                  lt: new Date(year, month, 1),
                },
              },
              select: { amount: true },
            },
          },
        },
      },
    });

    const results: any[] = [];

    for (const { member } of memberBranches) {
      // Skip if already evaluated and not forcing
      if (!force && member.monthlyEvaluations.length > 0) {
        results.push({ memberId: member.id, skipped: true });
        continue;
      }

      // Replace the clients-based volume calculation:
      const advisorInvestments = await prisma.investment.findMany({
        where: {
          advisorId: member.id,
          investmentDate: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
        select: { amount: true },
      });

      const volumeAchieved = advisorInvestments.reduce((sum, inv) => sum + inv.amount, 0);

      let periodNumber: number | null = null;
      let monthInPeriod: number | null = null;
      let targetAmount = 0;
      let bonusEarned = 0;
      let excessBonus = 0;
      let targetHit = false;

      if (member.status === "PROBATION" && member.probationStartDate) {
        const start = new Date(member.probationStartDate);
        const evalDate = new Date(year, month - 1, 1);
        const existingEval = member.monthlyEvaluations?.[0];
        const volumeAchieved = existingEval?.volumeAchieved ??
          member.advisorInvestments?.reduce((sum, inv) => sum + inv.amount, 0) ?? 0;

        const monthsElapsed =
          (evalDate.getFullYear() - start.getFullYear()) * 12 +
          (evalDate.getMonth() - start.getMonth());

        if (monthsElapsed >= 0 && monthsElapsed < 6) {
          periodNumber = monthsElapsed < 3 ? 1 : 2;
          monthInPeriod = (monthsElapsed % 3) + 1;

          const target = member.position?.positionTargets?.find(
            (t) => t.periodNumber === periodNumber && t.monthNumber === monthInPeriod
          );

          if (target) {
            targetAmount = target.targetAmount;
            targetHit = volumeAchieved >= targetAmount;

            if (targetHit) {
              // Full target hit → full bonus
              bonusEarned = target.bonusAmount;
              if (periodNumber === 2 && target.excessRate > 0) {
                excessBonus = (volumeAchieved - targetAmount) * target.excessRate;
              }
            } else if (
              target.partialThreshold > 0 &&
              volumeAchieved >= target.partialThreshold
            ) {
              // Partial threshold hit → partial bonus only
              bonusEarned = target.partialBonus;
            }
          }
        }
      }

      // Upsert evaluation record
      const evaluation = await prisma.monthlyEvaluation.upsert({
        where: { memberId_year_month: { memberId: member.id, year, month } },
        update: { volumeAchieved, targetAmount, bonusEarned, excessBonus, targetHit, periodNumber, monthInPeriod },
        create: { memberId: member.id, year, month, periodNumber, monthInPeriod, volumeAchieved, targetAmount, bonusEarned, excessBonus, targetHit },
      });

      // Auto-promote to PERMANENT after 6 months
      if (member.status === "PROBATION" && member.probationStartDate) {
        const start = new Date(member.probationStartDate);
        const evalDate = new Date(year, month - 1, 1);
        const monthsElapsed =
          (evalDate.getFullYear() - start.getFullYear()) * 12 +
          (evalDate.getMonth() - start.getMonth());
        if (monthsElapsed >= 5) {
          await prisma.member.update({
            where: { id: member.id },
            data: { status: "PERMANENT" },
          });
        }
      }

      results.push({ memberId: member.id, skipped: false, evaluation });
    }

    revalidatePath("/features/hr/evaluations");
    return { success: true, results: serializeData(results) };
  } catch (err) {
    console.error("runBatchEvaluation error:", err);
    return { success: false, error: "Failed to run batch evaluation" };
  }
}

// ── getEvaluationHistory ──────────────────────────────────────────────────────
// Returns all past evaluations for a single member.

export async function getEvaluationHistory(memberId: number) {
  try {
    const evaluations = await prisma.monthlyEvaluation.findMany({
      where: { memberId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return { success: true, evaluations: serializeData(evaluations) };
  } catch (err) {
    console.error("getEvaluationHistory error:", err);
    return { success: false, error: "Failed to fetch history" };
  }
}

// ── getBranches (for selector) ────────────────────────────────────────────────
// Re-export or use your existing getBranches action.
// If you already have one, skip this and import from branches/actions.
export async function getBranchesForEval() {
  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, location: true },
  });
  return serializeData(branches);
}