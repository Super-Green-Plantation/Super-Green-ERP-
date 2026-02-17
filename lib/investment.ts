import crypto from "crypto";

export function generateInvestmentNumber() {
  const randomNumber = crypto.randomInt(100000, 999999);
  return `INV-${randomNumber}`;
}
