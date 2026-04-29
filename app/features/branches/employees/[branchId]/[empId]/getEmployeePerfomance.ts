"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/withPermission";

export async function getEmployeePerformance(memberId: number) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;


  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      status: true,
      dateOfJoin: true,
      positionId: true,
      position: {
        include: {
          salary: true,
          positionTargets: true,
        },
      },
      monthlyEvaluations: {
        where: { year: currentYear, month: currentMonth },
        take: 1,
      },
      monthlyPayrolls: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 6,
      },
    },
  });

  if (!member) return null;

  // ── PROBATION ──────────────────────────────────────────────────────────────
  if (member.position.isProbation === true && member.dateOfJoin) {
    const start = new Date(member.dateOfJoin);

    // monthsElapsed: how many full months since probation started
    const monthsElapsed =
      (currentYear - start.getFullYear()) * 12 +
      (currentMonth - (start.getMonth() + 1));

    // Period 1 = months 0–2 (first 3 months), Period 2 = months 3–5 (next 3 months)
    const periodNumber = monthsElapsed < 3 ? 1 : 2;
    const monthInPeriod = (monthsElapsed % 3) + 1; // 1, 2, or 3

    // Find the matching PositionTarget row
    const target = member.position.positionTargets.find(
      (t: any) =>
        Number(t.periodNumber) === periodNumber &&
        Number(t.monthNumber) === monthInPeriod
    ) ?? null;

    const evaluation = member.monthlyEvaluations[0] ?? null;

    return {
      status: "PROBATION" as const,
      probationStartDate: member.dateOfJoin,
      monthsElapsed,
      periodNumber,
      monthInPeriod,
      target,
      evaluation, // has volumeAchieved, bonusEarned, targetHit
    };
  }

  // ── PERMANENT ─────────────────────────────────────────────────────────────
  const salary = member.position.salary ?? null;

  // Current month payroll (first in the ordered list if it matches)
  const currentPayroll =
    member.monthlyPayrolls[0]?.year === currentYear &&
      member.monthlyPayrolls[0]?.month === currentMonth
      ? member.monthlyPayrolls[0]
      : null;

  return {
    status: "PERMANENT" as const,
    salary,
    currentPayroll,
    payrollHistory: member.monthlyPayrolls, // up to last 6 months
  };
}