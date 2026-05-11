"use server"


import { serializeData } from "@/app/utils/serializers";
import { prisma } from "@/lib/prisma";

export async function getCommissionStats() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const last7Days = new Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const [
      totalSum,
      monthlySum,
      count,
      heatmapRaw,
      recentCommissions
    ] = await Promise.all([
      prisma.commission.aggregate({
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.commission.count(),
      prisma.commission.groupBy({
        by: ['createdAt'],
        _count: { id: true },
        where: {
          createdAt: { gte: last7Days[0] }
        }
      }),
      // heatmap query
      prisma.commission.findMany({
        where: {
          investment: {
            investmentDate: { gte: last7Days[0] }
          }
        },
        select: {
          investment: { select: { investmentDate: true } }
        }
      })
    ]);

    const heatmap = last7Days.map(date => {
      const match = heatmapRaw.find(d =>
        new Date(d.createdAt).toDateString() === date.toDateString()
      );
      return match ? match._count.id : 0;
    });

    return {
      totalSum: totalSum._sum.amount || 0,
      monthlySum: monthlySum._sum.amount || 0,
      count,
      heatmap,
      recentCommissions: serializeData(recentCommissions)
    };
  } catch (error) {
    console.error("Error fetching commission stats:", error);
    throw new Error("Failed to fetch commission stats");
  }
}