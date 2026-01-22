import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ empCode: string; }> }
) {
  const empCode = ((await params).empCode)
  const employee = await prisma.member.findUnique({
    where: { empNo: empCode },
  });

  if (!employee) {
    return NextResponse.json(
      { message: "Employee not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ employee });
}
