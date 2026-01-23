import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ empNo: string; branchId: string }> }
) {
  const empNo = (await params).empNo;
  const branchId = Number((await params).branchId);

  try {
    const selectedMember = await prisma.member.findUnique({
      where: { empNo },
      include: {
        position: true,
        investments:true
      },
    });

    const eligibleMembers = await prisma.member.findMany({
      where: {
        branchId,
        position: {
          rank: {
            gte: selectedMember?.position.rank,
          },
        },
      },
    });

    return NextResponse.json({ eligibleMembers });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to get employees by branch" },
      { status: 500 },
    );
  }
}
