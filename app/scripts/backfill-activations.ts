import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type HierarchyRole = "fmId" | "bmId" | "rmId" | "zmId" | "agmId" | "ccoId";
type TransactionClient = Prisma.TransactionClient;

async function upsertActivationForMember(
  tx: TransactionClient,
  memberId: number,
  role: HierarchyRole,
  year: number,
  month: number,
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const investments = await tx.investment.findMany({
    where: {
      [role]: memberId,
      investmentDate: { gte: startDate, lt: endDate },
      faId: { not: null },
    },
    select: {
      faId: true,
      fmId: true,
      bmId: true,
      rmId: true,
      zmId: true,
      agmId: true,
    },
  });

  const uniqueFaIds  = new Set(investments.map((i) => i.faId).filter(Boolean));
  const uniqueFmIds  = new Set(investments.filter((i) => i.fmId !== memberId).map((i) => i.fmId).filter(Boolean));
  const uniqueBmIds  = new Set(investments.filter((i) => i.bmId !== memberId).map((i) => i.bmId).filter(Boolean));
  const uniqueRmIds  = new Set(investments.filter((i) => i.rmId !== memberId).map((i) => i.rmId).filter(Boolean));
  const uniqueZmIds  = new Set(investments.filter((i) => i.zmId !== memberId).map((i) => i.zmId).filter(Boolean));
  const uniqueAgmIds = new Set(investments.filter((i) => i.agmId !== memberId).map((i) => i.agmId).filter(Boolean));

  const activationCount = {
    fmId:  uniqueFaIds.size,
    bmId:  uniqueFaIds.size + uniqueFmIds.size,
    rmId:  uniqueFaIds.size + uniqueFmIds.size + uniqueBmIds.size,
    zmId:  uniqueFaIds.size + uniqueFmIds.size + uniqueBmIds.size + uniqueRmIds.size,
    agmId: uniqueFaIds.size + uniqueFmIds.size + uniqueBmIds.size + uniqueRmIds.size + uniqueZmIds.size,
    ccoId: uniqueFaIds.size + uniqueFmIds.size + uniqueBmIds.size + uniqueRmIds.size + uniqueZmIds.size + uniqueAgmIds.size,
  }[role];

  await tx.monthlyActivation.upsert({
    where: { memberId_year_month: { memberId, year, month } },
    create: { memberId, year, month, activationCount, isActivated: activationCount >= 4 },
    update: { activationCount, isActivated: activationCount >= 4 },
  });
}

export async function backfillActivations() {
  const roles: HierarchyRole[] = ["fmId", "bmId", "rmId", "zmId", "agmId", "ccoId"];

  const investments = await prisma.investment.findMany({
    where: { faId: { not: null } },
    select: {
      fmId: true, bmId: true, rmId: true,
      zmId: true, agmId: true, ccoId: true,
      investmentDate: true,
    },
  });

  // Collect unique (role, memberId, year, month) combos
  const keys = new Set<string>();
  for (const inv of investments) {
    const year = inv.investmentDate.getFullYear();
    const month = inv.investmentDate.getMonth() + 1;
    for (const role of roles) {
      const id = inv[role];
      if (id) keys.add(`${role}:${id}:${year}:${month}`);
    }
  }

  let processed = 0;
  const errors: string[] = [];

  for (const key of keys) {
    const [role, memberId, year, month] = key.split(":");
    try {
      await prisma.$transaction(async (tx) => {
        await upsertActivationForMember(
          tx,
          Number(memberId),
          role as HierarchyRole,
          Number(year),
          Number(month),
        );
      });
      processed++;
    } catch (e) {
      errors.push(`${key}: ${String(e)}`);
    }
  }

  return { processed, errors };
}