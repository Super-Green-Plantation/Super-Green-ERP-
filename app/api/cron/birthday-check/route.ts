import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Today's month and day in Sri Lanka time
    // const today = new Date(
    //     new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" })
    // );
    // const month = today.getMonth() + 1; // 1–12
    // const day = today.getDate();

    // Fetch employees whose birthday month/day matches today
    // birthDay is stored as a string e.g. "1990.04.01"
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

    // Today (Sri Lanka time)
    const today = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" })
    );

    // End date (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const upcomingBirthdays = employees.filter((emp) => {
        if (!emp.dob) return false;

        const dob = new Date(String(emp.dob).replace(" ", "T"));

        // Create birthday in current year
        const thisYearBirthday = new Date(
            today.getFullYear(),
            dob.getMonth(),
            dob.getDate()
        );

        // Handle year wrap (Dec → Jan)
        if (thisYearBirthday < today) {
            thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        return thisYearBirthday >= today && thisYearBirthday <= nextWeek;
    });

    if (upcomingBirthdays.length === 0) {
        return NextResponse.json({ message: "No birthdays today." });
    }

    // Build message
    if (upcomingBirthdays.length === 0) {
        return NextResponse.json({ message: "No birthdays in next 7 days." });
    }

    const lines = upcomingBirthdays.map(
        (emp) => `• ${emp.nameWithInitials} — ${emp.phone ?? "No phone"}`
    );

    const message =
        `🎂 *SGP Upcoming Birthdays*\n\n` +
        `Next 7 days (${upcomingBirthdays.length}):\n\n` +
        lines.join("\n");

    // Send WhatsApp via Twilio
    const client = twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
    );

    await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM!,
        to: process.env.NOTIFY_WHATSAPP_TO!,
        body: message,
    });

    return NextResponse.json({
        message: `Notified ${upcomingBirthdays.length} birthday(s).`,
        employees: upcomingBirthdays.map((e) => e.nameWithInitials),
    });
}