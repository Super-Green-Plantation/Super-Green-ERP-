// app/api/cron/birthday-debug/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" })
  );

  const employees = await prisma.member.findMany({
    where: { dob: { not: null } },
    select: { nameWithInitials: true, dob: true },
    take: 5,
  });

  return NextResponse.json({
    serverToday: today,
    month: today.getMonth() + 1,
    day: today.getDate(),
    sampleDobs: employees.map((e) => ({
      name: e.nameWithInitials,
      rawDob: e.dob,
      stringified: String(e.dob),
    })),
  });
}
