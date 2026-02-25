"use server"

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";


export async function getDashboardStats() {
  try {
    const [
      investmentSum,
      totCommissionPayout,
      totProfit,
      getAllInvestment,
      totClients,
      totMembers,
      totBranchs
    ] = await Promise.all([
      prisma.investment.aggregate({
        _sum: {
          amount: true,
        },
      }),
      prisma.profit.aggregate({
        _sum: {
          commissionPayout: true,
        },
      }),
      prisma.profit.aggregate({
        _sum: {
          totalProfit: true,
        },
      }),
      prisma.investment.findMany({
        include: {
          advisor: {
            include: {
              branch: true,
              position: true,
            },
          },
          client: true,
        },
        orderBy: { investmentDate: "desc" },
      }),
      prisma.client.count(),
      prisma.member.count(),
      prisma.branch.count(),
    ]);

    return {
      totProfit,
      totCommissionPayout,
      investmentSum,
      totClients,
      totMembers,
      totBranchs,
      getAllInvestment,
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
