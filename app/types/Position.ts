import { CommissionRate, Member } from "./member";

export interface Position {
  id: number;
  title: string;
  baseSalary: number;
  commissionRate?: CommissionRate;

  members?: Member[];

  createdAt: string | Date;
  updatedAt: string | Date;
}