"use server"

import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { serializeData } from "@/app/utils/serializers";
import { prisma } from "@/lib/prisma";

const SYSTEM_DASHBOARD_ROLES = new Set(["ADMIN", "HR", "DEV"]);
const MANAGERIAL_DASHBOARD_ROLES = new Set([
  "BRANCH_MANAGER",
  "REGIONAL_MANAGER",
  "ZONAL_MANAGER",
  "AGM",
]);

async function getDashboardBranchScope() {
  const user = await getCurrentUserWithRole();
  if (!user) throw new Error("Unauthorized");

  if (SYSTEM_DASHBOARD_ROLES.has(user.role)) {
    return { isSystemScope: true, branchIds: [] as number[], scopeLabel: "All branches" };
  }

  if (!MANAGERIAL_DASHBOARD_ROLES.has(user.role) || !user.member) {
    throw new Error("Unauthorized dashboard scope");
  }

  const assignedBranchIds = user.member.branches.map((assignment) => assignment.branchId);
  const primaryBranchIds = user.member.branches
    .filter((assignment) => assignment.isPrimary)
    .map((assignment) => assignment.branchId);

  if (user.role === "ZONAL_MANAGER" && user.member.zones.length > 0) {
    const zoneIds = user.member.zones.map((assignment) => assignment.zoneId);
    const zoneBranches = await prisma.branch.findMany({
      where: { zoneId: { in: zoneIds }, status: "Active" },
      select: { id: true },
    });
    return {
      isSystemScope: false,
      branchIds: zoneBranches.map((branch) => branch.id),
      scopeLabel: user.member.zones.map((assignment) => assignment.zone.name).join(", "),
    };
  }

  const roots = user.role === "BRANCH_MANAGER"
    ? (primaryBranchIds.length ? primaryBranchIds : assignedBranchIds)
    : assignedBranchIds;

  if (user.role === "REGIONAL_MANAGER" || user.role === "AGM") {
    const branches = await prisma.branch.findMany({
      where: { status: "Active" },
      select: { id: true, parentId: true },
    });
    const branchIds = new Set(roots);
    let added = true;
    while (added) {
      added = false;
      for (const branch of branches) {
        if (branch.parentId && branchIds.has(branch.parentId) && !branchIds.has(branch.id)) {
          branchIds.add(branch.id);
          added = true;
        }
      }
    }
    return { isSystemScope: false, branchIds: [...branchIds], scopeLabel: "Assigned region" };
  }

  return { isSystemScope: false, branchIds: roots, scopeLabel: "Assigned branch" };
}

