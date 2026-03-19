import { RowConfig } from "../features/hr/targets/components/shared";

export interface PositionWithTargets {
  id: number;
  title: string;
  rank: number;
  orc: {
    ratePermanent: number;
    rateNonPermanent: number;
  } | null;
  positionTargets: RowConfig[];

  createdAt: string | Date;
  updatedAt: string | Date;
}