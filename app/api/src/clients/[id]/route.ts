import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

//get [id] client
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const client = await prisma.client.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        investments: { include: { plan: true } },
        branch: true,
        nominee: true,
        beneficiary: true,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ messsage: "Failed to get client" });
  }
}

//update
//delete
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const nic = id;
  console.log(id);
  const res = await prisma.client.delete({
    where: { nic: nic },
  });
  return NextResponse.json(res);
}
