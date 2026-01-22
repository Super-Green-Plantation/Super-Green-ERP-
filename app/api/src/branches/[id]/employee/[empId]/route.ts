import { NextResponse } from "next/server";
import { prisma } from "@/app/api/src/utils/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; empId: string }> }
) {
  let body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { id, empId } = await params;

  const branchId = Number(id);
  const employeeId = Number(empId);

  if (isNaN(branchId) || isNaN(employeeId)) {
    return NextResponse.json(
      { message: "Invalid branchId or employeeId" },
      { status: 400 }
    );
  }

  try {
    const updatedMember = await prisma.member.update({
      where: {
        id: employeeId,
      },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        empNo: body.empNo,
        totalCommission: Number(body.totalCommission),

        // ✅ update relations properly
        branch: {
          connect: { id: branchId },
        },
        position: {
          connect: { id: Number(body.positionId) },
        },
      },
    });

    return NextResponse.json({ updatedMember });
  } catch (error) {
    console.error("Update employee failed:", error);
    return NextResponse.json(
      { message: "Failed to update employee" },
      { status: 500 }
    );
  }
}

