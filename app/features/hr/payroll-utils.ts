// payroll-utils.ts
// Decoupled dual-track payroll engine.
// HEAD_OFFICE — static corporate compensation with allowances & statutory deductions.
// MARKETING   — dynamic field incentives driven by target/achievement data.

// ─── Shared types ─────────────────────────────────────────────────────────────

export type PayrollCategory = "HEAD_OFFICE" | "MARKETING";

export type ActiveTeamCounts = {
  advisors: number;
  fms: number;
  bms: number;
};

// ─── HEAD OFFICE types ────────────────────────────────────────────────────────

/**
 * Input configuration for the Head Office track.
 * Sourced from ManagementBaseSalary / HoPayrollConfig per member.
 */
export type HoSalaryConfig = {
  basicSalary: number;
  fixedAllowance: number;
  vehicleAllowance: number;        // flat LKR; from PositionSalary or per-member override
  fuelAllowance: number;           // flat LKR; configured per member
  channelOperation: number;        // channel operation & incentive bonus
  attendanceAllowance: number;     // awarded on perfect (≤ 1.5 leaves) attendance
  // ORC is pre-computed from Commission records and passed in externally.

  // Deductions
  loanInstalments: number;
  festivalAdvance: number;
  merchandiseDeduction: number;

  // Statutory rates
  epfEmployeeRate: number;         // default 0.08
  epfEmployerRate: number;         // default 0.12
  etfEmployerRate: number;         // default 0.03

  // Leave policy
  maxLeavesWithoutDeduction: number; // default 1.5
};

export type HoPayrollBreakdown = {
  // Earnings
  basicSalary: number;
  fixedAllowance: number;
  vehicleAllowance: number;        // flat LKR amount
  fuelAllowance: number;           // flat LKR amount
  channelOperation: number;
  incentive: number;               // channelOperation alias kept for schema compat
  attendanceAllowance: number;
  attendanceAllowanceHit: boolean; // true = leaves ≤ maxLeavesWithoutDeduction
  orcEarned: number;
  grossPay: number;

  // Deductions
  loanInstalments: number;
  festivalAdvance: number;
  merchandiseDeduction: number;
  epfEmployee: number;             // deducted from net pay
  totalDeductions: number;

  // Employer statutory (NOT deducted from net pay — for payslip display only)
  epfEmployer: number;
  etfEmployer: number;

  // Leave meta
  leavesTaken: number;

  netPay: number;
};

// ─── MARKETING types ──────────────────────────────────────────────────────────

/**
 * Input configuration for the Marketing track.
 * Sourced from PositionTarget row resolved for the member's tenure month.
 */
export type MarketingSalaryConfig = {
  // Target context
  targetAmount: number;
  tenureMonthCount: number;        // months since join — determines hurdle tier

  // Target budget salary — FA-only (Position.targetBudgetAmount > 0).
  // When targetBudgetAmount = 0 the entire block is skipped (TL, BM, RM, etc.).
  targetBudgetAmount: number;      // from Position.targetBudgetAmount; 0 = no target budget
  targetBudgetCeiling: number;     // max payout cap (30 000 for FA)
  targetBudgetMinPct: number;      // minimum achievement to unlock (default 0.25 = 25%)

  // Hurdle thresholds (fractions, e.g. 0.066 / 0.20)
  hurdleRateProbation: number;     // months 1–3 (default 0.066 = 6.6%)
  hurdleRatePermanent: number;     // months 4+  (default 0.20 = 20.0%)

  // Two-part incentive (mutually exclusive by position type):
  //   basicIncentiveAmount — FA partial: 20K at hurdle. 0 for non-FA.
  //   fullIncentiveAmount  — Non-FA full: bonusAmount at threshold. 0 for FA.
  basicIncentiveAmount: number;    // partialBonus (FA only, e.g. 20 000)
  fullIncentiveAmount: number;     // bonusAmount  (non-FA only, e.g. 22K TL / 30K BM)
  // Threshold to unlock fullIncentive. Defaults to 1.0 (100%) for normal
  // probation months. For after-6-month rows this is after6MonthIncentivePct
  // (e.g. 0.45 for TL), allowing the bonus to fire below 100% of target.
  fullIncentiveThresholdPct: number;

  // Excess commission
  excessCommissionRate: number;    // fraction applied to surplus volume (default 0.005 = 0.5%)


  // Additional sales commissions (pre-computed ORC + team-tier bonuses passed in externally)
  vehicleThresholdPct: number;
  vehicleAmount: number;
  teamActiveThresholdPct: number;
  teamActiveAmount: number;
  minActiveAdvisors: number;
  minActiveFMs: number;
  minActiveBMs: number;
  fullTargetBonusAmount : number;
};

