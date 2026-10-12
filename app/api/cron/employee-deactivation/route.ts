// Daily cron — finds non-management, active employees (FA/TL level) who have
// no activity in the past 2 months, deactivates their account, and creates an
// in-app Notification for each deactivation.
//
// "No activity in 2 months" means the employee:
//   1. Has lastInvestmentAt null or older than 60 days, AND
//   2. Does NOT appear in the hierarchy (faId/fmId/bmId/rmId/zmId/agmId/ccoId)
//      of any APPROVED investment within the last 60 days.
//
// Rule: if an employee is in the investment hierarchy they must stay active,
// even if they personally brought no new business.
//
// Only targets employees whose position is NOT management (isManagement=false),
// matching the field-advisor deactivation intent.

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

  // Find active, non-management field employees with no personal investment in 2 months
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

  // ── Exclude members who appear in the investment hierarchy within the cutoff ──
  // An employee should stay active if they are in the hierarchy of ANY
  // investment approved in the last 2 months — even if they didn't personally
  // bring that investment (i.e. they appear as FA, FM, BM, RM, ZM, AGM, or CCO).
  const recentHierarchyInvestments = await prisma.investment.findMany({
    where: {
      investmentDate: { gte: cutoff },
      approvalStatus: "APPROVED",
    },
    select: {
      faId: true,
      fmId: true,
      bmId: true,
      rmId: true,
      zmId: true,
      agmId: true,
      ccoId: true,
    },
  });

  const activeHierarchyMemberIds = new Set<number>();
  for (const inv of recentHierarchyInvestments) {
    for (const id of [inv.faId, inv.fmId, inv.bmId, inv.rmId, inv.zmId, inv.agmId, inv.ccoId]) {
      if (id !== null && id !== undefined) activeHierarchyMemberIds.add(id);
    }
  }

  // Filter out candidates who are still active via the investment hierarchy
  const toDeactivate = candidates.filter((m) => !activeHierarchyMemberIds.has(m.id));

  if (toDeactivate.length === 0) {
    return Response.json({ deactivated: 0 });
  }

  const now = new Date();

  const notifications = toDeactivate.map((m) => {
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
      body: `${m.nameWithInitials} (${m.empNo}) — ${m.position.title}, ${branch} — deactivated due to no investment activity in 2 months. ${lastInv}`,
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

  const memberIds = toDeactivate.map((m) => m.id);
  const userIds = toDeactivate.map((m) => m.userId).filter(Boolean) as string[];

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
    deactivated: toDeactivate.length,
    members: toDeactivate.map((m) => ({
      empNo: m.empNo,
      name: m.nameWithInitials,
    })),
  });
}