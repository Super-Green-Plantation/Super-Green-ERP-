// payroll-utils.ts

export type ActiveTeamCounts = {
  advisors: number;
  fms: number;
  bms: number;
};

export type PayrollBreakdown = {
  basicSalaryPermanent: number;
  monthlyTarget: number;
  volumeAchieved: number;

  incentiveEarned: number;
  incentivePartialEarned: number;
  vehicleEarned: number;
  teamActiveEarned: number;
  allowanceEarned: number; // kept for UI backward-compat; mirrors vehicleEarned
  orcEarned: number;
  commissionEarned: number;

  epfDeduction: number;
  epfEmployer: number;
  etfEmployer: number;

  incentiveHit: boolean;
  incentivePartialHit: boolean;
  vehicleHit: boolean;
  teamActiveHit: boolean;
  allowanceHit: boolean; // mirrors vehicleHit

  grossPay: number;
  netPay: number;
};

export type PositionTargetData = {
  targetAmount: number;
  bonusAmount: number;
  partialThreshold: number;
  partialBonus: number;
  vehicleThresholdPct: number;
  vehicleAmount: number;
  teamActiveThresholdPct: number;
  teamActiveAmount: number;
  minActiveAdvisors: number;
  minActiveFMs: number;
  minActiveBMs: number;
};

/**
 * Calculate a single member's payroll breakdown for a given month.
 *
 * ORC is NOT computed here — it must be pre-computed by summing the
 * member's Commission records of type UPLINE for the month and passed
 * in as `orcEarned`. This keeps payroll-utils pure and consistent with
 * how processCommissions already stores ORC.
 */
