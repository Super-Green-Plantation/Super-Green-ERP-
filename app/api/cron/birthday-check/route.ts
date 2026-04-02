import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function GET(req: NextRequest) {
  //  Auth check
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  //  Fetch employees
  const employees = await prisma.member.findMany({
    where: {
      dob: { not: null },
    },
    select: {
      nameWithInitials: true,
      dob: true,
      phone: true,
    },
  });

  const now = new Date();

  // Start of today (UTC midnight)
  const todayStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));

  // End of day, 7 days from today
  const weekEnd = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 7,
    23, 59, 59, 999
  ));

const upcomingBirthdays = employees.filter((emp) => {
  if (!emp.dob) return false;

  const dob = new Date(emp.dob as Date); // Prisma returns Date, not string
  if (isNaN(dob.getTime())) return false;

  let birthday = new Date(Date.UTC(
    now.getUTCFullYear(),
    dob.getUTCMonth(),
    dob.getUTCDate()
  ));

  if (birthday < todayStart) {
    birthday = new Date(Date.UTC(
      now.getUTCFullYear() + 1,
      dob.getUTCMonth(),
      dob.getUTCDate()
    ));
  }

  return birthday >= todayStart && birthday <= weekEnd;
});
  //  No birthdays
  if (upcomingBirthdays.length === 0) {
    return NextResponse.json({
      message: "No birthdays in next 7 days.",
    });
  }

  //  Build message
  const lines = upcomingBirthdays.map(
    (emp) => `• ${emp.nameWithInitials} — ${emp.phone ?? "No phone"} - ${new Date(emp.dob as Date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
  );

  const message =
    `🎂 *SGP Upcoming Birthdays*\n\n` +
    `Next 7 days (${upcomingBirthdays.length}):\n\n` +
    lines.join("\n");

  //Send via Twilio
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: process.env.NOTIFY_WHATSAPP_TO!,
    body: message,
  });

  // Response
  return NextResponse.json({
    message: `Notified ${upcomingBirthdays.length} birthday(s).`,
    employees: upcomingBirthdays.map((e) => e.nameWithInitials),
  });
}