export async function getDashboardStats() {
  try {
    const now = new Date();
    const last7Days = new Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    // Month-over-month trend helpers
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth  = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const firstDayThisYear = new Date(now.getFullYear(), 0, 1);

    const [
      investmentSum,
      totCommissionPayout,
      totProfit,
      recentInvestments,
      totClients,
      totMembers,
      totBranches,
      keyPersonnel,
      currentUser,
      heatmapDataRaw,
      thisMonthSum,
      lastMonthSum,
      yearToDateInvestmentSum,
      positionTargetSum,
      initialChartData,
    ] = await Promise.all([
      prisma.investment.aggregate({
        _sum: { amount: true },
      }),
      prisma.profit.aggregate({
        _sum: { commissionPayout: true },
      }),
      prisma.profit.aggregate({
        _sum: { totalProfit: true },
      }),
      prisma.investment.findMany({
        take: 5,
        orderBy: { investmentDate: "desc" },
        include: {
          client: true,
          advisor: {
            include: {
              position: true,
              branches: { select: { branchId: true } }
            },
          },
        },
      }),
      prisma.client.count(),
      prisma.member.count(),
      prisma.branch.count(),
      prisma.member.findMany({
        take: 3,
        orderBy: {
          position: { rank: "desc" },
        },
        include: {
          position: true,
          branches: { select: { branchId: true } }
        },
      }),
      getCurrentUserWithRole(),
      prisma.investment.groupBy({
        by: ['investmentDate'],
        _count: { id: true },
        where: {
          investmentDate: {
            gte: last7Days[0],
          },
        },
      }),
      // This month's investment total (for MoM trend)
      prisma.investment.aggregate({
        _sum: { amount: true },
        where: { investmentDate: { gte: firstDayThisMonth } },
      }),
      // Last month's investment total (for MoM trend)
      prisma.investment.aggregate({
        _sum: { amount: true },
        where: { investmentDate: { gte: firstDayLastMonth, lte: lastDayLastMonth } },
      }),
      prisma.investment.aggregate({
        _sum: { amount: true },
        where: { investmentDate: { gte: firstDayThisYear } },
      }),
      // System target = sum of all position monthly salary targets × 12
      prisma.positionSalary.aggregate({
        _sum: { monthlyTarget: true },
      }),
      // Initial chart data
      getClientRegistrationByBranch(),
    ]);

    // Map heatmap data to last 7 days
    const heatmap = last7Days.map(date => {
      const match = heatmapDataRaw.find(d =>
        new Date(d.investmentDate).toDateString() === date.toDateString()
      );
      return match ? match._count.id : 0;
    });

    // Month-over-month investment trend as a percentage
    const thisM    = thisMonthSum._sum.amount ?? 0;
    const lastM    = lastMonthSum._sum.amount ?? 0;
    const momTrend = lastM > 0
      ? parseFloat(((thisM - lastM) / lastM * 100).toFixed(1))
      : null;

    // Annual system target derived from all position salary monthly targets × 12
    const systemTarget = (positionTargetSum._sum.monthlyTarget ?? 0) * 12;
    const yearToDateAchievement = yearToDateInvestmentSum._sum.amount ?? 0;

    return {
      totProfit,
      totCommissionPayout,
      investmentSum,
      totClients,
      totMembers,
      totBranches,
      recentInvestments: serializeData(recentInvestments),
      keyPersonnel: serializeData(keyPersonnel),
      user: serializeData(currentUser),
      heatmap,
      momTrend,
      systemTarget,
      yearToDateAchievement,
      initialChartData
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw new Error("Failed to fetch dashboard statistics");
  }
}

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/signin")

}

export async function getClientRegistrationByBranch(year?: number, month?: number) {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth();

  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0, 23, 59, 59);

  const branches = await prisma.branch.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const registrations = await prisma.investment.groupBy({
    by: ["branchId", "investmentDate"],
    where: { investmentDate: { gte: from, lte: to } },
    _count: { id: true },
    _sum: { amount: true },
  });

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    new Date(y, m, i + 1).toISOString().slice(0, 10)
  );

  const branchData = branches.map((branch) => {
    const dailyCountMap: Record<string, number> = {};
    const dailyAmountMap: Record<string, number> = {};

    for (const reg of registrations) {
      if (reg.branchId === branch.id) {
        const day = new Date(reg.investmentDate).toISOString().slice(0, 10);
        dailyCountMap[day] = (dailyCountMap[day] || 0) + reg._count.id;
        dailyAmountMap[day] = (dailyAmountMap[day] || 0) + (reg._sum.amount ?? 0);
      }
    }

    return {
      branchId: branch.id,
      branchName: branch.name,
      daily: days.map((d) => dailyCountMap[d] ?? 0),
      dailyAmount: days.map((d) => dailyAmountMap[d] ?? 0),
      total: Object.values(dailyCountMap).reduce((a, b) => a + b, 0),
      totalAmount: Object.values(dailyAmountMap).reduce((a, b) => a + b, 0),
    };
  });

  return { year: y, month: m, days, branches: branchData };
}

// ─── Phase 2: Maturity Pipeline ─────────────────────────────────────────────

export type MaturityInvestment = {
  id: number;
  amount: number;
  maturityDate: Date | null;
  client: { fullName: string; phoneMobile: string | null };
  advisor: { nameWithInitials: string | null } | null;
  branch: { name: string };
  plan: { name: string } | null;
};

