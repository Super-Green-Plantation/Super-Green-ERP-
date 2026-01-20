import { NextResponse } from "next/server";
import { prisma } from "../utils/prisma";

export async function GET() {
    try {
        const plans =await prisma.financialPlan.findMany();
        console.log("pland",plans);
        
        return NextResponse.json({plans})
    } catch (err) {
        return NextResponse.json({message:"Failed to get Plans", err})
    }
}