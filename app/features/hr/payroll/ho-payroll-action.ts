"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  calculateHoPayroll,
  calculatePermBmPayroll,
  getBasicSalaryThreshold,
  type HoSalaryConfig,
  type PermBmSalaryConfig,
} from "../payroll-utils";
import { previewAdvanceDeductions } from "../deduction/previewAdvanceDeductions";
import { applyAdvanceDeductions } from "../deduction/action";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_EPF_EMPLOYEE_RATE = 0.08;
const DEFAULT_EPF_EMPLOYER_RATE = 0.12;
const DEFAULT_ETF_EMPLOYER_RATE = 0.03;
const DEFAULT_MAX_LEAVES = 1.5;

// Permanent BM/RM/ZM/AGM ranks (HO track, volume-gated salary).
// Ranks 14–20: JBM(14), SBM(15), JRM(16), SRM(17), JZM(18), SZM(19), PER_AGM(20).
const PERM_BM_RANKS = new Set([14, 15, 16, 17, 18, 19, 20]);
// RM and above (rank >= 16) get vehicle+fuel unconditionally for months 1–4.
const VEHICLE_UNCONDITIONAL_MIN_RANK = 16;
const VEHICLE_UNCONDITIONAL_MAX_TENURE = 4;

const MGMT_PERSONAL_INCENTIVE_THRESHOLD = 500_000;
const MGMT_PERSONAL_INCENTIVE_AMOUNT = 15_000;
const MGMT_COMM_RATE_HIGH = 0.10;
const MGMT_COMM_RATE_LOW  = 0.07;

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── DB helpers ───────────────────────────────────────────────────────────────

const HO_MIN_RANK = 14;

async function getHoMembers() {
  return prisma.member.findMany({
    where: {
      position: { rank: { gte: HO_MIN_RANK } },
      isActive: true,
      channel: { not: "Micro" },
    },
    include: {
      position: { include: { salary: true } },
      branches: { include: { branch: true } },
      ManagementBaseSalary: true,
      HoPayrollConfig: true,
    },
    orderBy: [{ position: { rank: "asc" } }, { nameWithInitials: "asc" }],
  });
}

/** Months since dateOfJoin, counting the join month as month 1. */
function computeTenureMonths(
  dateOfJoin: Date | string | null | undefined,
  year: number,
  month: number,
): number {
  if (!dateOfJoin) return 1;
  const d = typeof dateOfJoin === "string" ? new Date(dateOfJoin) : dateOfJoin;
  const months = (year - d.getFullYear()) * 12 + (month - (d.getMonth() + 1)) + 1;
  return Math.max(1, months);
}

