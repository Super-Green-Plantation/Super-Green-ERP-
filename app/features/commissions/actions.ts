"use server"

import { serializeData } from "@/app/utils/serializers";
import { prisma } from "@/lib/prisma";

// Generate commission reference number
// export function generateCommissionRef() {
//   return `COM-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
// }

// Get employee commissions
export async function getEmployeeCommissions(empNo: number) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: Number(empNo) },
    });

    const commissions = await prisma.commission.findMany({
      where: { memberEmpNo: member?.empNo },
      include: {
        investment: { include: { plan: true, client: true } },

      },
    });

    return { commissions: serializeData(commissions) };
  } catch (error) {
    console.error("Error fetching employee commissions:", error);
    throw new Error("Failed to fetch employee commissions");
  }
}

// Get eligible commissions for employee
export async function getEligibleCommissions(empNo: string, branchId: number) {
  try {
    const advisor = await prisma.member.findFirst({
      where: { empNo, isActive: true },
      include: {
        position: { include: { salary: true } },
        branches: { include: { branch: true, member: true } },
      },
    });

    if (!advisor) throw new Error("Advisor not found");

    const uplines = await getUplineChain(advisor.position?.rank ?? 0, branchId);

    return serializeData({ advisor, upperMember: uplines });
  } catch (error) {
    console.error("Error fetching eligible commissions:", error);
    throw error;
  }
}

export async function getCommissionByBranch(branchId: number) {
  try {
    const commissions = await prisma.commission.findMany({
      where: { branchId },
      include: {
        member: true, investment: { include: { plan: true, client: true } }, Branch: true
      },
      orderBy: { createdAt: "desc" },

    });
    return serializeData(commissions);
  } catch (error) {
    console.error("Error fetching commissions by branch:", error);
    throw new Error("Failed to fetch commissions by branch");
  }
}

export async function getCommissionDetails() {
  try {
    const investments = await prisma.commission.findMany({
      select: {
        id: true,
        amount: true,
        type: true,
        Branch: true,

        investment: { include: { plan: true, client: true } },
        member: true,


      },
    });

    return serializeData(investments);
  } catch (error) {
    console.error("Error fetching investment details:", error);
    throw new Error("Failed to fetch investment details");
  }
}

export async function getUplineChain(advisorRank: number, branchId: number) {

  const branchUplines = await prisma.member.findMany({
    where: {
      isActive: true,
      branches: { some: { branchId } },
      position: { rank: { gt: advisorRank } },
    },
    include: {
      position: { include: { salary: true, orc: true } },
      branches: { include: { branch: true } },
    },
    orderBy: { position: { rank: "asc" } },
  });

  const highestBranchRank = branchUplines.length > 0
    ? Math.max(...branchUplines.map(m => m.position?.rank ?? 0))
    : advisorRank;

  const crossBranchUplines = await prisma.member.findMany({
    where: {
      branches: { some: { branchId } },
      position: { rank: { gt: highestBranchRank } },
    },
    include: {
      position: { include: { salary: true, orc: true } },
      branches: { include: { branch: true } },
    },
    orderBy: { position: { rank: "asc" } },
  });

  // Merge, deduplicate by empNo, preserve rank order
  const seen = new Set<string>();
  const all = [...branchUplines, ...crossBranchUplines].filter(m => {
    if (seen.has(m.empNo)) return false;
    seen.add(m.empNo);
    return true;
  });

  return all.sort((a, b) => (a.position?.rank ?? 0) - (b.position?.rank ?? 0));
}
// ─── Monthly Proposal Commission actions ──────────────────────────────────────

export async function getMPCommissions() {
  try {
    const rows = await prisma.monthlyProposalCommission.findMany({
      include: {
        MonthlyProposal: {
          select: {
            id: true,
            proposalFormNo: true,
            planType: true,
            applicantName: true,
            premium: true,
            frequency: true,
            commissionsProcessed: true,
            branchId: true,
            branch: { select: { name: true } },
            client: { select: { fullName: true, nic: true } },
          },
        },
        Member: {
          select: {
            nameWithInitials: true,
            empNo: true,
            position: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return serializeData(rows);
  } catch (error) {
    console.error("Error fetching MP commissions:", error);
    throw new Error("Failed to fetch monthly proposal commissions");
  }
}

export async function getMPCommissionsByBranch(branchId: number) {
  try {
    const rows = await (prisma as any).monthlyProposalCommission.findMany({
      where: { branchId },
      include: {
        monthlyProposal: {
          select: {
            id: true,
            proposalFormNo: true,
            planType: true,
            applicantName: true,
            premium: true,
            frequency: true,
            commissionsProcessed: true,
            branchId: true,
            branch: { select: { name: true } },
            client: { select: { fullName: true, nic: true } },
          },
        },
        member: {
          select: {
            nameWithInitials: true,
            empNo: true,
            position: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return serializeData(rows);
  } catch (error) {
    console.error("Error fetching MP commissions by branch:", error);
    throw new Error("Failed to fetch monthly proposal commissions by branch");
  }
}

export async function undoMPCommissions(proposalId: number): Promise<{
  success: boolean;
  reversed?: number;
  error?: string;
}> {
  try {
    const result = await (prisma as any).$transaction(async (tx: any) => {
      const proposal = await tx.monthlyProposal.findUnique({
        where:  { id: proposalId },
        select: { id: true, commissionsProcessed: true },
      });

      if (!proposal) throw new Error("Proposal not found");
      if (!proposal.commissionsProcessed) return { alreadyUndone: true, reversed: 0 };

      const existing = await tx.monthlyProposalCommission.findMany({
        where: {
          monthlyProposalId: proposalId,
          type: { not: "REVERSED" },
        },
        select: { id: true, memberEmpNo: true, amount: true, type: true, month: true, year: true, branchId: true },
      });

      if (existing.length === 0) {
        await tx.monthlyProposal.update({
          where: { id: proposalId },
          data:  { commissionsProcessed: false, updatedAt: new Date() },
        });
        return { alreadyUndone: false, reversed: 0 };
      }

      // Decrement totalCommission for each affected member
      const groupedByEmpNo = new Map<string, number>();
      for (const c of existing) {
        groupedByEmpNo.set(c.memberEmpNo, (groupedByEmpNo.get(c.memberEmpNo) ?? 0) + c.amount);
      }
      for (const [empNo, totalAmount] of groupedByEmpNo.entries()) {
        await tx.member.update({
          where: { empNo },
          data:  { totalCommission: { decrement: totalAmount } },
        });
      }

      // Delete original commission rows
      await tx.monthlyProposalCommission.deleteMany({
        where: { monthlyProposalId: proposalId, type: { not: "REVERSED" } },
      });

      // Create REVERSED audit entries
      const reversedRows = existing.map((c: any) => ({
        monthlyProposalId: proposalId,
        memberEmpNo:       c.memberEmpNo,
        amount:            -Math.abs(c.amount),
        type:              "REVERSED" as const,
        refNumber:         `REV-MPC-${Date.now()}-${c.id}`,
        branchId:          c.branchId,
        month:             c.month,
        year:              c.year,
      }));

      await tx.monthlyProposalCommission.createMany({ data: reversedRows });

      // Mark commissions as unprocessed
      await tx.monthlyProposal.update({
        where: { id: proposalId },
        data:  { commissionsProcessed: false, updatedAt: new Date() },
      });

      return { alreadyUndone: false, reversed: existing.length };
    });

    return { success: true, reversed: result.reversed };
  } catch (err: any) {
    console.error("[undoMPCommissions] error:", err);
    return { success: false, error: err.message ?? "Something went wrong" };
  }
}