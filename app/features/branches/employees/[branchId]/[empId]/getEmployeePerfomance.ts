"use server"

import { prisma } from "@/lib/prisma";

export async function getEmployeePerformance(memberId: number, year: number, month: number) {

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      status: true,
      dateOfJoin: true,
      positionId: true,
      position: { include: { salary: true, positionTargets: true } },
      monthlyPayrolls: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 6,
      },
    },
  });

  if (!member) return null;

  //  Use the selected year/month directly — not latestPayroll
  const currentPayroll = member.monthlyPayrolls.find(
    (p) => p.year === year && p.month === month
  ) ?? null;

  //  History = everything except the selected month
  const payrollHistory = member.monthlyPayrolls.filter(
    (p) => !(p.year === year && p.month === month)
  );

  //  Evaluation also uses selected year/month
  const evaluation = await prisma.monthlyEvaluation.findUnique({
    where: { memberId_year_month: { memberId, year, month } },
  });

  // ── PROBATION ──────────────────────────────────────────────────────────────
  if (member.position.isProbation === true && member.dateOfJoin) {
    const start = new Date(member.dateOfJoin);

    const monthsElapsed =
      (year - start.getFullYear()) * 12 +
      (month - (start.getMonth() + 1));

    const periodNumber = monthsElapsed < 3 ? 1 : 2;
    const monthInPeriod = (monthsElapsed % 3) + 1;

    const target = member.position.positionTargets.find(
      (t: any) =>
        Number(t.periodNumber) === periodNumber &&
        Number(t.monthNumber) === monthInPeriod
    ) ?? null;

    return {
      status: "PROBATION" as const,
      probationStartDate: member.dateOfJoin,
      monthsElapsed,
      periodNumber,
      monthInPeriod,
      target,
      evaluation,
      currentPayroll,
    };
  }

  // ── PERMANENT ─────────────────────────────────────────────────────────────
  const salary = member.position.salary ?? null;

  return {
    status: "PERMANENT" as const,
    salary,
    currentPayroll,
    payrollHistory,
  };
}