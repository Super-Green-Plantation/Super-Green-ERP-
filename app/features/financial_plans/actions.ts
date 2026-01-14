// app/features/financial_plans/actions.ts
"use server"

import { prisma } from "../../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function createFinancialPlan(formData: FormData) {
  const name = formData.get("name") as string;
  const duration = parseInt(formData.get("duration") as string);
  const rate = parseFloat(formData.get("rate") as string);
  const description = formData.get("description") as string;

  try {
    await prisma.financialPlan.create({
      data: { name, duration, rate, description },
    });

    revalidatePath("/features/financial_plans");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false };
  }
}