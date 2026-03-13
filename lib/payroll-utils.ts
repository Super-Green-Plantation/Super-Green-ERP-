type PayrollBreakdown = {
  basicSalary: number;
  monthlyTarget: number;
  volumeAchieved: number;
  incentiveEarned: number;
  allowanceEarned: number;
  orcEarned: number;
  commissionEarned: number;
  epfDeduction: number;   // employee pays this (deducted from gross)
  epfEmployer: number;    // employer pays this (not deducted, shown for info)
  etfEmployer: number;    // employer pays this (not deducted, shown for info)
  incentiveHit: boolean;
  allowanceHit: boolean;
  grossPay: number;       // basic + incentive + allowance + orc + commission
  netPay: number;         // grossPay - epfDeduction
};

// ─── calculatePayroll ─────────────────────────────────────────────────────────
/**
 * Pure calculation — no DB reads or writes.
 *
 * Given a member's salary config, their status (PROBATION / PERMANENT),
 * and the volume they achieved this month, returns a full PayrollBreakdown.
 *
 * Commission rate logic:
 *   PROBATION  → <500k = 7%,  ≥500k = 10%
 *   PERMANENT  → <500k = 5%,  ≥500k = 8%
 *
 * Incentive  → paid in full when volumeAchieved >= monthlyTarget (100%)
 * Allowance  → paid in full when volumeAchieved >= monthlyTarget * 0.75 (75%)
 * EPF        → 8% of basicSalary (employee deduction)
 * EPF emp    → 12% of basicSalary (employer cost, not deducted)
 * ETF        → 3% of basicSalary (employer cost, not deducted)
 */
export function calculatePayroll(
  salary: {
    basicSalary: number;
    monthlyTarget: number;
    incentiveAmount: number;
    allowanceAmount: number;
    orcRate: number;
    commRateLow: number;
    commRateHigh: number;
    commThreshold: number;
    epfEmployee: number;
    epfEmployer: number;
    etfEmployer: number;
    allowanceThresholdPermanent: number;
    allowanceThresholdProbation: number;
  },
  memberStatus: "PROBATION" | "PERMANENT",
  volumeAchieved: number,
  orcVolume: number = 0, // total ORC-eligible volume from commissions
): PayrollBreakdown {
  const {
    basicSalary,
    monthlyTarget,
    incentiveAmount,
    allowanceAmount,
    orcRate,
    commThreshold,
    epfEmployee,
    epfEmployer,
    etfEmployer,
    allowanceThresholdPermanent,
    allowanceThresholdProbation,

  } = salary;

  // Commission rate depends on permanent/probation status
  const commRate =
    memberStatus === "PROBATION"
      ? volumeAchieved < commThreshold
        ? 0.07
        : 0.10
      : volumeAchieved < commThreshold
        ? 0.05
        : 0.08;

  // // Thresholds
  // const allowanceHit = volumeAchieved >= monthlyTarget * 0.75;
  // const incentiveHit = volumeAchieved >= monthlyTarget;
  const allowanceThresholdPct = memberStatus === "PERMANENT"
    ? salary.allowanceThresholdPermanent  // 1.0 for all except FA (0.75)
    : salary.allowanceThresholdProbation; // 0.75 TL, 0.60 BM, 0.70 RM/ZM, 0.65 AGM

  const allowanceHit = volumeAchieved >= monthlyTarget * allowanceThresholdPct;
  const incentiveHit = volumeAchieved >= monthlyTarget; // always 100%

  const incentiveEarned = incentiveHit ? incentiveAmount : 0;
  const allowanceEarned = allowanceHit ? allowanceAmount : 0;

  // ORC = flat rate on total ORC-eligible volume (from commission system)
  const orcEarned = orcVolume * orcRate;

  // New business commission on volume achieved
  const commissionEarned = volumeAchieved * commRate;

  // EPF/ETF on basic salary only
  const epfDeduction = basicSalary * epfEmployee;
  const epfEmployerAmount = basicSalary * epfEmployer;
  const etfEmployerAmount = basicSalary * etfEmployer;

  const grossPay =
    basicSalary + incentiveEarned + allowanceEarned + orcEarned + commissionEarned;
  const netPay = grossPay - epfDeduction;


  return {
    basicSalary,
    monthlyTarget,
    volumeAchieved,
    incentiveEarned,
    allowanceEarned,
    orcEarned,
    commissionEarned,
    epfDeduction,
    epfEmployer: epfEmployerAmount,
    etfEmployer: etfEmployerAmount,
    incentiveHit,
    allowanceHit,
    grossPay,
    netPay,
  };
}