export async function getMaturityPipeline(branchId?: number): Promise<MaturityInvestment[]> {
  const now = new Date();
  const in90 = new Date(now);
  in90.setDate(now.getDate() + 90);
  const scope = await getDashboardBranchScope();
  const branchIds = scope.isSystemScope
    ? (branchId ? [branchId] : undefined)
    : scope.branchIds;

  const results = await prisma.investment.findMany({
    where: {
      isMatured: false,
      status: "Active",
      maturityDate: { gte: now, lte: in90 },
      ...(branchIds ? { branchId: { in: branchIds } } : {}),
    },
    select: {
      id: true,
      amount: true,
      maturityDate: true,
      client:  { select: { fullName: true, phoneMobile: true } },
      advisor: { select: { nameWithInitials: true } },
      branch:  { select: { name: true } },
      plan:    { select: { name: true } },
    },
    orderBy: { maturityDate: "asc" },
  });

  return serializeData(results);
}

// ─── Phase 3: Branch KPI Cards ───────────────────────────────────────────────

export type BranchKpi = {
  branchId: number;
  branchName: string;
  investmentCount: number;
  investmentTotal: number;
  clientCount: number;
  staffCount: number;
};

export async function getBranchKPIs(year: number, month: number): Promise<BranchKpi[]> {
  // month is 1-indexed
  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month, 0, 23, 59, 59);

  const branches = await prisma.branch.findMany({
    where: { status: "Active" },
    select: {
      id:   true,
      name: true,
      investments: {
        where: { investmentDate: { gte: from, lte: to }, status: "Active" },
        select: { amount: true },
      },
      client:  { select: { id: true } },
      members: { select: { memberId: true } },
    },
    orderBy: { name: "asc" },
  });

  return branches.map(b => ({
    branchId:        b.id,
    branchName:      b.name,
    investmentCount: b.investments.length,
    investmentTotal: b.investments.reduce((s, i) => s + i.amount, 0),
    clientCount:     b.client.length,
    staffCount:      b.members.length,
  }));
}

export type ManagerDashboardStats = {
  investmentTotal: number;
  currentMonthInvestment: number;
  clientCount: number;
  staffCount: number;
  target: number;
  percentage: number;
  momTrend: number | null;
  scopeLabel: string;
};

export async function getManagerDashboardStats(): Promise<ManagerDashboardStats> {
  const scope = await getDashboardBranchScope();
  if (scope.isSystemScope || scope.branchIds.length === 0) {
    throw new Error("A manager must be assigned to at least one branch or zone");
  }

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const branchFilter = { branchId: { in: scope.branchIds } };

  const [investment, thisMonth, lastMonth, clientCount, staffCount, staff] = await Promise.all([
    prisma.investment.aggregate({ where: branchFilter, _sum: { amount: true } }),
    prisma.investment.aggregate({ where: { ...branchFilter, investmentDate: { gte: thisMonthStart } }, _sum: { amount: true } }),
    prisma.investment.aggregate({ where: { ...branchFilter, investmentDate: { gte: lastMonthStart, lte: lastMonthEnd } }, _sum: { amount: true } }),
    prisma.client.count({ where: branchFilter }),
    prisma.member.count({ where: { branches: { some: { branchId: { in: scope.branchIds } } } } }),
    prisma.member.findMany({
      where: { branches: { some: { branchId: { in: scope.branchIds }, isPrimary: true } } },
      select: { position: { select: { salary: { select: { monthlyTarget: true } } } } },
    }),
  ]);

  const investmentTotal = investment._sum.amount ?? 0;
  const currentMonthInvestment = thisMonth._sum.amount ?? 0;
  const lastMonthInvestment = lastMonth._sum.amount ?? 0;
  const target = staff.reduce((total, member) => total + (member.position.salary?.monthlyTarget ?? 0), 0);

  return {
    investmentTotal,
    currentMonthInvestment,
    clientCount,
    staffCount,
    target,
    percentage: target > 0 ? Math.min(Math.round((currentMonthInvestment / target) * 100), 100) : 0,
    momTrend: lastMonthInvestment > 0
      ? Number((((currentMonthInvestment - lastMonthInvestment) / lastMonthInvestment) * 100).toFixed(1))
      : null,
    scopeLabel: scope.scopeLabel,
  };
}

// ─── Phase 4: Commission Leaderboard ─────────────────────────────────────────

export type LeaderboardEntry = {
  empNo: string;
  total: number;
  member: { nameWithInitials: string | null; position: { title: string } } | null;
};

