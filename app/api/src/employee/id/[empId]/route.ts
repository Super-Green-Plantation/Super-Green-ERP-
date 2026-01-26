import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/src/utils/prisma";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ empId: string }> },
) {
  const { empId } = await params;
  const employeeId = Number(empId);

  if (isNaN(employeeId)) {
    return NextResponse.json(
      { message: "Invalid employee ID" },
      { status: 400 },
    );
  }

  try {
    const deleted = await prisma.member.delete({
      where: { id: employeeId },
    });
    return NextResponse.json({ deleted });
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return NextResponse.json(
      { message: "Failed to delete employee" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ empId: string }> },
) {
  const { empId } = await params;
  const id = Number(empId);
  const commission = await req.json();
  const com = Number(commission);

  try {
    const totComm = await prisma.member.findUnique({
      where: { id: id },
      select: { totalCommission: true },
    });

    if (!totComm) {
      // Member not found
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const res = await prisma.member.update({
      where: { id: id },
      data: {
        totalCommission: totComm.totalCommission + com,
      },
    });
    return NextResponse.json(res);
  } catch (error) {
    console.log(error);
    return NextResponse.json(error);
  }
}
