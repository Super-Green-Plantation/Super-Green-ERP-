"use server";

import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function rejectInvestment(
  investmentId: number,
  reviewNote: string
) {
  try {
    const currentUser = await getCurrentUserWithRole();
    if (!currentUser?.member?.id) return { success: false, error: "Unauthorized" };

    if (!reviewNote?.trim()) return { success: false, error: "Review note is required for rejection" };

    await prisma.investment.update({
      where: { id: investmentId },
      data: {
        approvalStatus: "REJECTED",
        reviewedAt: new Date(),
        reviewNote,
      },
    });

    revalidatePath("/features/investments");
    return { success: true };
  } catch (err) {
    console.error("rejectInvestment error:", err);
    return { success: false, error: "Server error" };
  }
}