export interface FormData {
  applicant: {
    fullName?: string;
    nic?: string;
    drivingLicense?: string;
    passportNo?: string;
    email?: string;
    phoneMobile?: string;
    phoneLand?: string;
    dateOfBirth?: string;
    occupation?: string;
    address?: string;
    branchId?: string;
    investmentAmount?:string;
  };
  investment: { planId?: string };
  beneficiary: {
    fullName?: string;
    nic?: string;
    phone?: string;
    bankName?: string;
    bankBranch?: string;
    accountNo?: string;
    relationship?: string;
  };
  nominee: {
    fullName?: string;
    permanentAddress?: string;
    postalAddress?: string;
  };
}