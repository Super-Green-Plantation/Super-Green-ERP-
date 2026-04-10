import { Branch } from "./branch";
import { Status } from "./enum";
import { Investment } from "./investment";

export interface Client {
  id: number;
  fullName: string;
  
  // Update these to accept null
  nic: string | null; 
  drivingLicense?: string | null;
  passportNo?: string | null;

  email?: string | null;
  phoneMobile?: string | null;
  phoneLand?: string | null;

  dateOfBirth?: string | Date | null;
  occupation?: string | null;

  address: string;

  branchId: number;
  branch?: Partial<Branch>;

  status: Status;

  // Prisma often returns arrays for relations, 
  // ensure these match your API response (plural vs singular)
  investments?: Investment[];
  beneficiaries?: Beneficiary[]; // Changed to array if that's what API returns
  nominees?: Nominee[];       // Changed to array if that's what API returns

  createdAt: string | Date;
  updatedAt: string | Date;
}


export interface Beneficiary {
  id: number;

  fullName: string;
  nic?: string |  null;
  phone: string;

  bankName: string;
  bankBranch: string;
  accountNo: string;

  relationship: string;

  clientId: number;
  client?: Client;

  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Nominee {
  id: number;

  fullName: string;
  permanentAddress?: string |  null;
  postalAddress?: string |  null;

  clientId: number;
  client?: Client;

  createdAt: string | Date;
  updatedAt: string | Date;
}