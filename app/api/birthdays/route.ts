import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // 🔐 Auth check
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🎂 Birthday cron started");

    // 📦 Fetch employees
    const employees = await prisma.member.findMany({
      where: {
        dob: { not: null },
      },
      select: {
        nameWithInitials: true,
        dob: true,
        phone: true,
        position: { select: { title: true } },
        branches: {
          select: {
            branch: { select: { name: true } },
          },
        },
      },
    });

    const now = new Date();

    const todayStart = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));

    const weekEnd = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 7,
      23, 59, 59, 999
    ));

    // 🎯 Filter upcoming birthdays
    const upcomingBirthdays = employees.filter((emp) => {
      if (!emp.dob) return false;

      const dob = new Date(emp.dob as Date);
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

    // 🧾 Build message
    if (upcomingBirthdays.length === 0) {
      console.log("No birthdays in next 7 days.");
      return NextResponse.json({
        message: "No birthdays in next 7 days.",
      });
    }

    const lines = upcomingBirthdays.map((emp) => {
      const branchNames =
        emp.branches?.map((b) => b.branch?.name).filter(Boolean).join(", ") ||
        "No branch";

      return `• ${emp.nameWithInitials} — ${emp.position?.title ?? "No position"} — ${branchNames} — ${emp.phone ?? "No phone"} - ${new Date(emp.dob as Date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    });

    const message =
      `🎂 SGP Upcoming Birthdays\n\n` +
      `Next 7 days (${upcomingBirthdays.length}):\n\n` +
      lines.join("\n");

    // 🖨️ Console output
    console.log("=================================");
    console.log(message);
    console.log("=================================");

    // 📤 Return response (for testing)
    return NextResponse.json({
      message,
      count: upcomingBirthdays.length,
    });

  } catch (err: any) {
    console.error("❌ CRON ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}