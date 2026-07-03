"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculatePayroll } from "./payroll-utils";
import { resolvePositionTarget } from "@/lib/commissions/resolvePositionTarget";
import { applyAdvanceDeductions } from "./deduction/action";
import { previewAdvanceDeductions } from "./deduction/previewAdvanceDeductions";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTeamCounts = { advisors: number; fms: number; bms: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────


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

async function getActiveTeamCounts(
  memberEmpNo: string,
  year: number,
  month: number
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

  for (const inv of investments) {
    // Lowest non-null rank member = the person who brought this investment
    const lowestBringer =
      inv.faId ?? inv.fmId ?? inv.bmId ??
      inv.rmId ?? inv.zmId ?? inv.agmId ?? inv.ccoId ?? null;

    if (!lowestBringer || lowestBringer === memberId) continue;

    // Bucket by which field they occupy — exclude self from each bucket
    if (inv.faId && inv.faId === lowestBringer) activeAdvisorIds.add(inv.faId);
    if (inv.fmId && inv.fmId === lowestBringer && inv.fmId !== memberId) activeFmIds.add(inv.fmId);
    if (inv.bmId && inv.bmId === lowestBringer && inv.bmId !== memberId) activeBmIds.add(inv.bmId);
  }

  const showFms = rank >= 3;   // BM and above see FM activations
  const showBms = rank >= 4;   // RM and above see BM activations

  for (const inv of investments) {
    const lowestBringer =
      inv.faId ?? inv.fmId ?? inv.bmId ??
      inv.rmId ?? inv.zmId ?? inv.agmId ?? inv.ccoId ?? null;

    if (!lowestBringer || lowestBringer === memberId) continue;

    // Count ALL non-null members below this member on the investment
    // Each unique member at each level counts as one activation
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

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const branchMembers = await prisma.memberBranch.findMany({
    where: { branchId },
    include: {
      member: {
        include: {
          position: {
            include: { salary: true, orc: true, positionTargets: true },
          },
          monthlyPayrolls: { where: { year, month } },
          branches: true,
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

  const BRANCH_LOCAL_RANKS = new Set([
    1,  // FA (probation)
    2,  // TL (probation)
    3,  // BM (probation)
    11, // TRAINEE_FA
    12, // P_FA
    13, // P_TL
    14, // JBM
    15, // SBM
  ]);

  const filteredMembers = branchMembers.filter(({ member }: any) => {
    const rank = member.position?.rank ?? 0;

    if (BRANCH_LOCAL_RANKS.has(rank)) return true; // FA/TL/BM level — any branch

    // RM and above (16,17,18,19,20,4,5,6,100+ etc.) — only in their primary branch
    const primaryBranch = member.branches?.find((b: any) => b.isPrimary === true);
    return primaryBranch?.branchId === branchId;
  });


  const rows = await Promise.all(
    filteredMembers.map(async ({ member }: any) => {
      const salary = member.position?.salary;
      const existing = member.monthlyPayrolls?.[0] ?? null;
      const volumeAchieved =
        volumes[member.id] ?? Number(existing?.volumeAchieved ?? 0);

      const personalCommissionEarned = member.commissions.reduce(
        (sum: number, c: any) => sum + Number(c.amount),
        0,
      );

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

      // Excess commission — separate from personal, same shape as ORC query
      const excessCommissions = await prisma.commission.findMany({
        where: {
          memberEmpNo: member.empNo,
          type: "EXCESS",
          investment: {
            investmentDate: { gte: startDate, lt: endDate },
          },
        },
        select: { amount: true },
      });
      const excessEarned = excessCommissions.reduce(
        (sum, c) => sum + Number(c.amount),
        0,
      );

      const normalizedSalary = normalizeSalary(salary);

      // Resolve probation target row
      const positionTargetRow = resolvePositionTarget(member, year, month);
      const positionTargetData = toPositionTargetData(positionTargetRow);

      const activeTeamCounts = await getActiveTeamCounts(member.empNo, year, month);

      const breakdown = normalizedSalary
        ? calculatePayroll(
          normalizedSalary,
          personalCommissionEarned,
          member.status,
          volumeAchieved,
          orcEarned,
          activeTeamCounts,
          positionTargetData,
          Number(member.position?.targetBudgetAmount ?? 0),
        )
        : null;

      const { totalDeducted: advanceDeducted, deductionDetails, outstandingRemaining, outstandingTypes } =
        normalizedSalary
          ? await previewAdvanceDeductions(member.id, year, month, breakdown!.netPay)
          : { totalDeducted: 0, deductionDetails: [], outstandingRemaining: 0, outstandingTypes: [] };

      const finalNetPay = breakdown ? breakdown.netPay - advanceDeducted : 0;

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
        excessEarned,
        advanceDeducted,                 // NEW
        advanceTypes: deductionDetails.map((d: any) => d.type), // NEW — e.g. ["FESTIVAL"] or ["SALARY","FESTIVAL"]
        actualCommissionEarned: personalCommissionEarned + orcEarned + excessEarned,
        activeTeamCounts: activeTeamCounts ?? { advisors: 0, fms: 0, bms: 0 },
        breakdown: breakdown ? { ...breakdown, netPay: finalNetPay } : null, // show post-advance netPay in preview
        outstandingAdvanceRemaining: outstandingRemaining,   // NEW
        outstandingAdvanceTypes: outstandingTypes,           // NEW
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
    where: { branchId },
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

    const salary = member.position?.salary;

    const personalCommissionEarned = member.commissions.reduce(
      (sum: number, c: any) => sum + Number(c.amount),
      0,
    );

    const orcCommissions = await prisma.commission.findMany({
      where: {
        memberEmpNo: member.empNo,
        type: "UPLINE",
        investment: { investmentDate: { gte: startDate, lt: endDate } },
      },
      select: { amount: true },
    });
    const orcEarned = orcCommissions.reduce((sum, c) => sum + Number(c.amount), 0);

    const excessCommissions = await prisma.commission.findMany({
      where: {
        memberEmpNo: member.empNo,
        type: "EXCESS",
        investment: { investmentDate: { gte: startDate, lt: endDate } },
      },
      select: { amount: true },
    });
    const excessEarned = excessCommissions.reduce((sum, c) => sum + Number(c.amount), 0);

    const normalizedSalary = normalizeSalary(salary);

    if (!normalizedSalary) {
      errors.push(`${member.nameWithInitials ?? member.empNo}: no salary config`);
      continue;
    }

    const positionTargetRow = resolvePositionTarget(member, year, month);
    const positionTargetData = toPositionTargetData(positionTargetRow);
    const activeTeamCounts = await getActiveTeamCounts(member.empNo, year, month);

    const dbVolumeAchieved = existingPayroll?.volumeAchieved
      ? Number(existingPayroll.volumeAchieved)
      : (volumes[member.id] ?? 0);

    const breakdown = calculatePayroll(
      normalizedSalary,
      personalCommissionEarned + excessEarned,
      member.status,
      dbVolumeAchieved,
      orcEarned,
      activeTeamCounts,
      positionTargetData,
      Number(member.position?.targetBudgetAmount ?? 0), // NEW — was missing
    );


    const payrollDataBase = {
      basicSalaryPermanent: breakdown.basicSalaryPermanent,
      monthlyTarget: breakdown.monthlyTarget,
      incentiveEarned: breakdown.incentiveEarned,
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
    };

    try {
      await prisma.$transaction(async (tx) => {
        const { totalDeducted } = await applyAdvanceDeductions(
          tx, member.id, year, month, breakdown.netPay,
        );
        const finalNetPay = breakdown.netPay - totalDeducted;

        await tx.monthlyPayroll.upsert({
          where: { memberId_year_month: { memberId: member.id, year, month } },
          create: {
            memberId: member.id, year, month,
            volumeAchieved: dbVolumeAchieved,
            ...payrollDataBase,
            advanceDeducted: totalDeducted,
            netPay: finalNetPay,
          },
          update: {
            ...payrollDataBase,
            advanceDeducted: totalDeducted,
            netPay: finalNetPay,
          }, // ← volumeAchieved still NOT in update
        });
      });
      processed++;
    } catch (e) {
      errors.push(`${member.nameWithInitials ?? member.empNo}: ${String(e)}`);
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