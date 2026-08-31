"use server";

/**
 * processMonthlyProposalCommissions
 *
 * Commission rules (from Pension/Child/Marriage plan docx):
 *
 *   Frequency       | Min Premium  | Commission Rate
 *   ────────────────|──────────────|────────────────
 *   Monthly         | Rs. 15,000   | 2.5%
 *   Quarterly       | Rs. 50,000   | 5.0%
 *   Semi-Annual     | Rs. 100,000  | 7.0%
 *   Annual          | Rs. 200,000  | 8.0%
 *
 * Commission base  = proposal.premium (first installment amount)
 * Personal rate    = fixed by frequency (above) — no volume threshold
 * Excess           = NOT applicable for monthly proposals
 * ORC / upline     = same position-based ORC rates as yearly investments
 *
 * Place at: app/features/commissions/processMonthlyProposal.ts
 */

import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/error";
import { serializeData } from "@/app/utils/serializers";
import { revalidatePath } from "next/cache";

// ─── Commission rates by frequency ───────────────────────────────────────────

const FREQ_COMMISSION_RATE: Record<string, number> = {
  MONTHLY:     0.025,  // 2.5%
  QUARTERLY:   0.05,   // 5%
  SEMI_ANNUAL: 0.07,   // 7%
  ANNUAL:      0.08,   // 8%
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateCommissionRef(): Promise<string> {
  return `MPC-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function processMonthlyProposalCommissions(data: {
  proposalId:       number;
  empNo:            string;           // FA empNo
  branchId:         number;
  hierarchyEmpNos?: string[];         // [fmEmpNo, bmEmpNo, rmEmpNo, zmEmpNo] in rank order
  performedById?:   number;
}) {
  const {
    proposalId,
    empNo,
    branchId,
    hierarchyEmpNos = [],
  } = data;

  try {
    // ── Resolve FA ───────────────────────────────────────────────────────────
    const advisor = await prisma.member.findUnique({
      where:   { empNo },
      include: {
        position: {
          include: { orc: true },
        },
      },
    });

    if (!advisor)          throw new ApiError("ADVISOR_NOT_FOUND", "FA not found", 404);
    if (!advisor.position) throw new ApiError("POSITION_MISSING",  "FA has no position");

    // ── Resolve uplines ──────────────────────────────────────────────────────
    let uplines: any[] = [];
    if (hierarchyEmpNos.length > 0) {
      uplines = await prisma.member.findMany({
        where:   { empNo: { in: hierarchyEmpNos } },
        include: {
          position: { include: { orc: true } },
          branches: { include: { branch: true } },
        },
      });
      // Sort by the order passed in
      uplines.sort(
        (a, b) => hierarchyEmpNos.indexOf(a.empNo) - hierarchyEmpNos.indexOf(b.empNo)
      );
    }

    const chairmanUpline = uplines.length > 0 ? uplines[uplines.length - 1] : null;
    const CHAIRMAN_ORC_RATE = 0.02;

    const result = await (prisma as any).$transaction(async (tx: any) => {
      const createdCommissions: any[] = [];

      // ── Fetch proposal ───────────────────────────────────────────────────
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

      // ── Commission base and rate ─────────────────────────────────────────
      const commissionBase = Number(proposal.premium);
      const commRate       = FREQ_COMMISSION_RATE[proposal.frequency] ?? 0.025;
      const personalAmount = commissionBase * commRate;

      const approvalDate = new Date();
      const year  = approvalDate.getFullYear();
      const month = approvalDate.getMonth() + 1;

      // ── Mark commissions processed ───────────────────────────────────────
      await tx.monthlyProposal.update({
        where: { id: proposalId },
        data:  { commissionsProcessed: true, updatedAt: new Date() },
      });

      // ── FA totalCommission + lastInvestmentAt ────────────────────────────
      const updatedAdvisor = await tx.member.update({
        where: { empNo },
        data: {
          totalCommission:   { increment: personalAmount },
          lastInvestmentAt:  approvalDate,
          isActive:          true,
          autoDeactivatedAt: null,
        },
      });

      // ── Personal commission record ────────────────────────────────────────
      const personalRecord = await tx.monthlyProposalCommission.create({
        data: {
          monthlyProposalId: proposalId,
          memberEmpNo:       empNo,
          branchId,
          amount:            personalAmount,
          type:              "PERSONAL",
          refNumber:         await generateCommissionRef(),
          month,
          year,
        },
        include: {
          member: { select: { empNo: true, nameWithInitials: true, position: { select: { title: true } } } },
        },
      });
      createdCommissions.push(personalRecord);

      // ── ORC / upline commissions ─────────────────────────────────────────
      // Same ORC rates from position config as yearly investments.
      // Chairman (top of hierarchy) gets CHAIRMAN_ORC_RATE × total MP volume
      // this month for this FA. Others get their position ORC rate × premium.
      for (const upline of uplines) {
        if (!upline.position?.orc) continue;

        const isChairman = upline.empNo === chairmanUpline?.empNo;
        let uplineAmount: number;

        if (isChairman) {
          // Chairman ORC = 2% of total approved MP premium volume this month for this FA
          const monthStart = new Date(Date.UTC(year, month - 1, 1));
          const monthEnd   = new Date(Date.UTC(year, month, 1));
          const volResult  = await tx.monthlyProposal.aggregate({
            where: {
              faId:           advisor.id,
              approvalStatus: "APPROVED",
              createdAt:      { gte: monthStart, lt: monthEnd },
            },
            _sum: { premium: true },
          });
          const totalVol = Number(volResult._sum.premium ?? 0);
          uplineAmount   = totalVol * CHAIRMAN_ORC_RATE;
        } else {
          const orcRate = upline.status === "PERMANENT"
            ? Number(upline.position.orc.ratePermanent)
            : Number(upline.position.orc.rateNonPermanent);
          if (orcRate === 0) continue;
          uplineAmount = commissionBase * orcRate;
        }

        if (uplineAmount <= 0) continue;

        await tx.member.update({
          where: { empNo: upline.empNo },
          data: {
            totalCommission:   { increment: uplineAmount },
            ...(upline.autoDeactivatedAt ? { isActive: true, autoDeactivatedAt: null } : {}),
          },
        });

        const uplineRecord = await tx.monthlyProposalCommission.create({
          data: {
            monthlyProposalId: proposalId,
            memberEmpNo:       upline.empNo,
            amount:            uplineAmount,
            type:              isChairman ? "CHAIRMAN" : "UPLINE",
            refNumber:         await generateCommissionRef(),
            branchId,
            month,
            year,
          },
          include: {
            member: { select: { empNo: true, nameWithInitials: true, position: { select: { title: true } } } },
          },
        });
        createdCommissions.push(uplineRecord);
      }

      return serializeData({
        alreadyProcessed: false,
        proposal,
        advisor: updatedAdvisor,
        commissions: createdCommissions,
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