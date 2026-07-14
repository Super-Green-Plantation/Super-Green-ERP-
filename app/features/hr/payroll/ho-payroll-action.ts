"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { previewAdvanceDeductions } from "../deduction/previewAdvanceDeductions";
import { applyAdvanceDeductions } from "../deduction/action";

// ─── Constants ────────────────────────────────────────────────────────────────
// Management members (RM/ZM/AGM/COO and fixed-salary HO staff like HR/ACC)
// don't run against PositionSalary/PositionTarget — they're flat
// base-salary + personal-commission + ORC, same EPF/ETF rates used
// elsewhere in the system as the default when no override is configured.
const DEFAULT_EPF_EMPLOYEE_RATE = 0.08;
const DEFAULT_EPF_EMPLOYER_RATE = 0.12;
const DEFAULT_ETF_EMPLOYER_RATE = 0.03;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Management members are identified by Position.type === "MANAGEMENT"
 * (mirrors the existing gate used in commissions/process.ts), not by
 * branch — ManagementBaseSalary/ManagementSalary are keyed purely by
 * memberId, same as the rest of the management payroll schema.
 */
async function getManagementMembers() {
  return prisma.member.findMany({
    where: {
      position: { type: "MANAGEMENT" },
      isActive: true,
    },
    include: {
      position: true,
      branches: { include: { branch: true } },
      ManagementBaseSalary: true,
    },
    orderBy: [{ position: { rank: "asc" } }, { nameWithInitials: "asc" }],
  });
}

async function getPersonalCommission(empNo: string, startDate: Date, endDate: Date) {
  const rows = await prisma.commission.findMany({
    where: {
      memberEmpNo: empNo,
      type: "PERSONAL",
      investment: { investmentDate: { gte: startDate, lt: endDate } },
    },
    select: { amount: true },
  });
  return rows.reduce((sum, c) => sum + Number(c.amount), 0);
}

async function getOrcCommission(empNo: string, startDate: Date, endDate: Date) {
  const rows = await prisma.commission.findMany({
    where: {
      memberEmpNo: empNo,
      type: "UPLINE",
      investment: { investmentDate: { gte: startDate, lt: endDate } },
    },
    select: { amount: true },
  });
  return rows.reduce((sum, c) => sum + Number(c.amount), 0);
}

// ─── Base salary management (standing default) ────────────────────────────────

export async function getManagementBaseSalaries() {
  const members = await getManagementMembers();
  return members.map((m) => ({
    memberId: m.id,
    name: m.nameWithInitials ?? m.empNo,
    empNo: m.empNo,
    position: m.position?.title ?? "—",
    primaryBranch:
      m.branches.find((b) => b.isPrimary)?.branch?.name ?? m.branches[0]?.branch?.name ?? "—",
    baseSalary: m.ManagementBaseSalary?.[0] ? Number(m.ManagementBaseSalary[0].baseSalary) : 0,
  }));
}

export async function upsertManagementBaseSalary(memberId: number, baseSalary: number) {
  await prisma.managementBaseSalary.upsert({
    where: { memberId },
    create: { memberId, baseSalary },
    update: { baseSalary },
  });
  revalidatePath("/features/hr/ho-payroll");
  return { success: true };
}

// ─── getHoPayrollPreview ────────────────────────────────────────────────────────

export async function getHoPayrollPreview(
  year: number,
  month: number,
  overrides: Record<number, number> = {}, // memberId -> base salary override for this run
) {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));
  const monthDate = new Date(Date.UTC(year, month - 1, 1));

  const members = await getManagementMembers();

  const existingSalaries = await prisma.managementSalary.findMany({
    where: { month: monthDate, memberId: { in: members.map((m) => m.id) } },
  });
  const existingBySalaryMemberId = new Map(existingSalaries.map((s) => [s.memberId, s]));

  const rows = await Promise.all(
    members.map(async (member) => {
      const existing = existingBySalaryMemberId.get(member.id) ?? null;
      const alreadyProcessed = !!existing;

      const defaultBaseSalary = member.ManagementBaseSalary?.[0]
        ? Number(member.ManagementBaseSalary[0].baseSalary)
        : 0;
      const baseSalary =
        overrides[member.id] ?? (existing ? Number(existing.baseSalary) : defaultBaseSalary);

      const personalCommissionEarned = await getPersonalCommission(member.empNo, startDate, endDate);
      const orcEarned = await getOrcCommission(member.empNo, startDate, endDate);

      const epfDeduction = baseSalary * DEFAULT_EPF_EMPLOYEE_RATE;
      const epfEmployer = baseSalary * DEFAULT_EPF_EMPLOYER_RATE;
      const etfEmployer = baseSalary * DEFAULT_ETF_EMPLOYER_RATE;

      const grossPay = baseSalary + personalCommissionEarned + orcEarned;
      const netPayBeforeAdvance = grossPay - epfDeduction;

      const { totalDeducted: advanceDeducted, deductionDetails, outstandingRemaining, outstandingTypes } =
        await previewAdvanceDeductions(member.id, year, month, netPayBeforeAdvance);

      const netPay = netPayBeforeAdvance - advanceDeducted;

      return {
        memberId: member.id,
        name: member.nameWithInitials ?? member.empNo,
        empNo: member.empNo,
        position: member.position?.title ?? "—",
        baseSalaryConfigured: !!member.ManagementBaseSalary?.[0],
        baseSalary,
        personalCommissionEarned,
        orcEarned,
        epfDeduction,
        epfEmployer,
        etfEmployer,
        advanceDeducted,
        advanceTypes: deductionDetails.map((d) => d.type),
        outstandingAdvanceRemaining: outstandingRemaining,
        outstandingAdvanceTypes: outstandingTypes,
        grossPay,
        netPay,
        alreadyProcessed,
        status: existing?.status ?? "PENDING",
        paidAt: existing?.paidAt ?? null,
      };
    }),
  );

  return rows;
}

