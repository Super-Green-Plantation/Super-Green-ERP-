"use server";


import { HIERARCHY_EDIT_ROLES } from "@/app/const/HIERARCHY_FIELDS";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { logActivity } from "@/lib/logActivity";
import { prisma } from "@/lib/prisma";
import { ActivityAction, ActivityEntity } from "@prisma/client";
import { revalidatePath } from "next/cache";

const HIERARCHY_FIELDS = ["faId", "fmId", "bmId", "rmId", "zmId", "agmId", "ccoId"] as const;
type HierarchyField = typeof HIERARCHY_FIELDS[number];
type HierarchyIds = Partial<Record<HierarchyField, number | null>>;

export async function updateInvestmentHierarchyWithAudit(
  investmentId: number,
  newHierarchy: HierarchyIds
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUserWithRole();
    if (!currentUser?.member?.id) {
      return { success: false, error: "Unauthorized" };
    }
 
    // ── Role guard ────────────────────────────────────────────────────────────
    // currentUser.role comes from the User table (enum Role).
    // Only ADMIN and HR may manually override a saved hierarchy.
    const userRole = (currentUser as any).role as string | undefined;
    if (!userRole || !HIERARCHY_EDIT_ROLES.includes(userRole as any)) {
      return {
        success: false,
        error: "Only ADMIN or HR users may edit the investment hierarchy after approval",
      };
    }
 
    // ── Fetch existing state ─────────────────────────────────────────────────
    const existing = await prisma.investment.findUnique({
      where: { id: investmentId },
      select: {
        amount: true,
        investmentDate: true,
        approvalStatus: true,
        branchId: true,
        faId: true, fmId: true, bmId: true,
        rmId: true, zmId: true, agmId: true, ccoId: true,
      },
    });
 
    if (!existing) return { success: false, error: "Investment not found" };
    if (existing.approvalStatus !== "APPROVED") {
      return { success: false, error: "Can only edit hierarchy on approved investments" };
    }
 
    const investmentDate = new Date(existing.investmentDate);
    const year = investmentDate.getFullYear();
    const month = investmentDate.getMonth() + 1;
    const amount = existing.amount;
 
    // ── Diff old vs new member sets ──────────────────────────────────────────
    const oldIds = [
      ...new Set(
        HIERARCHY_FIELDS.map((f) => existing[f] as number | null).filter(
          (id): id is number => id !== null
        )
      ),
    ];
    const newIds = [
      ...new Set(
        HIERARCHY_FIELDS.map((f) => newHierarchy[f] ?? null).filter(
          (id): id is number => id !== null
        )
      ),
    ];
 
    const removed = oldIds.filter((id) => !newIds.includes(id));
    const added = newIds.filter((id) => !oldIds.includes(id));
 
    await prisma.$transaction(async (tx: any) => {
      // ── Adjust monthlyPayroll for removed members ─────────────────────────
      await Promise.all(
        removed.map((memberId) =>
          tx.monthlyPayroll.upsert({
            where: { memberId_year_month: { memberId, year, month } },
            update: { volumeAchieved: { decrement: amount } },
            create: {
              memberId, year, month,
              monthlyTarget: 0, volumeAchieved: 0, basicSalaryPermanent: 0,
            },
          })
        )
      );
 
      // ── Adjust monthlyPayroll for added members ───────────────────────────
      await Promise.all(
        added.map((memberId) =>
          tx.monthlyPayroll.upsert({
            where: { memberId_year_month: { memberId, year, month } },
            update: { volumeAchieved: { increment: amount } },
            create: {
              memberId, year, month,
              monthlyTarget: 0, volumeAchieved: amount, basicSalaryPermanent: 0,
            },
          })
        )
      );
 
      // ── Update Investment row ─────────────────────────────────────────────
      await tx.investment.update({
        where: { id: investmentId },
        data: {
          faId: newHierarchy.faId ?? null,
          fmId: newHierarchy.fmId ?? null,
          bmId: newHierarchy.bmId ?? null,
          rmId: newHierarchy.rmId ?? null,
          zmId: newHierarchy.zmId ?? null,
          agmId: newHierarchy.agmId ?? null,
          ccoId: newHierarchy.ccoId ?? null,
          // Mark this investment as having a manually-overridden hierarchy.
          // Requires: ALTER TABLE "Investment" ADD COLUMN "hierarchyModified" BOOLEAN DEFAULT false;
          // Once migrated, remove the (as any) cast.
          ...({ hierarchyModified: true } as any),
        },
      });
    });
 
    revalidatePath("/features/investments");
 
    // ── Audit log — fires after the transaction ───────────────────────────────
    // before/after snapshots let you reconstruct the full diff from ActivityLog
    // without needing a separate audit table.
    void logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.INVESTMENT,
      entityId: investmentId,
      performedById: currentUser.member.id,
      branchId: existing.branchId,
      metadata: {
        event: "hierarchy_manual_override",
        before: {
          faId: existing.faId ?? null,
          fmId: existing.fmId ?? null,
          bmId: existing.bmId ?? null,
          rmId: existing.rmId ?? null,
          zmId: existing.zmId ?? null,
          agmId: existing.agmId ?? null,
          ccoId: existing.ccoId ?? null,
        },
        after: {
          faId: newHierarchy.faId ?? null,
          fmId: newHierarchy.fmId ?? null,
          bmId: newHierarchy.bmId ?? null,
          rmId: newHierarchy.rmId ?? null,
          zmId: newHierarchy.zmId ?? null,
          agmId: newHierarchy.agmId ?? null,
          ccoId: newHierarchy.ccoId ?? null,
        },
        memberChanges: { removed, added },
        payrollAdjusted: { year, month, amount },
        editedBy: currentUser.member.id,
        editedAt: new Date().toISOString(),
      },
    });
 
    return { success: true };
  } catch (err: any) {
    console.error("updateInvestmentHierarchyWithAudit error:", err);
    return { success: false, error: "Server error" };
  }
}