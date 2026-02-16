import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params).id;
  console.log(id);

  const numericId = Number(id);

  if (!id || isNaN(numericId)) {
    return NextResponse.json({ message: "Invalid plan ID" }, { status: 400 });
  }

  try {
    const res = await prisma.financialPlan.findMany({
      where: {
        id: numericId,
      },
    });
    return NextResponse.json({ res });
  } catch (error) {
    console.log("Failed to get plans", error);
    return NextResponse.json({ error });
  }
}
