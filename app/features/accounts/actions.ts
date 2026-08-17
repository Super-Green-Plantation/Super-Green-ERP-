"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ACCOUNT_ROLES = ["ADMIN", "HR", "DEV", "ACC", "CHAIRMAN"];

async function assertAccountsAccess() {
  const user = await getCurrentUser();
  if (!ACCOUNT_ROLES.includes(user.role)) {
    throw new Error("You do not have permission to view Accounts.");
  }
}

function monthBounds(year: number, month: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid reporting period.");
  }

  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

function paymentDateForMonth(investmentDate: Date, year: number, month: number) {
  const originalDay = investmentDate.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1, Math.min(originalDay, lastDay)));
}

function weekForDay(day: number) {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

export async function getMonthlyHarvests(year: number, month: number) {
  await assertAccountsAccess();
  const { end } = monthBounds(year, month);

  const investments = await prisma.investment.findMany({
    where: { status: "Active", monthlyHarvest: { gt: 0 }, investmentDate: { lt: end } },
    select: {
      id: true,
      investmentDate: true,
      monthlyHarvest: true,
      client: { select: { fullName: true } },
      plan: { select: { name: true, duration: true } },
    },
    orderBy: { investmentDate: "asc" },
  });

  return investments.map((investment) => {
    const paymentDate = paymentDateForMonth(investment.investmentDate, year, month);
    return {
      id: investment.id,
      paymentDate: paymentDate.toISOString(),
      week: weekForDay(paymentDate.getUTCDate()),
      amount: investment.monthlyHarvest ?? 0,
      clientName: investment.client.fullName,
      plan: investment.plan ? `${investment.plan.name} (${investment.plan.duration} months)` : "No plan",
    };
  });
}

export async function getIncomingInvestments(year: number, month: number) {
  await assertAccountsAccess();
  const { start, end } = monthBounds(year, month);

  const investments = await prisma.investment.findMany({
    where: { investmentDate: { gte: start, lt: end } },
    select: {
      id: true,
      amount: true,
      investmentDate: true,
      createdAt: true,
      client: { select: { fullName: true } },
      plan: { select: { name: true, duration: true } },
    },
    orderBy: { investmentDate: "desc" },
  });

  return investments.map((investment) => ({
    id: investment.id,
    amount: investment.amount,
    receivedAt: investment.investmentDate.toISOString(),
    clientName: investment.client.fullName,
    plan: investment.plan ? `${investment.plan.name} (${investment.plan.duration} months)` : "No plan",
  }));
}

export async function getOutgoingPayroll(year: number, month: number) {
  await assertAccountsAccess();
  monthBounds(year, month);

  const [payroll, commissions] = await Promise.all([
    prisma.monthlyPayroll.aggregate({
      where: { year, month },
      _sum: { grossPay: true, netPay: true },
      _count: { id: true },
    }),
    prisma.commission.aggregate({
      where: { year, month, type: { not: "REVERSED" } },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  return {
    payrollGross: payroll._sum.grossPay ?? 0,
    payrollNet: payroll._sum.netPay ?? 0,
    payrollCount: payroll._count.id,
    commissionTotal: commissions._sum.amount ?? 0,
    commissionCount: commissions._count.id,
  };
}
