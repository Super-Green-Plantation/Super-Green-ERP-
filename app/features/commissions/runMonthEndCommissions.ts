"use server";

/**
 * Month-end commission runner.
 *
 * Personal, excess, upline ORC, and chairman commissions are calculated once
 * per branch at payroll run — not at investment/MP approval time.
 *
 * Approval time only stamps volume (MonthlyPayroll.volumeAchieved) and
 * marks commissionsProcessed on the investment / monthly proposal.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { computeExcessCommission } from "@/lib/commissions/excess";
import { resolvePositionTarget } from "@/lib/commissions/resolvePositionTarget";

const UPLINE_INVESTMENT_FIELDS = [
  "fmId",
  "bmId",
  "rmId",
  "zmId",
  "agmId",
  "ccoId",
] as const;

const UPLINE_MP_FIELDS = ["fmId", "bmId", "rmId", "zmId"] as const;

const RENEWAL_VOLUME_FACTOR = 0.25;
const CHAIRMAN_RATE = 0.002;
const PROBATION_COMM_RATE_HIGH = 0.10;
const PROBATION_COMM_RATE_LOW = 0.07;
const DEFAULT_COMM_THRESHOLD = 500_000;
const DEFAULT_EXCESS_RATE = 0.005;

const FA_INCLUDE = {
  position: { include: { salary: true, orc: true, positionTargets: true } },
} as const;

async function generateCommissionRef() {
  return `COM-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export type MonthEndCommissionReceipt = {
  alreadyRun: boolean;
  personalCount: number;
  orcCount: number;
  excessCount: number;
  chairmanWritten: boolean;
  totalCommissionWritten: number;
};

function emptyReceipt(alreadyRun: boolean): MonthEndCommissionReceipt {
  return {
    alreadyRun,
    personalCount: 0,
    orcCount: 0,
    excessCount: 0,
    chairmanWritten: false,
    totalCommissionWritten: 0,
  };
}

function creditedInvestmentVolume(amount: number, renewedFromId: number | null): number {
  return renewedFromId ? amount * RENEWAL_VOLUME_FACTOR : amount;
}

function monthWindow(year: number, month: number) {
  return {
    monthStart: new Date(Date.UTC(year, month - 1, 1)),
    monthEnd: new Date(Date.UTC(year, month, 1)),
  };
}

/** Approved-this-month filter for monthly proposals (reviewedAt, fallback createdAt). */
function approvedThisMonthFilter(monthStart: Date, monthEnd: Date): Prisma.MonthlyProposalWhereInput {
  return {
    approvalStatus: "APPROVED",
    OR: [
      { reviewedAt: { gte: monthStart, lt: monthEnd } },
      { AND: [{ reviewedAt: null }, { createdAt: { gte: monthStart, lt: monthEnd } }] },
    ],
  };
}

type FaBucket = {
  empNo: string;
  status: string;
  position: {
    salary: {
      commThreshold: number | null;
      commRateHigh: number | null;
      commRateLow: number | null;
    } | null;
    positionTargets: any[];
  } | null;
  probationStartDate: string | null;
  totalVolume: number;
  representativeInvestmentId: number | null;
};

function addFaVolume(
  faMap: Map<number, FaBucket>,
  faId: number | null | undefined,
  fa: any,
  volume: number,
  investmentId: number | null,
) {
  if (!faId || !fa) return;
  const existing = faMap.get(faId);
  if (existing) {
    existing.totalVolume += volume;
    if (existing.representativeInvestmentId == null && investmentId != null) {
      existing.representativeInvestmentId = investmentId;
    }
    return;
  }
  faMap.set(faId, {
    empNo: fa.empNo,
    status: fa.status,
    position: fa.position ?? null,
    probationStartDate: fa.probationStartDate ?? null,
    totalVolume: volume,
    representativeInvestmentId: investmentId,
  });
}

function addUplineVolume(
  map: Map<number, number>,
  memberId: number | null | undefined,
  volume: number,
) {
  if (!memberId) return;
  map.set(memberId, (map.get(memberId) ?? 0) + volume);
}