export async function getCommissionLeaderboard(
  year: number,
  month: number,
  limit = 10
): Promise<LeaderboardEntry[]> {
  const results = await prisma.commission.groupBy({
    by: ["memberEmpNo"],
    where: { year, month, type: { in: ["PERSONAL", "EXCESS"] } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  const empNos  = results.map(r => r.memberEmpNo);
  const members = await prisma.member.findMany({
    where:  { empNo: { in: empNos } },
    select: {
      empNo:            true,
      nameWithInitials: true,
      position:         { select: { title: true } },
    },
  });

  return results.map(r => ({
    empNo:  r.memberEmpNo,
    total:  r._sum.amount ?? 0,
    member: members.find(m => m.empNo === r.memberEmpNo) ?? null,
  }));
}

// ─── Phase 5: Incentive Forecast ─────────────────────────────────────────────

export type IncentiveForecastEntry = {
  volumeAchieved:      number;
  monthlyTarget:       number;
  incentiveHit:        boolean;
  incentivePartialHit: boolean;
  member: {
    nameWithInitials: string | null;
    empNo:            string;
    position:         { title: string };
    branches:         { branch: { name: string } }[];
  } | null;
};

export async function getIncentiveForecast(
  year: number,
  month: number,
  branchId?: number
): Promise<IncentiveForecastEntry[]> {
  const scope = await getDashboardBranchScope();
  const branchIds = scope.isSystemScope
    ? (branchId ? [branchId] : undefined)
    : scope.branchIds;

  const results = await prisma.monthlyPayroll.findMany({
    where: {
      year,
      month,
      payrollCategory: "MARKETING",
      ...(branchIds
        ? { member: { branches: { some: { branchId: { in: branchIds }, isPrimary: true } } } }
        : {}),
    },
    select: {
      volumeAchieved:      true,
      monthlyTarget:       true,
      incentiveHit:        true,
      incentivePartialHit: true,
      member: {
        select: {
          nameWithInitials: true,
          empNo:            true,
          position:         { select: { title: true } },
          branches: {
            where:  { isPrimary: true },
            select: { branch: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { volumeAchieved: "desc" },
  });

  return serializeData(results);
}

// ─── Phase 6: Payroll Cost Breakdown ─────────────────────────────────────────

export type PayrollBreakdownSlice = {
  grossPay:         number;
  netPay:           number;
  incentiveEarned:  number;
  allowanceEarned:  number;
  orcEarned:        number;
  commissionEarned: number;
  epfEmployer:      number;
  etfEmployer:      number;
};

export type PayrollBreakdownData = {
  current:  PayrollBreakdownSlice;
  previous: PayrollBreakdownSlice;
};

export async function getPayrollCostBreakdown(
  year: number,
  month: number
): Promise<PayrollBreakdownData> {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;

  const fields = {
    grossPay:         true,
    netPay:           true,
    incentiveEarned:  true,
    allowanceEarned:  true,
    orcEarned:        true,
    commissionEarned: true,
    epfEmployer:      true,
    etfEmployer:      true,
  } as const;

  const [currentAgg, previousAgg] = await Promise.all([
    prisma.monthlyPayroll.aggregate({ where: { year, month },                     _sum: fields }),
    prisma.monthlyPayroll.aggregate({ where: { year: prevYear, month: prevMonth }, _sum: fields }),
  ]);

  const extract = (agg: typeof currentAgg): PayrollBreakdownSlice => ({
    grossPay:         agg._sum.grossPay         ?? 0,
    netPay:           agg._sum.netPay           ?? 0,
    incentiveEarned:  agg._sum.incentiveEarned  ?? 0,
    allowanceEarned:  agg._sum.allowanceEarned  ?? 0,
    orcEarned:        agg._sum.orcEarned        ?? 0,
    commissionEarned: agg._sum.commissionEarned ?? 0,
    epfEmployer:      agg._sum.epfEmployer      ?? 0,
    etfEmployer:      agg._sum.etfEmployer      ?? 0,
  });

  return { current: extract(currentAgg), previous: extract(previousAgg) };
}
