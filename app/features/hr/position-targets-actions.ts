"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { logActivity } from "@/lib/logActivity";
import { ActivityAction, ActivityEntity } from "@prisma/client";

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
    const currentUser = await getCurrentUserWithRole().catch(() => null);

    await Promise.all(
      targets.map((t) => {
        const { periodNumber, monthNumber, ...updateData } = t;
        return prisma.positionTarget.upsert({
          where: {
            positionId_periodNumber_monthNumber: {
              positionId,
              periodNumber: t.periodNumber,
              monthNumber: t.monthNumber,
            },
          },
          create: { positionId, ...t },
          update: updateData,
        });
      })
    );

    logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.MEMBER, // Closest match for HR structure
      performedById: currentUser?.member?.id ?? 0,
      metadata: { action: "position_targets_updated", positionId },
    });

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
    const currentUser = await getCurrentUserWithRole().catch(() => null);

    await prisma.commissionRate.upsert({
      where: { positionId },
      create: {
        positionId,
        rateNonPermanent
      },
      update: { rateNonPermanent },
    });

    logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.MEMBER,
      performedById: currentUser?.member?.id ?? 0,
      metadata: { action: "position_orc_updated", positionId, rateNonPermanent },
    });

    return { success: true };
  } catch (err) {
    console.error("upsertPositionOrc error:", err);
    return { success: false, error: "Failed to save ORC rate" };
  }
}