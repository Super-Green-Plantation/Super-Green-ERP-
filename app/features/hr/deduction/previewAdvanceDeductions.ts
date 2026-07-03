import { prisma } from "@/lib/prisma";

export async function previewAdvanceDeductions(
  memberId: number,
  year: number,
  month: number,
  netPayBeforeAdvances: number,
): Promise<{
  totalDeducted: number;
  deductionDetails: { advanceId: number; type: string; amount: number }[];
  outstandingRemaining: number;
  outstandingTypes: string[];
}> {
  const outstandingAdvances = await prisma.salaryAdvance.findMany({
    where: { memberId, remainingAmount: { gt: 0 } },
    orderBy: { createdAt: "asc" },
  });

  const outstandingRemaining = outstandingAdvances.reduce(
    (sum, a) => sum + Number(a.remainingAmount),
    0,
  );
  const outstandingTypes = [...new Set(outstandingAdvances.map((a) => a.type))];

  let availableNetPay = netPayBeforeAdvances;
  let totalDeducted = 0;
  const deductionDetails: { advanceId: number; type: string; amount: number }[] = [];

  for (const advance of outstandingAdvances) {
    if (availableNetPay <= 0) break;

    const existing = await prisma.advanceDeduction.findUnique({
      where: { salaryAdvanceId_year_month: { salaryAdvanceId: advance.id, year, month } },
    });
    if (existing) {
      totalDeducted += Number(existing.amountDeducted);
      availableNetPay -= Number(existing.amountDeducted);
      continue;
    }

    const targetAmount = Math.min(Number(advance.installmentAmount), Number(advance.remainingAmount));
    const actualDeduction = Math.min(targetAmount, availableNetPay);
    if (actualDeduction <= 0) continue;

    totalDeducted += actualDeduction;
    availableNetPay -= actualDeduction;
    deductionDetails.push({ advanceId: advance.id, type: advance.type, amount: actualDeduction });
  }

  return { totalDeducted, deductionDetails, outstandingRemaining, outstandingTypes };
}