import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
    const { branchId } = await params;
  try {
    const clients = await prisma.client.findMany({
      where: {
        branchId: Number(branchId),
      },
      include:{
        investments:true,
        branch:true
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to get clients by branch" },
      { status: 500 }
    );
  }
}
