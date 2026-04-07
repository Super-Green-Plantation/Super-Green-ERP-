
export interface MemberBranch {
  id: number;
  memberId: number;
  branchId: number;
  branch?: {
    id: number;
    name: string;
    status: string;
    location?: string | null;
  };
}

export interface Member {
  id: number;
  empNo: string;
  epfNo:string;
  etfNo: string;
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
  reportingPersons?: string[];
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

  // In formData initial state
  status: "PROBATION" | "PERMANENT" | "MANAGEMENT";
  probationStartDate: string | null;

  // --- Timestamps ---
  createdAt: string | Date;
  updatedAt: string | Date;
  profilePic:string | undefined
  isActive: boolean;
}

export interface Position {
  orc: any;
  id: number;
  title: string;
  rank: number;
  baseSalary: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  commissionRate?: CommissionRate;
  personalCommissionTiers: PersonalCommissionTiers[];
  salary?: PositionSalary;
}

export interface PositionSalary {
  id: number;
  positionId: number;
  basicSalaryPermanent: number;
  monthlyTarget: number;
  incentiveAmount: number;
  allowanceAmount: number;
  orcRate: number;       // stored as decimal, e.g. 0.02 = 2%
  commRateLow: number;
  commRateHigh: number;
  commThreshold: number;
  epfEmployee: number;
  epfEmployer: number;
  etfEmployer: number;
  allowanceThresholdProbation: number;
  allowanceThresholdPermanent: number;
}

export interface PersonalCommissionTiers {
  id: number;
  positionId: number;
  minAmount: number;
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

export interface EmpModalProps {
  mode: "add" | "edit";
  initialData?: Member;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface EmpData {
  // name: string;
  empNo: string;
  epfNo: string;
  positionId: number;

  // Replaces branchId — always at least one entry (the current branch)
  branchIds: number[];

  // Basic contact
  email?: string;
  phone?: string;
  phone2?: string;
  totalCommission: number;

  // Name variants
  nameWithInitials?: string;

  // Personal
  nic?: string;
  dob?: string;
  gender?: string;
  civilStatus?: string;
  address?: string;

  // Employment
  reportingPersons?: string[];
  dateOfJoin?: string;
  appointmentLetter?: string;
  confirmation?: string;
  remark?: string;

  status: "PROBATION" | "PERMANENT" | "MANAGEMENT";
  probationStartDate: string | null;

  // Banking
  accNo?: string;
  bank?: string;
  bankBranch?: string;
  profilePic?: string;
  isActive:boolean;
}

export type FormData = {
  empNo: string;
  epfNo: string;
  etfNo: string;
  positionId: string;
  branchIds: number[];

  email: string;
  phone: string;
  phone2: string;
  totalCommission: number;

  nameWithInitials: string;

  nic: string;
  dob: string;
  gender: string;
  civilStatus: string;
  address: string;

  reportingPersons: string[]; // ✅ important

  dateOfJoin: string;
  appointmentLetter: string;
  confirmation: string;
  remark: string;

  accNo: string;
  bank: string;
  bankBranch: string;

  status: "PROBATION" | "PERMANENT" | "MANAGEMENT";
  probationStartDate: string;

  profilePic: string;
  isActive: boolean;
};