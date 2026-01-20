import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { empCode: string } }
) {
  const employee = await prisma.member.findUnique({
    where: { empNo: params.empCode },
  });

  if (!employee) {
    return NextResponse.json(
      { message: "Employee not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ employee });
}
