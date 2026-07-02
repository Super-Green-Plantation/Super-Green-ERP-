"use server"

import { prisma } from "@/lib/prisma";

export async function getEmployeePerformance(
  memberId: number,
  year: number | null,
  month: number | null // null = All Time
) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      status: true,
      dateOfJoin: true,
      positionId: true,
      position: { include: { salary: true, positionTargets: true } },
      monthlyPayrolls: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        // take 6 only makes sense for the "recent history" list, not All Time totals
      },
    },
  });

  if (!member) return null;

  const recentClients = await prisma.client.findMany({
    where: { createdById: memberId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, fullName: true, createdAt: true, status: true, approvalStatus: true },
  });

  const isAllTime = year === null || month === null;

  const currentPayroll = isAllTime
    ? null
    : member.monthlyPayrolls.find((p) => p.year === year && p.month === month) ?? null;

  const payrollHistory = isAllTime
    ? member.monthlyPayrolls
    : member.monthlyPayrolls.filter((p) => !(p.year === year && p.month === month));

  const evaluation = isAllTime
    ? null
    : await prisma.monthlyEvaluation.findUnique({
        where: { memberId_year_month: { memberId, year: year!, month: month! } },
      });

  // ── All-time aggregate goal ──
  if (isAllTime) {
    const achieved = member.monthlyPayrolls.reduce((sum, p) => sum + (p.volumeAchieved ?? 0), 0);
    const target = member.monthlyPayrolls.reduce((sum, p) => sum + (p.monthlyTarget ?? 0), 0);

    const goal = {
      achieved,
      target,
      incentiveHit: false, // not meaningful across multiple periods
      allowanceHit: false,
    };

    return {
      status: member.position.isProbation ? ("PROBATION" as const) : ("PERMANENT" as const),
      salary: member.position.salary ?? null,
      goal,
      currentPayroll: null,
      payrollHistory,
      recentClients,
    };
  }

  // ── PROBATION (single month) ──
  if (member.position.isProbation === true && member.dateOfJoin) {
    const start = new Date(member.dateOfJoin);
    const monthsElapsed = (year! - start.getFullYear()) * 12 + (month! - (start.getMonth() + 1));
    const periodNumber = monthsElapsed < 3 ? 1 : 2;
    const monthInPeriod = (monthsElapsed % 3) + 1;

    let target = member.position.positionTargets.find(
      (t: any) => Number(t.periodNumber) === periodNumber && Number(t.monthNumber) === monthInPeriod
    ) ?? null;

    if (!target && monthsElapsed >= 3) {
      const altMonth = monthsElapsed + 1;
      target = member.position.positionTargets.find(
        (t: any) => Number(t.periodNumber) === periodNumber && Number(t.monthNumber) === altMonth
      ) ?? null;
    }

    const goal = {
      achieved: currentPayroll?.volumeAchieved ?? 0,
      target: target?.targetAmount ?? 0,
      incentiveHit: currentPayroll?.incentiveHit ?? false,
      allowanceHit: currentPayroll?.allowanceHit ?? false,
    };

    return {
      status: "PROBATION" as const,
      probationStartDate: member.dateOfJoin.toISOString(),
      monthsElapsed,
      periodNumber,
      monthInPeriod,
      target,
      goal,
      evaluation,
      currentPayroll,
      recentClients,
    };
  }

  // ── PERMANENT (single month) ──
  const goal = {
    achieved: currentPayroll?.volumeAchieved ?? 0,
    target: currentPayroll?.monthlyTarget ?? 0,
    incentiveHit: currentPayroll?.incentiveHit ?? false,
    allowanceHit: currentPayroll?.allowanceHit ?? false,
  };

  return {
    status: "PERMANENT" as const,
    salary: member.position.salary ?? null,
    goal,
    currentPayroll,
    payrollHistory,
    recentClients,
  };
}