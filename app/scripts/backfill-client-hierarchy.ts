// scripts/backfill-client-hierarchy.ts

import { prisma } from '@/lib/prisma'
import { resolveClientHierarchy } from '../features/clients/_helpers'
import { PrismaClient } from '@prisma/client'



async function main() {
  const clients = await prisma.client.findMany({
    where: { memberId: { not: null }, faId: null },
    select: { id: true, memberId: true },
  })

  console.log(`Backfilling ${clients.length} clients...`)

  for (const client of clients) {
    const hierarchy = await resolveClientHierarchy(client.memberId!)

    await prisma.client.update({
      where: { id: client.id },
      data: hierarchy,
    })
  }

  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())