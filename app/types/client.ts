import { Branch } from "./branch";
import { Status } from "./enum";
import { Investment } from "./investment";

export interface Client {
  id: number;

  fullName: string;
  nic?: string;
  drivingLicense?: string;
  passportNo?: string;

  email?: string;
  phoneMobile?: string;
  phoneLand?: string;

  dateOfBirth?: string | Date;
  occupation?: string;

  address: string;

  branchId: number;
  branch?: Branch; // optional if included in query

  status: Status;

  investments?: Investment[];
  beneficiary?: Beneficiary;
  nominee?: Nominee;

  createdAt: string | Date;
  updatedAt: string | Date;
}


export interface Beneficiary {
  id: number;

  fullName: string;
  nic?: string;
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
  permanentAddress: string;
  postalAddress?: string;

  clientId: number;
  client?: Client;

  createdAt: string | Date;
  updatedAt: string | Date;
}