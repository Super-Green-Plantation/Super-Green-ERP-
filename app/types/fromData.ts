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
   
  };
  investment: { 
    planId?: string
     amount?: string;
   };
  beneficiaries: BeneficiaryData[];
  nominees: NomineeData[];
}

type BeneficiaryData = {
  fullName?: string;
  nic?: string;
  phone?: string;
  bankName?: string;
  bankBranch?: string;
  accountNo?: string;
  relationship?: string;
};

type NomineeData = {
  fullName?: string;
  permanentAddress?: string;
  postalAddress?: string;
};