"use server";

import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createQuotation(formData: FormData) {
  const user = await getCurrentUserWithRole();
  if (!user?.id) throw new Error("Unauthorized");

  const planType = formData.get("planType") as string;
  const frequency = formData.get("frequency") as string;
  const duration = Number(formData.get("duration"));
  const premium = Number(formData.get("premium"));
  const clientName = formData.get("clientName") as string;
  const clientNic = (formData.get("clientNic") as string) || null;
  const clientAge = formData.get("clientAge") ? Number(formData.get("clientAge")) : null;
  const retirementAge = formData.get("retirementAge") ? Number(formData.get("retirementAge")) : null;
  const totalInvested = Number(formData.get("totalInvested"));
  const interestRate = Number(formData.get("interestRate"));
  const maturityAmount = Number(formData.get("maturityAmount"));
  const interestEarned = Number(formData.get("interestEarned"));
  const documentCharge = Number(formData.get("documentCharge")) || 500;
  const notes = (formData.get("notes") as string) || null;

  const quotation = await prisma.quotation.create({
    data: {
      planType: planType as any,
      frequency: frequency as any,
      duration,
      premium,
      clientName,
      clientNic,
      clientAge,
      retirementAge,
      totalInvested,
      interestRate,
      interestEarned,                              // net (after doc charge)
      netInterestEarned: interestEarned,           // same value, explicit field
      netMaturityAmount: maturityAmount,           // net maturity (after doc charge)
      maturityAmount,
      documentCharge,
      notes,
      createdByUserId: user.id,
    },
  });

  revalidatePath("/features/quotations");
  return quotation;
}

export async function getQuotations(page = 1, pageSize = 15) {
  const user = await getCurrentUserWithRole();
  if (!user?.id) throw new Error("Unauthorized");

  const skip = (page - 1) * pageSize;

  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      where: { createdByUserId: user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.quotation.count({ where: { createdByUserId: user.id } }),
  ]);

  // Advisor info derived from the logged-in user's member profile
  const branch = user.member?.branches?.[0]?.branch;
  const advisor = {
    name: user.member?.nameWithInitials ?? user.name ?? "N/A",
    empNo: user.member?.empNo ?? "N/A",
    branch: branch?.name ?? "N/A",
  };

  return { quotations, total, page, pageSize, advisor };
}

export async function deleteQuotation(id: string) {
  const user = await getCurrentUserWithRole();
  if (!user?.id) throw new Error("Unauthorized");

  const quotation = await prisma.quotation.findFirst({
    where: { id, createdByUserId: user.id },
  });
  if (!quotation) throw new Error("Not found");

  await prisma.quotation.delete({ where: { id } });
  revalidatePath("/features/quotations");
}

export async function getCurrentAdvisorInfo() {
  const user = await getCurrentUserWithRole();
  if (!user) return null;

  // If user has a linked member, return their details
  if (user.member) {
    const branch = user.member.branches?.[0]?.branch;
    return {
      name: user.member.nameWithInitials ?? user.name ?? "N/A",
      empNo: user.member.empNo,
      branch: branch?.name ?? "N/A",
    };
  }

  // Fallback for admin/non-member users
  return {
    name: user.name ?? user.email ?? "N/A",
    empNo: "N/A",
    branch: "N/A",
  };
}