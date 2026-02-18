export interface Member {
  id: number;
  name: string;
  email: string | null;
  empNo: string;
  phone: string | null;
  totalCommission: number;
  position: Position;
}

export interface Position {
  orc: any;
  id: number;
  title: string;
  baseSalary: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  commissionRate?: CommissionRate;
   personalCommissionTiers:PersonalCommissionTiers[]
}

export interface PersonalCommissionTiers{
  id: number;
  positionId:number;
  minAmount:number;
  rate: any;
}

export interface CommissionRate {
  id: number;
  rate: any;
  positionId: number;
  position?: Position;

  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface EmployeesPage {
  emp: Member[];
  nextCursor: number | null;
}