"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * getPositionSalaries
 * -------------------
 * Fetches every Position row and left-joins its PositionSalary config.
 * Returns an array like:
 *   [{ id, title, rank, salary: { basicSalary, monthlyTarget, ... } | null }]
 *
 * The UI uses this to:
 *  - Show all positions in the accordion
 *  - Pre-fill the form if a config already exists
 *  - Show a "Configured" badge when salary !== null
 */
export async function getPositionSalaries() {
  const positions = await prisma.position.findMany({
    orderBy: { rank: "asc" },
    include: { salary: true },
  });
  return positions;
}

/**
 * upsertPositionSalary
 * --------------------
 * Creates or updates the PositionSalary row for a given positionId.
 * Safe to call for both first-time setup and edits — Prisma handles
 * the insert-or-update logic via the unique positionId constraint.
 *
 * All monetary values are stored as plain floats (e.g. 30000, not "30,000").
 * Rates are stored as decimals (e.g. 0.08 for 8%).
 */
export async function upsertPositionSalary(data: {
  positionId: number;
  basicSalaryPermanent: number;
  // basicSalaryProbation: number;
  monthlyTarget: number;
  incentiveAmount: number;
  allowanceAmount: number;
  orcRate: number;
  commRateLow: number;
  commRateHigh: number;
  commThreshold: number;
  epfEmployee: number;
  epfEmployer: number;
  etfEmployer: number;
}) {
  await prisma.positionSalary.upsert({
    where: { positionId: data.positionId },
    create: data,
    update: data,
  });

  revalidatePath("/features/hr/salary");
  return { success: true };
}