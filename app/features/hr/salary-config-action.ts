"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPositionSalaries() {
  const positions = await prisma.position.findMany({
    orderBy: { rank: "asc" },
    include: { salary: true, orc: true },
  });
  return positions;
}

export async function upsertPositionSalary(data: {
  positionId: number;
  basicSalaryPermanent: number;
  basicSalaryProbation: number;
  monthlyTarget: number;
  incentiveAmount: number;
  allowanceAmount: number;
  orcRatePermanent: number;
  commRateLow: number;
  commRateHigh: number;
  commThreshold: number;
  epfEmployee: number;
  epfEmployer: number;
  etfEmployer: number;
  allowanceThresholdPermanent: number;
  allowanceThresholdProbation: number;
  incentivePartialThreshold: number;
  incentivePartialAmount: number;
  vehicleThresholdPct: number;
  vehicleAmount: number;
  teamActiveThresholdPct: number;
  teamActiveAmount: number;
  minActiveAdvisors: number;
  minActiveFMs: number;
  minActiveBMs: number;
}) {
  const { positionId, orcRatePermanent, ...salaryData } = data;

  await Promise.all([
    prisma.positionSalary.upsert({
      where: { positionId },
      create: { positionId, ...salaryData },
      update: salaryData,
    }),
    prisma.commissionRate.upsert({
      where: { positionId },
      create: { positionId, ratePermanent: orcRatePermanent / 100 },
      update: { ratePermanent: orcRatePermanent / 100 },
    }),
  ]);

  revalidatePath("/features/hr/salary");
  return { success: true };
}
