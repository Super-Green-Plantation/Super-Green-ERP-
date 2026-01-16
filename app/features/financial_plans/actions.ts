"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFinancialPlans() {
  return await prisma.financialPlan.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createFinancialPlan(formData: FormData) {
  const name = formData.get("name") as string;
  const duration = parseInt(formData.get("duration") as string);
  const rate = parseFloat(formData.get("rate") as string);
  const description = formData.get("description") as string;
  const investmentValue = formData.get("investment") as string;
  const investment = investmentValue ? parseFloat(investmentValue) : null;

  try {
    await prisma.financialPlan.create({
      data: { name, duration, rate, description, investment },
    });
    revalidatePath("/features/financial_plans");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function updateFinancialPlan(id: number, data: any) {
  try {
    await prisma.financialPlan.update({
      where: { id },
      data: {
        name: data.name,
        duration: data.duration,
        rate: data.rate,
        description: data.description,
        investment: data.investment
      },
    });
    revalidatePath("/features/financial_plans");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function deleteFinancialPlan(id: number) {
  try {
    await prisma.financialPlan.delete({ where: { id } });
    revalidatePath("/features/financial_plans");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}