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
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const data = await req.json();
  console.log(data);

  const {id} = (await params);
  const nic = id;
  console.log(nic);

  const res = await prisma.client.update({
    where: {id : Number(nic) },
  });

  return NextResponse.json({ data });
}
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
