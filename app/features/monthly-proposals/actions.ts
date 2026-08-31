"use server";

import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { reserveProposalFormNoInTx } from "@/lib/proposalNumber";
import { logActivity } from "@/lib/logActivity";
import { ActivityAction, ActivityEntity } from "@prisma/client";
import { processMonthlyProposalCommissions } from "@/app/features/commissions/processMonthlyProposal";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MonthlyPlanType = "CHILD" | "MARGE" | "PENSION";
export type MonthlyFrequency = "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL";

export interface CreateMonthlyProposalInput {
  planType: MonthlyPlanType;
  clientId?: number | null;

  // Applicant (all three forms)
  applicantName: string;
  applicantNic?: string;
  applicantDob?: string;
  applicantAge?: number;
  applicantAddress?: string;
  applicantPhone?: string;
  applicantEmail?: string;

  // MARGE / PENSION only
  gender?: string;
  maritalStatus?: string;

  // Bank details on applicant — PENSION + MARGE forms
  applicantBankAccNo?: string;
  applicantBankName?: string;

  // Child plan — child details
  childName?: string;
  childDob?: string;
  childBirthCertNo?: string;
  childSchool?: string;
  childGrade?: string;

  // Plan
  duration: number;
  retirementAge?: number;
  frequency: MonthlyFrequency;
  premium: number;

  // Calculated financials
  totalInvested: number;
  interestRate: number;
  interestEarned: number;
  maturityAmount: number;
  documentCharge?: number;

  // Nominee / beneficiary
  nomineeName?: string;
  nomineeNic?: string;
  nomineeRelationship?: string;
  nomineePhone?: string;   // Child + MARGE only

  // Agent bank details (page 2 of all forms)
  agentBankAccNo?: string;
  agentBankName?: string;
  agentBankBranch?: string;

  notes?: string;
}

// Proposal numbers are shared with yearly Investments through one global sequence.



// ─── Create ───────────────────────────────────────────────────────────────────

export async function createMonthlyProposal(input: CreateMonthlyProposalInput) {
  const user = await getCurrentUserWithRole();
  if (!user?.id) throw new Error("Unauthorized");

  const branchId = user.member?.branches?.[0]?.branchId ?? null;
  const memberId = user.member?.id ?? null;

  const data: Record<string, unknown> = {
    planType: input.planType,

    applicantName: input.applicantName,
    applicantNic: input.applicantNic || null,
    applicantDob: input.applicantDob ? new Date(input.applicantDob) : null,
    applicantAge: input.applicantAge ?? null,
    applicantAddress: input.applicantAddress || null,
    applicantPhone: input.applicantPhone || null,
    applicantEmail: input.applicantEmail || null,

    gender: input.gender || null,
    maritalStatus: input.maritalStatus || null,

    applicantBankAccNo: input.applicantBankAccNo || null,
    applicantBankName: input.applicantBankName || null,

    // Child fields — only written for CHILD plan
    childName: input.planType === "CHILD" ? (input.childName || null) : null,
    childDob: input.planType === "CHILD" && input.childDob ? new Date(input.childDob) : null,
    childBirthCertNo: input.planType === "CHILD" ? (input.childBirthCertNo || null) : null,
    childSchool: input.planType === "CHILD" ? (input.childSchool || null) : null,
    childGrade: input.planType === "CHILD" ? (input.childGrade || null) : null,

    duration: input.duration,
    retirementAge: input.planType === "PENSION" ? (input.retirementAge ?? null) : null,
    frequency: input.frequency,
    premium: input.premium,

    totalInvested: input.totalInvested,
    interestRate: input.interestRate,
    interestEarned: input.interestEarned,
    maturityAmount: input.maturityAmount,
    documentCharge: input.documentCharge ?? 500,

    nomineeName: input.nomineeName || null,
    nomineeNic: input.nomineeNic || null,
    nomineeRelationship: input.nomineeRelationship || null,
    nomineePhone: input.nomineePhone || null,

    agentBankAccNo: input.agentBankAccNo || null,
    agentBankName: input.agentBankName || null,
    agentBankBranch: input.agentBankBranch || null,

    notes: input.notes || null,
    branchId,
    createdById: memberId,
    faId: memberId,    // creating member defaults as FA
    fmId: null,
    bmId: null,
    rmId: null,
    zmId: null,
  };

  if (input.clientId) data.clientId = input.clientId;

  const proposal = await (prisma as any).$transaction(async (tx: any) => {
    const proposalFormNo = await reserveProposalFormNoInTx(tx);
    return tx.monthlyProposal.create({ data: { ...data, proposalFormNo } });
  });

  revalidatePath("/features/investments");
  revalidatePath("/features/clients");
  revalidatePath("/features/monthly-proposals");

  return { ...proposal, proposalFormNo: proposal.proposalFormNo };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function getMonthlyProposals(
  page = 1,
  pageSize = 50,
  clientId?: number
) {
  const user = await getCurrentUserWithRole();
  if (!user?.id) throw new Error("Unauthorized");

  const where: Record<string, unknown> = {};

  if (clientId) {
    where.clientId = clientId;
  } else {
    switch (user.role) {
      case "ADMIN": case "HR": case "DEV": break;
      case "EMPLOYEE":
        where.createdById = user.member?.id;
        break;
      case "BRANCH_MANAGER": case "REGIONAL_MANAGER": case "AGM": {
        const branchIds = user.member?.branches?.map((b: any) => b.branchId) ?? [];
        where.branchId = { in: branchIds };
        break;
      }
    }
  }

  const skip = (page - 1) * pageSize;

  const [proposals, total] = await Promise.all([
    (prisma as any).monthlyProposal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        client: { select: { id: true, fullName: true, nic: true } },
        createdBy: { select: { id: true, nameWithInitials: true } },
      },
    }),
    (prisma as any).monthlyProposal.count({ where }),
  ]);

  return {
    proposals: JSON.parse(JSON.stringify(proposals)),
    total,
    page,
    pageSize,
  };
}

