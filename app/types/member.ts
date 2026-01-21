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
  id: number;
  title: string;
  baseSalary: number;
  createdAt: string;
  updatedAt: string;
  commissionRate:CommissionRate
}

export interface CommissionRate {
  id: number;
  rate: number;
  positionId: number;
  position?: Position;

  createdAt: string | Date;
  updatedAt: string | Date;
}