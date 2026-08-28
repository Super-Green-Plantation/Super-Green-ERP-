import { getNextProposalFormNoPreview } from "@/lib/proposalNumber";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    const proposalFormNo = await getNextProposalFormNoPreview();
    return NextResponse.json({ proposalFormNo });
  } catch (error) {
    console.error("[next-proposal-number] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate proposal number" },
      { status: 500 }
    );
  }
}