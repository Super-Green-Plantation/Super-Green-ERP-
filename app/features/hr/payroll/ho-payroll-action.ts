"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculateHoPayroll, type HoSalaryConfig } from "../payroll-utils";
import { previewAdvanceDeductions } from "../deduction/previewAdvanceDeductions";
import { applyAdvanceDeductions } from "../deduction/action";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_EPF_EMPLOYEE_RATE = 0.08;
const DEFAULT_EPF_EMPLOYER_RATE = 0.12;
const DEFAULT_ETF_EMPLOYER_RATE = 0.03;
const DEFAULT_MAX_LEAVES = 1.5;

// Management staff personal incentive & commission rates
const MGMT_PERSONAL_INCENTIVE_THRESHOLD = 500_000;
const MGMT_PERSONAL_INCENTIVE_AMOUNT = 15_000;
const MGMT_COMM_RATE_HIGH = 0.10; // 10% when volume >= 500K
const MGMT_COMM_RATE_LOW  = 0.07; // 7%  when volume <  500K

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Per-run overrides that the HO payroll page allows editing before committing.
 * Any field not provided falls back to the stored HoPayrollConfig for the member.
 */
export type HoPayrollOverrides = {
  basicSalary?: number;
  fixedAllowance?: number;
  vehicleAllowance?: number;
  fuelAllowance?: number;
  channelOperation?: number;
  attendanceAllowance?: number;
  leavesTaken?: number;
  loanInstalments?: number;
  festivalAdvance?: number;
  merchandiseDeduction?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Rank boundary for HO payroll:
// rank >= 14 = JBM and above (permanent BM/RM/ZM/AGM, COO, GM, all HO staff)
// rank <  14 = FA, TL, BM, RM, ZM, PRO_AGM (field/marketing track)
const HO_MIN_RANK = 14;

async function getHoMembers() {
  return prisma.member.findMany({
    where: {
      position: { rank: { gte: HO_MIN_RANK } },
      isActive: true,
      channel: { not: "Micro" },
    },
    include: {
      position: true,
      branches: { include: { branch: true } },
      ManagementBaseSalary: true,
      HoPayrollConfig: true,
    },
    orderBy: [{ position: { rank: "asc" } }, { nameWithInitials: "asc" }],
  });
}

async function getOrcCommission(empNo: string, startDate: Date, endDate: Date): Promise<number> {
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

/**
 * Fetch the total investment volume achieved by a member in the month
 * (counting as FA — i.e. investments where faId = memberId).
 * Renewals contribute 25% of their amount.
 * Used for management staff personal commission calculation.
 */
async function getVolumeAchieved(memberId: number, startDate: Date, endDate: Date): Promise<number> {
  const investments = await prisma.investment.findMany({
    where: {
      faId: memberId,
      investmentDate: { gte: startDate, lt: endDate },
      status: "Active",
    },
    select: { amount: true, renewedFromId: true },
  });
  return investments.reduce((sum, inv) => {
    // Investments that have a parent (renewedFromId != null) are renewals → count 25%
    const isRenewal = inv.renewedFromId !== null;
    const contribution = isRenewal ? Number(inv.amount) * 0.25 : Number(inv.amount);
    return sum + contribution;
  }, 0);
}

/**
 * Compute management staff personal commission from their volume.
 *   volume >= 500K → 10% of volume
 *   volume <  500K → 7%  of volume
 * Commission is earned on ALL volume (no threshold gate — even 1 LKR earns 7%).
 * The 15K flat incentive is separate and only awarded when volume >= 500K.
 */
function calcMgmtPersonalCommission(volume: number): number {
  if (volume <= 0) return 0;
  const rate = volume >= MGMT_PERSONAL_INCENTIVE_THRESHOLD ? MGMT_COMM_RATE_HIGH : MGMT_COMM_RATE_LOW;
  return volume * rate;
}

/**
 * Builds an HoSalaryConfig by merging the member's stored HoPayrollConfig
 * (or ManagementBaseSalary fallback) with any per-run overrides.
 */
function buildHoConfig(member: any, overrides: HoPayrollOverrides = {}): HoSalaryConfig {
  // HoPayrollConfig has @unique on memberId → Prisma may generate it as either
  // a single object or an array relation depending on schema generation.
  // Normalise to a single object regardless.
  const rawCfg = member.HoPayrollConfig;
  const stored = Array.isArray(rawCfg) ? (rawCfg[0] ?? null) : (rawCfg ?? null);

  const rawBase = member.ManagementBaseSalary;
  const baseRow = Array.isArray(rawBase) ? (rawBase[0] ?? null) : (rawBase ?? null);
  const baseFallback = baseRow ? Number(baseRow.baseSalary) : 0;

  return {
    basicSalary:
      overrides.basicSalary ??
      (stored ? Number(stored.basicSalary) : baseFallback),
    fixedAllowance:
      overrides.fixedAllowance ?? (stored ? Number(stored.fixedAllowance) : 0),
    vehicleAllowance:
      overrides.vehicleAllowance ?? (stored ? Number(stored.vehicleAllowance) : 0),
    fuelAllowance:
      overrides.fuelAllowance ?? (stored ? Number(stored.fuelAllowance) : 0),
    channelOperation:
      overrides.channelOperation ?? (stored ? Number(stored.channelOperation) : 0),
    attendanceAllowance:
      overrides.attendanceAllowance ?? (stored ? Number(stored.attendanceAllowance) : 0),
    loanInstalments:
      overrides.loanInstalments ?? (stored ? Number((stored as any).loanInstalments ?? 0) : 0),
    festivalAdvance:
      overrides.festivalAdvance ?? (stored ? Number((stored as any).festivalAdvance ?? 0) : 0),
    merchandiseDeduction:
      overrides.merchandiseDeduction ?? (stored ? Number((stored as any).merchandiseDeduction ?? 0) : 0),
    epfEmployeeRate: DEFAULT_EPF_EMPLOYEE_RATE,
    epfEmployerRate: DEFAULT_EPF_EMPLOYER_RATE,
    etfEmployerRate: DEFAULT_ETF_EMPLOYER_RATE,
    maxLeavesWithoutDeduction: DEFAULT_MAX_LEAVES,
  };
}

// ─── HoPayrollConfig CRUD ─────────────────────────────────────────────────────

export async function getHoPayrollConfigs() {
  const members = await getHoMembers();
  return members.map((m) => {
    const rawCfg = m.HoPayrollConfig;
    const cfg = Array.isArray(rawCfg) ? (rawCfg[0] ?? null) : (rawCfg ?? null);
    const rawBase = m.ManagementBaseSalary;
    const baseRow = Array.isArray(rawBase) ? (rawBase[0] ?? null) : (rawBase ?? null);
    const baseFallback = baseRow ? Number(baseRow.baseSalary) : 0;
    return {
      memberId: m.id,
      name: m.nameWithInitials ?? m.empNo,
      empNo: m.empNo,
      position: m.position?.title ?? "—",
      primaryBranch:
        m.branches.find((b) => b.isPrimary)?.branch?.name ??
        m.branches[0]?.branch?.name ??
        "—",
      basicSalary: cfg ? Number(cfg.basicSalary) : baseFallback,
      fixedAllowance: cfg ? Number(cfg.fixedAllowance) : 0,
      vehicleAllowance: cfg ? Number(cfg.vehicleAllowance) : 0,
      fuelAllowance: cfg ? Number(cfg.fuelAllowance) : 0,
      channelOperation: cfg ? Number(cfg.channelOperation) : 0,
      attendanceAllowance: cfg ? Number(cfg.attendanceAllowance) : 0,
    };
  });
}

export async function upsertHoPayrollConfig(
  memberId: number,
  data: {
    basicSalary: number;
    fixedAllowance: number;
    vehicleAllowance: number;
    fuelAllowance: number;
    channelOperation: number;
    attendanceAllowance: number;
  },
) {
  await prisma.hoPayrollConfig.upsert({
    where: { memberId },
    create: { memberId, ...data },
    update: { ...data },
  });

  await prisma.managementBaseSalary.upsert({
    where: { memberId },
    create: { memberId, baseSalary: data.basicSalary },
    update: { baseSalary: data.basicSalary },
  });

  revalidatePath("/features/hr/ho-payroll");
  return { success: true };
}

// ─── getHoPayrollPreview ──────────────────────────────────────────────────────

export async function getHoPayrollPreview(
  year: number,
  month: number,
  overridesMap: Record<number, HoPayrollOverrides> = {},
) {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));
  const monthDate = new Date(Date.UTC(year, month - 1, 1));

  const members = await getHoMembers();

  const existingSalaries = await prisma.managementSalary.findMany({
    where: { month: monthDate, memberId: { in: members.map((m) => m.id) } },
  });
  const existingBySalaryMemberId = new Map(existingSalaries.map((s) => [s.memberId, s]));

  const rows = await Promise.all(
    members.map(async (member) => {
      const existing = existingBySalaryMemberId.get(member.id) ?? null;
      const alreadyProcessed = !!existing;
      const isManagementStaff = !!member.position?.isManagement;
      // ORC goes to BM-rank and above who are NOT management staff
      const receivesOrc = !isManagementStaff;

      const memberOverrides = overridesMap[member.id] ?? {};

      const effectiveOverrides: HoPayrollOverrides = alreadyProcessed
        ? {
            basicSalary: memberOverrides.basicSalary ?? Number(existing!.baseSalary),
            fixedAllowance: memberOverrides.fixedAllowance ?? Number((existing as any).fixedAllowance ?? 0),
            vehicleAllowance: memberOverrides.vehicleAllowance ?? Number((existing as any).vehicleAllowance ?? 0),
            fuelAllowance: memberOverrides.fuelAllowance ?? Number((existing as any).fuelAllowance ?? 0),
            channelOperation: memberOverrides.channelOperation ?? Number((existing as any).channelOperation ?? 0),
            attendanceAllowance: memberOverrides.attendanceAllowance ?? Number((existing as any).attendanceAllowance ?? 0),
            leavesTaken: memberOverrides.leavesTaken ?? Number((existing as any).leavesTaken ?? 0),
            loanInstalments: memberOverrides.loanInstalments ?? Number((existing as any).loanInstalments ?? 0),
            festivalAdvance: memberOverrides.festivalAdvance ?? Number((existing as any).festivalAdvance ?? 0),
            merchandiseDeduction: memberOverrides.merchandiseDeduction ?? Number((existing as any).merchandiseDeduction ?? 0),
          }
        : memberOverrides;

      const hoConfig = buildHoConfig(member, effectiveOverrides);
      const leavesTaken = effectiveOverrides.leavesTaken ?? 0;

      // ORC — only for non-management permanent BM/RM/ZM/AGM/COO/GM
      const orcEarned = receivesOrc
        ? await getOrcCommission(member.empNo, startDate, endDate)
        : 0;

      // Personal commission & incentive — management staff only.
      // Commission: 7% of volume always; 10% when volume >= 500K.
      // Flat incentive: 15K only when volume >= 500K.
      let personalCommission = 0;
      let personalIncentive = 0;
      let volumeAchieved = 0;
      if (isManagementStaff) {
        volumeAchieved = await getVolumeAchieved(member.id, startDate, endDate);
        personalCommission = calcMgmtPersonalCommission(volumeAchieved);
        if (volumeAchieved >= MGMT_PERSONAL_INCENTIVE_THRESHOLD) {
          personalIncentive = MGMT_PERSONAL_INCENTIVE_AMOUNT;
        }
      }

      const breakdown = calculateHoPayroll(hoConfig, leavesTaken, orcEarned);

      // Add personal incentive + personal commission to gross/net
      const totalGross = breakdown.grossPay + personalIncentive + personalCommission;
      const baseNetPay = totalGross - breakdown.totalDeductions;

      const { totalDeducted: advanceDeducted, deductionDetails, outstandingRemaining, outstandingTypes } =
        await previewAdvanceDeductions(member.id, year, month, baseNetPay);

      const netPay = baseNetPay - advanceDeducted;

      return {
        memberId: member.id,
        name: member.nameWithInitials ?? member.empNo,
        empNo: member.empNo,
        position: member.position?.title ?? "—",
        primaryBranch:
          member.branches.find((b) => b.isPrimary)?.branch?.name ??
          member.branches[0]?.branch?.name ??
          "—",
        isManagementStaff,
        receivesOrc,
        baseSalaryConfigured: hoConfig.basicSalary > 0,

        // Allowance config (editable per-run)
        basicSalary: breakdown.basicSalary,
        fixedAllowance: breakdown.fixedAllowance,
        vehicleAllowance: breakdown.vehicleAllowance,
        fuelAllowance: breakdown.fuelAllowance,
        channelOperation: breakdown.channelOperation,
        attendanceAllowance: breakdown.attendanceAllowance,
        attendanceAllowanceHit: breakdown.attendanceAllowanceHit,
        leavesTaken,

        // Commission / incentive
        orcEarned: breakdown.orcEarned,
        personalCommission,
        personalIncentive,
        volumeAchieved,

        grossPay: totalGross,

        // Deductions
        epfDeduction: breakdown.epfEmployee,
        loanInstalments: breakdown.loanInstalments,
        festivalAdvance: breakdown.festivalAdvance,
        merchandiseDeduction: breakdown.merchandiseDeduction,

        // Employer statutory
        epfEmployer: breakdown.epfEmployer,
        etfEmployer: breakdown.etfEmployer,

        // Advance deductions
        advanceDeducted,
        advanceTypes: deductionDetails.map((d: any) => d.type),
        outstandingAdvanceRemaining: outstandingRemaining,
        outstandingAdvanceTypes: outstandingTypes,

        netPay,
        alreadyProcessed,
        status: (existing as any)?.status ?? "PENDING",
        paidAt: (existing as any)?.paidAt ?? null,
      };
    }),
  );

  return rows;
}

