"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializeData } from "@/app/utils/serializers";

type Commission = { amount: number };

// Calculate and create profit record
export async function createProfit(commissions: {
  investment: any;
  commissions: Commission[];
}) {
  try {
    const existing = await prisma.profit.findUnique({
      where: { investmentId: commissions.investment.id },
    });

    if (existing) {
      return { success: false, error: "Profit already calculated" };
    }

    const totalCommission = commissions.commissions.reduce(
      (acc: number, curr: Commission) => acc + curr.amount,
      0
    );

    const profit = Number(commissions.investment.amount) - totalCommission;

    const result = await prisma.profit.create({
      data: {
        investment: {
          connect: { id: commissions.investment.id },
        },
        investmentAmount: commissions.investment.amount,
        commissionPayout: totalCommission,
        totalProfit: profit,
      },
    });

    revalidatePath("/features/profit");
    return { success: true, profit: serializeData(result) };
  } catch (error) {
    console.error("Error creating profit:", error);
    return { success: false, error: "Failed to create profit record" };
  }
}

// Get all profit records
export async function getProfitRecords() {
  try {
    const profits = await prisma.profit.findMany({
      include: {
        investment: {
          include: {
            client: true,
            plan: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return serializeData(profits);
  } catch (error) {
    console.error("Error fetching profit records:", error);
    throw new Error("Failed to fetch profit records");
  }
}
