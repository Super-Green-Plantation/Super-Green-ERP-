import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ empNo: string }> },
) {
  const empNo = (await params).empNo;
  try {
    const member = await prisma.member.findUnique({
      where: { id: Number(empNo) },
    });
    const res = await prisma.commission.findMany({
      where: { memberEmpNo: member?.empNo },
      include: {
        investment: true,
      },
    });

    return NextResponse.json({ res });
  } catch (error) {
    return NextResponse.json({ error });
  }
}
