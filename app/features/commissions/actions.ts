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