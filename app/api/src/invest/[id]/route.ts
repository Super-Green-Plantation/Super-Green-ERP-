import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

//get [id]plan
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> } // keep it as Promise
) {
  const resolvedParams = await params;  // unwrap the Promise
  const clientId = Number(resolvedParams.id); // convert string to number

  try {
    const investments = await prisma.investment.findMany({
      where: { clientId },
      include: { plan: true }, // include FinancialPlan details
    });

    // If you want only plans, not the full investments:
    const plans = investments.map(inv => inv.plan).filter(Boolean);

    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ message: "Failed to get plans", error });
  }
}

//update
//delete
