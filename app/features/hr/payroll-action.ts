"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculatePayroll, type PayrollCategory } from "./payroll-utils";
import { resolvePositionTarget } from "@/lib/commissions/resolvePositionTarget";
import { applyAdvanceDeductions } from "./deduction/action";
import { previewAdvanceDeductions } from "./deduction/previewAdvanceDeductions";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTeamCounts = { advisors: number; fms: number; bms: number };

// ─── Category resolution ──────────────────────────────────────────────────────

/**
 * Derives the explicit PayrollCategory from Position.type.
 * MANAGEMENT → HEAD_OFFICE (fixed base + ORC, statutory deductions)
 * PROBATION / PERMANENT → MARKETING (target-driven, field commission)
 *
 * This replaces the old `isProbation` flag gate which caused permanent FAs to
 * fall into the corporate path and probationary HO staff to be evaluated as
 * field reps.
 */
// Rank boundary shared with ho-payroll-action.ts
const HO_MIN_RANK = 14;

/**
 * Routes a member to the correct payroll track by position rank.
 * rank >= 14 → HEAD_OFFICE (permanent BM/RM/ZM/AGM, COO, GM, all HO staff)
 * rank <  14 → MARKETING  (FA, TL, probation BM/RM/ZM/AGM)
 *
 * Using rank (not Position.type) because permanent field roles like JBM(14),
 * JRM(16), COO(104) have type=PERMANENT but belong on the HO salary track.
 */