export function calculatePayroll(
  salary: {
    basicSalaryPermanent: number;
    basicSalaryProbation: number;
    monthlyTarget: number;
    incentiveAmount: number;
    allowanceAmount: number;
    epfEmployee: number;
    epfEmployer: number;
    etfEmployer: number;
    allowanceThresholdPermanent: number;
    allowanceThresholdProbation: number;
    incentivePartialThreshold?: number; // fraction, e.g. 0.75
    incentivePartialAmount?: number;
    vehicleThresholdPct?: number;       // fraction, e.g. 0.50
    vehicleAmount?: number;
    teamActiveThresholdPct?: number;
    teamActiveAmount?: number;
    minActiveAdvisors?: number;
    minActiveFMs?: number;
    minActiveBMs?: number;
  },
  commissionEarned: number = 0,
  memberStatus: "PROBATION" | "PERMANENT" | "MANAGEMENT",
  volumeAchieved: number,
  orcEarned: number = 0,            // pre-summed UPLINE commissions for the month
  activeTeamCounts?: ActiveTeamCounts,
  positionTarget?: PositionTargetData,
): PayrollBreakdown {
  const safe = (n: any): number => Number(n ?? 0);

  const isPermanent = memberStatus === "PERMANENT";
  const isProbation = memberStatus === "PROBATION";

  let basicSalary = 0;
  let monthlyTarget = 0;
  let incentiveEarned = 0;
  let incentivePartialEarned = 0;
  let vehicleEarned = 0;
  let teamActiveEarned = 0;

  let incentiveHit = false;
  let incentivePartialHit = false;
  let vehicleHit = false;
  let teamActiveHit = false;

  if (isProbation && positionTarget) {
    // ── Probation path ── target/bonus from PositionTarget row
    monthlyTarget = safe(positionTarget.targetAmount);

    // Full incentive at 100% of target
    incentiveHit = volumeAchieved >= monthlyTarget;
    if (incentiveHit) {
      incentiveEarned = safe(positionTarget.bonusAmount);
    } else {
      // Partial incentive at absolute threshold (not a percentage)
      const partialThreshold = safe(positionTarget.partialThreshold);
      if (partialThreshold > 0 && volumeAchieved >= partialThreshold) {
        incentivePartialHit = true;
        incentivePartialEarned = safe(positionTarget.partialBonus);
      }
    }

    // Vehicle/fuel allowance
    const vehicleThreshold = monthlyTarget * safe(positionTarget.vehicleThresholdPct);
    vehicleHit = vehicleThreshold > 0 && volumeAchieved >= vehicleThreshold;
    if (vehicleHit) vehicleEarned = safe(positionTarget.vehicleAmount);

    // Team active bonus — volume threshold AND headcount both required
    const teamThreshold = monthlyTarget * safe(positionTarget.teamActiveThresholdPct);
    const volumeOk = teamThreshold > 0 && volumeAchieved >= teamThreshold;
    if (volumeOk && activeTeamCounts) {
      const headcountOk =
        activeTeamCounts.advisors >= safe(positionTarget.minActiveAdvisors) &&
        activeTeamCounts.fms     >= safe(positionTarget.minActiveFMs) &&
        activeTeamCounts.bms     >= safe(positionTarget.minActiveBMs);
      if (headcountOk) {
        teamActiveHit = true;
        teamActiveEarned = safe(positionTarget.teamActiveAmount);
      }
    }

  } else {
    // ── Permanent / Management path ── data from PositionSalary
    basicSalary = isPermanent
      ? safe(salary.basicSalaryPermanent)
      : safe(salary.basicSalaryProbation); // management uses basicSalaryProbation field as their base
    monthlyTarget = safe(salary.monthlyTarget);

    // Full incentive at 100% of target
    incentiveHit = monthlyTarget > 0 && volumeAchieved >= monthlyTarget;
    if (incentiveHit) {
      incentiveEarned = safe(salary.incentiveAmount);
    } else {
      // Partial incentive at configured threshold percentage (e.g. 0.75)
      const partialPct = safe(salary.incentivePartialThreshold);
      const partialThreshold = monthlyTarget * partialPct;
      if (partialPct > 0 && partialThreshold > 0 && volumeAchieved >= partialThreshold) {
        incentivePartialHit = true;
        incentivePartialEarned = safe(salary.incentivePartialAmount);
      }
    }

    // Vehicle/fuel allowance — vehicleThresholdPct takes priority when configured,
    // otherwise falls back to legacy allowanceThresholdPermanent field.
    const vehicleThresholdPct = safe(salary.vehicleThresholdPct);
    const legacyThresholdPct = safe(salary.allowanceThresholdPermanent);
    const effectiveVehiclePct = vehicleThresholdPct > 0 ? vehicleThresholdPct : legacyThresholdPct;
    const vehicleThreshold = monthlyTarget * effectiveVehiclePct;

    vehicleHit = vehicleThreshold > 0 && volumeAchieved >= vehicleThreshold;
    if (vehicleHit) {
      // vehicleAmount takes priority over legacy allowanceAmount
      const vehicleAmt = safe(salary.vehicleAmount);
      const legacyAmt = safe(salary.allowanceAmount);
      vehicleEarned = vehicleAmt > 0 ? vehicleAmt : legacyAmt;
    }

    // Team active bonus
    const teamThresholdPct = safe(salary.teamActiveThresholdPct);
    const teamThreshold = monthlyTarget * teamThresholdPct;
    const volumeOk = teamThresholdPct > 0 && volumeAchieved >= teamThreshold;
    if (volumeOk && activeTeamCounts) {
      const headcountOk =
        activeTeamCounts.advisors >= safe(salary.minActiveAdvisors) &&
        activeTeamCounts.fms     >= safe(salary.minActiveFMs) &&
        activeTeamCounts.bms     >= safe(salary.minActiveBMs);
      if (headcountOk) {
        teamActiveHit = true;
        teamActiveEarned = safe(salary.teamActiveAmount);
      }
    }
  }

  // allowance* fields mirror vehicle* for UI backward-compatibility
  const allowanceEarned = vehicleEarned;
  const allowanceHit = vehicleHit;

  // EPF / ETF — always on basic salary only
  const epfDeduction      = basicSalary * safe(salary.epfEmployee);
  const epfEmployerAmount = basicSalary * safe(salary.epfEmployer);
  const etfEmployerAmount = basicSalary * safe(salary.etfEmployer);

  const grossPay =
    basicSalary +
    incentiveEarned +
    incentivePartialEarned +
    vehicleEarned +
    teamActiveEarned +
    safe(orcEarned) +
    safe(commissionEarned);

  const netPay = grossPay - epfDeduction;

  return {
    basicSalaryPermanent: basicSalary,
    monthlyTarget,
    volumeAchieved,

    incentiveEarned,
    incentivePartialEarned,
    vehicleEarned,
    teamActiveEarned,
    allowanceEarned,
    orcEarned: safe(orcEarned),
    commissionEarned: safe(commissionEarned),

    epfDeduction,
    epfEmployer: epfEmployerAmount,
    etfEmployer: etfEmployerAmount,

    incentiveHit,
    incentivePartialHit,
    vehicleHit,
    teamActiveHit,
    allowanceHit,

    grossPay,
    netPay,
  };
}