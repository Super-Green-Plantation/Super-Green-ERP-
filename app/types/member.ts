
export interface MemberBranch {
  id: number;
  memberId: number;
  branchId: number;
  branch?: {
    id: number;
    name: string;
    location?: string | null;
  };
}

export interface Member {
  id: number;

  // --- Core (required) ---
  name: string;
  empNo: string;
  position: Position;

  // --- Branch(es) ---
  branches: MemberBranch[];

  // --- Basic contact ---
  email: string | null;
  phone: string | null;
  phone2: string | null;
  totalCommission: number;

  // --- Name variants ---
  nameWithInitials: string | null;

  // --- Personal ---
  nic: string | null;
  dob: string | Date | null;
  birthday: string | Date | null;
  gender: string | null;
  civilStatus: string | null;
  address: string | null;

  // --- Employment ---
  reportingPerson: string | null;
  dateOfJoin: string | Date | null;
  appointmentLetter: string | null;
  confirmation: string | null;
  remark: string | null;

  // --- Banking ---
  accNo: string | null;
  bank: string | null;
  bankBranch: string | null;

  // --- Auth link ---
  userId: string | null;

  // --- Timestamps ---
  createdAt: string | Date;
  updatedAt: string | Date;
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