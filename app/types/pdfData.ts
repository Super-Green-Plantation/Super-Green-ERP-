type PdfData = {
  clientName: string;
  clientNic: string;
  clientPhone: string;
  nominees: {
    fullName: string;
    permanentAddress: string;
    postalAddress?: string;
  }[];
  beneficiaries: {
    fullName: string;
    nic?: string;
    phone: string;
    bankName: string;
    bankBranch: string;
    accountNo: string;
    relationship: string;
  }[];
  commissions: {
    memberEmpNo: string;
    type: string;
    amount: number;
    createdAt: string;
  }[];
  signatureUrl?: string;
  clientPhoto?: string;
};