function resolvePayrollCategory(positionRank: number | null | undefined): PayrollCategory {
  if ((positionRank ?? 0) >= HO_MIN_RANK) return "HEAD_OFFICE";
  return "MARKETING";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPositionTargetData(target: any) {
  if (!target) return undefined;
  return {
    targetAmount: Number(target.targetAmount ?? 0),
    bonusAmount: Number(target.bonusAmount ?? 0),
    partialThresholdPct: Number(target.partialThresholdPct ?? 0),
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

async function getActiveTeamCounts(
  memberEmpNo: string,
  year: number,
  month: number,
): Promise<ActiveTeamCounts> {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const member = await prisma.member.findUnique({
    where: { empNo: memberEmpNo },
    select: { id: true, position: { select: { rank: true } } },
  });

  if (!member) return { advisors: 0, fms: 0, bms: 0 };
  const memberId = member.id;
  const rank = member.position?.rank ?? 0;

  if (rank === 1 || rank === 11 || rank === 12) return { advisors: 0, fms: 0, bms: 0 };

  const investments = await prisma.investment.findMany({
    where: {
      investmentDate: { gte: startDate, lt: endDate },
      OR: [
        { fmId: memberId },
        { bmId: memberId },
        { rmId: memberId },
        { zmId: memberId },
        { agmId: memberId },
        { ccoId: memberId },
      ],
    },
    select: {
      faId: true, fmId: true, bmId: true,
      rmId: true, zmId: true, agmId: true, ccoId: true,
    },
  });

  if (investments.length === 0) return { advisors: 0, fms: 0, bms: 0 };

  const activeAdvisorIds = new Set<number>();
  const activeFmIds = new Set<number>();
  const activeBmIds = new Set<number>();

  const showFms = rank >= 3;
  const showBms = rank >= 4;

  for (const inv of investments) {
    const lowestBringer =
      inv.faId ?? inv.fmId ?? inv.bmId ??
      inv.rmId ?? inv.zmId ?? inv.agmId ?? inv.ccoId ?? null;

    if (!lowestBringer || lowestBringer === memberId) continue;

    if (inv.faId && inv.faId !== memberId) activeAdvisorIds.add(inv.faId);
    if (inv.fmId && inv.fmId !== memberId) activeFmIds.add(inv.fmId);
    if (inv.bmId && inv.bmId !== memberId) activeBmIds.add(inv.bmId);
  }

  return {
    advisors: activeAdvisorIds.size,
    fms: showFms ? activeFmIds.size : 0,
    bms: showBms ? activeBmIds.size : 0,
  };
}

/**
 * Computes the member's active tenure in months since dateOfJoin.
 * Falls back to 1 when date is missing (safe for first-month probationers).
 */
function computeTenureMonths(dateOfJoin: Date | null | undefined, year: number, month: number): number {
  if (!dateOfJoin) return 1;
  const joinYear = dateOfJoin.getFullYear();
  const joinMonth = dateOfJoin.getMonth() + 1;
  const months = (year - joinYear) * 12 + (month - joinMonth) + 1;
  return Math.max(1, months);
}

// ─── buildMktConfig ───────────────────────────────────────────────────────────

/**
 * Assembles the marketing config from:
 *   1. A resolved PositionTarget row (probation periods 1–2, 6 months)
 *   2. PositionSalary fallback (members past their probation period whose
 *      position has no matching PositionTarget row for their current tenure)
 *
 * Both sources expose a target amount and incentive amount — the field names
 * just differ. Returns null only when neither source has any data.
 */
function buildMktConfig(
  positionTargetData: ReturnType<typeof toPositionTargetData>,
  tenureMonthCount: number,
  excessRate: number = 0.005,
  positionSalary?: {
    monthlyTarget: number;
    incentiveAmount: number;
    incentivePartialAmount: number;
    vehicleThresholdPct: number;
    vehicleAmount: number;
    teamActiveThresholdPct: number;
    teamActiveAmount: number;
    minActiveAdvisors: number;
    minActiveFMs: number;
    minActiveBMs: number;
  } | null,
  // Position.targetBudgetAmount — gates and caps the target budget salary.
  // Only FA (positionId=1) has this set (1,500,000). All others are 0.
  positionTargetBudgetAmount: number = 0,
) {
  // Prefer PositionTarget row (has per-period config); fall back to PositionSalary.
  if (positionTargetData) {
    const hasPartial = positionTargetData.partialBonus > 0;
    return {
      targetAmount: positionTargetData.targetAmount,
      tenureMonthCount,
      // Target budget — FA-only. Gate: positionTargetBudgetAmount > 0.
      targetBudgetAmount: positionTargetBudgetAmount,
      targetBudgetCeiling: 30_000,
      targetBudgetMinPct: 0.25,
      hurdleRateProbation: 0.066,
      hurdleRatePermanent: positionTargetData.partialThresholdPct > 0
        ? positionTargetData.partialThresholdPct
        : 0.20,
      // Partial incentive — FA only (partialBonus set). 0 for non-FA.
      basicIncentiveAmount: hasPartial ? positionTargetData.partialBonus : 0,
      // Full incentive — non-FA only (bonusAmount at 100%). 0 for FA.
      // Note: for after-6-month rows resolvePositionTarget aliases bonusAmount → partialBonus,
      // but for non-FA positions partialBonus is always 0 so bonusAmount is safe to use directly.
      fullIncentiveAmount: !hasPartial ? (positionTargetData.bonusAmount ?? 0) : 0,
      excessCommissionRate: excessRate,
      vehicleThresholdPct: positionTargetData.vehicleThresholdPct,
      vehicleAmount: positionTargetData.vehicleAmount,
      teamActiveThresholdPct: positionTargetData.teamActiveThresholdPct,
      teamActiveAmount: positionTargetData.teamActiveAmount,
      minActiveAdvisors: positionTargetData.minActiveAdvisors,
      minActiveFMs: positionTargetData.minActiveFMs,
      minActiveBMs: positionTargetData.minActiveBMs,
    };
  }

  // PositionSalary fallback — used for members past their 6-month probation
  // period whose position has no PositionTarget row for their current tenure.
  if (positionSalary && positionSalary.monthlyTarget > 0) {
    // FA is identified by Position.targetBudgetAmount > 0, NOT incentivePartialAmount.
    // PositionSalary.incentivePartialAmount is 0 for FA (it's unused on that model).
    // All FAs get the fixed 20K partial incentive regardless of PositionSalary config.
    const isFa = positionTargetBudgetAmount > 0;
    return {
      targetAmount: positionSalary.monthlyTarget,
      tenureMonthCount,
      targetBudgetAmount: positionTargetBudgetAmount,
      targetBudgetCeiling: 30_000,
      targetBudgetMinPct: 0.25,
      hurdleRateProbation: 0.066,
      hurdleRatePermanent: 0.20,
      // FA always gets 20K partial; non-FA has no partial tier
      basicIncentiveAmount: isFa ? 20_000 : 0,
      // Non-FA: incentiveAmount is the full bonus at 100%; FA: 0 (target budget handles it)
      fullIncentiveAmount: !isFa ? (positionSalary.incentiveAmount ?? 0) : 0,
      excessCommissionRate: 0.005,
      vehicleThresholdPct: positionSalary.vehicleThresholdPct,
      vehicleAmount: positionSalary.vehicleAmount,
      teamActiveThresholdPct: positionSalary.teamActiveThresholdPct,
      teamActiveAmount: positionSalary.teamActiveAmount,
      minActiveAdvisors: positionSalary.minActiveAdvisors,
      minActiveFMs: positionSalary.minActiveFMs,
      minActiveBMs: positionSalary.minActiveBMs,
    };
  }

  return null;
}

// ─── getPayrollPreview ────────────────────────────────────────────────────────

export async function getPayrollPreview(
  branchId: number,
  year: number,
  month: number,
  volumes: Record<number, number> = {},
) {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const branchMembers = await prisma.memberBranch.findMany({
    where: { branchId, member: { channel: { not: "Micro" } } },
    include: {
      member: {
        include: {
          position: {
            include: { salary: true, orc: true, positionTargets: true },
          },
          monthlyPayrolls: { where: { year, month } },
          branches: true,
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

  const BRANCH_LOCAL_RANKS = new Set([1, 2, 3, 11, 12, 13, 14, 15]);

  const filteredMembers = branchMembers.filter(({ member }: any) => {
    const rank = member.position?.rank ?? 0;
    if (BRANCH_LOCAL_RANKS.has(rank)) return true;
    const primaryBranch = member.branches?.find((b: any) => b.isPrimary === true);
    return primaryBranch?.branchId === branchId;
  });

  const rows = await Promise.all(
    filteredMembers.map(async ({ member }: any) => {
      const existing = member.monthlyPayrolls?.[0] ?? null;
      const volumeAchieved = volumes[member.id] ?? Number(existing?.volumeAchieved ?? 0);

      const personalCommissionEarned = member.commissions.reduce(
        (sum: number, c: any) => sum + Number(c.amount),
        0,
      );

      const orcEarned = await prisma.commission.findMany({
        where: {
          memberEmpNo: member.empNo,
          type: "UPLINE",
          investment: { investmentDate: { gte: startDate, lt: endDate } },
        },
        select: { amount: true },
      }).then((rows) => rows.reduce((sum, c) => sum + Number(c.amount), 0));

      const excessEarned = await prisma.commission.findMany({
        where: {
          memberEmpNo: member.empNo,
          type: "EXCESS",
          investment: { investmentDate: { gte: startDate, lt: endDate } },
        },
        select: { amount: true },
      }).then((rows) => rows.reduce((sum, c) => sum + Number(c.amount), 0));

      // ── Category routing ─────────────────────────────────────────────────
      const payrollCategory = resolvePayrollCategory(member.position?.rank);

      const positionTargetRow = resolvePositionTarget(member, year, month);
      const positionTargetData = toPositionTargetData(positionTargetRow);
      const tenureMonthCount = computeTenureMonths(member.dateOfJoin, year, month);
      const activeTeamCounts = await getActiveTeamCounts(member.empNo, year, month);

      // HO config: for MANAGEMENT members we use ManagementBaseSalary as the
      // basicSalary; other HO-detail fields default to zero (editable via the
      // ho-payroll page). Deduction fields come from the existing advance system.
      const mgtBaseSalary = member.ManagementBaseSalary?.[0]
        ? Number(member.ManagementBaseSalary[0].baseSalary)
        : 0;

      const hoConfig = payrollCategory === "HEAD_OFFICE"
        ? {
          basicSalary: mgtBaseSalary,
          fixedAllowance: 0,
          vehicleAllowance: 0,
          fuelAllowance: 0,
          channelOperation: 0,
          attendanceAllowance: 0,
          loanInstalments: 0,
          festivalAdvance: 0,
          merchandiseDeduction: 0,
          epfEmployeeRate: 0.08,
          epfEmployerRate: 0.12,
          etfEmployerRate: 0.03,
          maxLeavesWithoutDeduction: 1.5,
        }
        : null;

      const mktConfig = payrollCategory === "MARKETING"
        ? buildMktConfig(
          positionTargetData,
          tenureMonthCount,
          Number(positionTargetRow?.excessRate ?? 0.005),
          (member as any).position?.salary ?? null,
          // Pass Position.targetBudgetAmount to gate/cap the target budget salary.
          // Only FA has this non-zero; TL/BM/RM etc. are 0 → no target budget.
          Number((member as any).position?.targetBudgetAmount ?? 0),
        )
        : null;

      let breakdown = null;
      if (payrollCategory === "HEAD_OFFICE" && hoConfig) {
        breakdown = calculatePayroll(
          "HEAD_OFFICE",
          null,
          hoConfig,
          volumeAchieved,
          personalCommissionEarned,
          orcEarned,
          0,
        );
      } else if (payrollCategory === "MARKETING" && mktConfig) {
        breakdown = calculatePayroll(
          "MARKETING",
          mktConfig,
          null,
          volumeAchieved,
          // Bug fix: do NOT add excessEarned here — excessCommission is computed
          // inside calculateMarketingPayroll from volumeAchieved vs target.
          // excessEarned (from Commission table) is only used for the run action
          // to persist into the DB snapshot; the preview calculates it live.
          personalCommissionEarned,
          orcEarned,
          0,
          activeTeamCounts,
        );
      }

      const { totalDeducted: advanceDeducted, deductionDetails, outstandingRemaining, outstandingTypes } =
        breakdown
          ? await previewAdvanceDeductions(member.id, year, month, breakdown.netPay)
          : { totalDeducted: 0, deductionDetails: [], outstandingRemaining: 0, outstandingTypes: [] };

      const finalNetPay = breakdown ? breakdown.netPay - advanceDeducted : 0;

      return {
        memberId: member.id,
        name: member.nameWithInitials ?? member.name,
        empNo: member.empNo,
        dateOfJoin: member.dateOfJoin ?? null, 
        position: member.position?.title ?? "—",
        status: member.status,
        payrollCategory,
        alreadyProcessed: !!existing,
        // Bug fix: configured = has PositionTarget OR has PositionSalary with a target
        salaryConfigured: payrollCategory === "HEAD_OFFICE"
          ? mgtBaseSalary > 0
          : !!mktConfig,
        volumeAchieved,
        personalCommissionEarned,
        orcEarned,
        excessEarned,
        tenureMonthCount,
        advanceDeducted,
        advanceTypes: deductionDetails.map((d: any) => d.type),
        actualCommissionEarned: personalCommissionEarned + orcEarned + excessEarned,
        activeTeamCounts: activeTeamCounts ?? { advisors: 0, fms: 0, bms: 0 },
        breakdown: breakdown ? { ...breakdown, netPay: finalNetPay } : null,
        outstandingAdvanceRemaining: outstandingRemaining,
        outstandingAdvanceTypes: outstandingTypes,
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
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const branchMembers = await prisma.memberBranch.findMany({
    where: { branchId, member: { channel: { not: "Micro" } } },
    include: {
      member: {
        include: {
          position: {
            include: { salary: true, orc: true, positionTargets: true },
          },
          monthlyPayrolls: { where: { year, month } },
          branches: true,
          ManagementBaseSalary: true,
          commissions: {
            where: {
              type: "PERSONAL",
              investment: { investmentDate: { gte: startDate, lt: endDate } },
            },
            select: { amount: true },
          },
        },
      },
    },
  });

  const BRANCH_LOCAL_RANKS = new Set([1, 2, 3, 11, 12, 13, 14, 15]);

  const filteredMembers = branchMembers.filter(({ member }: any) => {
    const rank = member.position?.rank ?? 0;
    if (BRANCH_LOCAL_RANKS.has(rank)) return true;
    const primaryBranch = member.branches?.find((b: any) => b.isPrimary);
    return primaryBranch?.branchId === branchId;
  });

  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const { member } of filteredMembers) {
    const existingPayroll = member.monthlyPayrolls?.[0] ?? null;
    const alreadyProcessed = existingPayroll !== null && Number(existingPayroll.monthlyTarget) > 0;
    if (alreadyProcessed && !force) {
      skipped++;
      continue;
    }

    try {
      const personalCommissionEarned = (member as any).commissions.reduce(
        (sum: number, c: any) => sum + Number(c.amount),
        0,
      );

      const orcEarned = await prisma.commission.findMany({
        where: {
          memberEmpNo: member.empNo,
          type: "UPLINE",
          investment: { investmentDate: { gte: startDate, lt: endDate } },
        },
        select: { amount: true },
      }).then((rows) => rows.reduce((sum, c) => sum + Number(c.amount), 0));

      const excessEarned = await prisma.commission.findMany({
        where: {
          memberEmpNo: member.empNo,
          type: "EXCESS",
          investment: { investmentDate: { gte: startDate, lt: endDate } },
        },
        select: { amount: true },
      }).then((rows) => rows.reduce((sum, c) => sum + Number(c.amount), 0));

      // ── Category routing ─────────────────────────────────────────────────
      const payrollCategory = resolvePayrollCategory((member as any).position?.rank);

      const positionTargetRow = resolvePositionTarget(member, year, month);
      const positionTargetData = toPositionTargetData(positionTargetRow);
      const tenureMonthCount = computeTenureMonths(member.dateOfJoin, year, month);
      const activeTeamCounts = await getActiveTeamCounts(member.empNo, year, month);

      const dbVolumeAchieved = existingPayroll?.volumeAchieved
        ? Number(existingPayroll.volumeAchieved)
        : (volumes[member.id] ?? 0);

      const mgtBaseSalary = (member as any).ManagementBaseSalary?.[0]
        ? Number((member as any).ManagementBaseSalary[0].baseSalary)
        : 0;

      const hoConfig = payrollCategory === "HEAD_OFFICE"
        ? {
          basicSalary: mgtBaseSalary,
          fixedAllowance: 0,
          vehicleAllowance: 0,
          fuelAllowance: 0,
          channelOperation: 0,
          attendanceAllowance: 0,
          loanInstalments: 0,
          festivalAdvance: 0,
          merchandiseDeduction: 0,
          epfEmployeeRate: 0.08,
          epfEmployerRate: 0.12,
          etfEmployerRate: 0.03,
          maxLeavesWithoutDeduction: 1.5,
        }
        : null;

      const mktConfig = payrollCategory === "MARKETING"
        ? buildMktConfig(
          positionTargetData,
          tenureMonthCount,
          Number(positionTargetRow?.excessRate ?? 0.005),
          (member as any).position?.salary ?? null,
          Number((member as any).position?.targetBudgetAmount ?? 0),
        )
        : null;

      if (payrollCategory === "HEAD_OFFICE" && !hoConfig) {
        errors.push(`${member.nameWithInitials ?? member.empNo}: no base salary configured (HO track)`);
        continue;
      }
      if (payrollCategory === "MARKETING" && !mktConfig) {
        errors.push(`${member.nameWithInitials ?? member.empNo}: no position target configured (Marketing track)`);
        continue;
      }

      const breakdown = calculatePayroll(
        payrollCategory,
        mktConfig,
        hoConfig,
        dbVolumeAchieved,
        // Bug fix: excessCommission is calculated inside calculateMarketingPayroll
        // from volume vs target — do NOT also add the DB excessEarned here or it
        // double-counts. excessEarned is snapshotted separately into the DB record.
        personalCommissionEarned,
        orcEarned,
        0, // leavesTaken — HO detail page handles this separately
        activeTeamCounts,
      );

      const payrollDataBase = {
        basicSalaryPermanent: breakdown.basicSalaryPermanent,
        monthlyTarget: breakdown.monthlyTarget,
        incentiveEarned: breakdown.incentiveEarned,
        fullTargetBonus: breakdown.fullTargetBonus,
        incentivePartialEarned: breakdown.incentivePartialEarned,
        vehicleEarned: breakdown.vehicleEarned,
        vehicleHit: breakdown.vehicleHit,
        activationAllowanceEarned: breakdown.teamActiveEarned,
        orcEarned: breakdown.orcEarned,
        commissionEarned: breakdown.commissionEarned,
        excessEarned,
        targetBudgetSalary: breakdown.targetBudgetSalary,
        epfDeduction: breakdown.epfDeduction,
        epfEmployer: breakdown.epfEmployer,
        etfEmployer: breakdown.etfEmployer,
        incentiveHit: breakdown.incentiveHit,
        incentivePartialHit: breakdown.incentivePartialHit,
        grossPay: breakdown.grossPay,
        // Extended HO fields (zero for marketing rows — harmless)
        fixedAllowance: breakdown.fixedAllowance,
        fuelAllowance: breakdown.fuelAllowance,
        channelOperation: breakdown.channelOperation,
        attendanceAllowance: breakdown.attendanceAllowance,
        loanInstalments: breakdown.loanInstalments,
        festivalAdvance: breakdown.festivalAdvance,
        merchandiseDeduction: breakdown.merchandiseDeduction,
        payrollCategory,
        tenureMonthCount,
        excessCommission: breakdown.excessCommission,
      };

      await prisma.$transaction(async (tx) => {
        const { totalDeducted } = await applyAdvanceDeductions(
          tx,
          member.id,
          year,
          month,
          breakdown.netPay,
        );
        const finalNetPay = breakdown.netPay - totalDeducted;

        await tx.monthlyPayroll.upsert({
          where: { memberId_year_month: { memberId: member.id, year, month } },
          create: {
            memberId: member.id,
            year,
            month,
            volumeAchieved: dbVolumeAchieved,
            ...payrollDataBase,
            advanceDeducted: totalDeducted,
            netPay: finalNetPay,
          },
          update: {
            ...payrollDataBase,
            advanceDeducted: totalDeducted,
            netPay: finalNetPay,
          },
        });
      });

      processed++;
    } catch (e) {
      errors.push(`${(member as any).nameWithInitials ?? member.empNo}: ${String(e)}`);
    }
  }

  revalidatePath("/features/hr/payroll");
  return { success: true, processed, skipped, errors };
}

// ─── getPayrollHistory ────────────────────────────────────────────────────────
// Drop-in replacement for the existing function in payroll-action.ts
// Now selects every field needed by both FAPaySheet and HOPaySheet.

export async function getPayrollHistory(memberId: number) {
  return prisma.monthlyPayroll.findMany({
    where: { memberId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: {
      id: true,
      year: true,
      month: true,
      payrollCategory: true,

      // Performance / Marketing
      volumeAchieved: true,
      monthlyTarget: true,
      targetBudgetSalary: true,
      incentiveEarned: true,
      incentivePartialEarned: true,
      excessCommission: true,
      excessEarned: true,
      vehicleEarned: true,
      activationAllowanceEarned: true,
      commissionEarned: true,
      orcEarned: true,

      // Status flags
      incentiveHit: true,
      incentivePartialHit: true,
      vehicleHit: true,
      tenureMonthCount: true,

      // HO fields
      basicSalaryPermanent: true,
      fixedAllowance: true,
      fuelAllowance: true,
      channelOperation: true,
      attendanceAllowance: true,
      loanInstalments: true,
      festivalAdvance: true,
      merchandiseDeduction: true,

      // Common
      grossPay: true,
      netPay: true,
      epfDeduction: true,
      epfEmployer: true,
      etfEmployer: true,
      advanceDeducted: true,
    },
  });
}