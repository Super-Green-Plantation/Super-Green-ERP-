import { Status } from "./enum";
import { Investment } from "./investment";

export interface FinancialPlan {
  investment: any;
  id: number;
  name: string;
  duration: number; // months
  rate: number;
  description: string;
  status: Status;

  investments?: Investment[]; // related investments

  createdAt: string | Date;
  updatedAt: string | Date;
}
