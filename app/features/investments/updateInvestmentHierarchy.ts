"use server";


import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const HIERARCHY_FIELDS = ["faId", "fmId", "bmId", "rmId", "zmId", "agmId", "ccoId"] as const;
type HierarchyField = typeof HIERARCHY_FIELDS[number];
type HierarchyIds = Partial<Record<HierarchyField, number | null>>;

export async function updateInvestmentHierarchy(
  investmentId: number,
  newHierarchy: HierarchyIds
) {
  try {
    const currentUser = await getCurrentUserWithRole();
    if (!currentUser?.member?.id) return { success: false, error: "Unauthorized" };

    const existing = await prisma.investment.findUnique({
      where: { id: investmentId },
      select: {
        amount: true,
        investmentDate: true,
        approvalStatus: true,
        faId: true, fmId: true, bmId: true,
        rmId: true, zmId: true, agmId: true, ccoId: true,
      },
    });

    if (!existing) return { success: false, error: "Investment not found" };
    if (existing.approvalStatus !== "APPROVED") return { success: false, error: "Can only edit hierarchy on approved investments" };

    const investmentDate = new Date(existing.investmentDate);
    const year = investmentDate.getFullYear();
    const month = investmentDate.getMonth() + 1;
    const amount = existing.amount;

    const oldIds = [...new Set(
      HIERARCHY_FIELDS.map((f) => existing[f] as number | null).filter((id): id is number => id !== null)
    )];
    const newIds = [...new Set(
      HIERARCHY_FIELDS.map((f) => newHierarchy[f] ?? null).filter((id): id is number => id !== null)
    )];

    const removed = oldIds.filter((id) => !newIds.includes(id));
    const added = newIds.filter((id) => !oldIds.includes(id));

    await prisma.$transaction(async (tx:any) => {
      await Promise.all(
        removed.map((memberId) =>
          tx.monthlyPayroll.upsert({
            where: { memberId_year_month: { memberId, year, month } },
            update: { volumeAchieved: { decrement: amount } },
            create: { memberId, year, month, monthlyTarget: 0, volumeAchieved: 0, basicSalaryPermanent: 0 },
          })
        )
      );

      await Promise.all(
        added.map((memberId) =>
          tx.monthlyPayroll.upsert({
            where: { memberId_year_month: { memberId, year, month } },
            update: { volumeAchieved: { increment: amount } },
            create: { memberId, year, month, monthlyTarget: 0, volumeAchieved: amount, basicSalaryPermanent: 0 },
          })
        )
      );

      await tx.investment.update({
        where: { id: investmentId },
        data: {
          faId: newHierarchy.faId ?? null,
          fmId: newHierarchy.fmId ?? null,
          bmId: newHierarchy.bmId ?? null,
          rmId: newHierarchy.rmId ?? null,
          zmId: newHierarchy.zmId ?? null,
          agmId: newHierarchy.agmId ?? null,
          ccoId: newHierarchy.ccoId ?? null,
        },
      });
    });

    revalidatePath("/features/investments");
    return { success: true };
  } catch (err) {
    console.error("updateInvestmentHierarchy error:", err);
    return { success: false, error: "Server error" };
  }
}