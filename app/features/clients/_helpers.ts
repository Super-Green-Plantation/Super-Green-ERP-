// actions/clients/_helpers.ts

import { titleToHierarchySlot, HierarchySlot } from '@/lib/hierarchy'
import { prisma } from '@/lib/prisma'

type HierarchyResult = {
  faId:  number | null
  fmId:  number | null
  bmId:  number | null
  rmId:  number | null
  zmId:  number | null
  agmId: number | null
  ccoId: number | null
}

export async function resolveClientHierarchy(
  bringerId: number
): Promise<HierarchyResult> {
  const result: HierarchyResult = {
    faId: null, fmId: null, bmId: null,
    rmId: null, zmId: null, agmId: null, ccoId: null,
  }

  let currentId: number | null = bringerId

  while (currentId !== null) {
    const member:any = await prisma.member.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        reportingPersons: true,
        position: {
          select: { title: true }
        },
      },
    })

    if (!member) break

    const slot = titleToHierarchySlot(member.position.title)

    if (slot === 'FA'  && result.faId  === null) result.faId  = member.id
    if (slot === 'FM'  && result.fmId  === null) result.fmId  = member.id
    if (slot === 'BM'  && result.bmId  === null) result.bmId  = member.id
    if (slot === 'RM'  && result.rmId  === null) result.rmId  = member.id
    if (slot === 'ZM'  && result.zmId  === null) result.zmId  = member.id
    if (slot === 'AGM' && result.agmId === null) result.agmId = member.id
    if (slot === 'CCO' && result.ccoId === null) result.ccoId = member.id

    const uplineEmpNo = member.reportingPersons?.[0] ?? null
    if (!uplineEmpNo) break

    const upline = await prisma.member.findUnique({
      where: { empNo: uplineEmpNo },
      select: { id: true },
    })
    currentId = upline?.id ?? null
  }

  return result
}

export async function upsertVolumeAchieved(
  tx: any,
  memberIds: (number | null)[],
  amount: number,
  investmentDate: Date,
) {
  const year  = investmentDate.getFullYear();
  const month = investmentDate.getMonth() + 1;

  const uniqueIds = [...new Set(memberIds.filter((id): id is number => id !== null))];

  for (const memberId of uniqueIds) {
    const position = await tx.member.findUnique({
      where: { id: memberId },
      select: { positionId: true, position: { select: { monthlyTarget: false, salary: true } } },
    });

    // Get this member's target for the month from PositionSalary or PositionTarget
    const target = await tx.positionTarget.findFirst({
      where: { positionId: position?.positionId },
      select: { target: true },
    });

    await tx.monthlyPayroll.upsert({
      where: { memberId_year_month: { memberId, year, month } },
      create: {
        memberId,
        year,
        month,
        volumeAchieved: amount,
        monthlyTarget:  target?.target ?? 0,
      },
      update: {
        volumeAchieved: { increment: amount },
      },
    });
  }
}