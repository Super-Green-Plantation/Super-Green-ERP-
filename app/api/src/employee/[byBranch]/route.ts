import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ byBranch: string }> }
) {
  const byBranch = Number((await params).byBranch);
  try {
    const emp = await prisma.member.findMany({
      where: { branchId: Number(byBranch) },
      include:{
        position:true,
        
      },
    });
    return NextResponse.json({ emp });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to get employees by branch" },
      { status: 500 }
    );
  }
}

