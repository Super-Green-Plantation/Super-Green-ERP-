import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "../../utils/errorHelper";

export async function POST(req: NextRequest) {
  const {
    investmentId,
    empNo, // advisor
    branchId,
  } = await req.json();

  console.log(investmentId, empNo, branchId);

  try {
    await prisma.$transaction(async (tx) => {
      //alreadyProcessed = any commission exists for investmentId
      // const alreadyProcessed = await tx.commission.count({
      //   where: { investmentId },
      // });

      // if (alreadyProcessed > 0) {
      //   throw new ApiError(
      //     "COMMISSION_ALREADY_PROCESSED",
      //     "Commission already processed for this investment",
      //     409,
      //   );
      // }

      // 2. Load investment
      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
      });

      if (!investment)
        throw new ApiError("INVESTMENT_NOT_FOUND", "Investment not found", 404);

      if (investment.commissionsProcessed)
        throw new ApiError(
          "COMMISSION_ALREADY_PROCESSED",
          "Commission already processed for this investment",
          409,
        );

      await tx.investment.update({
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
      const personalCommission = investment.amount * advisor.position.orc.rate;

      await tx.member.update({
        where: { empNo },
        data: {
          totalCommission: {
            increment: personalCommission, //  SAFE increment
          },
        },
      });

      await tx.commission.create({
        data: {
          investmentId,
          memberEmpNo: empNo,
          amount: personalCommission,
          type: "PERSONAL",
        },
      });

      // 🔁 6. UPLINE commissions
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

        const uplineCommission = investment.amount * upline.position.orc.rate;

        await tx.member.update({
          where: { empNo: upline.empNo },
          data: {
            totalCommission: {
              increment: uplineCommission,
            },
          },
        });

        await tx.commission.create({
          data: {
            investmentId,
            memberEmpNo: upline.empNo,
            amount: uplineCommission,
            type: "UPLINE",
          },
        });
      }
    });

    return NextResponse.json({ success: true });
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