// ─── runHoPayroll ────────────────────────────────────────────────────────────

export async function runHoPayroll(
  year: number,
  month: number,
  overrides: Record<number, number> = {},
  force = false,
) {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));
  const monthDate = new Date(Date.UTC(year, month - 1, 1));

  const members = await getManagementMembers();

  const existingSalaries = await prisma.managementSalary.findMany({
    where: { month: monthDate, memberId: { in: members.map((m) => m.id) } },
  });
  const existingByMemberId = new Map(existingSalaries.map((s) => [s.memberId, s]));

  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const member of members) {
    const existing = existingByMemberId.get(member.id) ?? null;

    // PAID rows are never touched by force re-run — they represent money
    // that's already gone out the door.
    if (existing?.status === "PAID") {
      skipped++;
      continue;
    }
    if (existing && !force) {
      skipped++;
      continue;
    }

    const defaultBaseSalary = member.ManagementBaseSalary?.[0]
      ? Number(member.ManagementBaseSalary[0].baseSalary)
      : 0;
    const baseSalary = overrides[member.id] ?? defaultBaseSalary;

    try {
      const personalCommissionEarned = await getPersonalCommission(member.empNo, startDate, endDate);
      const orcEarned = await getOrcCommission(member.empNo, startDate, endDate);

      const epfDeduction = baseSalary * DEFAULT_EPF_EMPLOYEE_RATE;
      const grossPay = baseSalary + personalCommissionEarned + orcEarned;
      const netPayBeforeAdvance = grossPay - epfDeduction;

      await prisma.$transaction(async (tx) => {
        const { totalDeducted } = await applyAdvanceDeductions(
          tx,
          member.id,
          year,
          month,
          netPayBeforeAdvance,
        );
        const netPay = netPayBeforeAdvance - totalDeducted;

        await tx.managementSalary.upsert({
          where: { memberId_month: { memberId: member.id, month: monthDate } },
          create: {
            memberId: member.id,
            month: monthDate,
            baseSalary,
            personalCommissionEarned,
            orcEarned,
            advanceDeduction: totalDeducted,
            epfDeduction,
            grossPay,
            netPay,
            status: "PENDING",
          },
          update: {
            baseSalary,
            personalCommissionEarned,
            orcEarned,
            advanceDeduction: totalDeducted,
            epfDeduction,
            grossPay,
            netPay,
          },
        });
      });

      processed++;
    } catch (e) {
      errors.push(`${member.nameWithInitials ?? member.empNo}: ${String(e)}`);
    }
  }

  revalidatePath("/features/hr/ho-payroll");
  return { success: true, processed, skipped, errors };
}

// ─── markManagementSalaryPaid ──────────────────────────────────────────────────

export async function markManagementSalaryPaid(memberId: number, year: number, month: number) {
  const monthDate = new Date(Date.UTC(year, month - 1, 1));
  await prisma.managementSalary.update({
    where: { memberId_month: { memberId, month: monthDate } },
    data: { status: "PAID", paidAt: new Date() },
  });
  revalidatePath("/features/hr/ho-payroll");
  return { success: true };
}

// ─── getHoPayrollHistory ────────────────────────────────────────────────────────

export async function getHoPayrollHistory(memberId: number) {
  return prisma.managementSalary.findMany({
    where: { memberId },
    orderBy: { month: "desc" },
  });
}
