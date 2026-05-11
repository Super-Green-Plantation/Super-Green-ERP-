"use server"

import { serializeData } from "@/app/utils/serializers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function runMonthlyEvaluation(data: {
  memberId: number;
  year: number;
  month: number; // 1–12
}) {
  const { memberId, year, month } = data;

  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        position: true,
        clients: {
          include: {
            investments: true,
          },
        },
      },
    });

    if (!member) return { success: false, error: "Member not found" };
    if (!member.probationStartDate) return { success: false, error: "Probation start date not set" };

    // Calculate which probation month this is
    const start = new Date(member.probationStartDate);
    const evalDate = new Date(year, month - 1, 1);
    const monthsElapsed = (evalDate.getFullYear() - start.getFullYear()) * 12
      + (evalDate.getMonth() - start.getMonth());

    // Only run probation bonuses for months 0–5 (first 6 months)
    let periodNumber: number | null = null;
    let monthInPeriod: number | null = null;

    if (member.status === "PROBATION" && monthsElapsed >= 0 && monthsElapsed < 6) {
      periodNumber = monthsElapsed < 3 ? 1 : 2;
      monthInPeriod = (monthsElapsed % 3) + 1;
    }

    // Sum investment volume for this employee's clients in the given month
    const volumeAchieved = member.clients.reduce((sum, client) => {
      return sum + client.investments
        .filter(inv => {
          const d = new Date(inv.investmentDate);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        })
        .reduce((s, inv) => s + inv.amount, 0);
    }, 0);

    let bonusEarned = 0;
    let excessBonus = 0;
    let targetHit = false;
    let targetAmount = 0;

    // Fetch position target if in probation
    if (periodNumber && monthInPeriod && member.positionId) {
      const target = await prisma.positionTarget.findUnique({
        where: {
          positionId_periodNumber_monthNumber: {
            positionId: member.positionId,
            periodNumber,
            monthNumber: monthInPeriod,
          },
        },
      });

      if (target) {
        targetAmount = target.targetAmount;
        targetHit = volumeAchieved >= targetAmount;

        if (targetHit) {
          bonusEarned = target.bonusAmount;

          // Period 2 excess commission
          if (periodNumber === 2 && target.excessRate > 0) {
            const excess = volumeAchieved - targetAmount;
            excessBonus = excess * target.excessRate;
          }
        }
      }
    }

    // Upsert evaluation record
    const evaluation = await prisma.monthlyEvaluation.upsert({
      where: { memberId_year_month: { memberId, year, month } },
      update: { volumeAchieved, targetAmount, bonusEarned, excessBonus, targetHit, periodNumber, monthInPeriod },
      create: { memberId, year, month, periodNumber, monthInPeriod, volumeAchieved, targetAmount, bonusEarned, excessBonus, targetHit },
    });

    // Auto-promote to PERMANENT after 6 months probation
    if (member.status === "PROBATION" && monthsElapsed >= 5) {
      await prisma.member.update({
        where: { id: memberId },
        data: { status: "PERMANENT" },
      });
    }

    revalidatePath("/features/hr/evaluations");
    return { success: true, evaluation: serializeData(evaluation) };
  } catch (err) {
    console.error("Monthly evaluation error:", err);
    return { success: false, error: "Failed to run evaluation" };
  }
}