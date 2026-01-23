import { NextResponse } from "next/server";
import { prisma } from "@/app/api/src/utils/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; empId: string }> },
) {
  let body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const { id, empId } = await params;

  const branchId = Number(id);
  const employeeId = Number(empId);

  if (isNaN(branchId) || isNaN(employeeId)) {
    return NextResponse.json(
      { message: "Invalid branchId or employeeId" },
      { status: 400 },
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
      { status: 500 },
    );
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string; empId: string }> }
) {
  // unwrap params
  const { id, empId } = await context.params;

  const employeeId = Number(empId);
  if (isNaN(employeeId)) {
    return NextResponse.json({ message: "Invalid empId" }, { status: 400 });
  }

  try {
    const res = await prisma.member.findUnique({
      where: { id: employeeId },
      include: {
        investments: true,
        manager: true,
        position: {
          include:{
            personalCommissionTiers:true,
            orc:true
          }
        },
        subordinates: true,
        branch: true,
      },
    });

    if (!res) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ res });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to fetch employee" }, { status: 500 });
  }
}