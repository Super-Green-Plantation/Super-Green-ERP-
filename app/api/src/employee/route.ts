import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../utils/prisma";

//create
export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log(body.name);
  try {
    const res = await prisma.member.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        empNo: body.empNo,
        totalCommission: Number(body.totalCommission),
        branchId: Number(body.branchId),
        positionId: Number(body.positionId),
      },
    });

    return NextResponse.json({ res });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
//get
