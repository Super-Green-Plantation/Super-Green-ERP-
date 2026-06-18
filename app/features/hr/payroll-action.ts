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