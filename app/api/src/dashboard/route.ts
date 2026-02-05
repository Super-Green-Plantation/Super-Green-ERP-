import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../utils/prisma";

export async function GET(_: NextRequest) {
  const investmentSum = await prisma.investment.aggregate({
    _sum: {
      amount: true,
    },
  });

  const totCommissionPayout = await prisma.profit.aggregate({
    _sum: {
      commissionPayout: true,
    },
  });

  const totProfit = await prisma.profit.aggregate({
    _sum: {
      totalProfit: true,
    },
  });

  const getAllInvestment = await prisma.investment.findMany({
    include: {
      advisor: {
        include: {
          branch: true,
          position: true,
        },
      },
      client: true,
    },orderBy:{investmentDate:"desc"}
  });

  const totClients = await prisma.client.count();
  const totMembers = await prisma.member.count();
  const totBranchs = await prisma.branch.count();

  return NextResponse.json({
    totProfit,
    totCommissionPayout,
    investmentSum,
    totClients,
    totMembers,
    totBranchs,
    getAllInvestment
  });
}