/** Normalise Prisma unique-relation that may return object or array. */
function normaliseUnique<T>(raw: T | T[] | null | undefined): T | null {
  if (raw == null) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

// ─── Commission / volume fetchers ─────────────────────────────────────────────

async function getOrcCommission(empNo: string, startDate: Date, endDate: Date): Promise<number> {
  const rows = await prisma.commission.findMany({
    where: { memberEmpNo: empNo, type: "UPLINE", investment: { investmentDate: { gte: startDate, lt: endDate } } },
    select: { amount: true },
  });
  return rows.reduce((s, c) => s + Number(c.amount), 0);
}

async function getPersonalCommissionFromDb(empNo: string, startDate: Date, endDate: Date): Promise<number> {
  const rows = await prisma.commission.findMany({
    where: { memberEmpNo: empNo, type: "PERSONAL", investment: { investmentDate: { gte: startDate, lt: endDate } } },
    select: { amount: true },
  });
  return rows.reduce((s, c) => s + Number(c.amount), 0);
}

/** FA-only volume (management staff personal commission base). */
async function getVolumeAchieved(memberId: number, startDate: Date, endDate: Date): Promise<number> {
  const investments = await prisma.investment.findMany({
    where: { faId: memberId, investmentDate: { gte: startDate, lt: endDate }, status: "Active" },
    select: { amount: true, renewedFromId: true },
  });
  return investments.reduce((s, inv) => s + (inv.renewedFromId ? Number(inv.amount) * 0.25 : Number(inv.amount)), 0);
}

/**
 * Team + personal volume for permanent BM/RM/ZM/AGM.
 * All investments where the member appears as BM/RM/ZM/AGM or FA.
 * Renewals count as 25%.
 */
async function getTeamVolumeAchieved(memberId: number, startDate: Date, endDate: Date): Promise<number> {
  const investments = await prisma.investment.findMany({
    where: {
      investmentDate: { gte: startDate, lt: endDate },
      status: "Active",
      OR: [
        { faId: memberId },
        { bmId: memberId },
        { rmId: memberId },
        { zmId: memberId },
        { agmId: memberId },
      ],
    },
    select: { id: true, amount: true, renewedFromId: true },
  });
  // Deduplicate by investment id (member may appear in multiple hierarchy slots)
  const seen = new Set<number>();
  return investments.reduce((s, inv) => {
    if (seen.has(inv.id)) return s;
    seen.add(inv.id);
    return s + (inv.renewedFromId ? Number(inv.amount) * 0.25 : Number(inv.amount));
  }, 0);
}

function calcMgmtPersonalCommission(volume: number): number {
  if (volume <= 0) return 0;
  return volume * (volume >= MGMT_PERSONAL_INCENTIVE_THRESHOLD ? MGMT_COMM_RATE_HIGH : MGMT_COMM_RATE_LOW);
}

// ─── Config builders ──────────────────────────────────────────────────────────

function buildHoConfig(member: any, overrides: HoPayrollOverrides = {}): HoSalaryConfig {
  const stored = normaliseUnique(member.HoPayrollConfig);
  const baseRow = normaliseUnique(member.ManagementBaseSalary);
  const baseFallback = baseRow ? Number(baseRow.baseSalary) : 0;
  return {
    basicSalary:         overrides.basicSalary         ?? (stored ? Number(stored.basicSalary)         : baseFallback),
    fixedAllowance:      overrides.fixedAllowance      ?? (stored ? Number(stored.fixedAllowance)      : 0),
    vehicleAllowance:    overrides.vehicleAllowance     ?? (stored ? Number(stored.vehicleAllowance)    : 0),
    fuelAllowance:       overrides.fuelAllowance        ?? (stored ? Number(stored.fuelAllowance)       : 0),
    channelOperation:    overrides.channelOperation     ?? (stored ? Number(stored.channelOperation)    : 0),
    attendanceAllowance: overrides.attendanceAllowance  ?? (stored ? Number(stored.attendanceAllowance) : 0),
    loanInstalments:     overrides.loanInstalments      ?? 0,
    festivalAdvance:     overrides.festivalAdvance      ?? 0,
    merchandiseDeduction:overrides.merchandiseDeduction ?? 0,
    epfEmployeeRate:   DEFAULT_EPF_EMPLOYEE_RATE,
    epfEmployerRate:   DEFAULT_EPF_EMPLOYER_RATE,
    etfEmployerRate:   DEFAULT_ETF_EMPLOYER_RATE,
    maxLeavesWithoutDeduction: DEFAULT_MAX_LEAVES,
  };
}

function buildPermBmConfig(
  ps: { basicSalaryPermanent: number; monthlyTarget: number; incentivePartialAmount: number; incentiveAmount: number; allowanceAmount: number; allowanceThresholdPermanent: number },
  rank: number,
  tenureMonth: number,
): PermBmSalaryConfig {
  return {
    basicSalary:             ps.basicSalaryPermanent,
    monthlyTarget:           ps.monthlyTarget,
    incentive75Amount:       ps.incentivePartialAmount,
    incentive100Amount:      ps.incentiveAmount,
    vehicleFuelAmount:       ps.allowanceAmount,
    vehicleFuelThresholdPct: ps.allowanceThresholdPermanent || 0.50,
    vehicleFuelUnconditional:
      rank >= VEHICLE_UNCONDITIONAL_MIN_RANK && tenureMonth <= VEHICLE_UNCONDITIONAL_MAX_TENURE,
    epfEmployeeRate: DEFAULT_EPF_EMPLOYEE_RATE,
    epfEmployerRate: DEFAULT_EPF_EMPLOYER_RATE,
    etfEmployerRate: DEFAULT_ETF_EMPLOYER_RATE,
  };
}

// ─── Shared commission resolver ───────────────────────────────────────────────

async function resolveMemberCommissions(member: any, startDate: Date, endDate: Date) {
  const rank = member.position?.rank ?? 0;
  const isManagementStaff = !!member.position?.isManagement;
  const isPermBmTrack = PERM_BM_RANKS.has(rank);
  const receivesOrc = !isManagementStaff;

  const orcEarned = receivesOrc ? await getOrcCommission(member.empNo, startDate, endDate) : 0;

  let personalCommission = 0;
  let personalIncentive = 0;
  let volumeAchieved = 0;

  if (isManagementStaff) {
    // Management staff: volume-based commission (7%/10%) + 15K flat incentive at 500K+
    volumeAchieved = await getVolumeAchieved(member.id, startDate, endDate);
    personalCommission = calcMgmtPersonalCommission(volumeAchieved);
    if (volumeAchieved >= MGMT_PERSONAL_INCENTIVE_THRESHOLD) personalIncentive = MGMT_PERSONAL_INCENTIVE_AMOUNT;
  } else {
    // All non-management HO members (perm BM/RM/ZM/AGM/COO/GM):
    // fetch PERSONAL-type commissions directly from Commission rows.
    personalCommission = await getPersonalCommissionFromDb(member.empNo, startDate, endDate);
  }

  return { isManagementStaff, isPermBmTrack, receivesOrc, orcEarned, personalCommission, personalIncentive, volumeAchieved };
}

// ─── Salary payload builder ───────────────────────────────────────────────────

function buildSalaryPayload(
  args: {
    hoConfig: HoSalaryConfig;
    hoBreakdown: ReturnType<typeof calculateHoPayroll>;
    personalCommission: number;
    personalIncentive: number;
    totalGross: number;
    finalNetPay: number;
    totalDeducted: number;
    leavesTaken: number;
    epfEmployer: number;
    etfEmployer: number;
    permBm?: ReturnType<typeof calculatePermBmPayroll>;
  },
) {
  const { hoConfig, hoBreakdown, personalCommission, personalIncentive,
          totalGross, finalNetPay, totalDeducted, leavesTaken,
          epfEmployer, etfEmployer, permBm } = args;
  return {
    baseSalary:              hoConfig.basicSalary,
    personalCommissionEarned:personalCommission,
    personalIncentive,
    orcEarned:               hoBreakdown.orcEarned,
    advanceDeduction:        totalDeducted,
    epfDeduction:            hoBreakdown.epfEmployee,
    grossPay:                totalGross,
    netPay:                  finalNetPay,
    fixedAllowance:          hoConfig.fixedAllowance,
    vehicleAllowance:        hoBreakdown.vehicleAllowance,
    fuelAllowance:           hoBreakdown.fuelAllowance,
    channelOperation:        hoConfig.channelOperation,
    attendanceAllowance:     hoBreakdown.attendanceAllowance,
    leavesTaken,
    loanInstalments:         hoBreakdown.loanInstalments,
    festivalAdvance:         hoBreakdown.festivalAdvance,
    merchandiseDeduction:    hoBreakdown.merchandiseDeduction,
    epfEmployer,
    etfEmployer,
    // Perm BM breakdown (0/false for fixed-salary staff)
    // Kept separate so it can be spread with `as any` — guards against stale Prisma client
    // before `db pull` + `prisma generate` is re-run after the migration.
    _permBmFields: {
      volumeAchieved:    permBm?.volumeAchieved    ?? 0,
      monthlyTarget:     permBm?.monthlyTarget      ?? 0,
      achievementPct:    permBm?.achievementPct     ?? 0,
      basicSalaryHit:    permBm?.basicSalaryHit     ?? false,
      incentive75Earned: permBm?.incentive75Earned  ?? 0,
      incentive75Hit:    permBm?.incentive75Hit      ?? false,
      incentive100Earned:permBm?.incentive100Earned  ?? 0,
      incentive100Hit:   permBm?.incentive100Hit     ?? false,
      vehicleFuelEarned: permBm?.vehicleFuelEarned  ?? 0,
      vehicleFuelHit:    permBm?.vehicleFuelHit      ?? false,
    },
  };
}

/**
 * Computes the full payroll for one member, returning both the HoPayrollBreakdown
 * (for fixed-salary components/deductions) and an optional PermBmPayrollBreakdown,
 * plus the unified gross/net figures.
 */
async function computeMemberPayroll(
  member: any,
  year: number,
  month: number,
  overrides: HoPayrollOverrides,
) {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate   = new Date(Date.UTC(year, month, 1));

  const { isManagementStaff, isPermBmTrack, orcEarned, personalCommission, personalIncentive, volumeAchieved } =
    await resolveMemberCommissions(member, startDate, endDate);

  const rank         = member.position?.rank ?? 0;
  const tenureMonth  = computeTenureMonths(member.dateOfJoin, year, month);
  const leavesTaken  = overrides.leavesTaken ?? 0;

  let permBmBreakdown: ReturnType<typeof calculatePermBmPayroll> | undefined;
  let hoBreakdown: ReturnType<typeof calculateHoPayroll>;
  let totalGross: number;
  let epfEmployee: number;
  let epfEmployer: number;
  let etfEmployer: number;

  if (isPermBmTrack) {
    // Perm BM track: volume-gated salary
    const ps = normaliseUnique(member.position?.salary);
    const permBmConfig = ps
      ? buildPermBmConfig(
          {
            basicSalaryPermanent:        Number(ps.basicSalaryPermanent),
            monthlyTarget:               Number(ps.monthlyTarget),
            incentivePartialAmount:      Number(ps.incentivePartialAmount),
            incentiveAmount:             Number(ps.incentiveAmount),
            allowanceAmount:             Number(ps.allowanceAmount),
            allowanceThresholdPermanent: Number(ps.allowanceThresholdPermanent),
          },
          rank,
          tenureMonth,
        )
      : null;

    const teamVol = await getTeamVolumeAchieved(member.id, startDate, endDate);

    permBmBreakdown = permBmConfig
      ? calculatePermBmPayroll(permBmConfig, teamVol, tenureMonth, orcEarned)
      : calculatePermBmPayroll(
          { basicSalary: 0, monthlyTarget: 0, incentive75Amount: 0, incentive100Amount: 0,
            vehicleFuelAmount: 0, vehicleFuelThresholdPct: 0.5, vehicleFuelUnconditional: false,
            epfEmployeeRate: DEFAULT_EPF_EMPLOYEE_RATE, epfEmployerRate: DEFAULT_EPF_EMPLOYER_RATE,
            etfEmployerRate: DEFAULT_ETF_EMPLOYER_RATE },
          0, tenureMonth, 0,
        );

    // Build a minimal HoConfig for shared deduction fields (leaves not applicable here)
    const hoConfig = buildHoConfig(member, { ...overrides, basicSalary: permBmBreakdown.basicSalary });
    hoBreakdown = calculateHoPayroll({ ...hoConfig, vehicleAllowance: 0, fuelAllowance: 0, channelOperation: 0, attendanceAllowance: 0 }, 0, 0);

    totalGross  = permBmBreakdown.grossPay + personalCommission;
    epfEmployee = permBmBreakdown.epfEmployee;
    epfEmployer = permBmBreakdown.epfEmployer;
    etfEmployer = permBmBreakdown.etfEmployer;

    // Patch hoBreakdown so buildSalaryPayload gets correct loan/festival/merch deductions
    hoBreakdown.orcEarned          = permBmBreakdown.orcEarned;
    hoBreakdown.epfEmployee        = epfEmployee;
    hoBreakdown.epfEmployer        = epfEmployer;
    hoBreakdown.etfEmployer        = etfEmployer;
    hoBreakdown.loanInstalments    = overrides.loanInstalments   ?? 0;
    hoBreakdown.festivalAdvance    = overrides.festivalAdvance   ?? 0;
    hoBreakdown.merchandiseDeduction = overrides.merchandiseDeduction ?? 0;
    // vehicle/fuel stored separately in vehicleFuelEarned, leave them 0 in hoBreakdown
    hoBreakdown.vehicleAllowance   = 0;
    hoBreakdown.fuelAllowance      = 0;
  } else {
    // Fixed-salary HO track (management staff, COO, GM etc.)
    const hoConfig = buildHoConfig(member, overrides);
    hoBreakdown    = calculateHoPayroll(hoConfig, leavesTaken, orcEarned);
    totalGross     = hoBreakdown.grossPay + personalIncentive + personalCommission;
    epfEmployee    = hoBreakdown.epfEmployee;
    epfEmployer    = hoBreakdown.epfEmployer;
    etfEmployer    = hoBreakdown.etfEmployer;
  }

  const baseNetPay = totalGross - epfEmployee
    - (overrides.loanInstalments    ?? hoBreakdown.loanInstalments    ?? 0)
    - (overrides.festivalAdvance    ?? hoBreakdown.festivalAdvance    ?? 0)
    - (overrides.merchandiseDeduction ?? hoBreakdown.merchandiseDeduction ?? 0);

  return {
    isManagementStaff, isPermBmTrack, rank, tenureMonth,
    orcEarned, personalCommission, personalIncentive, volumeAchieved,
    hoBreakdown, permBmBreakdown,
    totalGross, epfEmployee, epfEmployer, etfEmployer,
    baseNetPay, leavesTaken,
    hoConfig: buildHoConfig(member, overrides),
  };
}

// ─── HoPayrollConfig CRUD ─────────────────────────────────────────────────────

export async function getHoPayrollConfigs() {
  const members = await getHoMembers();
  return members.map((m) => {
    const cfg    = normaliseUnique(m.HoPayrollConfig);
    const baseRow= normaliseUnique(m.ManagementBaseSalary);
    const rank   = m.position?.rank ?? 0;
    const ps     = normaliseUnique((m.position as any)?.salary);
    return {
      memberId: m.id,
      name: m.nameWithInitials ?? m.empNo,
      empNo: m.empNo,
      position: m.position?.title ?? "—",
      primaryBranch: m.branches.find((b: any) => b.isPrimary)?.branch?.name ?? m.branches[0]?.branch?.name ?? "—",
      isPermBmTrack: PERM_BM_RANKS.has(rank),
      // Fixed-salary config
      basicSalary:         cfg ? Number(cfg.basicSalary)         : (baseRow ? Number(baseRow.baseSalary) : 0),
      fixedAllowance:      cfg ? Number(cfg.fixedAllowance)      : 0,
      vehicleAllowance:    cfg ? Number(cfg.vehicleAllowance)    : 0,
      fuelAllowance:       cfg ? Number(cfg.fuelAllowance)       : 0,
      channelOperation:    cfg ? Number(cfg.channelOperation)    : 0,
      attendanceAllowance: cfg ? Number(cfg.attendanceAllowance) : 0,
      // Perm BM config (from PositionSalary)
      posBasicSalary:         ps ? Number(ps.basicSalaryPermanent)     : 0,
      posMonthlyTarget:       ps ? Number(ps.monthlyTarget)            : 0,
      posIncentive75:         ps ? Number(ps.incentivePartialAmount)   : 0,
      posIncentive100:        ps ? Number(ps.incentiveAmount)          : 0,
      posVehicleFuel:         ps ? Number(ps.allowanceAmount)          : 0,
      posVehicleFuelThresh:   ps ? Number(ps.allowanceThresholdPermanent) : 0,
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
  const monthDate = new Date(Date.UTC(year, month - 1, 1));
  const members = await getHoMembers();
  const existingSalaries = await prisma.managementSalary.findMany({
    where: { month: monthDate, memberId: { in: members.map((m) => m.id) } },
  });
  const existingMap = new Map(existingSalaries.map((s) => [s.memberId, s]));

  const rows = await Promise.all(
    members.map(async (member) => {
      const existing   = existingMap.get(member.id) ?? null;
      const alreadyProcessed = !!existing;
      const storedCfg  = normaliseUnique(member.HoPayrollConfig);
      const memberOv   = overridesMap[member.id] ?? {};

      const effectiveOverrides: HoPayrollOverrides = alreadyProcessed
        ? {
            basicSalary:          memberOv.basicSalary          ?? (Number(existing!.baseSalary) || (storedCfg ? Number(storedCfg.basicSalary) : (normaliseUnique(member.ManagementBaseSalary) ? Number(normaliseUnique(member.ManagementBaseSalary)!.baseSalary) : 0))),
            fixedAllowance:       memberOv.fixedAllowance        ?? (Number((existing as any).fixedAllowance)       || (storedCfg ? Number(storedCfg.fixedAllowance)      : 0)),
            vehicleAllowance:     memberOv.vehicleAllowance      ?? (Number((existing as any).vehicleAllowance)     || (storedCfg ? Number(storedCfg.vehicleAllowance)    : 0)),
            fuelAllowance:        memberOv.fuelAllowance         ?? (Number((existing as any).fuelAllowance)        || (storedCfg ? Number(storedCfg.fuelAllowance)       : 0)),
            channelOperation:     memberOv.channelOperation      ?? (Number((existing as any).channelOperation)     || (storedCfg ? Number(storedCfg.channelOperation)    : 0)),
            attendanceAllowance:  memberOv.attendanceAllowance   ?? (Number((existing as any).attendanceAllowance)  || (storedCfg ? Number(storedCfg.attendanceAllowance) : 0)),
            leavesTaken:          memberOv.leavesTaken           ?? Number((existing as any).leavesTaken            ?? 0),
            loanInstalments:      memberOv.loanInstalments       ?? Number((existing as any).loanInstalments        ?? 0),
            festivalAdvance:      memberOv.festivalAdvance       ?? Number((existing as any).festivalAdvance        ?? 0),
            merchandiseDeduction: memberOv.merchandiseDeduction  ?? Number((existing as any).merchandiseDeduction   ?? 0),
          }
        : {
            // Not yet processed — seed from stored config so the preview always shows the
            // configured salary on page refresh rather than 0 (when client overrides are empty).
            basicSalary:          memberOv.basicSalary          ?? (storedCfg ? Number(storedCfg.basicSalary)         : (normaliseUnique(member.ManagementBaseSalary) ? Number(normaliseUnique(member.ManagementBaseSalary)!.baseSalary) : 0)),
            fixedAllowance:       memberOv.fixedAllowance       ?? (storedCfg ? Number(storedCfg.fixedAllowance)      : 0),
            vehicleAllowance:     memberOv.vehicleAllowance     ?? (storedCfg ? Number(storedCfg.vehicleAllowance)    : 0),
            fuelAllowance:        memberOv.fuelAllowance        ?? (storedCfg ? Number(storedCfg.fuelAllowance)       : 0),
            channelOperation:     memberOv.channelOperation     ?? (storedCfg ? Number(storedCfg.channelOperation)    : 0),
            attendanceAllowance:  memberOv.attendanceAllowance  ?? (storedCfg ? Number(storedCfg.attendanceAllowance) : 0),
            leavesTaken:          memberOv.leavesTaken          ?? 0,
            loanInstalments:      memberOv.loanInstalments      ?? 0,
            festivalAdvance:      memberOv.festivalAdvance      ?? 0,
            merchandiseDeduction: memberOv.merchandiseDeduction ?? 0,
            ...memberOv, // client-side changes still take priority
          };

      const computed = await computeMemberPayroll(member, year, month, effectiveOverrides);
      const { totalDeducted: advanceDeducted, deductionDetails, outstandingRemaining, outstandingTypes } =
        await previewAdvanceDeductions(member.id, year, month, computed.baseNetPay);
      const netPay = computed.baseNetPay - advanceDeducted;

      const pb = computed.permBmBreakdown;
      const tenureMonth = computed.tenureMonth;

      return {
        memberId:    member.id,
        name:        member.nameWithInitials ?? member.empNo,
        empNo:       member.empNo,
        position:    member.position?.title ?? "—",
        primaryBranch: member.branches.find((b: any) => b.isPrimary)?.branch?.name ?? member.branches[0]?.branch?.name ?? "—",
        isManagementStaff: computed.isManagementStaff,
        isPermBmTrack:     computed.isPermBmTrack,
        receivesOrc:       !computed.isManagementStaff,
        baseSalaryConfigured: computed.hoConfig.basicSalary > 0 || (pb?.basicSalary ?? 0) > 0,

        // Fixed-salary HO fields
        basicSalary:         computed.hoBreakdown.basicSalary,
        fixedAllowance:      computed.hoBreakdown.fixedAllowance,
        vehicleAllowance:    computed.hoBreakdown.vehicleAllowance,
        fuelAllowance:       computed.hoBreakdown.fuelAllowance,
        channelOperation:    computed.hoBreakdown.channelOperation,
        attendanceAllowance: computed.hoBreakdown.attendanceAllowance,
        attendanceAllowanceHit: computed.hoBreakdown.attendanceAllowanceHit,
        leavesTaken:         effectiveOverrides.leavesTaken ?? 0,

        // Perm BM track breakdown
        tenureMonth,
        basicSalaryThresholdPct: pb ? pb.basicSalaryThresholdPct : null,
        basicSalaryHit:    pb?.basicSalaryHit    ?? null,
        volumeAchieved:    pb?.volumeAchieved    ?? computed.volumeAchieved,
        monthlyTarget:     pb?.monthlyTarget     ?? 0,
        achievementPct:    pb?.achievementPct    ?? 0,
        incentive75Hit:    pb?.incentive75Hit    ?? null,
        incentive75Earned: pb?.incentive75Earned ?? 0,
        incentive100Hit:   pb?.incentive100Hit   ?? null,
        incentive100Earned:pb?.incentive100Earned ?? 0,
        vehicleFuelHit:    pb?.vehicleFuelHit    ?? null,
        vehicleFuelEarned: pb?.vehicleFuelEarned ?? 0,

        orcEarned:          computed.orcEarned,
        personalCommission: computed.personalCommission,
        personalIncentive:  computed.personalIncentive,

        grossPay:     computed.totalGross,
        epfDeduction: computed.epfEmployee,
        epfEmployer:  computed.epfEmployer,
        etfEmployer:  computed.etfEmployer,
        loanInstalments:      effectiveOverrides.loanInstalments   ?? 0,
        festivalAdvance:      effectiveOverrides.festivalAdvance   ?? 0,
        merchandiseDeduction: effectiveOverrides.merchandiseDeduction ?? 0,

        advanceDeducted,
        advanceTypes: deductionDetails.map((d: any) => d.type),
        outstandingAdvanceRemaining: outstandingRemaining,
        outstandingAdvanceTypes: outstandingTypes,

        netPay,
        alreadyProcessed,
        status:  (existing as any)?.status ?? "PENDING",
        paidAt:  (existing as any)?.paidAt ?? null,
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
  const monthDate = new Date(Date.UTC(year, month - 1, 1));
  const members = await getHoMembers();
  const existingSalaries = await prisma.managementSalary.findMany({
    where: { month: monthDate, memberId: { in: members.map((m) => m.id) } },
  });
  const existingByMemberId = new Map(existingSalaries.map((s) => [s.memberId, s]));

  let processed = 0, skipped = 0;
  const errors: string[] = [];

  for (const member of members) {
    const existing = existingByMemberId.get(member.id) ?? null;
    if ((existing as any)?.status === "PAID") { skipped++; continue; }
    if (existing && !force && Number(existing.baseSalary) > 0) { skipped++; continue; }

    try {
      const memberOv = overridesMap[member.id] ?? {};
      const computed = await computeMemberPayroll(member, year, month, memberOv);

      await prisma.$transaction(async (tx) => {
        const { totalDeducted } = await applyAdvanceDeductions(tx, member.id, year, month, computed.baseNetPay);
        const finalNetPay = computed.baseNetPay - totalDeducted;

        const payload = buildSalaryPayload({
          hoConfig:       computed.hoConfig,
          hoBreakdown:    computed.hoBreakdown,
          personalCommission: computed.personalCommission,
          personalIncentive:  computed.personalIncentive,
          totalGross:     computed.totalGross,
          finalNetPay,
          totalDeducted,
          leavesTaken:    memberOv.leavesTaken ?? 0,
          epfEmployer:    computed.epfEmployer,
          etfEmployer:    computed.etfEmployer,
          permBm:         computed.permBmBreakdown,
        });

        const { _permBmFields, ...basePayload } = payload;
        await (tx.managementSalary.upsert as any)({
          where: { memberId_month: { memberId: member.id, month: monthDate } },
          create: { memberId: member.id, month: monthDate, status: "PENDING", ...basePayload, ..._permBmFields },
          update: { ...basePayload, ..._permBmFields },
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

// ─── rerunSingleMember ────────────────────────────────────────────────────────

export async function rerunSingleMember(
  memberId: number,
  year: number,
  month: number,
  overrides: HoPayrollOverrides = {},
) {
  const monthDate = new Date(Date.UTC(year, month - 1, 1));
  const members = await getHoMembers();
  const member = members.find((m) => m.id === memberId);
  if (!member) return { success: false, error: "Member not found" };

  const existing = await prisma.managementSalary.findUnique({
    where: { memberId_month: { memberId, month: monthDate } },
  });
  if ((existing as any)?.status === "PAID") return { success: false, error: "Cannot re-run a PAID payroll record" };

  try {
    const computed = await computeMemberPayroll(member, year, month, overrides);

    await prisma.$transaction(async (tx) => {
      const { totalDeducted } = await applyAdvanceDeductions(tx, member.id, year, month, computed.baseNetPay);
      const finalNetPay = computed.baseNetPay - totalDeducted;

      const payload = buildSalaryPayload({
        hoConfig:       computed.hoConfig,
        hoBreakdown:    computed.hoBreakdown,
        personalCommission: computed.personalCommission,
        personalIncentive:  computed.personalIncentive,
        totalGross:     computed.totalGross,
        finalNetPay,
        totalDeducted,
        leavesTaken:    overrides.leavesTaken ?? 0,
        epfEmployer:    computed.epfEmployer,
        etfEmployer:    computed.etfEmployer,
        permBm:         computed.permBmBreakdown,
      });

      const { _permBmFields, ...basePayload } = payload;
      await (tx.managementSalary.upsert as any)({
        where: { memberId_month: { memberId: member.id, month: monthDate } },
        create: { memberId: member.id, month: monthDate, status: "PENDING", ...basePayload, ..._permBmFields },
        update: { ...basePayload, ..._permBmFields },
      });
    });

    revalidatePath("/features/hr/ho-payroll");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
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

export async function getHoPayrollHistory(memberId: number) {
  return prisma.managementSalary.findMany({ where: { memberId }, orderBy: { month: "desc" } });
}

// ─── Legacy compat ────────────────────────────────────────────────────────────

export async function getManagementBaseSalaries() {
  const members = await getHoMembers();
  return members.map((m) => {
    const baseRow = normaliseUnique(m.ManagementBaseSalary);
    return {
      memberId: m.id,
      name: m.nameWithInitials ?? m.empNo,
      empNo: m.empNo,
      position: m.position?.title ?? "—",
      primaryBranch: m.branches.find((b: any) => b.isPrimary)?.branch?.name ?? m.branches[0]?.branch?.name ?? "—",
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