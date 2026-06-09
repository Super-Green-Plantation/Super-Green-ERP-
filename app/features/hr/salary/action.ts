import { Prisma } from "@prisma/client";

type TransactionClient = Prisma.TransactionClient;

type HierarchyRole = "fmId" | "bmId" | "rmId" | "zmId" | "agmId" | "ccoId";

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

  const isActivated = activationCount >= 4;

  await tx.monthlyActivation.upsert({
    where: { memberId_year_month: { memberId, year, month } },
    create: { memberId, year, month, activationCount, isActivated },
    update: { activationCount, isActivated },
  });
}

export async function upsertActivationsForInvestment(
  tx: TransactionClient,
  hierarchy: {
    fmId?: number | null;
    bmId?: number | null;
    rmId?: number | null;
    zmId?: number | null;
    agmId?: number | null;
    ccoId?: number | null;
  },
  year: number,
  month: number,
) {
  const roles: HierarchyRole[] = ["fmId", "bmId", "rmId", "zmId", "agmId", "ccoId"];

  await Promise.all(
    roles
      .filter((role) => !!hierarchy[role])
      .map((role) =>
        upsertActivationForMember(tx, hierarchy[role]!, role, year, month)
      )
  );
}
