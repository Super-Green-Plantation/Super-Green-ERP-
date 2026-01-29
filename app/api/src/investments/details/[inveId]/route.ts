import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ inveId: string }> },
) {
  const { inveId } = await params;
  try {
    const investment = await prisma.investment.findUnique({
      where: { id: Number(inveId) },
    });

    const clientId = investment?.clientId;
    const advisorId = investment?.advisorId;
    const planId = investment?.planId;

    if (!advisorId) return;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        beneficiary: true,
        nominee: true,
        investments: true,
      },
    });

    const plan = await prisma.financialPlan.findFirst({
      where: { id: Number(planId) },
    });

    const member = await prisma.member.findUnique({
      where: { id: advisorId },
      include: { branch: true },
    });

    return NextResponse.json({ client, member, plan });
  } catch (error) {
    console.log(error);
    return NextResponse.json(error);
  }
}
