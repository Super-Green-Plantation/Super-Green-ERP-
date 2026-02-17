"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Generate investment reference number
function generateInvestmentNumber() {
  const prefix = "INV";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
}

export async function getInvestments() {
  return await prisma.investment.findMany({
    include: {
      client: true,
      plan: true,
      advisor: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createInvestment(data: {
  clientId: number;
  planId?: number;
  advisorId?: number;
  amount: number;
}) {
  try {
    const refNumber = generateInvestmentNumber();

    const investment = await prisma.investment.create({
      data: {
        refNumber,
        clientId: data.clientId,
        planId: data.planId || null,
        advisorId: data.advisorId || null,
        amount: data.amount,
        investmentDate: new Date(),
      },
      include: {
        client: true,
        plan: true,
        advisor: true,
      },
    });

    revalidatePath("/features/investments");
    return { success: true, investment };
  } catch (error) {
    console.error("Error creating investment:", error);
    return { success: false, error: "Failed to create investment" };
  }
}

export async function getInvestmentById(id: number) {
  try {
    const investment = await prisma.investment.findUnique({
      where: { id },
      include: {
        client: true,
        plan: true,
        advisor: true,
      },
    });
    return investment;
  } catch (error) {
    console.error("Error fetching investment:", error);
    return null;
  }
}
