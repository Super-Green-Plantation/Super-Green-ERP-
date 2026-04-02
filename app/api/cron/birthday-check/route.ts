import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function GET(req: NextRequest) {
  // 🔐 Auth check
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 📦 Fetch employees
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

  // 🕒 Current time (UTC-safe)
  const now = new Date();

  // 📅 Next 7 days
  const nextWeek = new Date(now);
  nextWeek.setUTCDate(now.getUTCDate() + 7);

  // 🎂 Filter upcoming birthdays
  const upcomingBirthdays = employees.filter((emp) => {
    if (!emp.dob) return false;

    // ✅ Ensure proper parsing
    const dob = new Date(String(emp.dob).replace(" ", "T"));

    if (isNaN(dob.getTime())) return false;

    // 🎯 Birthday in this year (UTC)
    let birthday = new Date(Date.UTC(
      now.getUTCFullYear(),
      dob.getUTCMonth(),
      dob.getUTCDate()
    ));

    // 🔁 If already passed → move to next year
    if (birthday < now) {
      birthday.setUTCFullYear(now.getUTCFullYear() + 1);
    }

    return birthday >= now && birthday <= nextWeek;
  });

  // 🚫 No birthdays
  if (upcomingBirthdays.length === 0) {
    return NextResponse.json({
      message: "No birthdays in next 7 days.",
    });
  }

  // 📝 Build message
  const lines = upcomingBirthdays.map(
    (emp) => `• ${emp.nameWithInitials} — ${emp.phone ?? "No phone"}`
  );

  const message =
    `🎂 *SGP Upcoming Birthdays*\n\n` +
    `Next 7 days (${upcomingBirthdays.length}):\n\n` +
    lines.join("\n");

  // 📲 Send via Twilio
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: process.env.NOTIFY_WHATSAPP_TO!,
    body: message,
  });

  // ✅ Response
  return NextResponse.json({
    message: `Notified ${upcomingBirthdays.length} birthday(s).`,
    employees: upcomingBirthdays.map((e) => e.nameWithInitials),
  });
}