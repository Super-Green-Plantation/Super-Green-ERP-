import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const {
    investmentId,
    empNo, // advisor
    branchId,
  } = await req.json();

  console.log(investmentId, empNo, branchId);

  try {
    await prisma.$transaction(async (tx) => {
      const alreadyProcessed = await tx.commission.findUnique({
        where: { investmentId },
      });

      if (alreadyProcessed) {
        throw new Error("Commission already processed");
      }

      // 2. Load investment
      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
      });

      if (!investment) throw new Error("Investment not found");

      const advisor = await tx.member.findUnique({
        where: { empNo },
        include: {
          position: {
            include: { orc: true },
          },
        },
      });

      if (!advisor) throw new Error("Advisor not found");
      if (!advisor.position) throw new Error("Advisor has no position");
      if (!advisor.position.orc) throw new Error("Advisor ORC not set");

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
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
