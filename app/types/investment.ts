import { Client } from "./client";
import { ReturnFrequency } from "./enum";
import { FinancialPlan } from "./FinancialPlan";

export interface Investment {
  id: number;

  investmentDate: string | Date;
  amount: number;
  rate?: number | null;
  
  // 1. Add these fields if they aren't there, allowing null
  refNumber?: string | null;
  branchId: number;

  returnFrequency?: ReturnFrequency | null;

  clientId: number;
  client?: Client;

  // 2. Change this from 'planId?: number' to:
  planId?: number | null; 
  plan?: FinancialPlan | null;

  createdAt: string | Date;
  updatedAt: string | Date;
  
  // 3. Add this from your error log
  maturityNotified: boolean; 
}