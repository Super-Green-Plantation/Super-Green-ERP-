import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ empNo: string }> },
) {
  const empNo = (await params).empNo;
  try {
    const res = await prisma.commission.findMany({
      where: { memberEmpNo: empNo },
      include: {
        investment: true,
      },
    });

    return NextResponse.json({res})
  } catch (error) {
    return NextResponse.json({ error });
  }
}
