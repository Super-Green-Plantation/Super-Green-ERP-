import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Today's month and day in Sri Lanka time
    const today = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" })
    );
    const month = today.getMonth() + 1; // 1–12
    const day = today.getDate();

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

    const todaysBirthdays = employees.filter((emp) => {
        if (!emp.dob) return false;
        // Convert dob to Sri Lanka time
        const dobSL = new Date(
            new Date(emp.dob).toLocaleString("en-US", { timeZone: "Asia/Colombo" })
        );
        return dobSL.getMonth() + 1 === month && dobSL.getDate() === day;
    });

    if (todaysBirthdays.length === 0) {
        return NextResponse.json({ message: "No birthdays today." });
    }

    // Build message
    const lines = todaysBirthdays.map(
        (emp) => `• ${emp.nameWithInitials} — ${emp.phone ?? "No phone"}`
    );
    const message =
        `🎂 *SGP Birthday Alert — ${today.toDateString()}*\n\n` +
        `Today's birthdays (${todaysBirthdays.length}):\n\n` +
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
        message: `Notified ${todaysBirthdays.length} birthday(s).`,
        employees: todaysBirthdays.map((e) => e.nameWithInitials),
    });
}