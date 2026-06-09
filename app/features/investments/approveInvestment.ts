"use server";

import { revalidatePath } from "next/cache";
import { ActivityAction, ActivityEntity } from "@prisma/client";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";

const HIERARCHY_FIELDS = ["faId", "fmId", "bmId", "rmId", "zmId", "agmId", "ccoId"] as const;
type HierarchyField = typeof HIERARCHY_FIELDS[number];
type HierarchyIds = Partial<Record<HierarchyField, number | null>>;

export async function approveInvestment(
  investmentId: number,
  hierarchy: HierarchyIds,
  reviewNote?: string
) {
  try {
    const currentUser = await getCurrentUserWithRole();
    if (!currentUser?.member?.id) return { success: false, error: "Unauthorized" };

    const existing = await prisma.investment.findUnique({
      where: { id: investmentId },
      select: {
        id: true,
        amount: true,
        investmentDate: true,
        approvalStatus: true,
        faId: true,
        fmId: true,
        bmId: true,
        rmId: true,
        zmId: true,
        agmId: true,
        ccoId: true,
      },
    });

    console.log("approveInvestment hierarchy received:", hierarchy);
    

    if (!existing) return { success: false, error: "Investment not found" };
    if (existing.approvalStatus === "APPROVED") return { success: false, error: "Already approved" };

    if (!hierarchy.faId) return { success: false, error: "FA is required before approving" };

    const investmentDate = new Date(existing.investmentDate);
    const year = investmentDate.getFullYear();
    const month = investmentDate.getMonth() + 1;
    const amount = existing.amount;

    // Build old and new member ID sets
    const oldIds = HIERARCHY_FIELDS
      .map((f) => existing[f] as number | null)
      .filter((id): id is number => id !== null);

    const newIds = HIERARCHY_FIELDS
      .map((f) => hierarchy[f] ?? null)
      .filter((id): id is number => id !== null);

    const uniqueOldIds = [...new Set(oldIds)];
    const uniqueNewIds = [...new Set(newIds)];

    // Members removed: deduct
    const removed = uniqueOldIds.filter((id) => !uniqueNewIds.includes(id));
    // Members added: increment
    const added = uniqueNewIds.filter((id) => !uniqueOldIds.includes(id));

    await prisma.$transaction(async (tx:any) => {
      // Deduct from removed members
      await Promise.all(
        removed.map((memberId) =>
          tx.monthlyPayroll.upsert({
            where: { memberId_year_month: { memberId, year, month } },
            update: { volumeAchieved: { decrement: amount } },
            create: { memberId, year, month, monthlyTarget: 0, volumeAchieved: 0, basicSalaryPermanent: 0 },
          })
        )
      );

      // Increment for added members
      await Promise.all(
        added.map((memberId) =>
          tx.monthlyPayroll.upsert({
            where: { memberId_year_month: { memberId, year, month } },
            update: { volumeAchieved: { increment: amount } },
            create: { memberId, year, month, monthlyTarget: 0, volumeAchieved: amount, basicSalaryPermanent: 0 },
          })
        )
      );

      // Update investment
      await tx.investment.update({
        where: { id: investmentId },
        data: {
          approvalStatus: "APPROVED",
          reviewedAt: new Date(),
          reviewedById: currentUser.member!.id,
          reviewNote: reviewNote ?? null,
          faId: hierarchy.faId ?? null,
          fmId: hierarchy.fmId ?? null,
          bmId: hierarchy.bmId ?? null,
          rmId: hierarchy.rmId ?? null,
          zmId: hierarchy.zmId ?? null,
          agmId: hierarchy.agmId ?? null,
          ccoId: hierarchy.ccoId ?? null,
        },
      });
    });

    revalidatePath("/features/investments");

    void logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.INVESTMENT,
      entityId: investmentId,
      performedById: currentUser.member!.id,
      metadata: { action: "APPROVED", hierarchy },
    });

    return { success: true };
  } catch (err) {
    console.error("approveInvestment error:", err);
    return { success: false, error: "Server error" };
  }
}