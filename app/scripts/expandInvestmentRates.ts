// scripts/expandInvestmentRates.ts
import { prisma } from "@/lib/prisma";

async function run() {
  const investments = await prisma.investment.findMany({
    where: { planId: { not: null } },
    include: { plan: true },
  });

  let updated = 0;

  for (const inv of investments) {
    if (!inv.plan) continue;

    const years = Math.ceil(inv.plan.duration / 12);

    // already correct length — skip
    if (inv.investmentRates.length === years) continue;

    // use plan's rate array if it matches, else repeat the first stored rate
    let expanded: number[];
    if (Array.isArray(inv.plan.rate) && inv.plan.rate.length === years) {
      expanded = inv.plan.rate;
    } else {
      const base = inv.investmentRates[0] ?? inv.plan.rate[0] ?? 0;
      expanded = Array(years).fill(base);
    }

    // recalculate harvest with expanded rates
    const months = inv.plan.duration;
    const monthsPerYear = months / years;
    const totalHarvest = expanded.reduce(
      (sum, rate) => sum + inv.amount * (rate / 100) * (monthsPerYear / 12),
      0
    );

    await prisma.investment.update({
      where: { id: inv.id },
      data: {
        investmentRates: expanded,
        totalHarvest,
        monthlyHarvest: totalHarvest / months,
      },
    });

    updated++;
  }

}

run().catch(console.error).finally(() => prisma.$disconnect());