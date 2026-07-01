"use server";

import { prisma } from "@/lib/prisma";
import { InvStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// ─── Leave (mark matured, status = Matured) ──────────────────────────────────

export async function leaveInvestment(investmentId: number) {
  await prisma.investment.update({
    where: { id: investmentId },
    data: {
      isMatured: true,
      status: "Matured",
    },
  });

  revalidatePath("/");
  return { success: true };
}

// ─── Renew ────────────────────────────────────────────────────────────────────

// export async function renewInvestment(investmentId: number) {
//   const old = await prisma.investment.findUniqueOrThrow({
//     where: { id: investmentId },
//     include: { plan: true },
//   });

//   const now = new Date();
//   const duration = old.plan?.duration ?? 12; // months

//   const newMaturityDate = new Date(now);
//   newMaturityDate.setMonth(newMaturityDate.getMonth() + duration);

//   // Generate ref number
//   const refNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

//   // 25% of investment amount → advisor target uplift
//   const renewalAmount = old.amount * 0.25;

//   const result = await prisma.$transaction(async (tx:any) => {
//     // 1. Close old investment
//     await tx.investment.update({
//       where: { id: investmentId },
//       data: {
//         isMatured: true,
//         status: "Renewed",
//       },
//     });

//     // 2. Create new investment (carry over all relevant fields)
//     const newInvestment = await tx.investment.create({
//       data: {
//         investmentDate: now,
//         amount: old.amount,
//         clientId: old.clientId,
//         planId: old.planId,
//         advisorId: old.advisorId,
//         branchId: old.branchId,
//         beneficiaryId: old.beneficiaryId,
//         nomineeId: old.nomineeId,
//         investmentRates: old.investmentRates,
//         monthlyHarvest: old.monthlyHarvest,
//         totalHarvest: old.totalHarvest,
//         maturityDate: newMaturityDate,
//         refNumber,
//         renewedFromId: old.id,
//         commissionsProcessed: false,
//         isMatured: false,
//         status: "Renewed",
//         // hierarchy chain
//         faId: old.faId,
//         fmId: old.fmId,
//         bmId: old.bmId,
//         rmId: old.rmId,
//         zmId: old.zmId,
//         agmId: old.agmId,
//         ccoId: old.ccoId,
//       },
//     });

//     // 3. Process 25% renewal commission for advisor (if assigned)
//     //    This creates a Commission record against the new investment.
//     //    You can plug this into your existing processCommissions logic;
//     //    here we create a direct commission entry for the advisor.
//     if (old.advisorId) {
//       await tx.commission.create({
//         data: {
//           memberId: old.advisorId,
//           investmentId: newInvestment.id,
//           // commissionAmount = your rate applied to renewalBonus (25% of principal)
//           // Using renewalBonus directly as the "commission base" — adjust the
//           // rate multiplication here to match your CommissionRate table logic.
//           commissionAmount: renewalAmount,
//           type: "Renewal",       // add "Renewal" to your CommissionType enum if needed
//           month: now.getMonth() + 1,
//           year: now.getFullYear(),
//           processed: false,
//         },
//       });
//     }

//     return newInvestment;
//   });

//   revalidatePath("/");
//   return { success: true, newInvestmentId: result.id, refNumber: result.refNumber };
// }


const HIERARCHY_FIELDS = ["faId", "fmId", "bmId", "rmId", "zmId", "agmId", "ccoId"] as const;

export async function renewInvestment(investmentId: number) {
  const old = await prisma.investment.findUniqueOrThrow({
    where: { id: investmentId },
    include: { plan: true },
  });

  if (old.status === InvStatus.Renewed && old.renewalCreditedAt) {
    return { success: false, error: "Investment already renewed" };
  }

  const now = new Date();
  const duration = old.plan?.duration ?? 12;
  const newMaturityDate = new Date(old.maturityDate ?? now);
  newMaturityDate.setMonth(newMaturityDate.getMonth() + duration);

  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const renewalCredit = old.amount * 0.25;

  const hierarchyIds = [...new Set(
    HIERARCHY_FIELDS.map((f) => old[f] as number | null).filter((id): id is number => id !== null)
  )];

  const result = await prisma.$transaction(async (tx: any) => {
    await Promise.all(
      hierarchyIds.map((memberId) =>
        tx.monthlyPayroll.upsert({
          where: { memberId_year_month: { memberId, year, month } },
          update: { volumeAchieved: { increment: renewalCredit } },
          create: {
            memberId,
            year,
            month,
            monthlyTarget: 0,
            volumeAchieved: renewalCredit,
            basicSalaryPermanent: 0,
          },
        })
      )
    );

    return tx.investment.update({
      where: { id: investmentId },
      data: {
        status: InvStatus.Renewed,
        investmentDate: now,
        maturityDate: newMaturityDate,
        renewalCreditedAt: now,
      },
    });
  });

  revalidatePath("/features/investments");
  return { success: true, investmentId: result.id, refNumber: result.refNumber };
}


// ─── Dismiss maturity notification (persisted) ───────────────────────────────

export async function dismissMaturityNotification(investmentId: number) {
  await prisma.investment.update({
    where: { id: investmentId },
    data: { maturityNotified: true },
  });
  revalidatePath("/");
  return { success: true };
}