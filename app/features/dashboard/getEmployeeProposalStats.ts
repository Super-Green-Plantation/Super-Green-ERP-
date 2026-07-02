// app/features/branches/employees/[branchId]/[empId]/getEmployeeProposalStats.ts
"use server";

import { prisma } from "@/lib/prisma";

const SL_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export async function getEmployeeProposalStats(
  memberId: number,
  year: number | null,
  month: number | null // null = All Time
) {
  const dateFilter =
    year !== null && month !== null
      ? {
          investmentDate: {
            gte: new Date(Date.UTC(year, month - 1, 1) - SL_OFFSET_MS),
            lt: new Date(Date.UTC(year, month, 1) - SL_OFFSET_MS),
          },
        }
      : {};

  const statusGroups = await prisma.investment.groupBy({
    by: ["approvalStatus"],
    where: {
      createdById: memberId,
      ...dateFilter,
    },
    _count: { id: true },
    _sum: { amount: true },
  });

  const pending = statusGroups.find(p => p.approvalStatus === "PENDING");
  const approved = statusGroups.find(p => p.approvalStatus === "APPROVED");
  const rejected = statusGroups.find(p => p.approvalStatus === "REJECTED");

  return {
    pendingCount: pending?._count.id ?? 0,
    approvedCount: approved?._count.id ?? 0,
    rejectedCount: rejected?._count.id ?? 0,
    approvedAmount: approved?._sum.amount ?? 0,
    pendingAmount: pending?._sum.amount ?? 0,
  };
}