export type MarketingPayrollBreakdown = {
  // Performance context (snapshotted for the record)
  targetAmount: number;
  achievedAmount: number;
  achievementPct: number;
  tenureMonthCount: number;

  // Dynamic earnings — two-part FA incentive
  targetBudgetSalary: number;      // FA-only: 30K × achievementPct (0 if no target budget)
  basicIncentive: number;          // FA partial incentive (0 for non-FA)
  fullIncentive: number;           // non-FA incentive — bonusAmount at 100% (0 for FA)
  fullIncentiveHit: boolean;
  fullTargetBonus: number;         // legacy — always 0
  fullTargetBonusHit: boolean;     // legacy — always false
  excessCommission: number;        // 0.5% on surplus volume above 100%
  vehicleEarned: number;
  teamActiveEarned: number;
  otherSalesCommission: number;    // pre-computed PERSONAL commission passed in
  orcEarned: number;               // pre-computed UPLINE commission passed in

  // Status flags
  targetBudgetHit: boolean;        // achievement ≥ 25%
  basicIncentiveHit: boolean;      // achievement ≥ tenure hurdle
  vehicleHit: boolean;
  teamActiveHit: boolean;

  grossPay: number;
  netPay: number;                  // no EPF for field marketing track per plan
};

// ─── PositionTarget adapter (shared with both tracks) ─────────────────────────

export type PositionTargetData = {
  targetAmount: number;
  bonusAmount: number;
  partialThresholdPct: number;
  partialBonus: number;
  vehicleThresholdPct: number;
  vehicleAmount: number;
  teamActiveThresholdPct: number;
  teamActiveAmount: number;
  minActiveAdvisors: number;
  minActiveFMs: number;
  minActiveBMs: number;
};

// ─── Legacy unified type (kept for backward-compat with existing UI / export) ──

