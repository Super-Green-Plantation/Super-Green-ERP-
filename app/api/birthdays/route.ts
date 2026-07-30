import { prisma } from "@/lib/prisma";

export async function GET() {
  const employees = await prisma.member.findMany({
    where: { dob: { not: null } },
    select: {
      nameWithInitials: true,
      dob: true,
      phone: true,
      isActive: true,
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

  const windowEnd = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 30,
    23, 59, 59, 999
  ));

  const upcomingBirthdays = employees
    .filter((emp) => {
      if (!emp.dob) return false;
      const dob = new Date(emp.dob);
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

      return birthday >= todayStart && birthday <= windowEnd;
    })
    .map((emp) => {
      const dob = new Date(emp.dob!);

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

      return {
        name: emp.nameWithInitials,
        birthday: birthday.toISOString().split("T")[0], // "YYYY-MM-DD"
        phone: emp.phone ?? null,
        position: emp.position?.title ?? null,
        branch: emp.branches?.map((b) => b.branch?.name).filter(Boolean).join(", ") || null,
      };
    })
    .sort((a, b) => a.birthday.localeCompare(b.birthday)); // ascending by date

  return Response.json({
    window: "next_30_days",
    count: upcomingBirthdays.length,
    birthdays: upcomingBirthdays,
  });
}