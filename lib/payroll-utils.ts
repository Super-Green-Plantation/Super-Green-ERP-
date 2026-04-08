export type PayrollBreakdown = {
  basicSalary: number;
  basicType: "PERMANENT" | "PROBATION";
  monthlyTarget: number;
  volumeAchieved: number;

  incentiveEarned: number;
  allowanceEarned: number;
  orcEarned: number;
  commissionEarned: number;

  epfDeduction: number;
  epfEmployer: number;
  etfEmployer: number;

  incentiveHit: boolean;
  allowanceHit: boolean;

  grossPay: number;
  netPay: number;
};

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
  },
  commissionEarned: number = 0,
  memberStatus: "PROBATION" | "PERMANENT" | "MANAGEMENT",
  volumeAchieved: number,
  orcVolume: number = 0,
  orcRate: number = 0,
): PayrollBreakdown {

  const safe = (n: any) => Number(n ?? 0);

  const isPermanent = memberStatus === "PERMANENT";

  const basicSalary = isPermanent
    ? safe(salary.basicSalaryPermanent)
    : safe(salary.basicSalaryProbation);

  const basicType = isPermanent ? "PERMANENT" : "PROBATION";

  const monthlyTarget = safe(salary.monthlyTarget);
  const incentiveAmount = safe(salary.incentiveAmount);
  const allowanceAmount = safe(salary.allowanceAmount);

  const allowanceThresholdPct = isPermanent
    ? safe(salary.allowanceThresholdPermanent)
    : safe(salary.allowanceThresholdProbation);

  const allowanceHit = volumeAchieved >= monthlyTarget * allowanceThresholdPct;
  const incentiveHit = volumeAchieved >= monthlyTarget;

  const incentiveEarned = incentiveHit ? incentiveAmount : 0;
  const allowanceEarned = allowanceHit ? allowanceAmount : 0;

  const orcEarned = safe(orcVolume) * safe(orcRate);

  const epfDeduction = basicSalary * safe(salary.epfEmployee);
  const epfEmployerAmount = basicSalary * safe(salary.epfEmployer);
  const etfEmployerAmount = basicSalary * safe(salary.etfEmployer);

  const grossPay =
    basicSalary +
    incentiveEarned +
    allowanceEarned +
    orcEarned +
    safe(commissionEarned);

  const netPay = grossPay - epfDeduction;

  return {
    basicSalary,
    basicType,
    monthlyTarget,
    volumeAchieved,

    incentiveEarned,
    allowanceEarned,
    orcEarned,
    commissionEarned: safe(commissionEarned),

    epfDeduction,
    epfEmployer: epfEmployerAmount,
    etfEmployer: etfEmployerAmount,

    incentiveHit,
    allowanceHit,

    grossPay,
    netPay,
  };
}