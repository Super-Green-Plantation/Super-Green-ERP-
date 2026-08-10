// app/api/cron/investment-maturity/route.ts
//
// Daily cron — finds investments maturing within the next 30 days that haven't
// been notified yet, creates an in-app Notification for each, and marks the
// investment as notified so we don't fire again.
//
// Triggered by vercel.json:
//   { "path": "/api/cron/investment-maturity", "schedule": "0 2 * * *" }

import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // Protect from non-Vercel callers in production
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + 30);

  // Investments maturing in the next 30 days, not yet notified, still Active
  const maturing = await prisma.investment.findMany({
    where: {
      status: "Active",
      maturityNotified: false,
      maturityDate: {
        gte: now,
        lte: windowEnd,
      },
    },
    include: {
      client: { select: { fullName: true, nic: true } },
      plan: { select: { name: true, duration: true } },
    },
  });

  if (maturing.length === 0) {
    return Response.json({ notified: 0 });
  }

  // Create one Notification per maturing investment
  const notifications = maturing.map((inv) => {
    const maturityDate = inv.maturityDate!;
    const daysLeft = Math.ceil(
      (maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const formattedDate = maturityDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return {
      type: "INVESTMENT_MATURITY" as const,
      title: `Investment Maturing in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
      body: `${inv.client.fullName}${inv.client.nic ? ` (${inv.client.nic})` : ""} — ${
        inv.plan?.name ?? "Investment"
      } matures on ${formattedDate}. Ref: ${inv.refNumber ?? inv.id}.`,
      metadata: {
        investmentId: inv.id,
        clientId: inv.clientId,
        maturityDate: maturityDate.toISOString(),
        amount: inv.amount,
        refNumber: inv.refNumber,
      },
    };
  });

  await prisma.$transaction([
    prisma.notification.createMany({ data: notifications }),
    // Mark all as notified so we don't re-fire tomorrow
    prisma.investment.updateMany({
      where: { id: { in: maturing.map((i) => i.id) } },
      data: { maturityNotified: true },
    }),
  ]);

  return Response.json({ notified: maturing.length });
}