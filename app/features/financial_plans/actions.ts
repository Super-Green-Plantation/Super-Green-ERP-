"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/logActivity";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { ActivityAction, ActivityEntity } from "@prisma/client";

export async function getFinancialPlans() {
  return await prisma.financialPlan.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createFinancialPlan(data: {
  name: string;
  duration: number;
  rate: number[];
  description: string;
  investment: number | null;
}) {
  try {
    const currentUser = await getCurrentUserWithRole();

    const plan = await prisma.financialPlan.create({
      data: {
        name: data.name,
        duration: data.duration,
        rate: data.rate,       // Float[]
        description: data.description,
        investment: data.investment,
      },
    });

    revalidatePath("/features/financial_plans");

    const memberId = currentUser?.member?.id;
    if (!memberId) throw new Error("Current user has no associated member record");

    void logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.FINANCIAL_PLAN,
      entityId: plan.id,
      performedById: memberId,
      metadata: { created: plan },
    });

    return { success: true };
  } catch (error) {
    return { success: false,  error: (error as any).message };
  }
}

export async function updateFinancialPlan(
  id: number,
  data: {
    name: string;
    duration: number;
    rate: number[];
    description: string;
    investment: number | null;
  }
) {
  try {
    const currentUser = await getCurrentUserWithRole();

    const plan = await prisma.financialPlan.update({
      where: { id },
      data: {
        name:        data.name,
        duration:    data.duration,
        rate:        data.rate,
        description: data.description,
        investment:  data.investment,
      },
    });

    revalidatePath("/features/financial_plans");

    void logActivity({
      action:        ActivityAction.UPDATE,
      entity:        ActivityEntity.FINANCIAL_PLAN,
      entityId:      plan.id,
      performedById: currentUser?.member?.id ?? 0,
      metadata:      { updated: plan },
    });

    return { success: true };
  } catch (error) {
    console.error("updateFinancialPlan error:", error); // ← see the real error
    return { success: false, error: (error as any).message };
  }
}



export async function deleteFinancialPlan(id: number) {
  try {
    const [currentUser, existing] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.financialPlan.findUnique({ where: { id } }),
    ]);

    await prisma.financialPlan.delete({ where: { id } });
    revalidatePath("/features/financial_plans");

    void logActivity({
      action: ActivityAction.DELETE,
      entity: ActivityEntity.FINANCIAL_PLAN,
      entityId: id,
      performedById: currentUser?.member?.id ?? 0,
      metadata: { deleted: existing },
    });

    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getFinancialPlanById(id: number) {
  try {
    const plan = await prisma.financialPlan.findUnique({
      where: { id: Number(id) },
    });
    return plan;
  } catch (error) {
    console.error("Error fetching plan:", error);
    return null;
  }
}


