import { prisma } from "@/lib/prisma";

async function issueSalaryAdvance(data: {
  memberId: number;
  type: "SALARY" | "FESTIVAL";
  totalAmount: number;
  installments: number;
  note?: string;
}) {
  const { memberId, type, totalAmount, installments, note } = data;
  const installmentAmount = Math.floor((totalAmount / installments) * 100) / 100; // round down to nearest cent
  const now = new Date();

  return prisma.salaryAdvance.create({
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
}