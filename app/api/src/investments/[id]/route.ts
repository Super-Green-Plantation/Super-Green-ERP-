import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

//get [id]plan
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }, // keep it as Promise
) {
  const resolvedParams = await params; // unwrap the Promise
  const clientId = Number(resolvedParams.id); // convert string to number

  try {
    const investments = await prisma.investment.findMany({
      where: { clientId },
      include: { plan: true }, // include FinancialPlan details
    });

    // If you want only plans, not the full investments:
    const plans = investments.map((inv) => inv.plan).filter(Boolean);

    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ message: "Failed to get plans", error });
  }
}

//update
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { empNo } = await req.json();
    console.log(empNo);
    const {id} = await params
    console.log(id);
    
    

    // 1️⃣ Find member by empNo
    const advisor = await prisma.member.findUnique({
      where: { empNo },
      include: { position: true },
    });

    if (!advisor) {
      return NextResponse.json({ error: "Advisor not found" }, { status: 404 });
    }

    // // 3️⃣ Update investment
    const updatedInvestment = await prisma.investment.update({
      where: {
        id: Number(id),
      },
      data: {
        advisorId: advisor.id,
      },
    });

    return NextResponse.json(updatedInvestment);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update advisor" },
      { status: 500 },
    );
  }
}

//delete
