"use server"

import { ApiError } from "@/lib/error";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/app/utils/serializers";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/logActivity";
import { ActivityAction, ActivityEntity } from "@prisma/client";
import { getHierarchyEmpNosFromInvestment } from "../hr/salary/action";
import { autoDetectInvestmentRate } from "@/lib/commissions/investmentRates";

// ─── Helpers ────────────────────────────────────────────────────────────────

export async function generateCommissionRef() {
  return `COM-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

// ─── Feature 3: Auto-deactivation helpers ───────────────────────────────────

/**
 * Called after every investment approval.
 * Stamps lastInvestmentAt on the FA and reactivates any auto-deactivated
 * members in the hierarchy chain (they received a new investment under them).
 */
export async function stampLastInvestmentAndReactivate(
  advisorId: number,
  hierarchyMemberIds: number[],
) {
  try {
    const now = new Date();

    // Stamp FA
    await prisma.member.update({
      where: { id: advisorId },
      data: { lastInvestmentAt: now, isActive: true, autoDeactivatedAt: null },
    });

    // Reactivate any auto-deactivated uplines
    if (hierarchyMemberIds.length > 0) {
      await prisma.member.updateMany({
        where: {
          id: { in: hierarchyMemberIds },
          autoDeactivatedAt: { not: null },
        },
        data: { isActive: true, autoDeactivatedAt: null },
      });
    }
  } catch (err) {
    console.error("[auto-deactivation] stampLastInvestmentAndReactivate error:", err);
  }
}

/**
 * Run periodically (cron / manual trigger) — deactivates members who have had
 * no investment approved in the last 2 calendar months.
 */
export async function autoDeactivateInactiveMembers() {
  try {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const toDeactivate = await prisma.member.findMany({
      where: {
        isActive: true,
        autoDeactivatedAt: null,
        OR: [
          { lastInvestmentAt: null },
          { lastInvestmentAt: { lt: twoMonthsAgo } },
        ],
        // Only deactivate field-level FAs/TLs, not HO management
        position: { isManagement: false },
      },
      select: { id: true, empNo: true },
    });

    if (toDeactivate.length === 0) return { deactivated: 0 };

    const ids = toDeactivate.map((m) => m.id);
    const now = new Date();

    await prisma.member.updateMany({
      where: { id: { in: ids } },
      data: { isActive: false, autoDeactivatedAt: now },
    });

    console.log(`[auto-deactivation] Deactivated ${ids.length} members:`, toDeactivate.map(m => m.empNo));
    return { deactivated: ids.length, members: toDeactivate };
  } catch (err: any) {
    console.error("[auto-deactivation] autoDeactivateInactiveMembers error:", err);
    return { deactivated: 0, error: err.message };
  }
}

// ─── Feature 2: Auto-detect rate 40% for investments >= 500K ────────────────



// ─── Feature 4: Undo commissions ────────────────────────────────────────────

export async function undoCommissions(investmentId: number) {
  try {
    const currentUser = await getCurrentUserWithRole();
    const performedById = currentUser?.member?.id ?? 0;

    const result = await prisma.$transaction(async (tx) => {
      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
        select: { id: true, commissionsProcessed: true, refNumber: true, branchId: true },
      });
      if (!investment) throw new ApiError("NOT_FOUND", "Investment not found", 404);
      if (!investment.commissionsProcessed) {
        return { alreadyUndone: true, reversed: 0 };
      }

      // Load all existing commissions for this investment
      const existing = await tx.commission.findMany({
        where: {
          investmentId,
          type: { not: "REVERSED" }, // don't double-reverse
        },
        select: { id: true, memberEmpNo: true, amount: true, type: true, month: true, year: true },
      });

      if (existing.length === 0) {
        // Mark as unprocessed anyway
        await tx.investment.update({
          where: { id: investmentId },
          data: { commissionsProcessed: false },
        });
        return { alreadyUndone: false, reversed: 0 };
      }

      // Decrement totalCommission on each affected member
      const groupedByEmpNo = new Map<string, number>();
      for (const c of existing) {
        groupedByEmpNo.set(c.memberEmpNo, (groupedByEmpNo.get(c.memberEmpNo) ?? 0) + c.amount);
      }

      for (const [empNo, totalAmount] of groupedByEmpNo.entries()) {
        await tx.member.update({
          where: { empNo },
          data: { totalCommission: { decrement: totalAmount } },
        });
      }

      // Delete original commission rows
      await tx.commission.deleteMany({
        where: { investmentId, type: { not: "REVERSED" } },
      });

      // Create REVERSED audit record (one per original commission)
      const reversedRef = await generateCommissionRef();
      await tx.commission.createMany({
        data: existing.map((c) => ({
          investmentId,
          memberEmpNo: c.memberEmpNo,
          amount: -c.amount,
          type: "REVERSED" as const,
          refNumber: `REV-${reversedRef}`,
          branchId: investment.branchId,
          month: c.month,
          year: c.year,
        })),
      });

      // Reset commissionsProcessed
      await tx.investment.update({
        where: { id: investmentId },
        data: { commissionsProcessed: false },
      });

      return { alreadyUndone: false, reversed: existing.length };
    }, { timeout: 15000 });

    revalidatePath("/features/commissions");

    void logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.COMMISSION,
      entityId: investmentId,
      performedById,
      metadata: { action: "UNDO", investmentId, reversed: result.reversed },
    });

    return { success: true, ...result };
  } catch (err: any) {
    console.error("[undoCommissions] error:", err);
    if (err instanceof ApiError) return { success: false, error: err.message };
    return { success: false, error: "Something went wrong" };
  }
}

// ─── Main: processCommissions ────────────────────────────────────────────────

export async function processCommissions(data: {
  investmentId: number;
  empNo: string;
  branchId: number;
  disabledEmpNos?: string[];
  manualEmpNos?: string[];
  hierarchyEmpNos?: string[];
  performedById?: number;
}) {
  const {
    investmentId,
    empNo,
    branchId,
    disabledEmpNos = [],
    manualEmpNos = [],
    hierarchyEmpNos,
    performedById: callerPerformedById,
  } = data;

  try {
    const currentUser = callerPerformedById
      ? null
      : await getCurrentUserWithRole();
    const resolvedPerformedById = callerPerformedById ?? currentUser?.member?.id ?? 0;

    const advisor = await prisma.member.findUnique({
      where: { empNo },
      select: { id: true, empNo: true, positionId: true, position: { select: { id: true } } },
    });

    if (!advisor) throw new ApiError("ADVISOR_NOT_FOUND", "Advisor not found", 404);
    if (!advisor.position) throw new ApiError("POSITION_MISSING", "Advisor has no position");

    const result = await prisma.$transaction(async (tx) => {
      const investment = await tx.investment.findUnique({ where: { id: investmentId } });
      if (!investment) throw new ApiError("INVESTMENT_NOT_FOUND", "Investment not found", 404);

      if (investment.commissionsProcessed) {
        const existingCommissions = await tx.commission.findMany({
          where: { investmentId },
          include: { member: { select: { empNo: true, nameWithInitials: true, position: true } } },
        });
        return serializeData({ alreadyProcessed: true, investment, commissions: existingCommissions });
      }

      const investmentDate = new Date(investment.investmentDate);

      // Auto-set rate to 40% if >= 500K (unchanged — this is rate detection, not commission).
      const currentRates: number[] = Array.isArray(investment.investmentRates)
        ? (investment.investmentRates as any[]).map(Number)
        : [];
      const detectedRates = autoDetectInvestmentRate(investment.amount, currentRates);
      const ratesChanged  = JSON.stringify(detectedRates) !== JSON.stringify(currentRates);
      if (ratesChanged) {
        await tx.investment.update({
          where: { id: investmentId },
          data: { investmentRates: detectedRates },
        });
      }

      // Approval-time: track volume only. Commission amounts are calculated
      // once at month-end by runMonthEndCommissions.
      await tx.investment.update({
        where: { id: investmentId },
        data: { commissionsProcessed: true, advisorId: advisor.id },
      });

      const updatedAdvisor = await tx.member.update({
        where: { empNo },
        data: {
          lastInvestmentAt: investmentDate,
          isActive: true,
          autoDeactivatedAt: null,
        },
      });

      return serializeData({
        alreadyProcessed: false,
        investment,
        advisor: updatedAdvisor,
        commissions: [],
      });
    }, { timeout: 15000 });

    revalidatePath("/features/commissions");

    void logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.COMMISSION,
      entityId: investmentId,
      performedById: resolvedPerformedById,
      branchId,
      metadata: {
        investmentId,
        advisorEmpNo: empNo,
        processedAt: new Date().toISOString(),
        disabledEmpNos,
        manualEmpNos,
        usedSavedHierarchy: !!(hierarchyEmpNos && hierarchyEmpNos.length > 0),
      },
    });

    return { success: true, receipt: serializeData(result) };
  } catch (err: any) {
    console.error("Error processing commissions:", err);
    if (err instanceof ApiError) {
      return { success: false, error: { code: err.code, message: err.message } };
    }
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } };
  }
}

// ─── processCommissionsFromSavedHierarchy ───────────────────────────────────

export async function processCommissionsFromSavedHierarchy(data: {
  investmentId: number;
  empNo: string;
  branchId: number;
  disabledEmpNos?: string[];
  manualEmpNos?: string[];
  skipModifiedWarning?: boolean;
}): Promise<{
  success: boolean;
  receipt?: any;
  hierarchyModifiedWarning?: boolean;
  error?: any;
}> {
  try {
    const { success, empNos, hierarchyModified, error } =
      await getHierarchyEmpNosFromInvestment(data.investmentId);

    if (!success) return { success: false, error };

    if (hierarchyModified && !data.skipModifiedWarning) {
      return {
        success: false,
        hierarchyModifiedWarning: true,
        error: "This investment's hierarchy was manually edited after approval. Re-submit with skipModifiedWarning: true to proceed.",
      };
    }

    const result = await processCommissions({
      investmentId: data.investmentId,
      empNo: data.empNo,
      branchId: data.branchId,
      disabledEmpNos: data.disabledEmpNos ?? [],
      manualEmpNos:   data.manualEmpNos   ?? [],
      hierarchyEmpNos: empNos,
    });

    return { ...result, hierarchyModifiedWarning: false };
  } catch (err: any) {
    console.error("processCommissionsFromSavedHierarchy error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR", message: err.message } };
  }
}