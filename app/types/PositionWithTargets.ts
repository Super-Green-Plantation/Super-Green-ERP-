// PositionWithTargets.ts
import { RowConfig } from "../features/hr/targets/components/shared";

export interface PositionTargetRow extends RowConfig {
  id: number;
  positionId: number;
}

export interface PositionWithTargets {
  id: number;
  title: string;
  rank: number;
  isProbation: boolean;
  orc: {
    ratePermanent: number;
    rateNonPermanent: number;
  } | null;
  positionTargets: PositionTargetRow[];
  createdAt: string | Date;
  updatedAt: string | Date;
}