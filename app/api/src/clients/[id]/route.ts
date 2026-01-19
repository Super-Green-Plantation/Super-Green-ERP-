import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const client = await prisma.client.findUnique({
      where: {
        id: Number(id),
      },
      include:{
        investments:true,
        branch:true
      }
    });

    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ messsage: "Failed to get client" });
  }
}
