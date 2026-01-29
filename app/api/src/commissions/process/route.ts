import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "../../utils/errorHelper";
import { PrismaClient } from "@prisma/client";

export async function POST(req: NextRequest) {
  const {
    investmentId,
    empNo, // advisor
    branchId,
  } = await req.json();

  console.log(investmentId, empNo, branchId);

  try {
    const res = await prisma.$transaction(async (tx:any) => {
      const createdCommissions: any = [];
      // 2. Load investment
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
              select: {
                empNo: true,
                name: true,
                position: true,
              },
            },
          },
        });

        return {
          alreadyProcessed: true,
          investment,
          commissions: existingCommissions,
        };
      }

      const updatedInvestment = await tx.investment.update({
        where: { id: investmentId },
        data: { commissionsProcessed: true },
      });

      const advisor = await tx.member.findUnique({
        where: { empNo },
        include: {
          position: {
            include: { orc: true },
          },
        },
      });

      if (!advisor)
        throw new ApiError("ADVISOR_NOT_FOUND", "Advisor not found", 404);

      if (!advisor.position)
        throw new ApiError("POSITION_MISSING", "Advisor has no position");

      if (!advisor.position.orc)
        throw new ApiError("ORC_NOT_SET", "Advisor ORC not set");

      // 4. PERSONAL commission
      const personalComm = await tx.personalCommissionTier.findFirst({
        where: { positionId: advisor.positionId },
      });

      if (!personalComm) {
        throw new ApiError("NO_TIER", "No personal commission tier found");
      }
      const personalRate = Number(personalComm.rate) / 100; // if DB stores 7

      if (personalRate > 10) {
        throw new ApiError("PERSONAL_RATE_TOO_HIGH", "Personal commission rate too high! Possible config error.");
        
      }

      const personalCommission = investment.amount * Number(personalRate);

      const member = await tx.member.update({
        where: { empNo },
        data: {
          totalCommission: {
            increment: personalCommission, //  SAFE increment
          },
        },
      });

      const commission = await tx.commission.create({
        data: {
          investmentId,
          memberEmpNo: empNo,
          amount: personalCommission,
          type: "PERSONAL",
        },
      });

      createdCommissions.push(commission);

      //  6. UPLINE commissions
      const uplines = await tx.member.findMany({
        where: {
          branchId,
          position: {
            rank: {
              gt: advisor.position.rank,
            },
          },
        },
        include: {
          position: {
            include: { orc: true },
          },
        },
      });

      for (const upline of uplines) {
        if (!upline.position?.orc) continue;

        const uplineRate = Number(upline.position.orc.rate) / 100;

        if (uplineRate > 1) {
          throw new ApiError("ORC_RATE_TOO_HIGH", "ORC Commission rate too high! Possible config error.");
        
        }

        const uplineCommission = investment.amount * uplineRate;

        await tx.member.update({
          where: { empNo: upline.empNo },
          data: {
            totalCommission: {
              increment: uplineCommission,
            },
          },
        });

        const uplineComm = await tx.commission.create({
          data: {
            investmentId,
            memberEmpNo: upline.empNo,
            amount: uplineCommission,
            type: "UPLINE",
          },
        });

        createdCommissions.push(uplineComm);
      }
      return {
        alreadyProcessed: false,
        investment: updatedInvestment,
        advisor: member,
        commissions: createdCommissions,
      };
    });

    return NextResponse.json({
      success: true,
      receipt: res,
    });
  } catch (err: any) {
    console.error(err);

    if (err instanceof ApiError) {
      return NextResponse.json(
        {
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: err.status },
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Something went wrong",
        },
      },
      { status: 500 },
    );
  }
}
