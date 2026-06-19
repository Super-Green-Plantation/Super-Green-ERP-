import { ReturnFrequency } from "@prisma/client";
import { Client } from "./client";
import { FinancialPlan } from "./FinancialPlan";
import { Member } from "./member"; // add this import

export interface Investment {
  id: number;
  investmentDate: string | Date;
  amount: number;
  rate?: number | null;
  refNumber?: string | null;
  branchId: number;
  returnFrequency?: ReturnFrequency | null;
  clientId: number;
  client?: Client;
  planId?: number | null;
  plan?: FinancialPlan | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  maturityNotified: boolean;

  // Hierarchy member IDs (saved at approval)
  faId?: number | null;
  fmId?: number | null;
  bmId?: number | null;
  rmId?: number | null;
  zmId?: number | null;
  agmId?: number | null;
  ccoId?: number | null;

  // Hydrated hierarchy members (populated when included in query)
  fa?:  Member | null;
  fm?:  Member | null;
  bm?:  Member | null;
  rm?:  Member | null;
  zm?:  Member | null;
  agm?: Member | null;
  cco?: Member | null;
}