function personalCommRate(fa: FaBucket, isHighRate: boolean): number {
  if (fa.status === "PERMANENT") {
    return isHighRate
      ? Number(fa.position?.salary?.commRateHigh ?? 0.08)
      : Number(fa.position?.salary?.commRateLow ?? 0.05);
  }
  return isHighRate ? PROBATION_COMM_RATE_HIGH : PROBATION_COMM_RATE_LOW;
}

async function writeCommission(
  tx: Prisma.TransactionClient,
  data: {
    investmentId: number | null;
    memberEmpNo: string;
    amount: number;
    type: "PERSONAL" | "UPLINE" | "EXCESS" | "CHAIRMAN";
    branchId: number;
    month: number;
    year: number;
  },
) {
  await tx.commission.create({
    data: {
      ...(data.investmentId != null ? { investmentId: data.investmentId } : {}),
      memberEmpNo: data.memberEmpNo,
      amount: data.amount,
      type: data.type,
      refNumber: await generateCommissionRef(),
      branchId: data.branchId,
      month: data.month,
      year: data.year,
    },
  });
  await tx.member.update({
    where: { empNo: data.memberEmpNo },
    data: { totalCommission: { increment: data.amount } },
  });
}

export async function runMonthEndCommissions(
  branchId: number,
  year: number,
  month: number,
): Promise<MonthEndCommissionReceipt> {
  const { monthStart, monthEnd } = monthWindow(year, month);

  return prisma.$transaction(async (tx) => {
    // Idempotency: any PERSONAL/EXCESS/UPLINE row for this branch/month means
    // the runner already fired. CHAIRMAN is company-wide and has its own guard.
    const alreadyRun = await tx.commission.findFirst({
      where: {
        month,
        year,
        branchId,
        type: { in: ["PERSONAL", "EXCESS", "UPLINE"] },
      },
      select: { id: true },
    });
    if (alreadyRun) return emptyReceipt(true);

    const investments = await tx.investment.findMany({
      where: {
        branchId,
        approvalStatus: "APPROVED",
        investmentDate: { gte: monthStart, lt: monthEnd },
      },
      include: { fa: { include: FA_INCLUDE } },
    });

    const monthlyProposals = await tx.monthlyProposal.findMany({
      where: {
        branchId,
        ...approvedThisMonthFilter(monthStart, monthEnd),
      },
      include: { fa: { include: FA_INCLUDE } },
    });

    const faMap = new Map<number, FaBucket>();
    const uplineVolumeMap = new Map<number, number>();

    for (const inv of investments) {
      const volume = creditedInvestmentVolume(Number(inv.amount), inv.renewedFromId);
      addFaVolume(faMap, inv.faId, inv.fa, volume, inv.id);
      for (const field of UPLINE_INVESTMENT_FIELDS) {
        addUplineVolume(uplineVolumeMap, inv[field], volume);
      }
    }

    for (const mp of monthlyProposals) {
      const volume = Number(mp.premium);
      addFaVolume(faMap, mp.faId, mp.fa, volume, null);
      for (const field of UPLINE_MP_FIELDS) {
        addUplineVolume(uplineVolumeMap, mp[field], volume);
      }
    }

    let personalCount = 0;
    let excessCount = 0;
    let orcCount = 0;
    let chairmanWritten = false;
    let totalCommissionWritten = 0;

    // ── FA personal + excess ────────────────────────────────────────────────
    for (const [, fa] of faMap) {
      if (fa.totalVolume <= 0) continue;

      const commThreshold = Number(fa.position?.salary?.commThreshold ?? DEFAULT_COMM_THRESHOLD);
      const isHighRate = fa.totalVolume >= commThreshold;
      const commRate = personalCommRate(fa, isHighRate);
      const personalAmount = fa.totalVolume * commRate;

      if (personalAmount > 0) {
        await writeCommission(tx, {
          investmentId: fa.representativeInvestmentId,
          memberEmpNo: fa.empNo,
          amount: personalAmount,
          type: "PERSONAL",
          branchId,
          month,
          year,
        });
        personalCount += 1;
        totalCommissionWritten += personalAmount;
      }

      const positionTarget = resolvePositionTarget(
        {
          status: fa.status,
          probationStartDate: fa.probationStartDate,
          position: fa.position,
        },
        year,
        month,
      );
      const target = Number(positionTarget?.targetAmount ?? 0);
      if (target > 0) {
        const excessRate = Number(positionTarget?.excessRate ?? DEFAULT_EXCESS_RATE);
        const { excessCommission } = computeExcessCommission({
          investmentAmount: fa.totalVolume,
          priorVolumeThisMonth: 0,
          target,
          excessRate,
        });
        if (excessCommission > 0) {
          await writeCommission(tx, {
            investmentId: fa.representativeInvestmentId,
            memberEmpNo: fa.empNo,
            amount: excessCommission,
            type: "EXCESS",
            branchId,
            month,
            year,
          });
          excessCount += 1;
          totalCommissionWritten += excessCommission;
        }
      }
    }

    // ── ORC / upline ────────────────────────────────────────────────────────
    const uplineIds = [...uplineVolumeMap.keys()];
    const uplineMembers =
      uplineIds.length > 0
        ? await tx.member.findMany({
            where: { id: { in: uplineIds } },
            include: { position: { include: { orc: true } } },
          })
        : [];

    // Representative investment for ORC rows (first branch investment this month).
    const orcInvestmentId = investments[0]?.id ?? null;

    for (const member of uplineMembers) {
      const volume = uplineVolumeMap.get(member.id) ?? 0;
      if (volume <= 0 || !member.position?.orc) continue;

      const orcRate =
        member.status === "PERMANENT"
          ? Number(member.position.orc.ratePermanent)
          : Number(member.position.orc.rateNonPermanent);
      if (orcRate <= 0 || orcRate > 1) continue;

      const orcAmount = volume * orcRate;
      if (orcAmount <= 0) continue;

      await writeCommission(tx, {
        investmentId: orcInvestmentId,
        memberEmpNo: member.empNo,
        amount: orcAmount,
        type: "UPLINE",
        branchId,
        month,
        year,
      });
      orcCount += 1;
      totalCommissionWritten += orcAmount;
    }

    // ── Chairman (company-wide, once per month) ─────────────────────────────
    const existingChairman = await tx.commission.findFirst({
      where: { type: "CHAIRMAN", month, year },
      select: { id: true },
    });

    if (!existingChairman) {
      const allInvestments = await tx.investment.findMany({
        where: {
          approvalStatus: "APPROVED",
          investmentDate: { gte: monthStart, lt: monthEnd },
        },
        select: { amount: true, renewedFromId: true, id: true },
      });
      const allMps = await tx.monthlyProposal.findMany({
        where: approvedThisMonthFilter(monthStart, monthEnd),
        select: { premium: true },
      });

      let companyTotalVolume = 0;
      for (const inv of allInvestments) {
        companyTotalVolume += creditedInvestmentVolume(Number(inv.amount), inv.renewedFromId);
      }
      for (const mp of allMps) {
        companyTotalVolume += Number(mp.premium);
      }

      const chairmanAmount = companyTotalVolume * CHAIRMAN_RATE;
      const chairmanMember = await tx.member.findFirst({
        where: { isActive: true, position: { title: "CHAIRMEN" } },
        select: { empNo: true },
      });

      if (chairmanMember && chairmanAmount > 0) {
        await writeCommission(tx, {
          investmentId: allInvestments[0]?.id ?? orcInvestmentId,
          memberEmpNo: chairmanMember.empNo,
          amount: chairmanAmount,
          type: "CHAIRMAN",
          branchId,
          month,
          year,
        });
        chairmanWritten = true;
        totalCommissionWritten += chairmanAmount;
      }
    }

    return {
      alreadyRun: false,
      personalCount,
      orcCount,
      excessCount,
      chairmanWritten,
      totalCommissionWritten,
    };
  }, { timeout: 30000 });
}
