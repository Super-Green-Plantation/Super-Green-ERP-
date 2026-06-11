"use server"

import { prisma } from "@/lib/prisma";

export async function getEmployeeDashboardStats(memberId: number, year: number, month: number) {
  const [payroll, proposals] = await Promise.all([
    prisma.monthlyPayroll.findUnique({
      where: { memberId_year_month: { memberId, year, month } },
    }),
    prisma.investment.groupBy({
      by: ["approvalStatus"],
      where: { createdById: memberId },
      _count: { id: true },
      _sum: { amount: true },
    }),
  ]);

  const pending = proposals.find(p => p.approvalStatus === "PENDING");
  const approved = proposals.find(p => p.approvalStatus === "APPROVED");
  const rejected = proposals.find(p => p.approvalStatus === "REJECTED");

  return {
    volumeAchieved: payroll?.volumeAchieved ?? 0,
    monthlyTarget: payroll?.monthlyTarget ?? 0,
    incentiveHit: payroll?.incentiveHit ?? false,
    allowanceHit: payroll?.allowanceHit ?? false,
    netPay: payroll?.netPay ?? 0,
    pendingCount: pending?._count.id ?? 0,
    approvedCount: approved?._count.id ?? 0,
    rejectedCount: rejected?._count.id ?? 0,
    approvedAmount: approved?._sum.amount ?? 0,
    pendingAmount: pending?._sum.amount ?? 0,
  };
}