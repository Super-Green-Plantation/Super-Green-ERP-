import { Client } from "./client";
import { ReturnFrequency } from "./enum";
import { FinancialPlan } from "./FinancialPlan";

export interface Investment {
  id: number;

  investmentDate: string | Date;
  amount: number;
  rate: number;

  returnFrequency: ReturnFrequency;

  clientId: number;
  client?: Client;

  planId?: number;
  plan?: FinancialPlan;

  createdAt: string | Date;
  updatedAt: string | Date;
}