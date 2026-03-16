"use server";

import { prisma } from "@/lib/prisma";
import { serializeData } from "@/app/utils/serializers";
import { revalidatePath } from "next/cache";

// ── getPositions ──────────────────────────────────────────────────────────────

export async function getPositions() {
  const positions = await prisma.position.findMany({
    orderBy: { rank: "asc" },
    include: {
      orc: true,
      positionTargets: true, // ← correct relation name
    },
  });
  return serializeData(positions);
}

// ── upsertPositionTargets ─────────────────────────────────────────────────────
// Saves all 6 month targets (2 periods × 3 months) for a single position.

export async function upsertPositionTargets(
  positionId: number,
  targets: {
    periodNumber: number;
    monthNumber: number;
    targetAmount: number;
    bonusAmount: number;
    partialThreshold: number;
    partialBonus: number;
    excessRate: number;
  }[]
) {
  try {
    await prisma.$transaction(
      targets.map((t) =>
        prisma.positionTarget.upsert({
          where: {
            positionId_periodNumber_monthNumber: {
              positionId,
              periodNumber: t.periodNumber,
              monthNumber: t.monthNumber,
            },
          },
          update: {
            targetAmount: t.targetAmount,
            bonusAmount: t.bonusAmount,
            partialThreshold: t.partialThreshold,
            partialBonus: t.partialBonus,
            excessRate: t.excessRate,
          },
          create: {
            positionId,
            periodNumber: t.periodNumber,
            monthNumber: t.monthNumber,
            targetAmount: t.targetAmount,
            bonusAmount: t.bonusAmount,
            partialThreshold: t.partialThreshold,
            partialBonus: t.partialBonus,
            excessRate: t.excessRate,
          },
        })
      )
    );

    revalidatePath("/features/hr/targets");
    return { success: true };
  } catch (err) {
    console.error("Failed to upsert targets:", err);
    return { success: false, error: "Failed to save targets" };
  }
}