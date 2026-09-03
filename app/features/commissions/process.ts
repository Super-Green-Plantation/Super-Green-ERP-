"use server"

import { ApiError } from "@/lib/error";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/app/utils/serializers";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/logActivity";
import { ActivityAction, ActivityEntity, Prisma } from "@prisma/client";
import { getHierarchyEmpNosFromInvestment } from "../hr/salary/action";
import { computeExcessCommission } from "@/lib/commissions/excess";
import { resolvePositionTarget } from "@/lib/commissions/resolvePositionTarget";
import { autoDetectInvestmentRate } from "@/lib/commissions/investmentRates";

// ─── Helpers ────────────────────────────────────────────────────────────────

export async function generateCommissionRef() {
  return `COM-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

async function getPriorVolumeThisMonth(
  tx: Prisma.TransactionClient,
  advisorId: number,
  year: number,
  month: number,
  excludeInvestmentId: number,
) {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate   = new Date(Date.UTC(year, month, 1));
  const result = await tx.investment.aggregate({
    where: {
      advisorId,
      commissionsProcessed: true,
      investmentDate: { gte: startDate, lt: endDate },
      id: { not: excludeInvestmentId },
    },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

/** Total approved investment volume for a given member (as FA) in a given month. */
async function getTotalMonthlyVolume(
  tx: Prisma.TransactionClient,
  advisorId: number,
  year: number,
  month: number,
) {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate   = new Date(Date.UTC(year, month, 1));
  const result = await tx.investment.aggregate({
    where: {
      advisorId,
      approvalStatus: "APPROVED",
      investmentDate: { gte: startDate, lt: endDate },
    },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
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
        select: {
          id: true,
          commissionsProcessed: true,
          refNumber: true,
          branchId: true,
          amount: true,
          investmentDate: true,
          renewedFromId: true,
          renewalCreditedAt: true,
          faId: true,
          fmId: true,
          bmId: true,
          rmId: true,
          zmId: true,
          agmId: true,
          ccoId: true,
        },
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

      // ── Decrement volumeAchieved on MonthlyPayroll for all hierarchy members ──
      // Mirrors what approveInvestmentWithHierarchyLog / renewInvestment wrote.
      // Renewals credited amount × 0.25 in the renewal month; normal investments
      // credited the full amount in the investment month.
      const isRenewal = !!investment.renewedFromId && !!investment.renewalCreditedAt;
      const volumeToRemove = isRenewal
        ? Number(investment.amount) * 0.25
        : Number(investment.amount);

      const refDate = isRenewal
        ? new Date(investment.renewalCreditedAt!)
        : new Date(investment.investmentDate);
      const volYear  = refDate.getFullYear();
      const volMonth = refDate.getMonth() + 1;

      const hierarchyMemberIds = [
        investment.faId,
        investment.fmId,
        investment.bmId,
        investment.rmId,
        investment.zmId,
        investment.agmId,
        investment.ccoId,
      ].filter((id): id is number => id !== null && id !== undefined);

      const uniqueHierarchyIds = [...new Set(hierarchyMemberIds)];

      await Promise.all(
        uniqueHierarchyIds.map((memberId) =>
          tx.monthlyPayroll.updateMany({
            where: { memberId, year: volYear, month: volMonth },
            data: { volumeAchieved: { decrement: volumeToRemove } },
          })
        )
      );

      // Delete original commission rows
      await tx.commission.deleteMany({
        where: { investmentId, type: { not: "REVERSED" } },
      });

      // Create REVERSED audit record (one per original commission).
      // Each row needs its own unique refNumber — generateCommissionRef() uses
      // Date.now() + random suffix so sequential calls within the same tx are safe.
      for (const c of existing) {
        const reversedRef = await generateCommissionRef();
        await tx.commission.create({
          data: {
            investmentId,
            memberEmpNo: c.memberEmpNo,
            amount: -c.amount,
            type: "REVERSED" as const,
            refNumber: `REV-${reversedRef}`,
            branchId: investment.branchId,
            month: c.month,
            year: c.year,
          },
        });
      }

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

  const disabledSet = new Set(disabledEmpNos);

  try {
    const currentUser = callerPerformedById
      ? null
      : await getCurrentUserWithRole();
    const resolvedPerformedById = callerPerformedById ?? currentUser?.member?.id ?? 0;

    const advisor = await prisma.member.findUnique({
      where: { empNo },
      include: {
        position: {
          include: { orc: true, salary: true, positionTargets: true },
        },
      },
    });

    if (!advisor) throw new ApiError("ADVISOR_NOT_FOUND", "Advisor not found", 404);
    if (!advisor.position) throw new ApiError("POSITION_MISSING", "Advisor has no position");

    const isManagement = advisor.position.type === "MANAGEMENT";

    if (!isManagement && advisor.status !== "PROBATION" && !advisor.position.salary) {
      console.warn(`[commission] Position ${advisor.position.id} has no salary config — falling back to hardcoded rates for ${advisor.empNo}`);
    }

    // ── Resolve uplines from investment hierarchy snapshot ───────────────────
    let uplines: any[] = [];
    if (hierarchyEmpNos && hierarchyEmpNos.length > 0) {
      uplines = await prisma.member.findMany({
        where: { empNo: { in: hierarchyEmpNos } },
        include: {
          position: { include: { orc: true, salary: true } },
          branches: { include: { branch: true } },
        },
      });
      // Preserve rank order from caller's list
      uplines.sort((a, b) =>
        hierarchyEmpNos!.indexOf(a.empNo) - hierarchyEmpNos!.indexOf(b.empNo)
      );
    } else {
      const inv = await prisma.investment.findUnique({
        where: { id: investmentId },
        select: { fmId: true, bmId: true, rmId: true, zmId: true, agmId: true, ccoId: true },
      });
      const savedIds = [
        inv?.fmId, inv?.bmId, inv?.rmId, inv?.zmId, inv?.agmId, inv?.ccoId,
      ].filter((id): id is number => id !== null && id !== undefined);
      const uniqueSavedIds = [...new Set(savedIds)];
      if (uniqueSavedIds.length > 0) {
        uplines = await prisma.member.findMany({
          where: { id: { in: uniqueSavedIds } },
          include: {
            position: { include: { orc: true, salary: true } },
            branches: { include: { branch: true } },
          },
        });
        uplines.sort((a, b) => uniqueSavedIds.indexOf(a.id) - uniqueSavedIds.indexOf(b.id));
      }
    }

    const manualMembers =
      manualEmpNos.length > 0
        ? await prisma.member.findMany({
          where: { empNo: { in: manualEmpNos } },
          include: { position: { include: { orc: true, salary: true } } },
        })
        : [];

    const result = await prisma.$transaction(async (tx) => {
      const createdCommissions: any[] = [];

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
      const year  = investmentDate.getFullYear();
      const month = investmentDate.getMonth() + 1;

      // ── Feature 2: Auto-set rate to 40% if >= 500K ──────────────────────
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

      // ── Personal commission ──────────────────────────────────────────────
      // Rate decision is based on the advisor's TOTAL personal investment
      // volume for the month (all investments where faId = advisor.id,
      // including the current one), not the single investment amount.
      // This ensures that if an FA's cumulative monthly volume crosses the
      // 500K threshold, every investment in that month gets the higher rate.
      const monthStart = new Date(Date.UTC(year, month - 1, 1));
      const monthEnd   = new Date(Date.UTC(year, month, 1));

      const monthlyInvestments = await tx.investment.findMany({
        where: {
          faId: advisor.id,
          investmentDate: { gte: monthStart, lt: monthEnd },
          status: "Active",
        },
        select: { amount: true, renewedFromId: true },
      });
      // Renewals count at 25% toward volume (consistent with payroll engine)
      const totalMonthlyVolume = monthlyInvestments.reduce(
        (s, inv) => s + (inv.renewedFromId ? Number(inv.amount) * 0.25 : Number(inv.amount)),
        0,
      );

      const commThreshold = Number(advisor.position.salary?.commThreshold ?? 500000);
      // Use total monthly volume for the threshold decision, not per-investment amount
      const isHighRate    = totalMonthlyVolume >= commThreshold;
      const isPermanentNonManagement = advisor.status === "PERMANENT" && !isManagement;

      const commRate = isPermanentNonManagement
        ? isHighRate
          ? Number(advisor.position.salary?.commRateHigh ?? 0.08)
          : Number(advisor.position.salary?.commRateLow  ?? 0.05)
        : isHighRate ? 0.1 : 0.07;

      const personalCommissionAmount = investment.amount * commRate;

      await tx.investment.update({
        where: { id: investmentId },
        data: { commissionsProcessed: true, advisorId: advisor.id },
      });

      const updatedAdvisor = await tx.member.update({
        where: { empNo },
        data: {
          totalCommission: { increment: personalCommissionAmount },
          lastInvestmentAt: investmentDate,
          isActive: true,
          autoDeactivatedAt: null,
        },
      });

      const personalCommissionRecord = await tx.commission.create({
        data: {
          investmentId,
          memberEmpNo: empNo,
          branchId,
          amount: personalCommissionAmount,
          type: "PERSONAL",
          refNumber: await generateCommissionRef(),
          month,
          year,
        },
        include: { member: { include: { position: true } } },
      });
      createdCommissions.push(personalCommissionRecord);

      // ── Excess commission ─────────────────────────────────────────────────
      const positionTargetRow = resolvePositionTarget(advisor, year, month);
      const target     = Number(positionTargetRow?.targetAmount ?? 0);
      const excessRate = Number(positionTargetRow?.excessRate   ?? 0);

      if (target > 0 && excessRate > 0) {
        const priorVolume = await getPriorVolumeThisMonth(tx, advisor.id, year, month, investmentId);
        const { excessCommission } = computeExcessCommission({
          investmentAmount: investment.amount,
          priorVolumeThisMonth: priorVolume,
          target,
          excessRate,
        });

        if (excessCommission > 0) {
          await tx.member.update({
            where: { empNo },
            data: { totalCommission: { increment: excessCommission } },
          });
          const excessRecord = await tx.commission.create({
            data: {
              investmentId, memberEmpNo: empNo, branchId,
              amount: excessCommission, type: "EXCESS",
              refNumber: await generateCommissionRef(), month, year,
            },
            include: { member: { include: { position: true } } },
          });
          createdCommissions.push(excessRecord);
        }
      }

      // ── Upline / ORC commissions ──────────────────────────────────────────
      // All uplines (FM → BM → RM → ZM → AGM → COO) receive their normal ORC
      // rate on the investment amount. The COO is NOT the chairman.
      for (const upline of uplines) {
        if (disabledSet.has(upline.empNo)) continue;
        if (!upline.position?.orc) continue;

        const orcRate = upline.status === "PERMANENT"
          ? Number(upline.position.orc.ratePermanent)
          : Number(upline.position.orc.rateNonPermanent);
        if (orcRate === 0) continue;
        if (orcRate > 1) throw new ApiError("ORC_RATE_TOO_HIGH", "ORC rate too high");

        const uplineAmount = investment.amount * orcRate;
        if (uplineAmount <= 0) continue;

        // Reactivate auto-deactivated upline when they receive a commission
        await tx.member.update({
          where: { empNo: upline.empNo },
          data: {
            totalCommission: { increment: uplineAmount },
            ...(upline.autoDeactivatedAt ? { isActive: true, autoDeactivatedAt: null } : {}),
          },
        });

        const uplineRecord = await tx.commission.create({
          data: {
            investmentId, memberEmpNo: upline.empNo,
            amount: uplineAmount,
            type: "UPLINE",
            refNumber: await generateCommissionRef(),
            branchId, month, year,
          },
          include: { member: { include: { position: true } } },
        });
        createdCommissions.push(uplineRecord);
      }

      // ── Manual members ────────────────────────────────────────────────────
      for (const manual of manualMembers) {
        if (disabledSet.has(manual.empNo)) continue;
        if (!manual.position?.orc) continue;

        const orcRate = manual.status === "PERMANENT"
          ? Number(manual.position.orc.ratePermanent)
          : Number(manual.position.orc.rateNonPermanent);
        if (orcRate === 0) continue;
        if (orcRate > 1) throw new ApiError("ORC_RATE_TOO_HIGH", "ORC rate too high");

        const manualAmount = investment.amount * orcRate;
        await tx.member.update({
          where: { empNo: manual.empNo },
          data: { totalCommission: { increment: manualAmount } },
        });

        const manualRecord = await tx.commission.create({
          data: {
            investmentId, memberEmpNo: manual.empNo,
            amount: manualAmount, type: "UPLINE",
            refNumber: await generateCommissionRef(),
            branchId, month, year,
          },
          include: { member: { include: { position: true } } },
        });
        createdCommissions.push(manualRecord);
      }

      return serializeData({
        alreadyProcessed: false,
        investment,
        advisor: updatedAdvisor,
        commissions: createdCommissions,
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