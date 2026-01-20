import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const id = params;
    try {
        const plans = await prisma.investment.findMany({
            where:{planId:Number(id)}
        })
    } catch (error) {
        return NextResponse.json({message:"Failed to get plans", error})
    }
}