export type PayrollBreakdown = {
  basicSalaryPermanent: number;
  monthlyTarget: number;
  volumeAchieved: number;

  fullIncentive: number;           // full incentive (non-FA: bonusAmount at 100%)
  fullIncentiveHit: boolean;
  fullTargetBonus: number;         // legacy — always 0
  fullTargetBonusHit: boolean;
  incentivePartialEarned: number;
  vehicleEarned: number;
  teamActiveEarned: number;
  allowanceEarned: number;
  orcEarned: number;
  commissionEarned: number;
  targetBudgetSalary: number;
  excessCommission: number;

  epfDeduction: number;
  epfEmployer: number;
  etfEmployer: number;

  incentiveHit: boolean;
  incentivePartialHit: boolean;
  vehicleHit: boolean;
  teamActiveHit: boolean;
  allowanceHit: boolean;

  // Head-office extended fields (zero on marketing rows)
  fixedAllowance: number;
  fuelAllowance: number;
  channelOperation: number;
  attendanceAllowance: number;
  loanInstalments: number;
  festivalAdvance: number;
  merchandiseDeduction: number;

  grossPay: number;
  netPay: number;
  incentiveEarned:number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safe = (n: unknown): number => (isFinite(Number(n)) ? Number(n) : 0);

// ─── HEAD OFFICE engine ───────────────────────────────────────────────────────

/**
 * Pure calculation for the Head Office / Management track.
 *
 * EPF is computed on basicSalary only.
 * ORC must be pre-summed from Commission[type=UPLINE] for the month.
 * Advance deductions are applied downstream (in the action layer).
 */
export function calculateHoPayroll(
  config: HoSalaryConfig,
  leavesTaken: number,
  orcEarned: number = 0,
): HoPayrollBreakdown {
  const c = config;
  const leaves = safe(leavesTaken);
  const orc = safe(orcEarned);

  const basic = safe(c.basicSalary);

  // Vehicle and fuel are flat LKR amounts from config
  const vehicleAllowance = safe(c.vehicleAllowance);
  const fuelAllowance = safe(c.fuelAllowance);

  // Attendance allowance: awarded when leaves ≤ threshold
  const maxLeaves = safe(c.maxLeavesWithoutDeduction) || 1.5;
  const attendanceAllowanceHit = leaves <= maxLeaves;
  const attendanceAllowance = attendanceAllowanceHit ? safe(c.attendanceAllowance) : 0;

  // Gross earnings
  const grossPay =
    basic +
    safe(c.fixedAllowance) +
    vehicleAllowance +
    fuelAllowance +
    safe(c.channelOperation) +
    attendanceAllowance +
    orc;

  // EPF deducted from basic salary only
  const epfEmployee = basic * safe(c.epfEmployeeRate);

  // Other deductions
  const loanInstalments = safe(c.loanInstalments);
  const festivalAdvance = safe(c.festivalAdvance);
  const merchandiseDeduction = safe(c.merchandiseDeduction);
  const totalDeductions = epfEmployee + loanInstalments + festivalAdvance + merchandiseDeduction;

  // Employer statutory (non-deductible from netPay, reported separately)
  const epfEmployer = basic * safe(c.epfEmployerRate);
  const etfEmployer = basic * safe(c.etfEmployerRate);

  const netPay = grossPay - totalDeductions;

  return {
    basicSalary: basic,
    fixedAllowance: safe(c.fixedAllowance),
    vehicleAllowance,
    fuelAllowance,
    channelOperation: safe(c.channelOperation),
    incentive: safe(c.channelOperation), // alias
    attendanceAllowance,
    attendanceAllowanceHit,
    orcEarned: orc,
    grossPay,
    loanInstalments,
    festivalAdvance,
    merchandiseDeduction,
    epfEmployee,
    totalDeductions,
    epfEmployer,
    etfEmployer,
    leavesTaken: leaves,
    netPay,
  };
}

// ─── MARKETING engine ─────────────────────────────────────────────────────────

/**
 * Pure calculation for the Marketing / Field Advisor track.
 *
 * Target Budget Salary: scales linearly from 25%–100% achievement, capped
 * at `targetBudgetCeiling` (30 000 LKR). No EPF applies on this track.
 *
 * Basic Incentive: binary. Hurdle is 6.6% for first 3 months, 20.0% after.
 *
 * Excess Commission: 0.5% on volume above the 100% target baseline.
 *
 * ORC and personalCommission are pre-computed and passed in.
 */
export function calculateMarketingPayroll(
  config: MarketingSalaryConfig,
  volumeAchieved: number,
  personalCommission: number = 0,
  orcEarned: number = 0,
  activeTeamCounts?: ActiveTeamCounts,
): MarketingPayrollBreakdown {
  const target = safe(config.targetAmount);
  const vol = safe(volumeAchieved);
  const orc = safe(orcEarned);
  const personalComm = safe(personalCommission);

  const achievementPct = target > 0 ? vol / target : 0;

  // ── Target Budget Salary (FA-only, 0–30K, unlocks at 25%) ──────────────
  // Gate: Position.targetBudgetAmount must be > 0. Only FA has this set (1,500,000).
  // TL, BM, RM and all other positions have targetBudgetAmount = 0 → always 0.
  const hasBudget = safe(config.targetBudgetAmount) > 0;
  const ceiling = safe(config.targetBudgetCeiling) || 30_000;
  const minPct = safe(config.targetBudgetMinPct) || 0.25;
  const targetBudgetHit = hasBudget && target > 0 && achievementPct >= minPct;
  const targetBudgetSalary = targetBudgetHit
    ? Math.min(ceiling, ceiling * Math.min(achievementPct, 1))
    : 0;

  // ── Basic Incentive — Part 1: fixed 20K partial (tenure-adjusted hurdle) ──
  const tenure = safe(config.tenureMonthCount);
  const hurdleRate =
    tenure <= 3
      ? (safe(config.hurdleRateProbation) || 0.066)
      : (safe(config.hurdleRatePermanent) || 0.20);
  const basicIncentiveHurdle = target * hurdleRate;
  // basicIncentiveHit requires BOTH volume threshold AND a configured amount.
  // Without the amount check, TL/BM/RM (basicIncentiveAmount=0) would show
  // incentiveHit=true in the UI even though they earn nothing from this tier.
  const basicIncentiveHit = safe(config.basicIncentiveAmount) > 0
    && target > 0
    && vol >= basicIncentiveHurdle;
  const basicIncentive = basicIncentiveHit ? safe(config.basicIncentiveAmount) : 0;

  // ── Full incentive — non-FA positions (bonusAmount at threshold of target) ──
  // FA: fullIncentiveAmount = 0 (bonus comes from target budget salary instead).
  // TL/BM/RM probation months: threshold = 1.0 (must hit 100%).
  // After-6-month rows: threshold = after6MonthIncentivePct (e.g. 0.45 for TL).
  const fullIncentiveAmount = safe(config.fullIncentiveAmount);
  const fullIncentiveThreshold = safe(config.fullIncentiveThresholdPct) > 0
    ? safe(config.fullIncentiveThresholdPct)
    : 1.0;
  const fullIncentiveHit = fullIncentiveAmount > 0 && target > 0 && achievementPct >= fullIncentiveThreshold;
  const fullIncentive = fullIncentiveHit ? fullIncentiveAmount : 0;
  const fullTargetBonus = 0;        // legacy — always 0
  const fullTargetBonusHit = false; // legacy — always false

  // ── Excess Commission (0.5% on surplus above 100%) ───────────────────────
  // Use ?? not || — excessRate=0 means no excess commission for this position.
  // || would treat 0 as falsy and incorrectly apply the 0.5% FA rate to all roles.
  const excessRate = config.excessCommissionRate ?? 0;
  const surplus = Math.max(0, vol - target);
  const excessCommission = excessRate > 0 && target > 0 && surplus > 0 ? surplus * excessRate : 0;

  // ── Vehicle Allowance ─────────────────────────────────────────────────────
  const vehicleThreshold = target * safe(config.vehicleThresholdPct);
  const vehicleHit = vehicleThreshold > 0 && vol >= vehicleThreshold;
  const vehicleEarned = vehicleHit ? safe(config.vehicleAmount) : 0;

  // ── Team Active Allowance ─────────────────────────────────────────────────
  const teamThreshold = target * safe(config.teamActiveThresholdPct);
  const volumeOk = teamThreshold > 0 && vol >= teamThreshold;
  let teamActiveHit = false;
  let teamActiveEarned = 0;
  if (volumeOk && activeTeamCounts) {
    const headcountOk =
      activeTeamCounts.advisors >= safe(config.minActiveAdvisors) &&
      activeTeamCounts.fms >= safe(config.minActiveFMs) &&
      activeTeamCounts.bms >= safe(config.minActiveBMs);
    if (headcountOk) {
      teamActiveHit = true;
      teamActiveEarned = safe(config.teamActiveAmount);
    }
  }

  const grossPay =
    targetBudgetSalary +
    basicIncentive +
    fullIncentive +
    excessCommission +
    vehicleEarned +
    teamActiveEarned +
    personalComm +
    orc;

  // No EPF on marketing track per implementation plan
  const netPay = grossPay;

  return {
    targetAmount: target,
    achievedAmount: vol,
    achievementPct,
    tenureMonthCount: tenure,

    targetBudgetSalary,
    basicIncentive,
    fullIncentive,
    fullIncentiveHit,
    fullTargetBonus,      // always 0 — legacy compat
    fullTargetBonusHit,   // always false — legacy compat
    excessCommission,
    vehicleEarned,
    teamActiveEarned,
    otherSalesCommission: personalComm,
    orcEarned: orc,

    targetBudgetHit,
    basicIncentiveHit,
    vehicleHit,
    teamActiveHit,

    grossPay,
    netPay,
  };
}

// ─── Unified facade (backward-compat entry point) ────────────────────────────

/**
 * Routing facade that dispatches to the correct track based on `payrollCategory`.
 * Returns a `PayrollBreakdown` shaped consistently for existing UI and export code.
 *
 * Pass `payrollCategory: "HEAD_OFFICE"` for management/corporate staff.
 * Pass `payrollCategory: "MARKETING"` for field advisors and marketing roles.
 *
 * ORC must be pre-computed from Commission[type=UPLINE] in both cases.
 */
export function calculatePayroll(
  payrollCategory: PayrollCategory,
  // Marketing inputs
  mktConfig: {
    targetAmount: number;
    tenureMonthCount: number;
    targetBudgetAmount?: number;
    targetBudgetCeiling?: number;
    targetBudgetMinPct?: number;
    basicIncentiveAmount?: number;
    fullIncentiveAmount?: number;
    fullIncentiveThresholdPct?: number;
    hurdleRateProbation?: number;
    hurdleRatePermanent?: number;
    excessCommissionRate?: number;
    vehicleThresholdPct?: number;
    vehicleAmount?: number;
    teamActiveThresholdPct?: number;
    teamActiveAmount?: number;
    minActiveAdvisors?: number;
    minActiveFMs?: number;
    minActiveBMs?: number;
  } | null,
  // Head office inputs
  hoConfig: HoSalaryConfig | null,
  // Shared inputs
  volumeAchieved: number,
  personalCommission: number = 0,
  orcEarned: number = 0,
  leavesTaken: number = 0,
  activeTeamCounts?: ActiveTeamCounts,
): PayrollBreakdown {
  if (payrollCategory === "HEAD_OFFICE") {
    if (!hoConfig) throw new Error("calculatePayroll: hoConfig required for HEAD_OFFICE track");

    const bd = calculateHoPayroll(hoConfig, leavesTaken, orcEarned);

    return {
      basicSalaryPermanent: bd.basicSalary,
      monthlyTarget: 0,
      volumeAchieved,

      incentiveEarned: bd.channelOperation,
      fullIncentive: 0,
      fullIncentiveHit: false,
      fullTargetBonus: 0,
      fullTargetBonusHit: false,
      incentivePartialEarned: 0,
      vehicleEarned: bd.vehicleAllowance,
      teamActiveEarned: 0,
      allowanceEarned: bd.vehicleAllowance,
      orcEarned: bd.orcEarned,
      commissionEarned: personalCommission,
      targetBudgetSalary: 0,
      excessCommission: 0,

      epfDeduction: bd.epfEmployee,
      epfEmployer: bd.epfEmployer,
      etfEmployer: bd.etfEmployer,

      incentiveHit: false,
      incentivePartialHit: false,
      vehicleHit: false,
      teamActiveHit: false,
      allowanceHit: false,

      fixedAllowance: bd.fixedAllowance,
      fuelAllowance: bd.fuelAllowance,
      channelOperation: bd.channelOperation,
      attendanceAllowance: bd.attendanceAllowance,
      loanInstalments: bd.loanInstalments,
      festivalAdvance: bd.festivalAdvance,
      merchandiseDeduction: bd.merchandiseDeduction,

      grossPay: bd.grossPay,
      netPay: bd.netPay,
    };
  }

  // MARKETING track
  if (!mktConfig) throw new Error("calculatePayroll: mktConfig required for MARKETING track");

  const fullConfig: MarketingSalaryConfig = {
    targetAmount: mktConfig.targetAmount,
    tenureMonthCount: mktConfig.tenureMonthCount,
    targetBudgetAmount: mktConfig.targetBudgetAmount ?? 0,
    targetBudgetCeiling: mktConfig.targetBudgetCeiling ?? 30_000,
    targetBudgetMinPct: mktConfig.targetBudgetMinPct ?? 0.25,
    basicIncentiveAmount: mktConfig.basicIncentiveAmount ?? 0,
    fullIncentiveAmount: mktConfig.fullIncentiveAmount ?? 0,
    fullIncentiveThresholdPct: mktConfig.fullIncentiveThresholdPct ?? 0,
    fullTargetBonusAmount: 0,
    hurdleRateProbation: mktConfig.hurdleRateProbation ?? 0.066,
    hurdleRatePermanent: mktConfig.hurdleRatePermanent ?? 0.20,
    excessCommissionRate: mktConfig.excessCommissionRate ?? 0.005,
    vehicleThresholdPct: mktConfig.vehicleThresholdPct ?? 0,
    vehicleAmount: mktConfig.vehicleAmount ?? 0,
    teamActiveThresholdPct: mktConfig.teamActiveThresholdPct ?? 0,
    teamActiveAmount: mktConfig.teamActiveAmount ?? 0,
    minActiveAdvisors: mktConfig.minActiveAdvisors ?? 0,
    minActiveFMs: mktConfig.minActiveFMs ?? 0,
    minActiveBMs: mktConfig.minActiveBMs ?? 0,
  };

  const bd = calculateMarketingPayroll(
    fullConfig,
    volumeAchieved,
    personalCommission,
    orcEarned,
    activeTeamCounts,
  );

  return {
    basicSalaryPermanent: 0,
    monthlyTarget: bd.targetAmount,
    volumeAchieved: bd.achievedAmount,

    incentiveEarned: bd.basicIncentive,
    fullIncentive: bd.fullIncentive,
    fullIncentiveHit: bd.fullIncentiveHit,
    fullTargetBonus: 0,
    fullTargetBonusHit: false,
    incentivePartialEarned: 0,
    vehicleEarned: bd.vehicleEarned,
    teamActiveEarned: bd.teamActiveEarned,
    allowanceEarned: bd.vehicleEarned,
    orcEarned: bd.orcEarned,
    commissionEarned: bd.otherSalesCommission,
    targetBudgetSalary: bd.targetBudgetSalary,
    excessCommission: bd.excessCommission,

    epfDeduction: 0,
    epfEmployer: 0,
    etfEmployer: 0,

    incentiveHit: bd.basicIncentiveHit,
    incentivePartialHit: false,
    vehicleHit: bd.vehicleHit,
    teamActiveHit: bd.teamActiveHit,
    allowanceHit: bd.vehicleHit,

    fixedAllowance: 0,
    fuelAllowance: 0,
    channelOperation: 0,
    attendanceAllowance: 0,
    loanInstalments: 0,
    festivalAdvance: 0,
    merchandiseDeduction: 0,

    grossPay: bd.grossPay,
    netPay: bd.netPay,
  };
}
// ─── PERMANENT BM / RM / ZM SALARY CALC ─────────────────────────────────────

/**
 * Basic salary achievement thresholds by tenure month.
 * Month 1–6 have stepped requirements; month 7+ requires 100%.
 * Same ramp applies to all permanent BM/RM/ZM/AGM ranks.
 */
const BASIC_SALARY_THRESHOLDS: Record<number, number> = {
  1: 0.25,
  2: 0.35,
  3: 0.45,
  4: 0.60,
  5: 0.70,
  6: 0.80,
};
const BASIC_SALARY_THRESHOLD_AFTER_6 = 1.00;

export function getBasicSalaryThreshold(tenureMonth: number): number {
  if (tenureMonth <= 0) return BASIC_SALARY_THRESHOLDS[1];
  if (tenureMonth >= 7) return BASIC_SALARY_THRESHOLD_AFTER_6;
  return BASIC_SALARY_THRESHOLDS[tenureMonth] ?? BASIC_SALARY_THRESHOLD_AFTER_6;
}

export type PermBmSalaryConfig = {
  // From PositionSalary
  basicSalary: number;           // basicSalaryPermanent
  monthlyTarget: number;         // PositionSalary.monthlyTarget
  incentive75Amount: number;     // incentivePartialAmount (at 75% target)
  incentive100Amount: number;    // incentiveAmount (at 100% target)
  vehicleFuelAmount: number;     // allowanceAmount (vehicle+fuel combined)
  vehicleFuelThresholdPct: number; // allowanceThresholdPermanent (0.50)
  vehicleFuelUnconditional: boolean; // true for RM/ZM/AGM months 1–4
  // Statutory
  epfEmployeeRate: number;
  epfEmployerRate: number;
  etfEmployerRate: number;
};

export type PermBmPayrollBreakdown = {
  // Inputs
  volumeAchieved: number;
  monthlyTarget: number;
  achievementPct: number;
  tenureMonth: number;
  basicSalaryThresholdPct: number;

  // Basic salary
  basicSalaryHit: boolean;
  basicSalary: number;           // 0 if threshold not met

  // Incentives — mutually exclusive: 100% wins over 75%
  incentive100Hit: boolean;
  incentive100Earned: number;
  incentive75Hit: boolean;       // only true when 75% ≤ achievement < 100%
  incentive75Earned: number;

  // Vehicle + fuel (combined)
  vehicleFuelHit: boolean;
  vehicleFuelEarned: number;

  // ORC passed in externally
  orcEarned: number;

  // Statutory (EPF on basic only)
  epfEmployee: number;
  epfEmployer: number;
  etfEmployer: number;

  grossPay: number;
  totalDeductions: number;
  netPay: number;
};

/**
 * Calculates salary for permanent BM / RM / ZM / AGM (HO track, volume-gated).
 *
 * Rules:
 *  - Basic salary: released when achievementPct >= getBasicSalaryThreshold(tenureMonth)
 *  - 100% incentive: achievementPct >= 1.0  → earns incentive100Amount ONLY
 *  - 75% incentive:  achievementPct >= 0.75 AND < 1.0 → earns incentive75Amount ONLY
 *    (100% and 75% are mutually exclusive — 100% winner takes all)
 *  - Vehicle+Fuel: achievementPct >= vehicleFuelThresholdPct (0.50),
 *    OR unconditional when vehicleFuelUnconditional=true (RM/ZM/AGM, months 1–4)
 *  - EPF computed on basic salary only (same as HO fixed-salary track)
 *  - ORC passed in pre-computed (from Commission rows, type=UPLINE)
 *  - No personal commission on this track (commission is via ORC hierarchy)
 */
export function calculatePermBmPayroll(
  config: PermBmSalaryConfig,
  volumeAchieved: number,
  tenureMonth: number,
  orcEarned: number = 0,
): PermBmPayrollBreakdown {
  const vol = safe(volumeAchieved);
  const target = safe(config.monthlyTarget);
  const orc = safe(orcEarned);
  const achievementPct = target > 0 ? vol / target : 0;

  // ── Basic salary ───────────────────────────────────────────────────────────
  const basicThresholdPct = getBasicSalaryThreshold(tenureMonth);
  const basicSalaryHit = target > 0 && achievementPct >= basicThresholdPct;
  const basicSalary = basicSalaryHit ? safe(config.basicSalary) : 0;

  // ── Incentives (mutually exclusive) ───────────────────────────────────────
  const incentive100Hit = target > 0 && achievementPct >= 1.0;
  const incentive100Earned = incentive100Hit ? safe(config.incentive100Amount) : 0;

  // 75% tier: only when achievement >= 75% AND strictly < 100%
  const incentive75Hit = !incentive100Hit && target > 0 && achievementPct >= 0.75;
  const incentive75Earned = incentive75Hit ? safe(config.incentive75Amount) : 0;

  // ── Vehicle + fuel ─────────────────────────────────────────────────────────
  const vehicleFuelHit =
    config.vehicleFuelUnconditional ||
    (target > 0 && achievementPct >= safe(config.vehicleFuelThresholdPct));
  const vehicleFuelEarned = vehicleFuelHit ? safe(config.vehicleFuelAmount) : 0;

  // ── Gross ──────────────────────────────────────────────────────────────────
  const grossPay =
    basicSalary +
    incentive75Earned +
    incentive100Earned +
    vehicleFuelEarned +
    orc;

  // ── Statutory (EPF on basic salary only) ──────────────────────────────────
  const epfEmployee = basicSalary * safe(config.epfEmployeeRate);
  const epfEmployer = basicSalary * safe(config.epfEmployerRate);
  const etfEmployer = basicSalary * safe(config.etfEmployerRate);

  const totalDeductions = epfEmployee;
  const netPay = grossPay - totalDeductions;

  return {
    volumeAchieved: vol,
    monthlyTarget: target,
    achievementPct,
    tenureMonth,
    basicSalaryThresholdPct: basicThresholdPct,
    basicSalaryHit,
    basicSalary,
    incentive100Hit,
    incentive100Earned,
    incentive75Hit,
    incentive75Earned,
    vehicleFuelHit,
    vehicleFuelEarned,
    orcEarned: orc,
    epfEmployee,
    epfEmployer,
    etfEmployer,
    grossPay,
    totalDeductions,
    netPay,
  };
}