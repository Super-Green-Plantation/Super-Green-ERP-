import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id  = (await params).id;
  console.log(id);

  try {
    const res = await prisma.financialPlan.findMany({
      where: {
        id: Number(id),
      },
    });
    return NextResponse.json({ res });
  } catch (error) {
    console.log("Failed to get plans", error);
  }
}
