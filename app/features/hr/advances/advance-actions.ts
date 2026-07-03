"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function issueSalaryAdvance(data: {
  memberId: number;
  type: "SALARY" | "FESTIVAL";
  totalAmount: number;
  installments: number;
  note?: string;
}) {
  const { memberId, type, totalAmount, installments, note } = data;
  const installmentAmount = Math.floor((totalAmount / installments) * 100) / 100;
  const now = new Date();

  const advance = await prisma.salaryAdvance.create({
    data: {
      memberId,
      type,
      totalAmount,
      installments,
      installmentAmount,
      remainingAmount: totalAmount,
      issuedYear: now.getFullYear(),
      issuedMonth: now.getMonth() + 1,
      note,
    },
  });

  revalidatePath("/features/hr/advances");
  return advance;
}

export async function getMembersForAdvance() {
  return prisma.member.findMany({
    where: { status: { in: ["PROBATION", "PERMANENT"] } },
    select: { id: true, empNo: true, nameWithInitials: true,  },
    orderBy: { nameWithInitials: "asc" },
  });
}

export async function getAdvancesList() {
  return prisma.salaryAdvance.findMany({
    include: { member: { select: { empNo: true, nameWithInitials: true, } } },
    orderBy: { createdAt: "desc" },
  });
}