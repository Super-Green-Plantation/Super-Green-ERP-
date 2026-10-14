export function resolvePositionTarget(member: any, year: number, month: number) {
  if (member.status !== "PROBATION") return null;

  const targets = member.position?.positionTargets;
  if (!targets || targets.length === 0) return null;

  // If probationStartDate is missing we cannot compute tenure, so we default to
  // period 1 / month 1. This is the safest fallback — the member still gets their
  // position's vehicle, team-activation, and incentive amounts rather than falling
  // through to PositionSalary (which has those fields as 0).
  // If probationStartDate is missing, fall back to dateOfJoin. If neither is available,
  // we default to period 1 / month 1 as the safest fallback.
  const effectiveProbationStart = member.probationStartDate || member.dateOfJoin;
  if (!effectiveProbationStart) {
    return (
      targets.find((t: any) => t.periodNumber === 1 && t.monthNumber === 1) ??
      targets[0] ??
      null
    );
  }

  const monthsElapsed = getMonthsInProbation(
    effectiveProbationStart,
    year,
    month,
  );
  if (monthsElapsed < 0) return null;

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
  // If after6MonthTarget is not set (>0), return null to fall back to PositionSalary (e.g. FA's 2.5M).
  const anyTarget = targets[0];
  if (!anyTarget.after6MonthTarget || anyTarget.after6MonthTarget <= 0) {
    return null;
  }

  return {
    ...anyTarget,
    targetAmount: anyTarget.after6MonthTarget,
    // after6MonthIncentivePct is the fraction of target that must be achieved
    // (e.g. 0.5 = 50% of 8M = 4M for BM after 6 months). Store as
    // partialThresholdPct so calculatePayroll's probation path handles it.
    partialThresholdPct: anyTarget.after6MonthIncentivePct ?? 0,
    // Team active and vehicle thresholds (teamActiveThresholdPct, vehicleThresholdPct)
    // were configured relative to the probation targetAmount (e.g. 500K/1M),
    // NOT the after6MonthTarget (4M+). Store the original targetAmount so
    // calculateMarketingPayroll can compute the correct absolute threshold.
    // payroll-utils multiplies: teamActiveBaseTarget × teamActiveThresholdPct.
    teamActiveBaseTarget: anyTarget.targetAmount,
    vehicleBaseTarget:    anyTarget.targetAmount,
    // Do NOT alias bonusAmount → partialBonus here.
    // anyTarget.partialBonus is already spread above and is the correct value:
    //   FA:     partialBonus > 0  (e.g. 20 000)  → hasPartial=true → basicIncentive
    //   TL/BM:  partialBonus = 0                 → hasPartial=false → fullIncentive (bonusAmount)
  };
}

/**
 * Resolves the monthly sales target for any member:
 * 1. If on PROBATION, checks resolvePositionTarget.
 * 2. Checks position.salary.monthlyTarget (for permanent staff or probation fallback).
 * 3. Fallback to any positive positionTarget or 0.
 */
export function resolveMemberTarget(
  member: any,
  year: number,
  month: number
): number {
  if (!member || !member.position) return 0;

  // 1. If probation, try resolvePositionTarget
  if (member.status === "PROBATION") {
    const pt = resolvePositionTarget(member, year, month);
    if (pt && pt.targetAmount > 0) {
      return pt.targetAmount;
    }
  }

  // 2. Check position salary monthlyTarget (covers permanent members and probation fallbacks)
  if (member.position.salary?.monthlyTarget && member.position.salary.monthlyTarget > 0) {
    return member.position.salary.monthlyTarget;
  }

  // 3. Fallback: check any position target
  const posTargets = member.position.positionTargets;
  if (posTargets && posTargets.length > 0) {
    const firstTarget = posTargets.find((t: any) => t.targetAmount > 0);
    if (firstTarget) {
      return firstTarget.targetAmount;
    }
  }

  return 0;
}

export function getMonthsInProbation(
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