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

export async function getMonthlyHarvests(startDate?: Date, endDate?: Date) {
  await assertAccountsAccess();

  // For harvests, we still base it around the months covered by the date range
  // If no date range, just use current month
  const today = new Date();
  const start = startDate || new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
  const end = endDate || new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999));

  // Determine which months to check. To keep it simple, we use the month of the start date
  // (In a full implementation, you'd iterate through all months between start and end)
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + 1;

  const monthEnd = new Date(Date.UTC(year, month, 1));
  
  const investments = await prisma.investment.findMany({
    where: { status: "Active", monthlyHarvest: { gt: 0 }, investmentDate: { lt: monthEnd } },
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
  }).filter(h => {
    const pd = new Date(h.paymentDate);
    return pd >= start && pd <= end;
  });
}

export async function getIncomingInvestments(startDate?: Date, endDate?: Date) {
  await assertAccountsAccess();

  const whereClause = startDate && endDate ? { investmentDate: { gte: startDate, lte: endDate } } : {};

  const investments = await prisma.investment.findMany({
    where: whereClause,
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

export async function getOutgoingPayroll(startDate?: Date, endDate?: Date) {
  await assertAccountsAccess();
  
  // Payroll is strictly monthly in the DB. 
  // If a date range is given, we just look at the month of the startDate.
  const today = new Date();
  const start = startDate || new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + 1;

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

export async function getMonthlyExpenses(startDate?: Date, endDate?: Date) {
  await assertAccountsAccess();

  const whereClause = startDate && endDate ? { date: { gte: startDate, lte: endDate } } : {};

  const expenses = await prisma.expense.findMany({
    where: whereClause,
    select: {
      id: true,
      date: true,
      amount: true,
      category: true,
      description: true,
      createdBy: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });

  return expenses.map((exp) => ({
    id: exp.id,
    date: exp.date.toISOString(),
    amount: exp.amount,
    category: exp.category,
    description: exp.description,
    createdBy: exp.createdBy?.name || "Unknown",
  }));
}

export async function createExpense(data: { amount: number; category: string; description?: string; date: string }) {
  const user = await getCurrentUser();
  await assertAccountsAccess();

  await prisma.expense.create({
    data: {
      amount: data.amount,
      category: data.category,
      description: data.description,
      date: new Date(data.date),
      createdById: user.id,
    },
  });
}
