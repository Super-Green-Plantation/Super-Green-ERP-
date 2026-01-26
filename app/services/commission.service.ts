export function getPersonalRate(tiers, amount) {
  return (
    tiers.find(
      t =>
        amount >= t.minAmount &&
        (t.maxAmount === null || amount <= t.maxAmount)
    )?.rate ?? 0
  );
}

export function calculateCommission(amount, rate) {
  return (amount * rate) / 100;
}
