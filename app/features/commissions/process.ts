"use server"

import { ApiError } from "@/lib/error";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { prisma } from "@/lib/prisma";
import { getUplineChain } from "./actions";
import { serializeData } from "@/app/utils/serializers";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/logActivity";
import { ActivityAction, ActivityEntity } from "@prisma/client";


export async function generateCommissionRef() {
  return `COM-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function processCommissions(data: {
  investmentId: number;
  empNo: string;
  branchId: number;
  disabledEmpNos?: string[];   // members toggled off in UI — fully skipped
  manualEmpNos?: string[];     // manually added members to receive ORC
}) {
  const {
    investmentId,
    empNo,
    branchId,
    disabledEmpNos = [],
    manualEmpNos = [],
  } = data;

  const disabledSet = new Set(disabledEmpNos);

  try {
    const currentUser = await getCurrentUserWithRole();

    const advisor = await prisma.member.findUnique({
      where: { empNo },
      include: {
        position: {
          include: {
            orc: true,
            salary: true,
          },
        },
      },
    });

    if (!advisor) throw new ApiError("ADVISOR_NOT_FOUND", "Advisor not found", 404);

    // Fetch upline chain for the advisor
    const uplines = await getUplineChain(advisor.position.rank, branchId);

    // Fetch manually added members with their ORC config
    const manualMembers =
      manualEmpNos.length > 0
        ? await prisma.member.findMany({
          where: { empNo: { in: manualEmpNos } },
          include: {
            position: {
              include: { orc: true, salary: true },
            },
          },
        })
        : [];

    const result = await prisma.$transaction(async (tx) => {
      const createdCommissions: any[] = [];

      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
      });

      if (!investment)
        throw new ApiError("INVESTMENT_NOT_FOUND", "Investment not found", 404);

      if (investment.commissionsProcessed) {
        const existingCommissions = await tx.commission.findMany({
          where: { investmentId },
          include: {
            member: {
              select: { empNo: true, nameWithInitials: true, position: true },
            },
          },
        });
        return serializeData({
          alreadyProcessed: true,
          investment,
          commissions: existingCommissions,
        });
      }

      if (!advisor.position)
        throw new ApiError("POSITION_MISSING", "Advisor has no position");

      const isManagement = advisor.position.type === "MANAGEMENT";

      // Only enforce salary config for non-management, non-probation employees
      if (!isManagement && advisor.status !== "PROBATION" && !advisor.position.salary) {
        throw new ApiError("SALARY_CONFIG_MISSING", "No salary config for position");
      }

      const investmentDate = new Date(investment.investmentDate); // or investment.startDate
      const year = investmentDate.getFullYear();
      const month = investmentDate.getMonth() + 1;

      const commThreshold = Number(advisor.position.salary?.commThreshold ?? 500000);
      const isHighRate = investment.amount >= commThreshold;

      // Management treated as permanent for commission rate purposes
      const isPermanentOrManagement = advisor.status === "PERMANENT" || isManagement;

      const commRate = isPermanentOrManagement
        ? isHighRate
          ? Number(advisor.position.salary?.commRateHigh ?? 0.08)
          : Number(advisor.position.salary?.commRateLow ?? 0.05)
        : isHighRate
          ? 0.1
          : 0.07;

      const personalCommissionAmount = investment.amount * commRate;

      await tx.investment.update({
        where: { id: investmentId },
        data: { commissionsProcessed: true, advisorId: advisor.id },
      });

      // const payrollMemberIds = [
      //   advisor.id,
      //   ...uplines.filter(u => !disabledSet.has(u.empNo)).map(u => u.id),
      //   ...manualMembers.filter(m => !disabledSet.has(m.empNo)).map(m => m.id),
      // ];

      // await Promise.all(
      //   payrollMemberIds.map(memberId =>
      //     tx.monthlyPayroll.upsert({
      //       where: { memberId_year_month: { memberId, year, month } },
      //       update: { volumeAchieved: { increment: investment.amount } },
      //       create: { memberId, year, month, basicSalaryPermanent: 0, monthlyTarget: 0, volumeAchieved: investment.amount },
      //     })
      //   )
      // );

      // Step 3 — advisor commission
      const updatedAdvisor = await tx.member.update({
        where: { empNo },
        data: { totalCommission: { increment: personalCommissionAmount } },
      });

      const personalCommissionRecord = await tx.commission.create({
        data: {
          investmentId,
          memberEmpNo: empNo,
          branchId,
          amount: personalCommissionAmount,
          type: "PERSONAL",
          refNumber: generateCommissionRef()
        } as any,
        include: { member: { include: { position: true } } },
      });
      createdCommissions.push(personalCommissionRecord);


      // upline commissions (no payroll upserts here anymore)
      for (const upline of uplines) {
        if (disabledSet.has(upline.empNo)) continue;
        if (!upline.position?.orc) continue;

        const orcRate = upline.status === "PERMANENT"
          ? upline.position.orc.ratePermanent
          : upline.position.orc.rateNonPermanent;

        const uplineRate = Number(orcRate);
        if (uplineRate === 0) continue;
        if (uplineRate > 1) throw new ApiError("ORC_RATE_TOO_HIGH", "ORC rate too high");

        const uplineAmount = investment.amount * uplineRate;

        await tx.member.update({ where: { empNo: upline.empNo }, data: { totalCommission: { increment: uplineAmount } } });

        const uplineCommissionRecord = await tx.commission.create({
          data: { investmentId, memberEmpNo: upline.empNo, amount: uplineAmount, type: "UPLINE", refNumber: generateCommissionRef(), branchId } as any,
          include: { member: { include: { position: true } } },
        });
        createdCommissions.push(uplineCommissionRecord);
      }

      // --- Manually added members (flat, same ORC formula) ---
      for (const manual of manualMembers) {
        if (disabledSet.has(manual.empNo)) continue;
        if (!manual.position?.orc) continue;

        const orcRate = manual.status === "PERMANENT"
          ? manual.position.orc.ratePermanent
          : manual.position.orc.rateNonPermanent;

        const manualRate = Number(orcRate);
        if (manualRate === 0) continue;
        if (manualRate > 1) throw new ApiError("ORC_RATE_TOO_HIGH", "ORC rate too high");

        const manualAmount = investment.amount * manualRate;

        await tx.member.update({ where: { empNo: manual.empNo }, data: { totalCommission: { increment: manualAmount } } });

        const manualCommissionRecord = await tx.commission.create({
          data: { investmentId, memberEmpNo: manual.empNo, amount: manualAmount, type: "UPLINE", refNumber: generateCommissionRef(), branchId } as any,
          include: { member: { include: { position: true } } },
        });
        createdCommissions.push(manualCommissionRecord);
      }

      return serializeData({ alreadyProcessed: false, investment, advisor: updatedAdvisor, commissions: createdCommissions });
    }, { timeout: 15000 });

    revalidatePath("/features/commissions");

    void logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.COMMISSION,
      entityId: investmentId,
      performedById: currentUser?.member?.id ?? 0,
      branchId,
      metadata: {
        investmentId,
        advisorEmpNo: empNo,
        processedAt: new Date().toISOString(),
        disabledEmpNos,
        manualEmpNos,
      },
    });

    return { success: true, receipt: serializeData(result) };
  } catch (err: any) {
    console.error("Error processing commissions:", err);

    if (err instanceof ApiError) {
      return {
        success: false,
        error: { code: err.code, message: err.message },
      };
    }

    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    };
  }
}