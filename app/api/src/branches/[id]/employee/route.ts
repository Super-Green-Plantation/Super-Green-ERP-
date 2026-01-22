//fetch all branch members

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Unwrap the params
  const { id } = await params;
  const branchId = Number(id);

  const employees = await prisma.member.findMany({
    where: { branchId },
    select: {
      id: true,
      empNo: true,
      name: true,
      email: true,
      phone: true,
      totalCommission: true,
      position: true,
    },
    orderBy: { empNo: "asc" },
  });

  return NextResponse.json({ employees });
}
