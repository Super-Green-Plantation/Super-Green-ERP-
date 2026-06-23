import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function buildChain(memberId: number, visited = new Set<number>()): Promise<string[]> {
  if (visited.has(memberId)) return []; // prevent infinite loop
  visited.add(memberId);

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { empNo: true, recruitedById: true },
  });

  if (!member) return [];
  if (!member.recruitedById) return [];

  const manager = await prisma.member.findUnique({
    where: { id: member.recruitedById },
    select: { empNo: true },
  });

  if (!manager) return [];

  // Recursively build the chain upward
  const upperChain = await buildChain(member.recruitedById, visited);
  return [manager.empNo, ...upperChain];
}

async function main() {
  const allMembers = await prisma.member.findMany({
    select: { id: true, empNo: true, recruitedById: true, nameWithInitials: true },
  });

  console.log(`Backfilling ${allMembers.length} members...`);

  for (const member of allMembers) {
    const reportingPersons = await buildChain(member.id);

    await prisma.member.update({
      where: { id: member.id },
      data: { reportingPersons },
    });

    console.log(
      `✓ ${member.empNo} (${member.nameWithInitials}) → [${reportingPersons.join(", ")}]`
    );
  }

  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});