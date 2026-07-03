/**
 * Computes the excess commission earned on a single investment, given how much
 * volume the member has already had processed this month before this investment.
 *
 * Only the portion of THIS investment that pushes cumulative monthly volume
 * past target earns excessRate. Already-processed volume prior to this
 * investment is not re-charged.
 */
export function computeExcessCommission({
  investmentAmount,
  priorVolumeThisMonth,
  target,
  excessRate,
}: {
  investmentAmount: number;
  priorVolumeThisMonth: number;
  target: number;
  excessRate: number;
}): { excessBase: number; excessCommission: number } {
  if (!target || target <= 0 || !excessRate || excessRate <= 0) {
    return { excessBase: 0, excessCommission: 0 };
  }

  const newTotal = priorVolumeThisMonth + investmentAmount;
  if (newTotal <= target) {
    return { excessBase: 0, excessCommission: 0 };
  }

  const totalExcess = newTotal - target;
  const excessBase = Math.min(investmentAmount, totalExcess);
  const excessCommission = excessBase * excessRate;

  return { excessBase, excessCommission };
}