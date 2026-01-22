import { NextResponse } from "next/server";
import { prisma } from "@/app/api/src/utils/prisma";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ empId: string }> }
) {
  const { empId } = await params;
  const employeeId = Number(empId);

  if (isNaN(employeeId)) {
    return NextResponse.json({ message: "Invalid employee ID" }, { status: 400 });
  }

  try {
    const deleted = await prisma.member.delete({
      where: { id: employeeId },
    });
    return NextResponse.json({ deleted });
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return NextResponse.json({ message: "Failed to delete employee" }, { status: 500 });
  }
}
