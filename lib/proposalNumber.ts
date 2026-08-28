import { prisma } from "@/lib/prisma";

export const PROPOSAL_BASE = 500;
const SEQUENCE_ID = 1;

function sequenceFromProposalNo(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/(?:^|\/)(\d+)$/);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) ? number : null;
}

async function getLegacyMax(client: any): Promise<number> {
  const [investments, monthlyProposals] = await Promise.all([
    client.investment.findMany({
      where: {
        proposalFormNo: {
          startsWith: "SG/",
        },
      },
      select: { proposalFormNo: true },
    }),
    client.monthlyProposal.findMany({
      where: {
        proposalFormNo: {
          startsWith: "SG/",
        },
      },
      select: { proposalFormNo: true },
    }),
  ]);

  const numbers = [...investments, ...monthlyProposals]
    .map((row) => {
      const match = row.proposalFormNo?.match(/SG\/\d{2}\/\d{2}\/(\d+)$/);
      return match ? Number(match[1]) : null;
    })
    .filter((number): number is number => number !== null);

  return numbers.length > 0 ? Math.max(...numbers) : 499;
}


function formatProposalNumber(sequence: number, date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `SG/${yy}/${mm}/${sequence}`;
}

/**
 * Reserves one global proposal number inside the caller's Prisma transaction.
 * The singleton row is locked first, so yearly investments and monthly
 * proposals cannot reserve the same sequence even when saved concurrently.
 */
export async function reserveProposalFormNoInTx(tx: any, requested?: string | null, date = new Date()): Promise<string> {
  const rows = await tx.$queryRawUnsafe(
    `SELECT "id", "currentNumber" FROM "ProposalNumberSequence" WHERE "id" = ${SEQUENCE_ID} FOR UPDATE`
  );
  if (!rows.length) throw new Error("Proposal number sequence is not initialized");

  const sequenceRow = rows[0];
  const legacyMax = await getLegacyMax(tx);
  const current = Math.max(
    Number(sequenceRow.currentNumber),
    legacyMax
  );

  if (requested?.trim()) {
    const proposalFormNo = requested.trim();
    const [investment, monthlyProposal] = await Promise.all([
      tx.investment.findFirst({ where: { proposalFormNo }, select: { id: true } }),
      tx.monthlyProposal.findFirst({ where: { proposalFormNo }, select: { id: true } }),
    ]);
    if (investment || monthlyProposal) throw new Error(`Proposal form number ${proposalFormNo} is already in use`);

    const requestedSequence = sequenceFromProposalNo(proposalFormNo);
    if (requestedSequence !== null && requestedSequence > Number(sequenceRow.currentNumber)) {
      await tx.proposalNumberSequence.update({ where: { id: SEQUENCE_ID }, data: { currentNumber: requestedSequence } });
    }
    return proposalFormNo;
  }

  const next = current + 1;

  await tx.proposalNumberSequence.update({
    where: { id: 1 },
    data: { currentNumber: next },
  });

  return formatProposalNumber(next, date);
}

/** Informational preview only; the saved transaction remains authoritative. */
export async function getNextProposalFormNoPreview(): Promise<string> {
  const sequence = await prisma.proposalNumberSequence.findUnique({ where: { id: SEQUENCE_ID } });
  const legacyMax = await getLegacyMax(prisma);
  return formatProposalNumber(Math.max(Number(sequence?.currentNumber ?? PROPOSAL_BASE - 1), legacyMax) + 1);
}
