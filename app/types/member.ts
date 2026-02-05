export interface Member {
  id: number;
  name: string;
  email: string;
  empNo: string;
  phone: string;
  totalCommission: number;
  position: Position;
}

export interface Position {
  orc: any;
  id: number;
  title: string;
  baseSalary: number;
  createdAt: string;
  updatedAt: string;
  commissionRate:CommissionRate;
   personalCommissionTiers:PersonalCommissionTiers[]
}

export interface PersonalCommissionTiers{
  id: number;
  positionId:number;
  minAmount:number;
  rate:number
}

export interface CommissionRate {
  id: number;
  rate: number;
  positionId: number;
  position?: Position;

  createdAt: string | Date;
  updatedAt: string | Date;
}