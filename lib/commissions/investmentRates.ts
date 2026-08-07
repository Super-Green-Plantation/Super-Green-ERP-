/**
 * Returns the appropriate investment rate based on amount.
 * >= 500K → 40%, otherwise keeps existing rates.
 */
export function autoDetectInvestmentRate(amount: number, existingRates: number[]): number[] {
  if (amount >= 500000) return [40];
  return existingRates;
}