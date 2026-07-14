export function resolvePositionTarget(member: any, year: number, month: number) {
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

  // After 6 months: use after6MonthTarget and after6MonthIncentivePct.
  // Pass partialThresholdPct so calculatePayroll computes the absolute
  // threshold consistently as: targetAmount × partialThresholdPct.
  const anyTarget = targets[0];

  return {
    ...anyTarget,
    targetAmount: anyTarget.after6MonthTarget,
    // after6MonthIncentivePct is the fraction of target that must be achieved
    // (e.g. 0.5 = 50% of 8M = 4M for BM after 6 months). Store as
    // partialThresholdPct so calculatePayroll's probation path handles it.
    partialThresholdPct: anyTarget.after6MonthIncentivePct ?? 0,
    partialBonus: anyTarget.bonusAmount,
  };
}

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