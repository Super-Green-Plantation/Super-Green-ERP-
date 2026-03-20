"use server";

import { prisma } from "@/lib/prisma";

// in position-targets-actions.ts
export async function getPositions() {
  const positions = await prisma.position.findMany({
    orderBy: { rank: "asc" },
    include: {
      positionTargets: {
        orderBy: [{ periodNumber: "asc" }, { monthNumber: "asc" }],
      },
      orc: true,
    },
  });

  return positions.map(p => ({
    ...p,
    orc: p.orc ? {
      ratePermanent: Number(p.orc.ratePermanent),
      rateNonPermanent: Number(p.orc.rateNonPermanent),
    } : null,
  }));
}

export async function upsertPositionTargets(
  positionId: number,
  targets: {
    periodNumber: number;
    monthNumber: number;
    targetAmount: number;
    bonusAmount: number;
    bonusThresholdPct: number;
    vehicleAmount: number;
    vehicleThresholdPct: number;
    teamActiveAmount: number;
    teamActiveThresholdPct: number;
    minActiveAdvisors: number;
    minActiveFMs: number;
    minActiveBMs: number;
    excessRate: number;
    partialThreshold: number;
    partialBonus: number;
  }[]
) {
  try {
    await Promise.all(
      targets.map((t) => {
        const { periodNumber, monthNumber, ...updateData } = t;
        prisma.positionTarget.upsert({
          where: {
            positionId_periodNumber_monthNumber: {
              positionId,
              periodNumber: t.periodNumber,
              monthNumber: t.monthNumber,
            },
          },
          create: { positionId, ...t },
          update: updateData,
        })
      })
    );
    return { success: true };
  } catch (err) {
    console.error("upsertPositionTargets error:", err);
    return { success: false, error: "Failed to save targets" };
  }
}

export async function upsertPositionOrc(
  positionId: number,
  rateNonPermanent: number,
) {
  try {
    await prisma.commissionRate.upsert({
      where: { positionId },
      create: {
        positionId,
        rateNonPermanent
      },
      update: { rateNonPermanent },
    });
    return { success: true };
  } catch (err) {
    console.error("upsertPositionOrc error:", err);
    return { success: false, error: "Failed to save ORC rate" };
  }
}