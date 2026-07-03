"use server"

import { ApiError } from "@/lib/error";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { prisma } from "@/lib/prisma";
import { getUplineChain } from "./actions";
import { serializeData } from "@/app/utils/serializers";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/logActivity";
import { ActivityAction, ActivityEntity, Prisma } from "@prisma/client";
import { getHierarchyEmpNosFromInvestment } from "../hr/salary/action";
import { computeExcessCommission } from "@/lib/commissions/excess";
import { resolvePositionTarget } from "@/lib/commissions/resolvePositionTarget";


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
  const endDate = new Date(Date.UTC(year, month, 1));

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

export async function processCommissions(data: {
  investmentId: number;
  empNo: string;
  branchId: number;
  disabledEmpNos?: string[];
  manualEmpNos?: string[];
  hierarchyEmpNos?: string[];
}) {
  const {
    investmentId,
    empNo,
    branchId,
    disabledEmpNos = [],
    manualEmpNos = [],
    hierarchyEmpNos,
  } = data;

  const disabledSet = new Set(disabledEmpNos);

  try {
    const currentUser = await getCurrentUserWithRole();

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

    // Only enforce salary config for non-management, non-probation employees
    if (!isManagement && advisor.status !== "PROBATION" && !advisor.position.salary) {
      throw new ApiError("SALARY_CONFIG_MISSING", "No salary config for position");
    }

    const uplines =
      hierarchyEmpNos && hierarchyEmpNos.length > 0
        ? await prisma.member.findMany({
            where: { empNo: { in: hierarchyEmpNos } },
            include: {
              position: { include: { orc: true, salary: true } },
              branches: { include: { branch: true } },
            },
          })
        : await getUplineChain(advisor.position.rank, branchId);

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
      const year = investmentDate.getFullYear();
      const month = investmentDate.getMonth() + 1;

      const commThreshold = Number(advisor.position.salary?.commThreshold ?? 500000);
      const isHighRate = investment.amount >= commThreshold;
      const isPermanentOrManagement = advisor.status === "PERMANENT" || isManagement;

      const commRate = isPermanentOrManagement
        ? isHighRate
          ? Number(advisor.position.salary?.commRateHigh ?? 0.08)
          : Number(advisor.position.salary?.commRateLow ?? 0.05)
        : isHighRate
          ? 0.1
          : 0.07;

      const personalCommissionAmount = investment.amount * commRate;

      await tx.investment.update({
        where: { id: investmentId },
        data: { commissionsProcessed: true, advisorId: advisor.id },
      });

      const updatedAdvisor = await tx.member.update({
        where: { empNo },
        data: { totalCommission: { increment: personalCommissionAmount } },
      });

      const personalCommissionRecord = await tx.commission.create({
        data: {
          investmentId,
          memberEmpNo: empNo,
          branchId,
          amount: personalCommissionAmount,
          type: "PERSONAL",
          refNumber: await generateCommissionRef(),
        } as any,
        include: { member: { include: { position: true } } },
      });
      createdCommissions.push(personalCommissionRecord);

      // ── Excess commission — FA and management (management uses FA-package rates/targets) ──
      const positionTargetRow = resolvePositionTarget(advisor, year, month);
      const target = Number(positionTargetRow?.targetAmount ?? 0);
      const excessRate = Number(positionTargetRow?.excessRate ?? 0);

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

          const excessCommissionRecord = await tx.commission.create({
            data: {
              investmentId,
              memberEmpNo: empNo,
              branchId,
              amount: excessCommission,
              type: "EXCESS",
              refNumber: await generateCommissionRef(),
            } as any,
            include: { member: { include: { position: true } } },
          });
          createdCommissions.push(excessCommissionRecord);
        }
      }

      // upline commissions
      for (const upline of uplines) {
        if (disabledSet.has(upline.empNo)) continue;
        if (!upline.position?.orc) continue;

        const orcRate = upline.status === "PERMANENT"
          ? upline.position.orc.ratePermanent
          : upline.position.orc.rateNonPermanent;

        const uplineRate = Number(orcRate);
        if (uplineRate === 0) continue;
        if (uplineRate > 1) throw new ApiError("ORC_RATE_TOO_HIGH", "ORC rate too high");

        const uplineAmount = investment.amount * uplineRate;

        await tx.member.update({ where: { empNo: upline.empNo }, data: { totalCommission: { increment: uplineAmount } } });

        const uplineCommissionRecord = await tx.commission.create({
          data: { investmentId, memberEmpNo: upline.empNo, amount: uplineAmount, type: "UPLINE", refNumber: await generateCommissionRef(), branchId } as any,
          include: { member: { include: { position: true } } },
        });
        createdCommissions.push(uplineCommissionRecord);
      }

      // manually added members
      for (const manual of manualMembers) {
        if (disabledSet.has(manual.empNo)) continue;
        if (!manual.position?.orc) continue;

        const orcRate = manual.status === "PERMANENT"
          ? manual.position.orc.ratePermanent
          : manual.position.orc.rateNonPermanent;

        const manualRate = Number(orcRate);
        if (manualRate === 0) continue;
        if (manualRate > 1) throw new ApiError("ORC_RATE_TOO_HIGH", "ORC rate too high");

        const manualAmount = investment.amount * manualRate;

        await tx.member.update({ where: { empNo: manual.empNo }, data: { totalCommission: { increment: manualAmount } } });

        const manualCommissionRecord = await tx.commission.create({
          data: { investmentId, memberEmpNo: manual.empNo, amount: manualAmount, type: "UPLINE", refNumber: await generateCommissionRef(), branchId } as any,
          include: { member: { include: { position: true } } },
        });
        createdCommissions.push(manualCommissionRecord);
      }

      return serializeData({ alreadyProcessed: false, investment, advisor: updatedAdvisor, commissions: createdCommissions });
    }, { timeout: 15000 });

    revalidatePath("/features/commissions");

    void logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.COMMISSION,
      entityId: investmentId,
      performedById: currentUser?.member?.id ?? 0,
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
    // ── Step 1: Resolve hierarchy empNos from the saved investment snapshot ──
    const { success, empNos, hierarchyModified, error } =
      await getHierarchyEmpNosFromInvestment(data.investmentId);
 
    if (!success) {
      return { success: false, error };
    }
 
    // ── Step 2: Warn if hierarchy was manually overridden ────────────────────
    // Return the warning flag so the UI can show a confirmation dialog.
    // The caller can re-invoke with skipModifiedWarning: true to proceed.
    if (hierarchyModified && !data.skipModifiedWarning) {
      return {
        success: false,
        hierarchyModifiedWarning: true,
        error:
          "This investment's hierarchy was manually edited after approval. " +
          "Re-submit with skipModifiedWarning: true to process using the overridden list.",
      };
    }
 
    // ── Step 3: Delegate to the existing processCommissions ──────────────────
    // Import processCommissions from wherever it lives in your codebase.
    // It already accepts hierarchyEmpNos and handles the rest correctly.
    //
    // The dynamic call below is illustrative — replace with a direct import.
 
    const result = await processCommissions({
      investmentId: data.investmentId,
      empNo: data.empNo,
      branchId: data.branchId,
      disabledEmpNos: data.disabledEmpNos ?? [],
      manualEmpNos: data.manualEmpNos ?? [],
      // ← This is the key: pass the pre-resolved list instead of letting
      //   processCommissions fall through to getUplineChain.
      hierarchyEmpNos: empNos,
    });
 
    return {
      ...result,
      hierarchyModifiedWarning: false,
    };
  } catch (err: any) {
    console.error("processCommissionsFromSavedHierarchy error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR", message: err.message } };
  }
}