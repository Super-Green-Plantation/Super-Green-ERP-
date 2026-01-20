import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ branchId: string }> } // keep it as Promise
) {
  const branchId = Number(params);

  const employees = await prisma.member.findMany({
    where: { branchId },
    select: {
      id: true,
      empNo: true,
      name: true,
      position: true,
    },
    orderBy: { empNo: "asc" },
  });

  return NextResponse.json({ employees });
}
