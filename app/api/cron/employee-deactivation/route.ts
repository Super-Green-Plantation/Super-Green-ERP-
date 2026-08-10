// app/api/cron/employee-deactivation/route.ts
//
// Daily cron — finds non-management, active employees (FA/TL level) who have
// brought no investment in the past 2 months, deactivates their account, and
// creates an in-app Notification for each deactivation.
//
// "No investment in 2 months" is determined by:
//   - lastInvestmentAt is null (never brought one), OR
//   - lastInvestmentAt < 60 days ago
//
// Only targets employees whose position is NOT management (isManagement=false),
// matching the field-advisor deactivation intent.
//
// Triggered by vercel.json:
//   { "path": "/api/cron/employee-deactivation", "schedule": "0 0 1 * *" }
//   (runs on the 1st of each month at midnight — adjust as needed)

import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60); // 60 days ago = 2 months

  // Find active, non-management field employees with no investment in 2 months
  const candidates = await prisma.member.findMany({
    where: {
      isActive: true,
      position: { isManagement: false },
      OR: [
        { lastInvestmentAt: null },
        { lastInvestmentAt: { lt: cutoff } },
      ],
    },
    select: {
      id: true,
      nameWithInitials: true,
      empNo: true,
      userId: true,
      lastInvestmentAt: true,
      position: { select: { title: true } },
      branches: {
        where: { isPrimary: true },
        select: { branch: { select: { name: true } } },
        take: 1,
      },
    },
  });

  if (candidates.length === 0) {
    return Response.json({ deactivated: 0 });
  }

  const now = new Date();

  const notifications = candidates.map((m) => {
    const branch = m.branches[0]?.branch?.name ?? "Unknown Branch";
    const lastInv = m.lastInvestmentAt
      ? `Last investment: ${m.lastInvestmentAt.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}.`
      : "No investments recorded.";

    return {
      type: "EMPLOYEE_DEACTIVATION" as const,
      title: `Employee Auto-Deactivated`,
      body: `${m.nameWithInitials} (${m.empNo}) — ${m.position.title}, ${branch} — deactivated due to no investment in 2 months. ${lastInv}`,
      metadata: {
        memberId: m.id,
        empNo: m.empNo,
        positionTitle: m.position.title,
        branch,
        lastInvestmentAt: m.lastInvestmentAt?.toISOString() ?? null,
        deactivatedAt: now.toISOString(),
      },
    };
  });

  const memberIds = candidates.map((m) => m.id);
  const userIds = candidates.map((m) => m.userId).filter(Boolean) as string[];

  await prisma.$transaction([
    // Deactivate member records
    prisma.member.updateMany({
      where: { id: { in: memberIds } },
      data: { isActive: false, autoDeactivatedAt: now },
    }),
    // Suspend their user login if they have one
    ...(userIds.length > 0
      ? [
          prisma.user.updateMany({
            where: { id: { in: userIds }, status: true },
            data: { status: false },
          }),
        ]
      : []),
    // Create notifications
    prisma.notification.createMany({ data: notifications }),
  ]);

  return Response.json({
    deactivated: candidates.length,
    members: candidates.map((m) => ({
      empNo: m.empNo,
      name: m.nameWithInitials,
    })),
  });
}