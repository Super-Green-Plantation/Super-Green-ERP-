import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const nextNumber = await getNextProposalSequenceNumber();

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const proposalFormNo = `SG/${yy}/${mm}/${nextNumber}`;

    return NextResponse.json({ proposalFormNo });
  } catch (error) {
    console.error("[next-proposal-number] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate proposal number" },
      { status: 500 }
    );
  }
}

/**
 * Finds the highest sequential number across ALL SG/* proposal form numbers
 * and returns nextNumber = highest + 1 (or 500 if none exist).
 */
async function getNextProposalSequenceNumber(): Promise<number> {
  const BASE = 500;

  // Find all investments that have a proposalFormNo starting with "SG/"
  const investments = await prisma.investment.findMany({
    where: {
      proposalFormNo: {
        startsWith: "SG/",
      },
    },
    select: { proposalFormNo: true },
  });

  if (investments.length === 0) return BASE;

  // Extract the numeric sequence part (last segment after final "/")
  const numbers = investments
    .map((inv) => {
      const parts = inv.proposalFormNo!.split("/");
      return parseInt(parts[parts.length - 1], 10);
    })
    .filter((n) => !isNaN(n));

  if (numbers.length === 0) return BASE;

  return Math.max(...numbers) + 1;
}