// ─── runHoPayroll ─────────────────────────────────────────────────────────────

export async function runHoPayroll(
  year: number,
  month: number,
  overridesMap: Record<number, HoPayrollOverrides> = {},
  force = false,
) {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));
  const monthDate = new Date(Date.UTC(year, month - 1, 1));

  const members = await getHoMembers();

  const existingSalaries = await prisma.managementSalary.findMany({
    where: { month: monthDate, memberId: { in: members.map((m) => m.id) } },
  });
  const existingByMemberId = new Map(existingSalaries.map((s) => [s.memberId, s]));

  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const member of members) {
    const existing = existingByMemberId.get(member.id) ?? null;

    if ((existing as any)?.status === "PAID") {
      skipped++;
      continue;
    }
    if (existing && !force) {
      skipped++;
      continue;
    }

    try {
      const memberOverrides = overridesMap[member.id] ?? {};
      const hoConfig = buildHoConfig(member, memberOverrides);
      const leavesTaken = memberOverrides.leavesTaken ?? 0;
      const isManagementStaff = !!member.position?.isManagement;
      const receivesOrc = !isManagementStaff;

      const orcEarned = receivesOrc
        ? await getOrcCommission(member.empNo, startDate, endDate)
        : 0;

      let personalCommission = 0;
      let personalIncentive = 0;
      if (isManagementStaff) {
        const vol = await getVolumeAchieved(member.id, startDate, endDate);
        personalCommission = calcMgmtPersonalCommission(vol);
        if (vol >= MGMT_PERSONAL_INCENTIVE_THRESHOLD) {
          personalIncentive = MGMT_PERSONAL_INCENTIVE_AMOUNT;
        }
      }

      const breakdown = calculateHoPayroll(hoConfig, leavesTaken, orcEarned);
      const totalGross = breakdown.grossPay + personalIncentive + personalCommission;
      const baseNetPay = totalGross - breakdown.totalDeductions;

      await prisma.$transaction(async (tx) => {
        const { totalDeducted } = await applyAdvanceDeductions(
          tx,
          member.id,
          year,
          month,
          baseNetPay,
        );
        const finalNetPay = baseNetPay - totalDeducted;

        await tx.managementSalary.upsert({
          where: { memberId_month: { memberId: member.id, month: monthDate } },
          create: {
            memberId: member.id,
            month: monthDate,
            baseSalary: hoConfig.basicSalary,
            personalCommissionEarned: personalCommission,
            personalIncentive,
            orcEarned: breakdown.orcEarned,
            advanceDeduction: totalDeducted,
            epfDeduction: breakdown.epfEmployee,
            grossPay: totalGross,
            netPay: finalNetPay,
            status: "PENDING",
            fixedAllowance: hoConfig.fixedAllowance,
            vehicleAllowance: hoConfig.vehicleAllowance,
            fuelAllowance: hoConfig.fuelAllowance,
            channelOperation: hoConfig.channelOperation,
            attendanceAllowance: breakdown.attendanceAllowance,
            leavesTaken,
            loanInstalments: breakdown.loanInstalments,
            festivalAdvance: breakdown.festivalAdvance,
            merchandiseDeduction: breakdown.merchandiseDeduction,
            epfEmployer: breakdown.epfEmployer,
            etfEmployer: breakdown.etfEmployer,
          },
          update: {
            baseSalary: hoConfig.basicSalary,
            personalCommissionEarned: personalCommission,
            personalIncentive,
            orcEarned: breakdown.orcEarned,
            advanceDeduction: totalDeducted,
            epfDeduction: breakdown.epfEmployee,
            grossPay: totalGross,
            netPay: finalNetPay,
            fixedAllowance: hoConfig.fixedAllowance,
            vehicleAllowance: hoConfig.vehicleAllowance,
            fuelAllowance: hoConfig.fuelAllowance,
            channelOperation: hoConfig.channelOperation,
            attendanceAllowance: breakdown.attendanceAllowance,
            leavesTaken,
            loanInstalments: breakdown.loanInstalments,
            festivalAdvance: breakdown.festivalAdvance,
            merchandiseDeduction: breakdown.merchandiseDeduction,
            epfEmployer: breakdown.epfEmployer,
            etfEmployer: breakdown.etfEmployer,
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

// ─── markManagementSalaryPaid ─────────────────────────────────────────────────

export async function markManagementSalaryPaid(memberId: number, year: number, month: number) {
  const monthDate = new Date(Date.UTC(year, month - 1, 1));
  await prisma.managementSalary.update({
    where: { memberId_month: { memberId, month: monthDate } },
    data: { status: "PAID", paidAt: new Date() },
  });
  revalidatePath("/features/hr/ho-payroll");
  return { success: true };
}

// ─── getHoPayrollHistory ──────────────────────────────────────────────────────

export async function getHoPayrollHistory(memberId: number) {
  return prisma.managementSalary.findMany({
    where: { memberId },
    orderBy: { month: "desc" },
  });
}

// ─── Legacy compat exports ────────────────────────────────────────────────────

export async function getManagementBaseSalaries() {
  const members = await getHoMembers();
  return members.map((m) => {
    const rawBase = m.ManagementBaseSalary;
    const baseRow = Array.isArray(rawBase) ? (rawBase[0] ?? null) : (rawBase ?? null);
    return {
      memberId: m.id,
      name: m.nameWithInitials ?? m.empNo,
      empNo: m.empNo,
      position: m.position?.title ?? "—",
      primaryBranch:
        m.branches.find((b) => b.isPrimary)?.branch?.name ??
        m.branches[0]?.branch?.name ??
        "—",
      baseSalary: baseRow ? Number(baseRow.baseSalary) : 0,
    };
  });
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