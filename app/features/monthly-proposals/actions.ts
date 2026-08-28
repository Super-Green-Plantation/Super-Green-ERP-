"use server";

import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { reserveProposalFormNoInTx } from "@/lib/proposalNumber";

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
