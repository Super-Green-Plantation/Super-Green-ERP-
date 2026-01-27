import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/src/utils/prisma";
import { getUpperMembers } from "../../../utils/member";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ empNo: string }> },
) {
  const { empNo } = await params;
  const employeeId = Number(empNo);

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
  { params }: { params: { empNo: string } }
) {
  const empNo = params.empNo;
  const { commission } = await req.json(); // 👈 expect object

  try {
    const member = await prisma.member.findUnique({
      where: { empNo },
      select: { totalCommission: true },
    });

    if (!member) {
      return NextResponse.json(
        { message: "Member not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.member.update({
      where: { empNo },
      data: {
        totalCommission: member.totalCommission + Number(commission),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to update commission" },
      { status: 500 }
    );
  }
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ empNo: string }> },
) {
  const { empNo } = await params;

  try {
    const upperMembers = await getUpperMembers(empNo);
    return NextResponse.json({upperMembers});
  } catch (error) {
    console.log(error);

    return NextResponse.json(error);
  }
}
