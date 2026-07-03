import { Prisma } from "@prisma/client";


export async function applyAdvanceDeductions(
  tx: Prisma.TransactionClient,
  memberId: number,
  year: number,
  month: number,
  netPayBeforeAdvances: number,
): Promise<{ totalDeducted: number; deductionDetails: { advanceId: number; type: string; amount: number }[] }> {
  const outstandingAdvances = await tx.salaryAdvance.findMany({
    where: { memberId, remainingAmount: { gt: 0 } },
    orderBy: { createdAt: "asc" },
  });

  let availableNetPay = netPayBeforeAdvances;
  let totalDeducted = 0;
  const deductionDetails: { advanceId: number; type: string; amount: number }[] = [];

  for (const advance of outstandingAdvances) {
    if (availableNetPay <= 0) break;

    // Idempotency guard — don't double-deduct on a force re-run
    const existing = await tx.advanceDeduction.findUnique({
      where: { salaryAdvanceId_year_month: { salaryAdvanceId: advance.id, year, month } },
    });
    if (existing) {
      // Already deducted this month for this advance — count it but don't redo
      totalDeducted += Number(existing.amountDeducted);
      availableNetPay -= Number(existing.amountDeducted);
      continue;
    }

    const targetAmount = Math.min(Number(advance.installmentAmount), Number(advance.remainingAmount));
    const actualDeduction = Math.min(targetAmount, availableNetPay);

    if (actualDeduction <= 0) continue;

    await tx.advanceDeduction.create({
      data: {
        salaryAdvanceId: advance.id,
        year,
        month,
        amountDeducted: actualDeduction,
      },
    });

    await tx.salaryAdvance.update({
      where: { id: advance.id },
      data: { remainingAmount: { decrement: actualDeduction } },
    });

    totalDeducted += actualDeduction;
    availableNetPay -= actualDeduction;
    deductionDetails.push({ advanceId: advance.id, type: advance.type, amount: actualDeduction });
  }

  return { totalDeducted, deductionDetails };
}