// ─── Single-record fetch ───────────────────────────────────────────────────────

export async function getMonthlyProposal(id: number) {
  const user = await getCurrentUserWithRole();
  if (!user?.id) throw new Error("Unauthorized");

  const proposal = await (prisma as any).monthlyProposal.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          fullName: true,
          nic: true,
        },
      },

      createdBy: {
        select: {
          id: true,
          nameWithInitials: true,
          empNo: true,
        },
      },

      fa: {
        select: {
          id: true,
          nameWithInitials: true,
          empNo: true,
        },
      },

      fm: {
        select: {
          id: true,
          nameWithInitials: true,
          empNo: true,
        },
      },

      bm: {
        select: {
          id: true,
          nameWithInitials: true,
          empNo: true,
        },
      },

      rm: {
        select: {
          id: true,
          nameWithInitials: true,
          empNo: true,
        },
      },

      zm: {
        select: {
          id: true,
          nameWithInitials: true,
          empNo: true,
        },
      },
    },

  });

  if (!proposal) throw new Error("Monthly proposal not found");
  return JSON.parse(JSON.stringify(proposal));
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteMonthlyProposal(id: number) {
  const user = await getCurrentUserWithRole();
  if (!user?.id) throw new Error("Unauthorized");

  const existing = await (prisma as any).monthlyProposal.findFirst({
    where: { id },
    select: { createdById: true },
  });
  if (!existing) throw new Error("Not found");

  const isOwner = existing.createdById === user.member?.id;
  const isPrivileged = ["ADMIN", "HR", "DEV"].includes(user.role ?? "");
  if (!isOwner && !isPrivileged) throw new Error("Forbidden");

  await (prisma as any).monthlyProposal.delete({ where: { id } });
  revalidatePath("/features/investments");
  revalidatePath("/features/clients");
  revalidatePath("/features/monthly-proposals");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FREQ_INTERVAL_MONTHS: Record<MonthlyFrequency, number> = {
  MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12,
};

function getPayingYears(planType: MonthlyPlanType, duration: number): number {
  if (planType === "CHILD") return 3;
  if (planType === "MARGE") return 5;
  return duration;
}

function buildPaymentSlots(
  proposalId: number,
  frequency: MonthlyFrequency,
  payingYears: number,
  startDate: Date,
) {
  const intervalMonths = FREQ_INTERVAL_MONTHS[frequency];
  const totalPayments  = Math.round((payingYears * 12) / intervalMonths);
  const slots = [];
  for (let i = 0; i < totalPayments; i++) {
    const due = new Date(startDate);
    due.setMonth(due.getMonth() + i * intervalMonths);
    slots.push({
      monthlyProposalId: proposalId,
      installmentNo:     i + 1,
      dueYear:           due.getFullYear(),
      dueMonth:          due.getMonth() + 1,
      dueDate:           due,
    });
  }
  return slots;
}

function calcMaturityDate(activatedAt: Date, durationYears: number): Date {
  const d = new Date(activatedAt);
  d.setFullYear(d.getFullYear() + durationYears);
  return d;
}

// ─── Activate ─────────────────────────────────────────────────────────────────

export async function activateMonthlyProposal(proposalId: number) {
  const user = await getCurrentUserWithRole();
  if (!user?.id) throw new Error("Unauthorized");

  const proposal = await (prisma as any).monthlyProposal.findUnique({
    where:  { id: proposalId },
    select: { id: true, status: true, frequency: true, planType: true, duration: true, createdById: true },
  });

  if (!proposal)                     throw new Error("Proposal not found");
  if (proposal.status !== "PENDING") throw new Error("Proposal is already activated");

  const activatedAt  = new Date();
  const maturityDate = calcMaturityDate(activatedAt, proposal.duration);
  const payingYears  = getPayingYears(proposal.planType, proposal.duration);
  const slots        = buildPaymentSlots(proposalId, proposal.frequency, payingYears, activatedAt);

  await (prisma as any).$transaction(async (tx: any) => {
    await tx.monthlyProposal.update({
      where: { id: proposalId },
      data:  { status: "ACTIVE", activatedAt, maturityDate, updatedAt: new Date() },
    });
    await tx.monthlyProposalPayment.createMany({ data: slots });
  });

  revalidatePath(`/features/monthly-proposals/${proposalId}`);
  revalidatePath(`/features/monthly-proposals/${proposalId}/payments`);

  return { activatedAt, maturityDate, totalSlots: slots.length };
}

// ─── Record payment ───────────────────────────────────────────────────────────

export interface RecordPaymentInput {
  paymentId:     number;
  paidAmount:    number;
  paidAt:        string;
  receiptNo?:    string;
  paymentMethod: string;
  notes?:        string;
}

export async function recordProposalPayment(input: RecordPaymentInput) {
  const user = await getCurrentUserWithRole();
  if (!user?.id) throw new Error("Unauthorized");

  const payment = await (prisma as any).monthlyProposalPayment.findUnique({
    where:  { id: input.paymentId },
    select: { id: true, paidAmount: true, monthlyProposalId: true },
  });

  if (!payment)                    throw new Error("Payment slot not found");
  if (payment.paidAmount !== null) throw new Error("This installment is already paid");

  // Fetch hierarchy IDs to update volumeAchieved
  const proposal = await (prisma as any).monthlyProposal.findUnique({
    where:  { id: payment.monthlyProposalId },
    select: {
      status: true, premium: true,
      faId: true, fmId: true, bmId: true, rmId: true, zmId: true,
    },
  });

  if (!proposal) throw new Error("Proposal not found");

  const paidDate = new Date(input.paidAt);
  const year  = paidDate.getFullYear();
  const month = paidDate.getMonth() + 1;

  // All unique hierarchy member IDs
  const hierarchyIds = [
    proposal.faId, proposal.fmId, proposal.bmId,
    proposal.rmId, proposal.zmId,
  ].filter((id): id is number => id !== null && id !== undefined);
  const uniqueIds = [...new Set(hierarchyIds)];

  await (prisma as any).$transaction(async (tx: any) => {
    // 1. Mark slot as paid
    await tx.monthlyProposalPayment.update({
      where: { id: input.paymentId },
      data: {
        paidAmount:    input.paidAmount,
        paidAt:        paidDate,
        receiptNo:     input.receiptNo     || null,
        paymentMethod: input.paymentMethod,
        notes:         input.notes         || null,
        recordedById:  user.member?.id     ?? null,
        updatedAt:     new Date(),
      },
    });

    // 2. Increment volumeAchieved for all hierarchy members in payment month
    //    Uses actual paidAmount (not proposal.premium) to support partial payments
    if (uniqueIds.length > 0) {
      await Promise.all(
        uniqueIds.map((memberId: number) =>
          tx.monthlyPayroll.upsert({
            where:  { memberId_year_month: { memberId, year, month } },
            update: { volumeAchieved: { increment: input.paidAmount } },
            create: {
              memberId,
              year,
              month,
              basicSalaryPermanent: 0,
              monthlyTarget:        0,
              volumeAchieved:       input.paidAmount,
            },
          })
        )
      );
    }

    // 3. Auto-complete if all slots paid
    const unpaidCount = await tx.monthlyProposalPayment.count({
      where: { monthlyProposalId: payment.monthlyProposalId, paidAmount: null },
    });
    if (unpaidCount === 0 && proposal.status === "ACTIVE") {
      await tx.monthlyProposal.update({
        where: { id: payment.monthlyProposalId },
        data:  { status: "COMPLETED", updatedAt: new Date() },
      });
    }
  });

  revalidatePath(`/features/monthly-proposals/${payment.monthlyProposalId}/payments`);
  revalidatePath(`/features/monthly-proposals/${payment.monthlyProposalId}`);
}

// ─── Reverse payment ──────────────────────────────────────────────────────────

export async function reverseProposalPayment(paymentId: number) {
  const user = await getCurrentUserWithRole();
  if (!user?.id) throw new Error("Unauthorized");

  const isPrivileged = ["ADMIN", "HR", "DEV"].includes(user.role ?? "");
  if (!isPrivileged) throw new Error("Only admins can reverse payments");

  const payment = await (prisma as any).monthlyProposalPayment.findUnique({
    where:  { id: paymentId },
    select: { id: true, paidAmount: true, paidAt: true, monthlyProposalId: true },
  });

  if (!payment)                    throw new Error("Payment not found");
  if (payment.paidAmount === null) throw new Error("This installment is not paid");

  const proposal = await (prisma as any).monthlyProposal.findUnique({
    where:  { id: payment.monthlyProposalId },
    select: {
      status: true,
      faId: true, fmId: true, bmId: true, rmId: true, zmId: true,
    },
  });
  if (!proposal) throw new Error("Proposal not found");

  // Use original paidAt to decrement from the correct month
  const paidDate = payment.paidAt ? new Date(payment.paidAt) : new Date();
  const year  = paidDate.getFullYear();
  const month = paidDate.getMonth() + 1;

  const hierarchyIds = [
    proposal.faId, proposal.fmId, proposal.bmId,
    proposal.rmId, proposal.zmId,
  ].filter((id): id is number => id !== null && id !== undefined);
  const uniqueIds = [...new Set(hierarchyIds)];

  await (prisma as any).$transaction(async (tx: any) => {
    // 1. Clear payment slot
    await tx.monthlyProposalPayment.update({
      where: { id: paymentId },
      data: {
        paidAmount: null, paidAt: null, receiptNo: null,
        paymentMethod: null, notes: null, recordedById: null,
        updatedAt: new Date(),
      },
    });

    // 2. Decrement volumeAchieved for all hierarchy members in the original payment month
    if (uniqueIds.length > 0) {
      await Promise.all(
        uniqueIds.map((memberId: number) =>
          tx.monthlyPayroll.updateMany({
            where: { memberId, year, month },
            data:  { volumeAchieved: { decrement: Number(payment.paidAmount) } },
          })
        )
      );
    }

    // 3. Revert COMPLETED → ACTIVE if needed
    if (proposal.status === "COMPLETED") {
      await tx.monthlyProposal.update({
        where: { id: payment.monthlyProposalId },
        data:  { status: "ACTIVE", updatedAt: new Date() },
      });
    }
  });

  revalidatePath(`/features/monthly-proposals/${payment.monthlyProposalId}/payments`);
  revalidatePath(`/features/monthly-proposals/${payment.monthlyProposalId}`);
}

// ─── Get payments ─────────────────────────────────────────────────────────────

export async function getProposalPayments(proposalId: number) {
  const user = await getCurrentUserWithRole();
  if (!user?.id) throw new Error("Unauthorized");

  const [proposal, payments] = await Promise.all([
    (prisma as any).monthlyProposal.findUnique({
      where:  { id: proposalId },
      select: {
        id: true, proposalFormNo: true, planType: true, applicantName: true,
        frequency: true, premium: true, duration: true, status: true,
        activatedAt: true, maturityDate: true,
      },
    }),
    (prisma as any).monthlyProposalPayment.findMany({
      where:   { monthlyProposalId: proposalId },
      orderBy: { installmentNo: "asc" },
      // No include — recordedBy relation name may differ per db pull
      // recordedById is present as a plain field and sufficient for display
    }),
  ]);

  if (!proposal) throw new Error("Proposal not found");
  return JSON.parse(JSON.stringify({ proposal, payments }));
}

// ─── Approve ──────────────────────────────────────────────────────────────────

export async function approveMonthlyProposalWithHierarchy(data: {
  proposalId:  number;
  faId?:       number | null;
  fmId?:       number | null;
  bmId?:       number | null;
  rmId?:       number | null;
  zmId?:       number | null;
  reviewNote?: string;
  advisorId?:  number | null;
}): Promise<{
  success:              boolean;
  proposal?:            any;
  error?:               string;
  commissionProcessed?: boolean;
  commissionError?:     string;
  commissionReceipt?:   any;
}> {
  try {
    const currentUser = await getCurrentUserWithRole();
    if (!currentUser) throw new Error("Not authorized");

    const approverIds = [data.faId, data.fmId, data.bmId, data.rmId, data.zmId];
    if (!approverIds.some((id) => id))
      throw new Error("At least one hierarchy member is required");

    const proposal = await (prisma as any).monthlyProposal.findUnique({
      where:  { id: data.proposalId },
      select: {
        id: true, approvalStatus: true, premium: true, branchId: true,
        faId: true, fmId: true, bmId: true, rmId: true, zmId: true,
      },
    });

    if (!proposal)                             throw new Error("Proposal not found");
    if (proposal.approvalStatus !== "PENDING") throw new Error("Proposal is not pending");

    const result = await (prisma as any).$transaction(async (tx: any) => {
      const updated = await tx.monthlyProposal.update({
        where: { id: data.proposalId },
        data: {
          approvalStatus: "APPROVED",
          reviewedAt:     new Date(),
          reviewedBy:     currentUser.id,
          reviewNote:     data.reviewNote ?? null,
          faId:           data.faId  ?? null,
          fmId:           data.fmId  ?? null,
          bmId:           data.bmId  ?? null,
          rmId:           data.rmId  ?? null,
          zmId:           data.zmId  ?? null,
          advisorId:      data.advisorId ?? null,
          updatedAt:      new Date(),
        },
      });

      const hierarchyIds = [
        data.faId, data.fmId, data.bmId, data.rmId, data.zmId,
      ].filter((id): id is number => id !== null && id !== undefined);
      const uniqueIds = [...new Set(hierarchyIds)];

      if (uniqueIds.length > 0) {
        const now   = new Date();
        const year  = now.getFullYear();
        const month = now.getMonth() + 1;
        await Promise.all(
          uniqueIds.map((memberId) =>
            tx.monthlyPayroll.upsert({
              where:  { memberId_year_month: { memberId, year, month } },
              update: { volumeAchieved: { increment: proposal.premium } },
              create: { memberId, year, month, basicSalaryPermanent: 0, monthlyTarget: 0, volumeAchieved: proposal.premium },
            })
          )
        );
      }

      return updated;
    });

    revalidatePath("/features/monthly-proposals");

    void logActivity({
      action:        ActivityAction.APPROVE,
      entity:        ActivityEntity.INVESTMENT,
      entityId:      data.proposalId,
      performedById: currentUser?.member?.id ?? 0,
      branchId:      proposal.branchId,
      metadata: {
        event: "monthly_proposal_approval",
        hierarchySnapshot: { faId: data.faId, fmId: data.fmId, bmId: data.bmId, rmId: data.rmId, zmId: data.zmId },
      },
    });

    let commissionProcessed = false;
    let commissionError: string | undefined;
    let commissionReceipt: any;

    if (data.faId) {
      try {
        const faMember = await prisma.member.findUnique({
          where:  { id: data.faId },
          select: { empNo: true },
        });
        if (!faMember) throw new Error(`FA not found for id ${data.faId}`);

        const uplineIds = [data.fmId, data.bmId, data.rmId, data.zmId]
          .filter((id): id is number => id !== null && id !== undefined);
        const uniqueUplineIds = [...new Set(uplineIds)];
        let hierarchyEmpNos: string[] = [];
        if (uniqueUplineIds.length > 0) {
          const members = await prisma.member.findMany({
            where:  { id: { in: uniqueUplineIds } },
            select: { id: true, empNo: true },
          });
          hierarchyEmpNos = uniqueUplineIds
            .map((id) => members.find((m) => m.id === id)?.empNo)
            .filter((e): e is string => !!e);
        }

        const commResult = await processMonthlyProposalCommissions({
          proposalId:      data.proposalId,
          empNo:           faMember.empNo,
          branchId:        proposal.branchId,
          hierarchyEmpNos,
          performedById:   currentUser?.member?.id,
        });

        if (commResult.success) {
          commissionProcessed = true;
          commissionReceipt   = commResult.receipt;
        } else {
          commissionError = (commResult.error as any)?.message ?? "Commission processing failed";
        }
      } catch (e: any) {
        commissionError = e.message ?? "Commission processing failed";
      }
    }

    return { success: true, proposal: result, commissionProcessed, commissionError, commissionReceipt };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Reject ───────────────────────────────────────────────────────────────────

export async function rejectMonthlyProposal(data: {
  proposalId: number;
  reviewNote: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUserWithRole();
    if (!currentUser) throw new Error("Not authorized");
    if (!data.reviewNote?.trim()) throw new Error("A review note is required to reject");

    await (prisma as any).monthlyProposal.update({
      where: { id: data.proposalId },
      data: {
        approvalStatus: "REJECTED",
        reviewedAt:     new Date(),
        reviewedBy:     currentUser.id,
        reviewNote:     data.reviewNote,
        updatedAt:      new Date(),
      },
    });

    revalidatePath("/features/monthly-proposals");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}