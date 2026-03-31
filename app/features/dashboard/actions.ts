"use server"

import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { serializeData } from "@/app/utils/serializers";
import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  try {
    const now = new Date();
    const last7Days = new Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

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
      heatmapDataRaw
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
    ]);

    // Map heatmap data to last 7 days
    const heatmap = last7Days.map(date => {
      const match = heatmapDataRaw.find(d => 
        new Date(d.investmentDate).toDateString() === date.toDateString()
      );
      return match ? match._count.id : 0;
    });

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


// actions/dashboard.ts

export async function getClientRegistrationByBranch(year?: number, month?: number) {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth(); // 0-indexed

  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0, 23, 59, 59); // last day of month

  const branches = await prisma.branch.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const registrations = await prisma.client.groupBy({
    by: ["branchId", "createdAt"],
    where: { createdAt: { gte: from, lte: to } },
    _count: { id: true },
  });

  // Build day array for the month
  const daysInMonth = to.getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(y, m, i + 1);
    return d.toISOString().slice(0, 10);
  });

  const branchData = branches.map((branch) => {
    const dailyMap: Record<string, number> = {};
    for (const reg of registrations) {
      if (reg.branchId === branch.id) {
        const day = new Date(reg.createdAt).toISOString().slice(0, 10);
        dailyMap[day] = (dailyMap[day] || 0) + reg._count.id;
      }
    }
    return {
      branchId: branch.id,
      branchName: branch.name,
      daily: days.map((d) => dailyMap[d] ?? 0),
      total: Object.values(dailyMap).reduce((a, b) => a + b, 0),
    };
  });

  return {
    year: y,
    month: m,
    days,           // ["2025-03-01", "2025-03-02", ...]
    branches: branchData,
  };
}