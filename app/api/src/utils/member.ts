import { prisma } from "./prisma";

export async function getUpperMembers(
  empNo: string,
  branchId?: number
) {
  const member = await prisma.member.findUnique({
    where: { empNo },
    include: { position: true },
  });

  return prisma.member.findMany({
    where: {
      ...(branchId && { branchId }),
      position: {
        rank: {
          gt: member?.position.rank,
        },
      },
    },
    include: {
      position: {
        include: { orc: true, personalCommissionTiers: true },
      },
    },
  });
}
