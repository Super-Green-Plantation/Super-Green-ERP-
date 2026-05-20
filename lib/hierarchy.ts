// lib/hierarchy.ts

import { Title } from "@prisma/client"

export type HierarchySlot = 'FA' | 'FM' | 'BM' | 'RM' | 'ZM' | 'AGM' | 'CCO' | null

export function titleToHierarchySlot(title: Title): HierarchySlot {
  switch (title) {
    case 'FA':
    case 'P_FA':
    case 'TRAINEE_FA':
    case 'P_TL':
    case 'OPM':
    case 'HR':
    case 'ACC':
    case 'IT':
    case 'PRO':
    case 'CLEANING':
      return 'FA'

    case 'TL':
      return 'FM'

    case 'BM':
    case 'JBM':
    case 'SBM':
    case 'ABM':
      return 'BM'

    case 'RM':
    case 'JRM':
    case 'SRM':
      return 'RM'

    case 'ZM':
    case 'JZM':
    case 'SZM':
      return 'ZM'

    case 'PRO_AGM':
    case 'PER_AGM':
      return 'AGM'

    case 'COO':
      return 'CCO'

    case 'ADMIN':
    case 'CHAIRMEN':
    case 'DGM':
    case 'GM':
    case 'SE':
    default:
      return null
  }
}