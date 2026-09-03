"use server";

/**
 * processMonthlyProposalCommissions
 *
 * Approval-time only: stamp commissionsProcessed, advisor lastInvestmentAt,
 * and reactivate the FA. Personal / ORC amounts are calculated once at
 * month-end by runMonthEndCommissions (MP premium is included in FA volume).
 *
 * MonthlyPayroll.volumeAchieved is incremented by the approval action, not here.
 */

import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/error";
import { serializeData } from "@/app/utils/serializers";
import { revalidatePath } from "next/cache";

export async function processMonthlyProposalCommissions(data: {
  proposalId:       number;
  empNo:            string;
  branchId:         number;
  hierarchyEmpNos?: string[];
  performedById?:   number;
}) {
  const {
    proposalId,
    empNo,
  } = data;

  try {
    const advisor = await prisma.member.findUnique({
      where:   { empNo },
      include: {
        position: { select: { id: true } },
      },
    });

    if (!advisor)          throw new ApiError("ADVISOR_NOT_FOUND", "FA not found", 404);
    if (!advisor.position) throw new ApiError("POSITION_MISSING",  "FA has no position");

    const result = await (prisma as any).$transaction(async (tx: any) => {
      const proposal = await tx.monthlyProposal.findUnique({
        where:  { id: proposalId },
        select: {
          id: true, premium: true, frequency: true,
          commissionsProcessed: true, createdAt: true,
        },
      });

      if (!proposal) throw new ApiError("PROPOSAL_NOT_FOUND", "Monthly proposal not found", 404);

      if (proposal.commissionsProcessed) {
        const existing = await tx.monthlyProposalCommission.findMany({
          where:   { monthlyProposalId: proposalId },
          include: { member: { select: { empNo: true, nameWithInitials: true, position: true } } },
        });
        return serializeData({ alreadyProcessed: true, commissions: existing });
      }

      const approvalDate = new Date();

      await tx.monthlyProposal.update({
        where: { id: proposalId },
        data:  { commissionsProcessed: true, updatedAt: new Date() },
      });

      const updatedAdvisor = await tx.member.update({
        where: { empNo },
        data: {
          lastInvestmentAt:  approvalDate,
          isActive:          true,
          autoDeactivatedAt: null,
        },
      });

      return serializeData({
        alreadyProcessed: false,
        proposal,
        advisor: updatedAdvisor,
        commissions: [],
      });
    }, { timeout: 15000 });

    revalidatePath("/features/monthly-proposals");
    revalidatePath("/features/commissions");

    return { success: true, receipt: result };
  } catch (err: any) {
    console.error("[processMonthlyProposalCommissions] error:", err);
    return { success: false, error: err };
  }
}
