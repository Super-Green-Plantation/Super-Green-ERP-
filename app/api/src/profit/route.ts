import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../utils/prisma";

type Commission = { amount: number };

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {  commissions } = body;
  console.log(commissions.investment,commissions);
  

  const existing = await prisma.profit.findUnique({
    where: { investmentId: commissions.investment.id },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Profit already calculated" },
      { status: 400 },
    );
  }

  const totalCommission = commissions.commissions.reduce(
    (acc: number, curr: Commission) => acc + curr.amount,
    0,
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

  return NextResponse.json({
    success: true,
    profit: result,
  });
}

export async function GET(_:NextRequest) {
  
}