import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest) {
  const investments = await prisma.investment.findMany({
    select: {
      id: true,
      amount: true,
      investmentDate: true,

      client: {
        select: {
          fullName: true,
        },
      },

      plan: {
        select: {
          name: true,
        },
      },

      advisor: {
        select: {
          name: true,
          branch: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(investments);
}
