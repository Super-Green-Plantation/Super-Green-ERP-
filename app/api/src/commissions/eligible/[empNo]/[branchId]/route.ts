import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: { empNo: string; branchId: string } },
) {
  const empNo = (await params).empNo;
  const branchId = Number((await params).branchId);

  try {
    const selectedMember = await prisma.member.findUnique({
      where: { empNo },
      include: {
        position: true,
      },
    });

    const eligibleMembers = await prisma.member.findMany({
      where: {
        branchId,
        position: {
          rank: {
            gte: selectedMember?.position.rank, // 🔥 magic
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
