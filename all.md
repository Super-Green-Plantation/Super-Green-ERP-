app\features\commissions\process.ts

"use server"

import { ApiError } from "@/lib/error";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { prisma } from "@/lib/prisma";
import { getUplineChain } from "./actions";
import { serializeData } from "@/app/utils/serializers";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/logActivity";
import { ActivityAction, ActivityEntity } from "@prisma/client";
import { getHierarchyEmpNosFromInvestment } from "../hr/salary/action";


export async function generateCommissionRef() {
  return `COM-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function processCommissions(data: {
  investmentId: number;
  empNo: string;
  branchId: number;
  disabledEmpNos?: string[];      // members toggled off in UI — fully skipped
  manualEmpNos?: string[];        // manually added members to receive ORC
  hierarchyEmpNos?: string[];     // pre-saved client hierarchy (fa/fm/bm/rm/zm/agm/cco) — bypasses dynamic upline lookup
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
          include: {
            orc: true,
            salary: true,
          },
        },
      },
    });

    if (!advisor) throw new ApiError("ADVISOR_NOT_FOUND", "Advisor not found", 404);

    // Fetch upline chain — use pre-saved client hierarchy when available, otherwise derive dynamically
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

    // Fetch manually added members with their ORC config
    const manualMembers =
      manualEmpNos.length > 0
        ? await prisma.member.findMany({
          where: { empNo: { in: manualEmpNos } },
          include: {
            position: {
              include: { orc: true, salary: true },
            },
          },
        })
        : [];

    const result = await prisma.$transaction(async (tx) => {
      const createdCommissions: any[] = [];

      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
      });

      if (!investment)
        throw new ApiError("INVESTMENT_NOT_FOUND", "Investment not found", 404);

      if (investment.commissionsProcessed) {
        const existingCommissions = await tx.commission.findMany({
          where: { investmentId },
          include: {
            member: {
              select: { empNo: true, nameWithInitials: true, position: true },
            },
          },
        });
        return serializeData({
          alreadyProcessed: true,
          investment,
          commissions: existingCommissions,
        });
      }

      if (!advisor.position)
        throw new ApiError("POSITION_MISSING", "Advisor has no position");

      const isManagement = advisor.position.type === "MANAGEMENT";

      // Only enforce salary config for non-management, non-probation employees
      if (!isManagement && advisor.status !== "PROBATION" && !advisor.position.salary) {
        throw new ApiError("SALARY_CONFIG_MISSING", "No salary config for position");
      }

      const investmentDate = new Date(investment.investmentDate); // or investment.startDate
      const year = investmentDate.getFullYear();
      const month = investmentDate.getMonth() + 1;

      const commThreshold = Number(advisor.position.salary?.commThreshold ?? 500000);
      const isHighRate = investment.amount >= commThreshold;

      // Management treated as permanent for commission rate purposes
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

      // const payrollMemberIds = [
      //   advisor.id,
      //   ...uplines.filter(u => !disabledSet.has(u.empNo)).map(u => u.id),
      //   ...manualMembers.filter(m => !disabledSet.has(m.empNo)).map(m => m.id),
      // ];

      // await Promise.all(
      //   payrollMemberIds.map(memberId =>
      //     tx.monthlyPayroll.upsert({
      //       where: { memberId_year_month: { memberId, year, month } },
      //       update: { volumeAchieved: { increment: investment.amount } },
      //       create: { memberId, year, month, basicSalaryPermanent: 0, monthlyTarget: 0, volumeAchieved: investment.amount },
      //     })
      //   )
      // );

      // Step 3 — advisor commission
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
          refNumber: generateCommissionRef()
        } as any,
        include: { member: { include: { position: true } } },
      });
      createdCommissions.push(personalCommissionRecord);


      // upline commissions (no payroll upserts here anymore)
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
          data: { investmentId, memberEmpNo: upline.empNo, amount: uplineAmount, type: "UPLINE", refNumber: generateCommissionRef(), branchId } as any,
          include: { member: { include: { position: true } } },
        });
        createdCommissions.push(uplineCommissionRecord);
      }

      // --- Manually added members (flat, same ORC formula) ---
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
          data: { investmentId, memberEmpNo: manual.empNo, amount: manualAmount, type: "UPLINE", refNumber: generateCommissionRef(), branchId } as any,
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
      return {
        success: false,
        error: { code: err.code, message: err.message },
      };
    }

    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    };
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





-----------------------------------------------------
app\features\investments\updateInvestmentHierarchy.ts
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

--------------------------------------------------------
app\features\hr\payroll-action.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculatePayroll } from "./payroll-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTeamCounts = { advisors: number; fms: number; bms: number };
type PositionTargetRow = Awaited<ReturnType<typeof resolvePositionTarget>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthsInProbation(
  probationStartDate: string | Date,
  year: number,
  month: number,
) {
  const start = new Date(probationStartDate);
  const evalDate = new Date(year, month - 1, 1);
  return (
    (evalDate.getFullYear() - start.getFullYear()) * 12 +
    (evalDate.getMonth() - start.getMonth())
  );
}

function resolvePositionTarget(member: any, year: number, month: number) {
  if (member.status !== "PROBATION" || !member.probationStartDate) return null;

  const monthsElapsed = getMonthsInProbation(
    member.probationStartDate,
    year,
    month,
  );
  if (monthsElapsed < 0) return null;

  const targets = member.position?.positionTargets;
  if (!targets || targets.length === 0) return null;

  if (monthsElapsed < 6) {
    const periodNumber = monthsElapsed < 3 ? 1 : 2;
    const monthInPeriod = (monthsElapsed % 3) + 1;
    return (
      targets.find(
        (t: any) =>
          t.periodNumber === periodNumber && t.monthNumber === monthInPeriod,
      ) ?? null
    );
  }

  // After 6 months: use after6MonthTarget from any row
  const anyTarget = targets[0];
  return { ...anyTarget, targetAmount: anyTarget.after6MonthTarget ?? 0 };
}

function toPositionTargetData(target: any) {
  if (!target) return undefined;
  return {
    targetAmount: Number(target.targetAmount ?? 0),
    bonusAmount: Number(target.bonusAmount ?? 0),
    partialThreshold: Number(target.partialThreshold ?? 0),
    partialBonus: Number(target.partialBonus ?? 0),
    vehicleThresholdPct: Number(target.vehicleThresholdPct ?? 0),
    vehicleAmount: Number(target.vehicleAmount ?? 0),
    teamActiveThresholdPct: Number(target.teamActiveThresholdPct ?? 0),
    teamActiveAmount: Number(target.teamActiveAmount ?? 0),
    minActiveAdvisors: Number(target.minActiveAdvisors ?? 0),
    minActiveFMs: Number(target.minActiveFMs ?? 0),
    minActiveBMs: Number(target.minActiveBMs ?? 0),
  };
}

async function getActiveTeamCounts(memberId: number): Promise<ActiveTeamCounts> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { recruits: { include: { position: true } } },
  });

  if (!member) return { advisors: 0, fms: 0, bms: 0 };

  const advisors = member.recruits.filter(
    (r: any) => r.isActive && r.position?.title === "FA",
  ).length;
  const fms = member.recruits.filter(
    (r: any) =>
      r.isActive &&
      (r.position?.title === "TL" || r.position?.title === "FM"),
  ).length;
  const bms = member.recruits.filter(
    (r: any) => r.isActive && r.position?.title === "BM",
  ).length;

  return { advisors, fms, bms };
}

/**
 * Normalize a PositionSalary row from Prisma (Decimal → number).
 * Returns null when salary is missing (unconfigured position).
 */
function normalizeSalary(salary: any) {
  if (!salary) return null;
  return {
    basicSalaryPermanent: Number(salary.basicSalaryPermanent),
    basicSalaryProbation: Number(salary.basicSalaryProbation),
    monthlyTarget: Number(salary.monthlyTarget),
    incentiveAmount: Number(salary.incentiveAmount),
    allowanceAmount: Number(salary.allowanceAmount),
    epfEmployee: Number(salary.epfEmployee),
    epfEmployer: Number(salary.epfEmployer),
    etfEmployer: Number(salary.etfEmployer),
    allowanceThresholdPermanent: Number(salary.allowanceThresholdPermanent),
    allowanceThresholdProbation: Number(salary.allowanceThresholdProbation),
    incentivePartialThreshold: Number(salary.incentivePartialThreshold ?? 0.75),
    incentivePartialAmount: Number(salary.incentivePartialAmount ?? 0),
    vehicleThresholdPct: Number(salary.vehicleThresholdPct ?? 0),
    vehicleAmount: Number(salary.vehicleAmount ?? 0),
    teamActiveThresholdPct: Number(salary.teamActiveThresholdPct ?? 0),
    teamActiveAmount: Number(salary.teamActiveAmount ?? 0),
    minActiveAdvisors: Number(salary.minActiveAdvisors ?? 0),
    minActiveFMs: Number(salary.minActiveFMs ?? 0),
    minActiveBMs: Number(salary.minActiveBMs ?? 0),
  };
}

// ─── getPayrollPreview ────────────────────────────────────────────────────────

export async function getPayrollPreview(
  branchId: number,
  year: number,
  month: number,
  volumes: Record<number, number> = {},
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const branchMembers = await prisma.memberBranch.findMany({
    where: { branchId },
    include: {
      member: {
        include: {
          position: {
            include: { salary: true, orc: true, positionTargets: true },
          },
          monthlyPayrolls: { where: { year, month } },
          // Personal commission: direct business written by this member
          commissions: {
            where: {
              type: "PERSONAL",
              investment: {
                investmentDate: { gte: startDate, lt: endDate },
              },
            },
            select: { amount: true },
          },
        },
      },
    },
  });

  const rows = await Promise.all(
    branchMembers.map(async ({ member }: any) => {
      const salary = member.position?.salary;
      const existing = member.monthlyPayrolls?.[0] ?? null;
      const volumeAchieved =
        volumes[member.id] ?? Number(existing?.volumeAchieved ?? 0);

      // Personal (direct) commission — business the member wrote themselves
      const personalCommissionEarned = member.commissions.reduce(
        (sum: number, c: any) => sum + Number(c.amount),
        0,
      );

      // ORC (upline) commission — investment.amount × orcRate, already stored
      // by processCommissions as type=UPLINE records for this member
      const orcCommissions = await prisma.commission.findMany({
        where: {
          memberEmpNo: member.empNo,
          type: "UPLINE",
          investment: {
            investmentDate: { gte: startDate, lt: endDate },
          },
        },
        select: { amount: true },
      });
      const orcEarned = orcCommissions.reduce(
        (sum, c) => sum + Number(c.amount),
        0,
      );

      const normalizedSalary = normalizeSalary(salary);

      // Resolve probation target row
      const positionTargetRow = resolvePositionTarget(member, year, month);
      const positionTargetData = toPositionTargetData(positionTargetRow);

      // Active team counts only needed for probation (team active bonus)
      const activeTeamCounts =
        member.status === "PROBATION"
          ? await getActiveTeamCounts(member.id)
          : undefined;

      const breakdown = normalizedSalary
        ? calculatePayroll(
            normalizedSalary,
            personalCommissionEarned,
            member.status,
            volumeAchieved,
            orcEarned,
            activeTeamCounts,
            positionTargetData,
          )
        : null;

      return {
        memberId: member.id,
        name: member.nameWithInitials ?? member.name,
        empNo: member.empNo,
        position: member.position?.title ?? "—",
        status: member.status,
        alreadyProcessed: !!existing,
        salaryConfigured: !!salary,
        volumeAchieved,
        personalCommissionEarned,
        orcEarned,
        // kept as `actualCommissionEarned` for UI backward-compat
        actualCommissionEarned: personalCommissionEarned,
        breakdown,
      };
    }),
  );

  return rows;
}

// ─── runMonthlyPayroll ────────────────────────────────────────────────────────

export async function runMonthlyPayroll(
  branchId: number,
  year: number,
  month: number,
  volumes: Record<number, number>,
  force = false,
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const branchMembers = await prisma.memberBranch.findMany({
    where: { branchId },
    include: {
      member: {
        include: {
          position: {
            include: { salary: true, orc: true, positionTargets: true },
          },
          monthlyPayrolls: { where: { year, month } },
          commissions: {
            where: {
              type: "PERSONAL",
              investment: {
                investmentDate: { gte: startDate, lt: endDate },
              },
            },
            select: { amount: true },
          },
        },
      },
    },
  });

  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const { member } of branchMembers) {
    const alreadyProcessed = member.monthlyPayrolls?.length > 0;
    if (alreadyProcessed && !force) {
      skipped++;
      continue;
    }

    const salary = member.position?.salary;
    const volumeAchieved = volumes[member.id] ?? 0;

    const personalCommissionEarned = member.commissions.reduce(
      (sum: number, c: any) => sum + Number(c.amount),
      0,
    );

    // ORC from stored UPLINE commission records
    const orcCommissions = await prisma.commission.findMany({
      where: {
        memberEmpNo: member.empNo,
        type: "UPLINE",
        investment: {
          investmentDate: { gte: startDate, lt: endDate },
        },
      },
      select: { amount: true },
    });
    const orcEarned = orcCommissions.reduce(
      (sum, c) => sum + Number(c.amount),
      0,
    );

    const normalizedSalary = normalizeSalary(salary);

    // Skip if no salary config — warn but don't throw so batch continues
    if (!normalizedSalary) {
      errors.push(`${member.nameWithInitials ?? member.empNo}: no salary config`);
      continue;
    }

    const positionTargetRow = resolvePositionTarget(member, year, month);
    const positionTargetData = toPositionTargetData(positionTargetRow);

    const activeTeamCounts =
      member.status === "PROBATION"
        ? await getActiveTeamCounts(member.id)
        : undefined;

    const breakdown = calculatePayroll(
      normalizedSalary,
      personalCommissionEarned,
      member.status,
      volumeAchieved,
      orcEarned,
      activeTeamCounts,
      positionTargetData,
    );

    try {
      await prisma.monthlyPayroll.upsert({
        where: {
          memberId_year_month: { memberId: member.id, year, month },
        },
        create: { memberId: member.id, year, month, ...breakdown },
        update: { ...breakdown },
      });
      processed++;
    } catch (e) {
      errors.push(
        `${member.nameWithInitials ?? member.empNo}: ${String(e)}`,
      );
    }
  }

  revalidatePath("/features/hr/payroll");
  return { success: true, processed, skipped, errors };
}

// ─── getPayrollHistory ────────────────────────────────────────────────────────

export async function getPayrollHistory(memberId: number) {
  return prisma.monthlyPayroll.findMany({
    where: { memberId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}


---------------------------------------------------------------
app\features\investments\actions.ts

"use server"

import { serializeData } from "@/app/utils/serializers";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { logActivity } from "@/lib/logActivity";
import { prisma } from "@/lib/prisma";
import { createInvestmentForExistingClientSchema, updateInvestmentSchema } from "@/lib/validations/investment.schema";
import { ActivityAction, ActivityEntity, Channel, Prisma, Title } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getDescendantBranchIds } from "../branches/actions";
import { upsertActivationForMember } from "@/app/scripts/backfill-activations";

// Generate investment reference number
function generateInvestmentNumber() {
  const prefix = "INV";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
}

export async function getInvestments(page = 1, pageSize = 10, approvalStatus = "ALL") {
  const dbUser = await getCurrentUserWithRole();
  if (!dbUser) throw new Error("User not found");

  let whereCondition: any = {};

  switch (dbUser.role) {
    case "ADMIN":
    case "HR":
    case "DEV":
      whereCondition = {};
      break;

    case "BRANCH_MANAGER":
    case "REGIONAL_MANAGER":
    case "AGM":
    case "EMPLOYEE": {
      const branchIds = dbUser.member?.branches?.map(mb => mb.branchId) ?? [];
      if (branchIds.length === 0) throw new Error("No branches assigned to this user");
      whereCondition = { branchId: { in: branchIds } };
      break;
    }

    default:
      throw new Error("Unauthorized role");
  }

  if (approvalStatus !== "ALL") {
    whereCondition.approvalStatus = approvalStatus;
  }

  const [investments, total] = await Promise.all([
    prisma.investment.findMany({
      where: whereCondition,
      ...(pageSize !== -1 ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      include: {
        client: true,
        plan: true,
        advisor: true,
        branch: true,
        beneficiary: true,
        nominee: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.investment.count({ where: whereCondition }),
  ]);

  return serializeData({
    investments,
    total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page,
  });
}

export async function createInvestment(data: {
  clientId: number;
  branchId?: number;
  planId?: number;
  advisorId?: number;
  amount: number;
  proposalFormNo: string;
}) {
  try {
    const currentUser = await getCurrentUserWithRole();
    const refNumber = generateInvestmentNumber();

    const investment = await prisma.investment.create({
      data: {
        refNumber,
        branchId: Number(data.branchId),
        clientId: data.clientId,
        planId: data.planId || null,
        amount: data.amount,
        investmentDate: new Date(),
        proposalFormNo: data.proposalFormNo,
      },
      include: {
        client: true,
        plan: true,
        advisor: true,
      },
    });

    revalidatePath("/features/investments");

    void logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.INVESTMENT,
      entityId: investment.id,
      performedById: currentUser?.member?.id ?? 0,
      branchId: investment.branchId,
      metadata: { after: investment },
    });

    return { success: true, investment: serializeData(investment) };
  } catch (error) {
    console.error("Error creating investment:", error);
    return { success: false, error: "Failed to create investment" };
  }
}

export async function getInvestmentById(id: number) {

  try {

    const investment = await prisma.investment.findUnique({
      where: { id: id },
      include: {
        client: {
          include: {
            branch: true,
            beneficiaries: true,   // all client's beneficiaries for the picker
            nominees: true,        // all client's nominees for the picker
          },
        },
        beneficiary: true,
        nominee: true,
        plan: true,
        advisor: {
          include: {
            branches: {
              include: {
                branch: true, member: true
              }
            }
          },
        },
        fa: true, fm: true, bm: true, rm: true, zm: true, agm: true, cco: true,
      },
    });
    return investment;
  } catch (error) {
    console.error("Error fetching investment:", error);
    return null;
  }
}

// Get single investment detail by ID
export async function getInvestmentDetailById(id: number) {
  try {
    const investment = await prisma.investment.findUnique({
      where: { id },
      select: {
        id: true,
        amount: true,
        investmentDate: true,
        refNumber: true,
        commissionsProcessed: true,

        client: {
          select: {
            fullName: true,
            nic: true,
            email: true,
            phoneMobile: true,
          },
        },

        plan: {
          select: {
            name: true,
            rate: true,
            duration: true,
          },
        },

        advisor: {
          select: {
            nameWithInitials: true,
            empNo: true,
            branches: {
              select: {
                branch: { select: { name: true } }

              },
            },
          },
        },
      },
    });

    if (!investment) {
      throw new Error("Investment not found");
    }

    return investment;
  } catch (error) {
    console.error("Error fetching investment detail:", error);
    throw error;
  }
}

// Update the advisor for a specific investment
export async function updateAdvisorId(investmentId: number, advisorEmpNo: string) {
  try {
    const [currentUser, oldInvestment] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.investment.findUnique({ where: { id: investmentId }, select: { advisorId: true, branchId: true } }),
    ]);

    const updated = await prisma.investment.update({
      where: { id: investmentId },
      data: {
        advisor: {
          connect: { empNo: advisorEmpNo },
        },
      },
    });

    revalidatePath("/features/commissions");

    void logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.INVESTMENT,
      entityId: investmentId,
      performedById: currentUser?.member?.id ?? 0,
      branchId: oldInvestment?.branchId,
      metadata: { updatedField: "advisorId", before: { advisorId: oldInvestment?.advisorId }, after: { advisorEmpNo } },
    });

    return { success: true, investment: serializeData(updated) };
  } catch (error) {
    console.error("Error updating advisor:", error);
    return { success: false, error: "Failed to update advisor" };
  }
}

// Get all plans associated with a client's investments
export async function getPlansByClient(clientId: number) {
  try {
    const investments = await prisma.investment.findMany({
      where: { clientId },
      include: {
        plan: true,
      },
    });

    const plans = investments.map((inv) => inv.plan);
    // Remove duplicates
    const uniquePlans = Array.from(new Set(plans.filter(p => p !== null).map((p) => p!.id))).map((id) =>
      plans.find((p) => p?.id === id)
    );

    return serializeData(uniquePlans);
  } catch (error) {
    console.error("Error fetching plans by client:", error);
    throw new Error("Failed to fetch plans by client");
  }
}

export async function deleteInvestment(id: number) {
  try {
    const [currentUser, existing] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.investment.findUnique({ where: { id }, select: { branchId: true, clientId: true } }),
    ]);

    await prisma.investment.delete({
      where: { id },
    });
    revalidatePath("/features/commissions");

    void logActivity({
      action: ActivityAction.DELETE,
      entity: ActivityEntity.INVESTMENT,
      entityId: id,
      performedById: currentUser?.member?.id ?? 0,
      branchId: existing?.branchId,
      metadata: { investmentId: id, clientId: existing?.clientId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting investment:", error);
    throw new Error("Failed to delete investment");
  }
}

export async function createInvestmentForExistingClient(data: {
  clientId: number;
  branchId: number;
  planId?: number;
  amount: number;
  proposal?: string;
  investmentDate?: Date;
  investmentRates?: number[];
  beneficiaryId?: number | null;
  nomineeId?: number | null;
  newBeneficiary?: {
    fullName: string;
    nic?: string;
    phone: string;
    bankName: string;
    bankBranch: string;
    accountNo: string;
    relationship: string;
  } | null;
  newNominee?: {
    fullName: string;
    nic?: string;
    permanentAddress: string;
    postalAddress?: string;
  } | null;
  // ── NEW: optional hierarchy for volume tracking ───────────────────────────
  faId?: number | null;
  fmId?: number | null;
  bmId?: number | null;
  rmId?: number | null;
  zmId?: number | null;
  agmId?: number | null;
  ccoId?: number | null;
}) {
  const parsed = createInvestmentForExistingClientSchema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    });
    const firstMessage = parsed.error.issues[0]?.message ?? "Validation failed";
    return { success: false, error: firstMessage, fieldErrors };
  }

  try {
    const currentUser = await getCurrentUserWithRole();

    const result = await prisma.$transaction(async (tx: any) => {
      let beneficiaryId = data.beneficiaryId ?? null;
      let nomineeId = data.nomineeId ?? null;

      if (data.newBeneficiary?.fullName) {
        const b = await tx.beneficiary.create({
          data: {
            clientId: data.clientId,
            ...data.newBeneficiary,
            nic: data.newBeneficiary.nic || null,
          },
        });
        beneficiaryId = b.id;
      }

      if (data.newNominee?.fullName) {
        const n = await tx.nominee.create({
          data: {
            clientId: data.clientId,
            fullName: data.newNominee.fullName,
            nic: data.newNominee.nic || "",
            permanentAddress: data.newNominee.permanentAddress,
            postalAddress: data.newNominee.postalAddress || null,
          },
        });
        nomineeId = n.id;
      }

      const investmentDate = data.investmentDate ?? new Date();

      const plan = data.planId
        ? await tx.financialPlan.findUnique({ where: { id: data.planId } })
        : null;

      const maturityDate = plan
        ? new Date(
          new Date(investmentDate).setMonth(
            new Date(investmentDate).getMonth() + plan.duration
          )
        )
        : null;

      const investmentRates: number[] =
        data.investmentRates?.length ? data.investmentRates : plan?.rate ?? [];

      const months = plan?.duration ?? 0;
      const years = investmentRates.length;
      const monthsPerYear = years > 0 ? months / years : 0;

      const totalHarvest =
        investmentRates.length && months
          ? investmentRates.reduce(
            (sum, rate) =>
              sum + data.amount * (rate / 100) * (monthsPerYear / 12),
            0
          )
          : null;

      const monthlyHarvest =
        totalHarvest && months ? totalHarvest / months : null;

      const investment = await tx.investment.create({
        data: {
          clientId: data.clientId,
          branchId: data.branchId,
          planId: data.planId ?? null,
          investmentDate,
          maturityDate,
          amount: data.amount,
          refNumber: generateInvestmentNumber(),
          investmentRates,
          totalHarvest,
          monthlyHarvest,
          beneficiaryId,
          nomineeId,
          proposalFormNo: data.proposal,
          faId: data.faId,
          fmId: data.fmId,
          bmId: data.bmId,
          rmId: data.rmId,
          zmId: data.zmId,
          agmId: data.agmId,
          ccoId: data.ccoId,
          createdById: currentUser?.member?.id ?? null,
        },
      });

      // ── Volume tracking for hierarchy members (if provided) ───────────────
      const hierarchyMemberIds = [
        data.faId ?? null,
        data.fmId ?? null,
        data.bmId ?? null,
        data.rmId ?? null,
        data.zmId ?? null,
        data.agmId ?? null,
        data.ccoId ?? null,
      ].filter((id): id is number => id !== null);

      const uniqueHierarchyIds = [...new Set(hierarchyMemberIds)];

      if (uniqueHierarchyIds.length > 0) {
        const year = investmentDate.getFullYear();
        const month = investmentDate.getMonth() + 1;

        await Promise.all(
          uniqueHierarchyIds.map((memberId) =>
            tx.monthlyPayroll.upsert({
              where: { memberId_year_month: { memberId, year, month } },
              update: { volumeAchieved: { increment: data.amount } },
              create: {
                memberId,
                year,
                month,
                basicSalaryPermanent: 0,
                monthlyTarget: 0,
                volumeAchieved: data.amount,
              },
            })
          )
        );
        await upsertActivationsForInvestment(
          tx,
          {
            fmId: data.fmId ?? null,
            bmId: data.bmId ?? null,
            rmId: data.rmId ?? null,
            zmId: data.zmId ?? null,
            agmId: data.agmId ?? null,
            ccoId: data.ccoId ?? null,
          },
          year,
          month,
        );
      }



      return investment;
    });

    revalidatePath("/features/investments");

    void logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.INVESTMENT,
      entityId: result.id,
      performedById: currentUser?.member?.id ?? 0,
      branchId: data.branchId,
      metadata: { after: result },
    });

    return JSON.parse(JSON.stringify({ success: true, investment: result }));
  } catch (err) {
    console.error("createInvestmentForExistingClient error:", err);
    return { success: false, error: "Failed to create investment" };
  }
}


export async function updateInvestment({
  investmentId, planId, amount, investmentDate, investmentRates,
  beneficiaryId, nomineeId, newBeneficiary, newNominee, proposalFormNo,
  faId, fmId, bmId, rmId, zmId, agmId, ccoId,
}: {
  investmentId: number;
  planId?: number;
  amount: number;
  investmentDate: Date;
  investmentRates?: number[];
  beneficiaryId: number | null;
  nomineeId: number | null;
  newBeneficiary: any | null;
  newNominee: any | null;
  proposalFormNo: string;
  faId?: number | null;
  fmId?: number | null;
  bmId?: number | null;
  rmId?: number | null;
  zmId?: number | null;
  agmId?: number | null;
  ccoId?: number | null;
}): Promise<{ success: boolean; error?: string }> {

  console.log("hierarchy received:", { faId, fmId, bmId, rmId, zmId, agmId, ccoId });

  // ── Server-side Zod validation ────────────────────────────────────────────
  // const parsed = updateInvestmentSchema.safeParse({
  //   investmentId, planId, amount, investmentDate, investmentRates,
  //   beneficiaryId, nomineeId, proposalFormNo,
  // });
  // if (!parsed.success) {
  //   const firstMessage = parsed.error.issues[0]?.message ?? "Validation failed";
  //   return { success: false, error: firstMessage };
  // }

  try {
    return await prisma.$transaction(async (tx) => {

      const oldInv = await tx.investment.findUnique({
        where: { id: investmentId },
      });
      if (!oldInv) throw new Error("Investment not found");

      const clientId = oldInv.clientId;

      // Create new beneficiary/nominee records if payload provided
      let resolvedBeneficiaryId = beneficiaryId;
      if (newBeneficiary?.fullName) {
        const b = await tx.beneficiary.create({ data: { ...newBeneficiary, clientId: clientId } });
        resolvedBeneficiaryId = b.id;
      }
      let resolvedNomineeId = nomineeId;
      if (newNominee?.fullName) {
        const n = await tx.nominee.create({ data: { ...newNominee, clientId: clientId } });
        resolvedNomineeId = n.id;
      }

      const plan = planId
        ? await tx.financialPlan.findUnique({ where: { id: planId } })
        : null;

      const rates = investmentRates?.length ? investmentRates : (plan?.rate ?? []);
      const months = plan?.duration ?? 0;
      const years = rates.length;
      const monthsPerYear = years > 0 ? months / years : 0;

      const totalHarvest =
        rates.length && months
          ? rates.reduce(
            (sum, rate) => sum + amount * (rate / 100) * (monthsPerYear / 12),
            0
          )
          : null;

      const updated = await tx.investment.update({
        where: { id: investmentId },
        data: {
          planId, amount, investmentDate,
          investmentRates: rates,
          totalHarvest,
          monthlyHarvest: totalHarvest && months ? totalHarvest / months : null,
          beneficiaryId: resolvedBeneficiaryId,
          nomineeId: resolvedNomineeId,
          proposalFormNo: proposalFormNo,
          faId,
          fmId,
          bmId,
          rmId,
          zmId,
          agmId,
          ccoId,
        },
      });

      if (oldInv.approvalStatus === "APPROVED") {
        const oldYear = new Date(oldInv.investmentDate).getFullYear();
        const oldMonth = new Date(oldInv.investmentDate).getMonth() + 1;
        const newYear = new Date(investmentDate).getFullYear();
        const newMonth = new Date(investmentDate).getMonth() + 1;

        const oldMembers = [...new Set(
          [oldInv.faId, oldInv.fmId, oldInv.bmId, oldInv.rmId, oldInv.zmId, oldInv.agmId, oldInv.ccoId]
            .filter((id): id is number => id !== null)
        )];
        const newMembers = [...new Set(
          [faId, fmId, bmId, rmId, zmId, agmId, ccoId]
            .filter((id): id is number => id !== null)
        )];

        const dateChanged = oldYear !== newYear || oldMonth !== newMonth;

        if (dateChanged) {
          // Date changed — decrement everything from old month, increment everything in new month
          await Promise.all(oldMembers.map(memberId =>
            tx.monthlyPayroll.updateMany({
              where: { memberId, year: oldYear, month: oldMonth },
              data: { volumeAchieved: { decrement: oldInv.amount } },
            })
          ));
          await Promise.all(newMembers.map(memberId =>
            tx.monthlyPayroll.upsert({
              where: { memberId_year_month: { memberId, year: newYear, month: newMonth } },
              update: { volumeAchieved: { increment: amount } },
              create: { memberId, year: newYear, month: newMonth, basicSalaryPermanent: 0, monthlyTarget: 0, volumeAchieved: amount },
            })
          ));
        } else {
          // Same month — only touch members that actually changed
          const removed = oldMembers.filter(id => !newMembers.includes(id));
          const added = newMembers.filter(id => !oldMembers.includes(id));

          // Amount changed but same members — need to adjust the delta
          const amountChanged = oldInv.amount !== amount;
          const staying = oldMembers.filter(id => newMembers.includes(id));

          await Promise.all(removed.map(memberId =>
            tx.monthlyPayroll.updateMany({
              where: { memberId, year: oldYear, month: oldMonth },
              data: { volumeAchieved: { decrement: oldInv.amount } },
            })
          ));
          await Promise.all(added.map(memberId =>
            tx.monthlyPayroll.upsert({
              where: { memberId_year_month: { memberId, year: newYear, month: newMonth } },
              update: { volumeAchieved: { increment: amount } },
              create: { memberId, year: newYear, month: newMonth, basicSalaryPermanent: 0, monthlyTarget: 0, volumeAchieved: amount },
            })
          ));

          // If amount changed, adjust delta for members that stayed
          if (amountChanged && staying.length > 0) {
            const delta = amount - oldInv.amount;
            await Promise.all(staying.map(memberId =>
              tx.monthlyPayroll.updateMany({
                where: { memberId, year: oldYear, month: oldMonth },
                data: { volumeAchieved: { increment: delta } },
              })
            ));
          }
        }
      }
      return { success: true };
    });
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// actions/investment.ts
export async function getInvestmentCountsPerAdvisor(advisorIds: number[]): Promise<Record<number, number>> {
  const results = await prisma.investment.groupBy({
    by: ['advisorId'],
    where: {
      advisorId: { in: advisorIds },
    },
    _count: {
      id: true,
    },
  });

  // Build a map: { memberId: count }
  const countMap: Record<number, number> = {};

  // Initialize all to 0 first
  advisorIds.forEach(id => (countMap[id] = 0));

  results.forEach(r => {
    if (r.advisorId) countMap[r.advisorId] = r._count.id;
  });

  return countMap;
}


export type BranchReportRow = {
  branchId: number;
  branchName: string;
  employees: {
    memberId: number;
    name: string;
    position: string;
    proposalCount: number;
    totalAmount: number;
  }[];
};

export async function getProposalReportByBranch(
  from: Date,
  to: Date
): Promise<BranchReportRow[]> {
  const months: { year: number; month: number }[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);

  while (cursor <= end) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Excluded positions (management roles that span all branches)


  const EXCLUDED_TITLES: Title[] = ["COO","ADMIN", "CHAIRMEN", "HR", "ACC", "IT", "CLEANING", "OPM", "PRO", "SE"];

  const branches = await prisma.branch.findMany({

    orderBy: { id: "asc" },
    include: {
      members: {
        where: {
          member: {
            OR: [
              { remark: null },
              { remark: { not: "RESIGN" } },
            ],
            channel: { not: Channel.Micro },
            isActive: true,
            position: {
              title: { notIn: EXCLUDED_TITLES },
            },
          },
        },
        include: {
          member: {
            include: {
              position: true,
              advisorInvestments: {
                where: { createdAt: { gte: from, lte: to } },
                select: { amount: true },
              },
              monthlyPayrolls: {
                where: {
                  OR: months.map(({ year, month }) => ({ year, month })),
                },
                select: { volumeAchieved: true },
              },
            },
          },
        },
      },
    },
  });

  return branches.map((branch) => {
    // Deduplicate members — a member linked to multiple branches
    // will appear in each branch's members list; keep only unique memberIds per branch
    const seen = new Set<number>();
    const uniqueMembers = branch.members.filter(({ member }) => {
      if (seen.has(member.id)) return false;
      seen.add(member.id);
      return true;
    });

    return {
      branchId: branch.id,
      branchName: branch.name,
      employees: uniqueMembers.map(({ member }) => ({
        memberId: member.id,
        name: member.nameWithInitials || "",
        position: member.position?.title ?? "—",
        proposalCount: member.advisorInvestments.length,
        totalAmount: member.monthlyPayrolls.reduce(
          (sum, p) => sum + (p.volumeAchieved ?? 0),
          0
        ),
      })),
    };
  });
}

export async function updateInvestmentDocuments(
  investmentId: number,
  data: { paymentSlip?: string; proposal?: string; agreement?: string }
) {
  if (!investmentId) return { success: false, error: "Investment ID is required" };

  try {
    const [currentUser, investment] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.investment.findUnique({
        where: { id: investmentId },
        select: { clientId: true, client: { select: { branchId: true } } },
      }),
    ]);

    if (!investment) return { success: false, error: "Investment not found" };

    await prisma.investment.update({
      where: { id: investmentId },
      data: {
        paymentSlip: data.paymentSlip === "" ? null : (data.paymentSlip ?? undefined),
        proposal: data.proposal === "" ? null : (data.proposal ?? undefined),
        agreement: data.agreement === "" ? null : (data.agreement ?? undefined),
      },
    });

    revalidatePath("/features/clients");
    revalidatePath(`/features/clients/${investment.clientId}`);

    void logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.CLIENT,        // or add INVESTMENT to your enum
      entityId: investment.clientId,
      performedById: currentUser?.member?.id ?? 0,
      branchId: investment.client?.branchId,
      metadata: { investmentId, updatedFields: Object.keys(data) },
    });

    return { success: true };
  } catch (err) {
    console.error("Error updating investment documents:", err);
    return { success: false, error: "Failed to update investment documents" };
  }
}


export async function searchInvestments(
  searchText: string,
  branchId?: number,
  month?: string, // "2026-04" format
  page = 1,
  pageSize = 10,
  approvalStatus = "ALL"
) {
  const dbUser = await getCurrentUserWithRole();
  if (!dbUser) throw new Error("User not found");

  let whereCondition: any = {
    OR: [
      { client: { nic: { contains: searchText, mode: "insensitive" } } },
      { proposalFormNo: { contains: searchText, mode: "insensitive" } },
      { refNumber: { contains: searchText, mode: "insensitive" } },
    ],
  };

  if (branchId) whereCondition.branchId = branchId;

  // role-based access
  switch (dbUser.role) {
    case "ADMIN": case "HR": case "DEV":
      break;
    case "EMPLOYEE": {
      if (!dbUser.member?.id) throw new Error("Member not found");
      whereCondition = {
        ...whereCondition,
        client: { ...whereCondition.client, createdById: dbUser.member.id },
      };
      break;
    }
    case "BRANCH_MANAGER": case "REGIONAL_MANAGER": case "AGM": {
      const branchIds = dbUser.member?.branches?.map(mb => mb.branchId) ?? [];
      if (branchIds.length === 0) throw new Error("No branches assigned");
      whereCondition.branchId = { in: branchIds };
      break;
    }
    default:
      throw new Error("Unauthorized role");
  }

  // Apply month filter AFTER role switch
  if (month && month !== "all") {
    const [year, mon] = month.split("-").map(Number);
    whereCondition.investmentDate = {
      gte: new Date(year, mon - 1, 1),
      lte: new Date(year, mon, 0, 23, 59, 59, 999),
    };
  }

  if (approvalStatus !== "ALL") {
    whereCondition.approvalStatus = approvalStatus;
  }

  const [investments, total] = await Promise.all([
    prisma.investment.findMany({
      where: whereCondition,
      include: { client: true, plan: true, advisor: true },
      orderBy: { investmentDate: "desc" },
      ...(pageSize !== -1 ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
    }),
    prisma.investment.count({ where: whereCondition }),
  ]);

  return { investments, total, totalPages: Math.ceil(total / pageSize) };
}

// export async function getInvestmentSummary(filters: {
//   branchId?: number;
//   from?: Date;
//   to?: Date;
// }) {
//   const dbUser = await getCurrentUserWithRole();
//   if (!dbUser) throw new Error("User not found");

//   let whereCondition: any = {};

//   if (filters.branchId) whereCondition.branchId = filters.branchId;

//   if (filters.from || filters.to) {
//     whereCondition.investmentDate = {
//       ...(filters.from && { gte: filters.from }),
//       ...(filters.to && { lte: filters.to }),
//     };
//   }

//   // role-based access
//   switch (dbUser.role) {
//     case "ADMIN": case "HR": case "DEV": break;
//     case "BRANCH_MANAGER": case "REGIONAL_MANAGER": case "AGM": {
//       const branchIds = dbUser.member?.branches?.map(mb => mb.branchId) ?? [];
//       whereCondition.branchId = { in: branchIds };
//       break;
//     }
//     default: throw new Error("Unauthorized");
//   }

//   const [totalAmount, proposalCount, investmentCount] = await Promise.all([
//     prisma.investment.aggregate({
//       where: whereCondition,
//       _sum: { amount: true },
//     }),
//     prisma.investment.count({
//       where: { ...whereCondition, proposalFormNo: { not: null } },
//     }),
//     prisma.investment.count({ where: whereCondition }),
//   ]);

//   return {
//     totalAmount: totalAmount._sum.amount ?? 0,
//     proposalCount,
//     investmentCount,
//   };
// }

export async function getInvestmentSummary(filters: {
  branchId?: number;
  from?: Date;
  to?: Date;
}) {
  const dbUser = await getCurrentUserWithRole();
  if (!dbUser) throw new Error("User not found");

  let whereCondition: Prisma.InvestmentWhereInput = {};

  // Resolve branchId filter to include descendants
  if (filters.branchId) {
    const allBranchIds = await getDescendantBranchIds(filters.branchId);
    whereCondition.branchId = { in: allBranchIds };
  }

  if (filters.from || filters.to) {
    whereCondition.investmentDate = {
      ...(filters.from && { gte: filters.from }),
      ...(filters.to && { lte: filters.to }),
    };
  }

  // Role-based access
  switch (dbUser.role) {
    case "ADMIN":
    case "HR":
    case "DEV":
      break;

    case "BRANCH_MANAGER":
    case "REGIONAL_MANAGER":
    case "AGM": {
      const directBranchIds =
        dbUser.member?.branches?.map((mb) => mb.branchId) ?? [];

      // Expand each assigned branch to include its descendants
      const allBranchIdSets = await Promise.all(
        directBranchIds.map((id) => getDescendantBranchIds(id))
      );
      const allBranchIds = [...new Set(allBranchIdSets.flat())];

      // If a branchId filter was already applied, intersect — don't override
      if (filters.branchId) {
        const filterSet = new Set(
          (whereCondition.branchId as { in: number[] }).in
        );
        whereCondition.branchId = {
          in: allBranchIds.filter((id) => filterSet.has(id)),
        };
      } else {
        whereCondition.branchId = { in: allBranchIds };
      }
      break;
    }

    default:
      throw new Error("Unauthorized");
  }

  const [totalAmount, proposalCount, investmentCount] = await Promise.all([
    prisma.investment.aggregate({
      where: whereCondition,
      _sum: { amount: true },
    }),
    prisma.investment.count({
      where: { ...whereCondition, proposalFormNo: { not: null } },
    }),
    prisma.investment.count({ where: whereCondition }),
  ]);

  return {
    totalAmount: totalAmount._sum.amount ?? 0,
    proposalCount,
    investmentCount,
  };
}

type TransactionClient = Prisma.TransactionClient;


type HierarchyRole = "fmId" | "bmId" | "rmId" | "zmId" | "agmId" | "ccoId";

async function upsertActivationsForInvestment(
  tx: TransactionClient,
  hierarchy: {
    fmId?:  number | null;
    bmId?:  number | null;
    rmId?:  number | null;
    zmId?:  number | null;
    agmId?: number | null;
    ccoId?: number | null;
  },
  year: number,
  month: number,
) {
  const roles: HierarchyRole[] = ["fmId", "bmId", "rmId", "zmId", "agmId", "ccoId"];
 
  await Promise.all(
    roles
      .filter((role) => !!hierarchy[role])
      .map((role) =>
        upsertActivationForMember(tx, hierarchy[role]!, role, year, month)
      )
  );
}


export async function approveInvestmentWithHierarchyLog(data: {
  investmentId: number;
  faId?: number | null;
  fmId?: number | null;
  bmId?: number | null;
  rmId?: number | null;
  zmId?: number | null;
  agmId?: number | null;
  ccoId?: number | null;
  reviewNote?: string;
  advisorId?: number | null;
}): Promise<{ success: boolean; investment?: any; error?: string }> {
  try {
    const currentUser = await getCurrentUserWithRole();
    if (!currentUser) throw new Error("Not authorized");
 
    // Guard: at least one hierarchy member must be supplied
    const approverIds = [
      data.faId, data.fmId, data.bmId, data.rmId,
      data.zmId, data.agmId, data.ccoId,
    ];
    if (!approverIds.some((id) => id)) {
      throw new Error("At least one approver is required for approval");
    }
 
    const investment = await prisma.investment.findUnique({
      where: { id: data.investmentId },
      include: { client: true },
    });
 
    if (!investment) throw new Error("Investment not found");
    if (investment.approvalStatus !== "PENDING") throw new Error("Investment is not pending");
 
    const result = await prisma.$transaction(async (tx) => {
      // ── a. Stamp approval fields on the investment ──────────────────────────
      const updated = await tx.investment.update({
        where: { id: data.investmentId },
        data: {
          approvalStatus: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: currentUser.id,
          reviewNote: data.reviewNote,
          faId: data.faId,
          fmId: data.fmId,
          bmId: data.bmId,
          rmId: data.rmId,
          zmId: data.zmId,
          agmId: data.agmId,
          ccoId: data.ccoId,
          advisorId: data.advisorId ?? investment.advisorId,
        },
      });
 
      // ── b. Upsert monthlyPayroll volume for each hierarchy member ───────────
      const hierarchyMemberIds = [
        data.faId ?? null,
        data.fmId ?? null,
        data.bmId ?? null,
        data.rmId ?? null,
        data.zmId ?? null,
        data.agmId ?? null,
        data.ccoId ?? null,
      ].filter((id): id is number => id !== null);
 
      const uniqueHierarchyIds = [...new Set(hierarchyMemberIds)];
 
      if (uniqueHierarchyIds.length > 0) {
        const year = new Date(investment.investmentDate).getFullYear();
        const month = new Date(investment.investmentDate).getMonth() + 1;
 
        await Promise.all(
          uniqueHierarchyIds.map((memberId) =>
            tx.monthlyPayroll.upsert({
              where: { memberId_year_month: { memberId, year, month } },
              update: { volumeAchieved: { increment: investment.amount } },
              create: {
                memberId,
                year,
                month,
                basicSalaryPermanent: 0,
                monthlyTarget: 0,
                volumeAchieved: investment.amount,
              },
            })
          )
        );
 
        // ── c. Upsert activations for each non-FA hierarchy member ────────────
        // Recalculates MonthlyActivation counts so that isActivated flags and
        // cumulative activation counts stay accurate after this investment is saved.
        await upsertActivationsForInvestment(
          tx,
          {
            fmId:  data.fmId  ?? null,
            bmId:  data.bmId  ?? null,
            rmId:  data.rmId  ?? null,
            zmId:  data.zmId  ?? null,
            agmId: data.agmId ?? null,
            ccoId: data.ccoId ?? null,
          },
          year,
          month,
        );
      }
 
      // ── d. Auto-approve client if still pending ─────────────────────────────
      if (investment.client && investment.client.approvalStatus !== "APPROVED") {
        await tx.client.update({
          where: { id: investment.clientId },
          data: {
            approvalStatus: "APPROVED",
            reviewedAt: new Date(),
            reviewedBy: currentUser.id,
            reviewNote: "Automatically approved upon investment approval.",
          },
        });
      }
 
      return updated;
    });
 
    revalidatePath("/features/investments");
 
    // ── e. Audit log — fires AFTER transaction commits ─────────────────────
    // Hierarchy snapshot is stored in metadata so you can always reconstruct
    // "who was on this investment when it was approved".
    void logActivity({
      action: ActivityAction.APPROVE,
      entity: ActivityEntity.INVESTMENT,
      entityId: data.investmentId,
      performedById: currentUser?.member?.id ?? 0,
      branchId: investment.branchId,
      metadata: {
        event: "hierarchy_snapshot_at_approval",
        hierarchySnapshot: {
          faId: data.faId ?? null,
          fmId: data.fmId ?? null,
          bmId: data.bmId ?? null,
          rmId: data.rmId ?? null,
          zmId: data.zmId ?? null,
          agmId: data.agmId ?? null,
          ccoId: data.ccoId ?? null,
        },
        reviewNote: data.reviewNote ?? null,
        approvedAt: new Date().toISOString(),
      },
    });
 
    return { success: true, investment: result };
  } catch (error: any) {
    console.error("approveInvestmentWithHierarchyLog error:", error);
    return { success: false, error: error.message };
  }
}

export async function rejectInvestment(data: {
  investmentId: number;
  reviewNote: string;
}) {
  try {
    const currentUser = await getCurrentUserWithRole();
    if (!currentUser) throw new Error("Not authorized");
    if (!data.reviewNote || data.reviewNote.trim() === "") {
      throw new Error("Review note is required for rejection");
    }

    const updated = await prisma.investment.update({
      where: { id: data.investmentId },
      data: {
        approvalStatus: "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: currentUser.id,
        reviewNote: data.reviewNote,
      },
    });

    revalidatePath("/features/investments");
    return { success: true, investment: updated };
  } catch (error: any) {
    console.error("rejectInvestment error:", error);
    return { success: false, error: error.message };
  }
}



---------------------------------------
app\features\hr\salary\action.ts
"use server";

/**
 * investment-hierarchy.ts
 *
 * New functions that complete the proposed investment → commission flow.
 * These are meant to be dropped into your existing actions file alongside
 * the functions already present (approveInvestment, updateInvestmentHierarchy,
 * processCommissions, etc.).
 *
 * All four functions work with your existing schema and DB rows with zero
 * migration required — they only read/write fields that already exist.
 *
 * Functions in this file:
 *   1. getHierarchyEmpNosFromInvestment  — resolves saved faId…ccoId → empNos
 *   2. approveInvestmentWithHierarchyLog — approveInvestment + audit trail
 *   3. updateInvestmentHierarchyWithAudit — updateInvestmentHierarchy + audit + role guard
 *   4. processCommissionsFromSavedHierarchy — one-call commission processing, no manual filtering
 */

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { logActivity } from "@/lib/logActivity";
import { ActivityAction, ActivityEntity } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// upsertActivationsForInvestment (inlined from activations helper)
// ─────────────────────────────────────────────────────────────────────────────

type TransactionClient = Prisma.TransactionClient;
type HierarchyRole = "fmId" | "bmId" | "rmId" | "zmId" | "agmId" | "ccoId";

/**
 * Recalculates and upserts the MonthlyActivation record for a single hierarchy
 * member (e.g. the FM, BM, RM…) based on how many unique lower-level members
 * contributed investments in the given month.
 *
 * Activation count formula per role:
 *   FM  → count of unique FAs
 *   BM  → unique FAs + unique FMs below this BM
 *   RM  → unique FAs + FMs + BMs below this RM
 *   … and so on up to CCO
 *
 * isActivated = activationCount >= 4  (the threshold used across your codebase)
 */
async function upsertActivationForMember(
  tx: TransactionClient,
  memberId: number,
  role: HierarchyRole,
  year: number,
  month: number,
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate   = new Date(year, month, 1);

  // Pull every investment in this month where this member appears in their role
  const investments = await tx.investment.findMany({
    where: {
      [role]: memberId,
      investmentDate: { gte: startDate, lt: endDate },
      faId: { not: null }, // only count investments that have a direct FA
    },
    select: {
      faId: true,
      fmId: true,
      bmId: true,
      rmId: true,
      zmId: true,
      agmId: true,
    },
  });

  // Each set holds IDs of members at that level who contributed this month,
  // excluding the current member themselves (they don't count their own layer).
  const uniqueFaIds  = new Set(investments.map((i) => i.faId).filter(Boolean));
  const uniqueFmIds  = new Set(investments.filter((i) => i.fmId !== memberId).map((i) => i.fmId).filter(Boolean));
  const uniqueBmIds  = new Set(investments.filter((i) => i.bmId !== memberId).map((i) => i.bmId).filter(Boolean));
  const uniqueRmIds  = new Set(investments.filter((i) => i.rmId !== memberId).map((i) => i.rmId).filter(Boolean));
  const uniqueZmIds  = new Set(investments.filter((i) => i.zmId !== memberId).map((i) => i.zmId).filter(Boolean));
  const uniqueAgmIds = new Set(investments.filter((i) => i.agmId !== memberId).map((i) => i.agmId).filter(Boolean));

  // The activation count for each role is cumulative: higher roles see the
  // contributions of every level below them.
  const activationCount = {
    fmId:  uniqueFaIds.size,
    bmId:  uniqueFaIds.size + uniqueFmIds.size,
    rmId:  uniqueFaIds.size + uniqueFmIds.size + uniqueBmIds.size,
    zmId:  uniqueFaIds.size + uniqueFmIds.size + uniqueBmIds.size + uniqueRmIds.size,
    agmId: uniqueFaIds.size + uniqueFmIds.size + uniqueBmIds.size + uniqueRmIds.size + uniqueZmIds.size,
    ccoId: uniqueFaIds.size + uniqueFmIds.size + uniqueBmIds.size + uniqueRmIds.size + uniqueZmIds.size + uniqueAgmIds.size,
  }[role];

  const isActivated = activationCount >= 4;

  await tx.monthlyActivation.upsert({
    where:  { memberId_year_month: { memberId, year, month } },
    create: { memberId, year, month, activationCount, isActivated },
    update: { activationCount, isActivated },
  });
}

/**
 * Iterates over the non-null hierarchy role members supplied and recalculates
 * each one's MonthlyActivation record for the given year/month.
 *
 * Called inside the approval transaction (and re-called after any hierarchy
 * edit) so that activation counts stay in sync with the investment snapshot.
 *
 * Note: faId is intentionally excluded — FAs have their own activation logic
 * that is not recalculated here.
 */
async function upsertActivationsForInvestment(
  tx: TransactionClient,
  hierarchy: {
    fmId?:  number | null;
    bmId?:  number | null;
    rmId?:  number | null;
    zmId?:  number | null;
    agmId?: number | null;
    ccoId?: number | null;
  },
  year: number,
  month: number,
) {
  const roles: HierarchyRole[] = ["fmId", "bmId", "rmId", "zmId", "agmId", "ccoId"];

  await Promise.all(
    roles
      .filter((role) => !!hierarchy[role])
      .map((role) =>
        upsertActivationForMember(tx, hierarchy[role]!, role, year, month)
      )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The seven hierarchy role columns stored on every Investment row.
 * Order matters: it mirrors the rank order FA (lowest) → CCO (highest).
 */
const HIERARCHY_FIELDS = [
  "faId",
  "fmId",
  "bmId",
  "rmId",
  "zmId",
  "agmId",
  "ccoId",
] as const;

type HierarchyField = (typeof HIERARCHY_FIELDS)[number];
type HierarchyIds = Partial<Record<HierarchyField, number | null>>;

/**
 * Roles that are allowed to manually edit an approved investment's hierarchy.
 * Anyone outside this list hitting updateInvestmentHierarchyWithAudit will get
 * a 403-style error before any DB write happens.
 */
const HIERARCHY_EDIT_ROLES = ["ADMIN", "HR"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 1. getHierarchyEmpNosFromInvestment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads the seven hierarchy member IDs (faId, fmId, bmId, rmId, zmId, agmId,
 * ccoId) that were snapshotted onto the Investment at approval time, then
 * resolves each non-null ID to its Member.empNo.
 *
 * This is the bridge function that lets processCommissions use the saved
 * hierarchy list instead of rebuilding it dynamically via getUplineChain.
 *
 * Usage inside processCommissions:
 *   const { empNos } = await getHierarchyEmpNosFromInvestment(investmentId);
 *   await processCommissions({ ..., hierarchyEmpNos: empNos });
 *
 * @param investmentId  Primary key of the Investment row.
 * @returns             { empNos: string[], hierarchyModified: boolean }
 *                      empNos  — ordered list of empNo strings (nulls dropped)
 *                      hierarchyModified — true when an HR override was applied
 *                        after approval (requires the hierarchyModified column
 *                        — see schema migration note in the .md doc).
 *                        Falls back to false if the column doesn't exist yet.
 */
export async function getHierarchyEmpNosFromInvestment(investmentId: number): Promise<{
  success: boolean;
  empNos: string[];
  hierarchyModified: boolean;
  error?: string;
}> {
  try {
    // Step 1 — fetch only the columns we need (avoids pulling the full row)
    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
      select: {
        approvalStatus: true,
        // hierarchyModified is a new optional column — we read it safely below
        faId: true,
        fmId: true,
        bmId: true,
        rmId: true,
        zmId: true,
        agmId: true,
        ccoId: true,
      },
    });

    if (!investment) {
      return { success: false, empNos: [], hierarchyModified: false, error: "Investment not found" };
    }

    if (investment.approvalStatus !== "APPROVED") {
      return {
        success: false,
        empNos: [],
        hierarchyModified: false,
        error: "Investment is not approved — hierarchy is not finalised yet",
      };
    }

    // Step 2 — collect unique non-null member IDs in rank order
    const memberIds = [
      ...new Set(
        HIERARCHY_FIELDS.map((f) => investment[f] as number | null).filter(
          (id): id is number => id !== null
        )
      ),
    ];

    if (memberIds.length === 0) {
      // Approved investment with no hierarchy saved — this is valid for some
      // older records (e.g. investment 191 in the DB has all nulls).
      return { success: true, empNos: [], hierarchyModified: false };
    }

    // Step 3 — batch-resolve member IDs → empNos in one query
    const members = await prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, empNo: true },
    });

    // Preserve the rank order (FA first, CCO last) rather than DB return order
    const idToEmpNo = new Map(members.map((m) => [m.id, m.empNo]));
    const empNos = memberIds
      .map((id) => idToEmpNo.get(id))
      .filter((e): e is string => Boolean(e));

    // Step 4 — read the optional hierarchyModified flag
    // Cast to any because the column may not be in the generated Prisma types yet.
    // Once you run the migration and regenerate the client, remove the cast.
    const hierarchyModified = Boolean(
      (investment as any).hierarchyModified ?? false
    );

    return { success: true, empNos, hierarchyModified };
  } catch (err: any) {
    console.error("getHierarchyEmpNosFromInvestment error:", err);
    return { success: false, empNos: [], hierarchyModified: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. approveInvestmentWithHierarchyLog
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for approveInvestment that adds a structured audit log
 * entry at the moment the hierarchy snapshot is taken.
 *
 * What it does differently from the original approveInvestment:
 *   - Calls logActivity with entity=INVESTMENT, action=APPROVE after the
 *     transaction commits, recording the full hierarchy snapshot in metadata.
 *   - The metadata shape is intentionally identical to what
 *     updateInvestmentHierarchyWithAudit logs, so you can diff before/after
 *     across both events in the ActivityLog table.
 *
 * Everything else (monthlyPayroll upsert, upsertActivationsForInvestment,
 * auto-approving the client) is identical to the original.
 *
 * @param data  Same shape as the original approveInvestment params.
 */
export async function approveInvestmentWithHierarchyLog(data: {
  investmentId: number;
  faId?: number | null;
  fmId?: number | null;
  bmId?: number | null;
  rmId?: number | null;
  zmId?: number | null;
  agmId?: number | null;
  ccoId?: number | null;
  reviewNote?: string;
  advisorId?: number | null;
}): Promise<{ success: boolean; investment?: any; error?: string }> {
  try {
    const currentUser = await getCurrentUserWithRole();
    if (!currentUser) throw new Error("Not authorized");

    // Guard: at least one hierarchy member must be supplied
    const approverIds = [
      data.faId, data.fmId, data.bmId, data.rmId,
      data.zmId, data.agmId, data.ccoId,
    ];
    if (!approverIds.some((id) => id)) {
      throw new Error("At least one approver is required for approval");
    }

    const investment = await prisma.investment.findUnique({
      where: { id: data.investmentId },
      include: { client: true },
    });

    if (!investment) throw new Error("Investment not found");
    if (investment.approvalStatus !== "PENDING") throw new Error("Investment is not pending");

    const result = await prisma.$transaction(async (tx) => {
      // ── a. Stamp approval fields on the investment ──────────────────────────
      const updated = await tx.investment.update({
        where: { id: data.investmentId },
        data: {
          approvalStatus: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: currentUser.id,
          reviewNote: data.reviewNote,
          faId: data.faId,
          fmId: data.fmId,
          bmId: data.bmId,
          rmId: data.rmId,
          zmId: data.zmId,
          agmId: data.agmId,
          ccoId: data.ccoId,
          advisorId: data.advisorId ?? investment.advisorId,
        },
      });

      // ── b. Upsert monthlyPayroll volume for each hierarchy member ───────────
      const hierarchyMemberIds = [
        data.faId ?? null,
        data.fmId ?? null,
        data.bmId ?? null,
        data.rmId ?? null,
        data.zmId ?? null,
        data.agmId ?? null,
        data.ccoId ?? null,
      ].filter((id): id is number => id !== null);

      const uniqueHierarchyIds = [...new Set(hierarchyMemberIds)];

      if (uniqueHierarchyIds.length > 0) {
        const year = new Date(investment.investmentDate).getFullYear();
        const month = new Date(investment.investmentDate).getMonth() + 1;

        await Promise.all(
          uniqueHierarchyIds.map((memberId) =>
            tx.monthlyPayroll.upsert({
              where: { memberId_year_month: { memberId, year, month } },
              update: { volumeAchieved: { increment: investment.amount } },
              create: {
                memberId,
                year,
                month,
                basicSalaryPermanent: 0,
                monthlyTarget: 0,
                volumeAchieved: investment.amount,
              },
            })
          )
        );

        // ── c. Upsert activations for each non-FA hierarchy member ────────────
        // Recalculates MonthlyActivation counts so that isActivated flags and
        // cumulative activation counts stay accurate after this investment is saved.
        await upsertActivationsForInvestment(
          tx,
          {
            fmId:  data.fmId  ?? null,
            bmId:  data.bmId  ?? null,
            rmId:  data.rmId  ?? null,
            zmId:  data.zmId  ?? null,
            agmId: data.agmId ?? null,
            ccoId: data.ccoId ?? null,
          },
          year,
          month,
        );
      }

      // ── d. Auto-approve client if still pending ─────────────────────────────
      if (investment.client && investment.client.approvalStatus !== "APPROVED") {
        await tx.client.update({
          where: { id: investment.clientId },
          data: {
            approvalStatus: "APPROVED",
            reviewedAt: new Date(),
            reviewedBy: currentUser.id,
            reviewNote: "Automatically approved upon investment approval.",
          },
        });
      }

      return updated;
    });

    revalidatePath("/features/investments");

    // ── e. Audit log — fires AFTER transaction commits ─────────────────────
    // Hierarchy snapshot is stored in metadata so you can always reconstruct
    // "who was on this investment when it was approved".
    void logActivity({
      action: ActivityAction.APPROVE,
      entity: ActivityEntity.INVESTMENT,
      entityId: data.investmentId,
      performedById: currentUser?.member?.id ?? 0,
      branchId: investment.branchId,
      metadata: {
        event: "hierarchy_snapshot_at_approval",
        hierarchySnapshot: {
          faId: data.faId ?? null,
          fmId: data.fmId ?? null,
          bmId: data.bmId ?? null,
          rmId: data.rmId ?? null,
          zmId: data.zmId ?? null,
          agmId: data.agmId ?? null,
          ccoId: data.ccoId ?? null,
        },
        reviewNote: data.reviewNote ?? null,
        approvedAt: new Date().toISOString(),
      },
    });

    return { success: true, investment: result };
  } catch (error: any) {
    console.error("approveInvestmentWithHierarchyLog error:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. updateInvestmentHierarchyWithAudit
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for updateInvestmentHierarchy that adds:
 *   1. Role guard  — only ADMIN and HR roles may call this.
 *   2. Audit log   — before + after snapshot written to ActivityLog.metadata.
 *   3. Modified flag — sets hierarchyModified = true on the investment so
 *                      the commission UI can warn the operator.
 *                      (Requires the schema migration — see the .md doc.)
 *
 * The payroll adjustment logic (decrement removed members, increment added
 * members) is identical to the original updateInvestmentHierarchy.
 *
 * @param investmentId   Primary key of the Investment row.
 * @param newHierarchy   Partial map of the seven role fields with new values.
 *                       Pass null explicitly to clear a role.
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// 4. processCommissionsFromSavedHierarchy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The core function that closes the "no manual filtering" loop.
 *
 * How it differs from calling processCommissions directly:
 *   - It calls getHierarchyEmpNosFromInvestment internally to build the
 *     hierarchyEmpNos list — the caller does NOT need to know or supply it.
 *   - It warns when the investment hierarchy was manually overridden so the
 *     operator UI can surface an alert before the user confirms processing.
 *   - It passes the resolved list as hierarchyEmpNos to processCommissions,
 *     which bypasses the getUplineChain dynamic lookup entirely.
 *   - disabledEmpNos and manualEmpNos are still accepted for exception handling
 *     exactly as before — they are passed through unchanged to processCommissions.
 *
 * Call this from your commissions UI instead of processCommissions directly.
 *
 * @param data.investmentId     Investment to process.
 * @param data.empNo            The advisor's empNo (for personal commission).
 * @param data.branchId         The branch this investment belongs to.
 * @param data.disabledEmpNos   Optional: members to skip even if in hierarchy.
 * @param data.manualEmpNos     Optional: members to add that aren't in hierarchy.
 * @param data.skipModifiedWarning  Set true to process even when hierarchy was
 *                              manually overridden without surfacing a warning.
 */
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
    const { processCommissions } = await import("../../commissions/process"); // adjust path

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

// ─────────────────────────────────────────────────────────────────────────────
// 5. getInvestmentHierarchyAuditLog  (bonus utility)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all ActivityLog entries for a given investment that relate to
 * hierarchy events (both the original approval snapshot and any subsequent
 * manual overrides).
 *
 * Useful for the "View hierarchy history" panel in your investment detail page.
 *
 * @param investmentId  Primary key of the Investment row.
 */
export async function getInvestmentHierarchyAuditLog(investmentId: number): Promise<{
  success: boolean;
  logs?: Array<{
    id: number;
    action: string;
    performedById: number | null;
    performedByName: string | null;
    createdAt: Date;
    event: string | null;
    before: Record<string, number | null> | null;
    after: Record<string, number | null> | null;
  }>;
  error?: string;
}> {
  try {
    // Fetch all ActivityLog rows for this investment, most recent first.
    // We filter in-memory for hierarchy events because metadata is a JSON
    // column and Prisma doesn't support deep JSON WHERE on all DB versions.
    const allLogs = await prisma.activityLog.findMany({
      where: {
        entity: ActivityEntity.INVESTMENT,
        entityId: investmentId,
        action: { in: [ActivityAction.APPROVE, ActivityAction.UPDATE] },
      },
      include: {
        performedBy: { select: { id: true, nameWithInitials: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Keep only logs that contain a hierarchy event marker in their metadata.
    const hierarchyLogs = allLogs
      .filter((log) => {
        const meta = log.metadata as any;
        return (
          meta?.event === "hierarchy_snapshot_at_approval" ||
          meta?.event === "hierarchy_manual_override"
        );
      })
      .map((log) => {
        const meta = log.metadata as any;
        return {
          id: log.id,
          action: log.action as string,
          performedById: log.performedBy?.id ?? null,
          performedByName: log.performedBy?.nameWithInitials ?? null,
          createdAt: log.createdAt,
          event: meta?.event ?? null,
          before: meta?.before ?? null,
          after: meta?.after ?? meta?.hierarchySnapshot ?? null,
        };
      });

    return { success: true, logs: hierarchyLogs };
  } catch (err: any) {
    console.error("getInvestmentHierarchyAuditLog error:", err);
    return { success: false, error: err.message };
  }
}


----------------------
app\const\HIERARCHY_FIELDS.ts
export const HIERARCHY_FIELDS = [
  "faId",
  "fmId",
  "bmId",
  "rmId",
  "zmId",
  "agmId",
  "ccoId",
] as const;
 
type HierarchyField = (typeof HIERARCHY_FIELDS)[number];
type HierarchyIds = Partial<Record<HierarchyField, number | null>>;

export const HIERARCHY_EDIT_ROLES = ["ADMIN", "HR"] as const;

----------------------------------------------------------
app\features\clients\actions.ts

"use server"

import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { generateInvestmentNumber } from "@/lib/investment";
import { logActivity } from "@/lib/logActivity";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { saveClientSchema, updateClientSchema, updateBeneficiarySchema, updateNomineeSchema } from "@/lib/validations/client.schema";
import { ActivityAction, ActivityEntity, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import crypto from "crypto"
import nodemailer from "nodemailer";
import { upsertActivationsForInvestment } from "../hr/salary/action";


export async function getAccessibleClients(page = 1, pageSize = 10, searchText = "") {
  const dbUser = await getCurrentUserWithRole();
  if (!dbUser) throw new Error("User not found");

  let whereCondition: any = {};

  switch (dbUser.role) {
    case "ADMIN":
    case "HR":
    case "DEV":
      whereCondition = {};
      break;

    case "EMPLOYEE": {
      //  ONLY their own clients
      if (!dbUser.member?.id) {
        throw new Error("Member not found for user");
      }

      whereCondition = {
        createdById: dbUser.member.id,
      };
      break;
    }

    case "BRANCH_MANAGER":
    case "REGIONAL_MANAGER":
    case "AGM": {
      const branchIds =
        dbUser.member?.branches?.map((mb) => mb.branchId) ?? [];

      if (branchIds.length === 0) {
        throw new Error("No branches assigned to this user");
      }

      whereCondition = {
        branchId: { in: branchIds },
      };
      break;
    }

    default:
      throw new Error("Unauthorized role");
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where: whereCondition,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        investments: { include: { plan: true } },
        branch: true,
        beneficiaries: true,
        nominees: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.count({ where: whereCondition }),
  ]);

  return serializeData({
    clients,
    total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page,
  });
}

// Get all clients with full details
export async function getClients() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        beneficiaries: true,
        nominees: true,
        investments: true,
        branch: {
          include: {
            members: {
              include: {
                member: { include: { position: true } }

              },
            },
          },
        },
      },
    });
    return { clients };
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw new Error("Failed to fetch clients");
  }
}

// Get single client by ID
export async function getClientById(id: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  const privilegedRoles = ["ADMIN", "HR", "DEV"];

  const client = await prisma.client.findFirst({
    where: {
      id,
      ...(privilegedRoles.includes(dbUser!.role)
        ? {}
        : { branchId: Number(dbUser!.branchId) }),
    },
    include: {
      investments: {
        include: {
          client: true,
          plan: true,
          beneficiary: true,
          nominee: true
        }
      },
      branch: true,
      nominees: true,
      beneficiaries: true,
      fa: { include: { position: { include: { salary: true, orc: true } }, branches: { include: { branch: true } } } },
      fm: { include: { position: { include: { salary: true, orc: true } }, branches: { include: { branch: true } } } },
      bm: { include: { position: { include: { salary: true, orc: true } }, branches: { include: { branch: true } } } },
      rm: { include: { position: { include: { salary: true, orc: true } }, branches: { include: { branch: true } } } },
      zm: { include: { position: { include: { salary: true, orc: true } }, branches: { include: { branch: true } } } },
      agm: { include: { position: { include: { salary: true, orc: true } }, branches: { include: { branch: true } } } },
      cco: { include: { position: { include: { salary: true, orc: true } }, branches: { include: { branch: true } } } },
    },
  });

  if (!client) {
    throw new Error("Client not accessible");
  }

  return client;
}
// Get clients by branch
export async function getClientsByBranch(branchId: number) {
  try {
    const clients = await prisma.client.findMany({
      where: { branchId },
      include: {
        investments: true,
        branch: true,
        beneficiaries: true,
        nominees: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { clients };
  } catch (error) {
    console.error("Error fetching clients by branch:", error);
    throw new Error("Failed to fetch clients by branch");
  }
}

export async function getClientsByMember(memberId: number) {
  try {
    const clients = await prisma.client.findMany({
      where: {
        memberId: memberId,
      },
      include: {
        investments: true,
        branch: true,
        beneficiaries: true,
        nominees: true,
      },
    });
    return { clients };
  } catch (error) {
    console.error("Error fetching clients by member:", error);
    throw new Error("Failed to fetch clients by member");
  }
}

const UNIQUE_FIELD_LABELS: Record<string, string> = {
  nic: "NIC",
  drivingLicense: "Driving License",
  passportNo: "Passport Number",
  email: "Email",
  proposalFormNo: "Proposal Form Number",
};

export async function saveClient(
  data: {
    applicant: any;
    investment: any;
    beneficiary?: any;
    nominee?: any;
  },
  email: any
) {
  const { applicant, investment, beneficiary, nominee } = data;

  const parsed = saveClientSchema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    });
    const firstMessage = parsed.error.issues[0]?.message ?? "Validation failed";
    return { success: false, error: firstMessage, fieldErrors };
  }

  try {
    const currentUser = await getCurrentUserWithRole();

    const client = await prisma.$transaction(async (tx: any) => {
      const member = await tx.member.findFirst({
        where: {
          email,
          branches: { some: { branchId: Number(applicant.branchId) } },
        },
      });

      const createClient = await tx.client.create({
        data: {
          fullName: applicant.fullName,
          nic: applicant.nic || null,
          drivingLicense: applicant.drivingLicense || null,
          passportNo: applicant.passportNo || null,
          email: applicant.email || null,
          phoneMobile: applicant.phoneMobile || null,
          phoneLand: applicant.phoneLand || null,
          dateOfBirth: applicant.dateOfBirth ? new Date(applicant.dateOfBirth) : null,
          occupation: applicant.occupation || null,
          address: applicant.address,
          branchId: applicant.branchId,
          signature: applicant.signature,
          idFront: applicant.idFront,
          idBack: applicant.idBack,
          createdById: currentUser?.member?.id ?? null,
          faId: applicant.faId ?? null,
          fmId: applicant.fmId ?? null,
          bmId: applicant.bmId ?? null,
          rmId: applicant.rmId ?? null,
          zmId: applicant.zmId ?? null,
          agmId: applicant.agmId ?? null,
          ccoId: applicant.ccoId ?? null,
        },
      });

      if (member) {
        await tx.member.update({
          where: { id: member.id },
          data: { lastClientRegisteredAt: new Date() },
        });
      }

      let beneficiaryId: number | null = null;
      if (beneficiary?.fullName) {
        const createdBeneficiary = await tx.beneficiary.create({
          data: {
            clientId: createClient.id,
            fullName: beneficiary.fullName,
            nic: beneficiary.nic || null,
            phone: beneficiary.phone || "",
            bankName: beneficiary.bankName || "",
            bankBranch: beneficiary.bankBranch || "",
            accountNo: beneficiary.accountNo || "",
            relationship: beneficiary.relationship || "",
          },
        });
        beneficiaryId = createdBeneficiary.id;
      }

      let nomineeId: number | null = null;
      if (nominee?.fullName) {
        const createdNominee = await tx.nominee.create({
          data: {
            clientId: createClient.id,
            fullName: nominee.fullName,
            nic: nominee.nic || "",
            permanentAddress: nominee.permanentAddress || "",
            postalAddress: nominee.postalAddress || null,
          },
        });
        nomineeId = createdNominee.id;
      }

      const investmentDate = applicant.investmentDate
        ? new Date(applicant.investmentDate)
        : new Date();

      const plan = await tx.financialPlan.findUnique({
        where: { id: Number(investment.planId) },
      });

      const maturityDate = plan
        ? new Date(
          new Date(investmentDate).setMonth(
            new Date(investmentDate).getMonth() + plan.duration
          )
        )
        : null;

      const investmentRates: number[] =
        Array.isArray(investment.investmentRates) &&
          investment.investmentRates.length > 0
          ? investment.investmentRates.map((r: any) => parseFloat(r))
          : Array.isArray(plan?.rate) && plan.rate.length > 0
            ? plan.rate
            : [];

      const amount = Number(applicant.investmentAmount);
      const months = plan?.duration ?? 0;
      const years = investmentRates.length;
      const monthsPerYear = years > 0 ? months / years : 0;

      const totalHarvest =
        investmentRates.length && months
          ? Math.round(
            investmentRates.reduce(
              (sum, rate) =>
                sum + amount * (rate / 100) * (monthsPerYear / 12),
              0
            )
          )
          : 0;

      const monthlyHarvest = months > 0 ? Math.round(totalHarvest / months) : 0;

      const createInvestment = await tx.investment.create({
        data: {
          clientId: createClient.id,
          refNumber: generateInvestmentNumber(),
          branchId: applicant.branchId,
          planId: Number(investment.planId),
          investmentDate,
          maturityDate,
          amount,
          beneficiaryId,
          nomineeId,
          investmentRates,
          totalHarvest,
          monthlyHarvest,
          proposalFormNo: applicant.proposalFormNo || null,
          proposal: applicant.proposal,
          paymentSlip: applicant.paymentSlip,
          agreement: applicant.agreement,
        },
      });

      // Volume tracking across hierarchy
      const hierarchyMemberIds = [
        applicant.faId ?? null,
        applicant.fmId ?? null,
        applicant.bmId ?? null,
        applicant.rmId ?? null,
        applicant.zmId ?? null,
        applicant.agmId ?? null,
        applicant.ccoId ?? null,
      ].filter((id): id is number => id !== null);

      const uniqueHierarchyIds = [...new Set(hierarchyMemberIds)];
      const year = investmentDate.getFullYear();
      const month = investmentDate.getMonth() + 1;

      await Promise.all(
        uniqueHierarchyIds.map((memberId) =>
          tx.monthlyPayroll.upsert({
            where: { memberId_year_month: { memberId, year, month } },
            update: { volumeAchieved: { increment: amount } },
            create: {
              memberId,
              year,
              month,
              basicSalaryPermanent: 0,
              monthlyTarget: 0,
              volumeAchieved: amount,
            },
          })
        )
      );

      await upsertActivationsForInvestment(
        tx,
        {
          fmId: applicant.fmId ?? null,
          bmId: applicant.bmId ?? null,
          rmId: applicant.rmId ?? null,
          zmId: applicant.zmId ?? null,
          agmId: applicant.agmId ?? null,
          ccoId: applicant.ccoId ?? null,
        },
        year,
        month,
      );

      return { ...createClient, investments: [createInvestment] };
    });

    revalidatePath("/features/clients");

    void logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.CLIENT,
      entityId: client.id,
      performedById: currentUser?.member?.id ?? 0,
      branchId: applicant.branchId,
      metadata: { after: client },
    });

    return serializeData({ success: true, client });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      console.error("P2002 meta:", JSON.stringify(err.meta, null, 2));

      const driverError = err.meta?.driverAdapterError as any;
      const fields: string[] =
        driverError?.cause?.constraint?.fields ??
        (err.meta?.target as string[]) ??
        [];

      const label = fields
        .map((f) => UNIQUE_FIELD_LABELS[f] ?? f)
        .join(", ");

      return {
        success: false,
        error: label
          ? `A client with this ${label} already exists.`
          : "A duplicate value was found. Please check your entries.",
      };
    }

    console.error("Error creating client:", err);
    return { success: false, error: "Server error" };
  }
}

// Helper — already in your codebase, duplicated here for reference
function serializeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
// Update client
export async function updateClient(id: number, formData: any) {
  const clientId = id;

  const parsed = updateClientSchema.safeParse(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    });
    const firstMessage = parsed.error.issues[0]?.message ?? "Validation failed";
    return { success: false, error: firstMessage, fieldErrors };
  }

  try {
    const [currentUser, oldClient] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.client.findUnique({ where: { id: clientId } }),
    ]);

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        fullName: formData.applicant.fullName,
        nic: formData.applicant.nic || null,
        email: formData.applicant.email || null,
        phoneMobile: formData.applicant.phoneMobile || null,
        occupation: formData.applicant.occupation || null,
        address: formData.applicant.address || null,
        drivingLicense: formData.applicant.drivingLicense || null,
        passportNo: formData.applicant.passportNo || null,
        phoneLand: formData.applicant.phoneLand || null,
        idFront: formData.applicant.idFront || null,
        idBack: formData.applicant.idBack || null,
        dateOfBirth: formData.applicant.dateOfBirth
          ? new Date(formData.applicant.dateOfBirth)
          : undefined,
        branchId: formData.applicant.branchId
          ? Number(formData.applicant.branchId)
          : undefined,
      },
    });

    revalidatePath("/features/clients");

    void logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.CLIENT,
      entityId: clientId,
      performedById: currentUser?.member?.id ?? 0,
      branchId: updatedClient.branchId,
      metadata: { before: oldClient, after: updatedClient },
    });

    return serializeData({ success: true, client: updatedClient, error: "Failed to update client" });
  } catch (error) {
    console.error("Error updating client:", error);
    return { success: false, error: "Failed to update client" };
  }
}

// Delete client
export async function deleteClient(id: number) {
  try {
    const [currentUser, existingClient] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.client.findUnique({ where: { id } }),
    ]);

    const res = await prisma.client.delete({
      where: { id },
    });

    revalidatePath("/features/clients");

    void logActivity({
      action: ActivityAction.DELETE,
      entity: ActivityEntity.CLIENT,
      entityId: existingClient?.id,
      performedById: currentUser?.member?.id ?? 0,
      branchId: existingClient?.branchId,
      metadata: { deleted: existingClient },
    });

    return serializeData({ success: true, client: res });
  } catch (error) {
    console.error("Error deleting client:", error);
    return { success: false, error: "Failed to delete client" };
  }
}

// Update client documents
export async function updateClientDocuments(
  clientId: number,
  data: {
    idFront?: string;
    idBack?: string;

  }
) {
  if (!clientId) return { success: false, error: "Client ID is required" };

  try {
    const [currentUser, client] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.client.findUnique({ where: { id: clientId }, select: { branchId: true } }),
    ]);

    await prisma.client.update({
      where: { id: clientId },
      data: {
        idFront: data.idFront ?? undefined,
        idBack: data.idBack ?? undefined,

      },
    });

    revalidatePath("/features/clients");
    revalidatePath(`/features/clients/${clientId}`);

    void logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.CLIENT,
      entityId: clientId,
      performedById: currentUser?.member?.id ?? 0,
      branchId: client?.branchId,
      metadata: { updatedFields: Object.keys(data) },
    });

    return { success: true };
  } catch (err) {
    console.error("Error updating documents:", err);
    return { success: false, error: "Failed to update documents" };
  }
}

// Delete client document field
export async function deleteClientDocument(nic: string, field: string) {
  const allowedFields = ["idFront", "idBack", "paymentSlip", "signature", "proposal", "agreement"];

  if (!allowedFields.includes(field)) {
    return { success: false, error: "Invalid document field" };
  }

  try {
    await prisma.client.update({
      where: { nic },
      data: {
        [field]: null,
      },
    });

    const currentUser = await getCurrentUserWithRole().catch(() => null);

    revalidatePath("/features/clients");

    logActivity({
      action: ActivityAction.DELETE,
      entity: ActivityEntity.CLIENT,
      performedById: currentUser?.member?.id ?? 0,
      metadata: { deletedFieldValue: field, clientNic: nic },
    });

    return { success: true, field };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Failed to delete document" };
  }
}

export async function generateUploadUrl(clientId: number) {
  const token = crypto.randomBytes(32).toString("hex");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { email: true, fullName: true },
  });

  if (!client) throw new Error("Client not found");

  await prisma.clientDocumentRequest.create({
    data: {
      clientId,
      token,
      createdById: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days
    },
  });

  const uploadLink = `${process.env.NEXT_PUBLIC_APP_URL}/upload/${token}`;

  // Only send email if client has one — otherwise just return the link to copy
  if (client.email) {
    try {
      await sendDocumentRequestEmail({
        to: client.email,
        clientName: client.fullName,
        uploadLink,
      });
    } catch (err) {
      // Don't block link generation if email fails
      console.error("Email send failed:", err);
    }
  }

  return {
    uploadLink,
    emailSent: !!client.email,
  };
}

async function sendDocumentRequestEmail({
  to,
  clientName,
  uploadLink,
}: {
  to: string;
  clientName: string;
  uploadLink: string;
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Document Request" <${process.env.SMTP_FROM}>`,
    to,
    subject: "Action Required: Please Upload Your Documents",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Hi ${clientName},</h2>
        <p style="color: #475569; line-height: 1.6;">
          We need you to upload the following documents to complete your application:
        </p>
        <ul style="color: #475569; line-height: 2;">
          <li>National ID / NIC — Front</li>
          <li>National ID / NIC — Back</li>
          <li>Payment Slip</li>
        </ul>
        <a href="${uploadLink}" style="
          display: inline-block;
          margin-top: 24px;
          padding: 14px 28px;
          background: #1e293b;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          font-size: 14px;
        ">
          Upload Documents
        </a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
          This link expires in 48 hours. Do not share it with anyone.
        </p>
      </div>
    `,
  });
}

export async function validateUploadToken(token: string) {
  const request = await prisma.clientDocumentRequest.findUnique({
    where: { token },
    include: {
      client: { select: { id: true, fullName: true, email: true } },
    },
  });

  if (!request) return { valid: false, error: "Invalid link." };
  if (request.used) return { valid: false, error: "This link has already been used." };
  if (new Date() > request.expiresAt) return { valid: false, error: "This link has expired." };

  return { valid: true, request };
}

export async function saveUploadedDocuments(
  token: string,
  urls: {
    idFront?: string;
    idBack?: string;
    // paymentSlip?: string;
    signature?: string; // ← optional, not required
  }
) {
  const request = await prisma.clientDocumentRequest.findUnique({
    where: { token },
  });

  if (!request) return { success: false, error: "Invalid token" };
  if (request.used) return { success: false, error: "Link already used" };
  if (new Date() > request.expiresAt) return { success: false, error: "Link expired" };

  await prisma.$transaction([
    prisma.client.update({
      where: { id: request.clientId },
      data: {
        idFront: urls.idFront ?? undefined,
        idBack: urls.idBack ?? undefined,
        // paymentSlip: urls.paymentSlip ?? undefined,
        signature: urls.signature ?? undefined,
      },
    }),
    prisma.clientDocumentRequest.update({
      where: { token },
      data: { used: true },
    }),
  ]);

  logActivity({
    action: ActivityAction.UPDATE,
    entity: ActivityEntity.CLIENT,
    entityId: request.clientId,
    performedById: undefined, // Internal/Guest Action
    metadata: { action: "documents_uploaded_via_token", token },
  });

  return { success: true };
}

export async function searchClients(query: string) {
  if (!query || query.trim().length < 2) return null;

  const client = await prisma.client.findFirst({
    where: {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { nic: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      fullName: true,
      nic: true,
      branchId: true,
      branch: { select: { name: true } },
      investments: { select: { id: true } },
      // ── NEW: include beneficiaries and nominees for the picker ──
      beneficiaries: {
        select: {
          id: true,
          fullName: true,
          nic: true,
          phone: true,
          bankName: true,
          bankBranch: true,
          accountNo: true,
          relationship: true,
        },
      },
      nominees: {
        select: {
          id: true,
          fullName: true,
          nic: true,
          permanentAddress: true,
          postalAddress: true,
        },
      },
    },
  });

  return client;
}

export async function updateBeneficiary(data: any) {
  try {
    console.log(data);

    const updatedBeneficiary = await prisma.beneficiary.update({
      where: { id: data.id },
      data: {
        fullName: data.fullName,
        relationship: data.relationship || "",
        bankName: data.bankName || "",
        bankBranch: data.bankBranch || "",
        accountNo: data.accountNo || "",
        nic: data.nic || null,
        phone: data.phone || "",
      },
    })

    return updatedBeneficiary;

  } catch (err) {
    console.error("Error updating beneficiary:", err);
    return { success: false, error: "Failed to update beneficiary" };
  }
}

export async function updateNominee(data: any) {

  try {
    const updatedNominee = await prisma.nominee.update({
      where: { id: data.id },
      data: {
        fullName: data.fullName,
        permanentAddress: data.permanentAddress || "",
        postalAddress: data.postalAddress || null,
      },
    });

    return updatedNominee;

  } catch (err) {
    console.error("Error updating nominee:", err);
    return { success: false, error: "Failed to update nominee" };
  }
}

export async function deleteBeneficiaryAction(id: number) {
  try {
    await prisma.beneficiary.delete({
      where: { id },
    })
  } catch (err) {
    console.error("Error deleting beneficiary:", err);
    return { success: false, error: "Failed to delete beneficiary" };
  }
}

export async function deleteNomineeAction(id: number) {
  try {
    await prisma.nominee.delete({
      where: { id },
    })
  } catch (err) {
    console.error("Error deleting nominee:", err);
    return { success: false, error: "Failed to delete nominee" };
  }
}


export async function searchMembersByName(query: string) {
  const terms = query.trim().split(/\s+/).filter(Boolean);

  return prisma.member.findMany({
    where: {
      isActive: true,
      AND: terms.map((term) => ({
        nameWithInitials: { contains: term, mode: "insensitive" },
      })),
    },
    select: {
      id: true,
      nameWithInitials: true,
      empNo: true,
      position: { select: { title: true } },
    },
    take: 8,
  });
}