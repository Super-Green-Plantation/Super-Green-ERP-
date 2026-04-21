import { useQuery } from "@tanstack/react-query";
import { getClientById } from "../features/clients/actions";

const mapClientToFormData = (client: any) => ({
  applicant: {
    id: client.id,
    fullName: client.fullName || "",

    nic: client.nic || "",
    drivingLicense: client.drivingLicense || "",
    passportNo: client.passportNo || "",
    email: client.email || "",
    phoneMobile: client.phoneMobile || "",
    phoneLand: client.phoneLand || "",
    investmentAmount: client.investmentAmount
      ? `${client.investmentAmount}`
      : "",
    dateOfBirth: client.dateOfBirth
      ? new Date(client.dateOfBirth).toISOString().split("T")[0]
      : "",
    occupation: client.occupation || "",
    address: client.address || "",
    branchId: client.branch?.id || "",
    idFront: client.idFront || "",
    idBack: client.idBack || "",
    paymentSlip: client.paymentSlip || "",
    proposal: client.proposal || "",
    proposalFormNo: client.proposalFormNo || "",
    agreement: client.agreement || "",
    signature: client.signature || "",
  },
  investment: {
    planId: client.investments?.map((p:any)=>p.planId?.toString()) || "",
    refNumber: client.investments?.map((ref:any) => ref.refNumber) || [],
  },
  beneficiaries: client.beneficiaries?.length
    ? client.beneficiaries.map((b: any) => ({
      id: b.id,
      fullName: b.fullName || "",
      nic: b.nic || "",
      phone: b.phone || "",
      bankName: b.bankName || "",
      bankBranch: b.bankBranch || "",
      accountNo: b.accountNo || "",
      relationship: b.relationship || "",
    }))
    : [emptyBeneficiary],
  nominees: client.nominees?.length
    ? client.nominees.map((n: any) => ({
      id:n.id,
      fullName: n.fullName || "",
      nic: n.nic || "",
      permanentAddress: n.permanentAddress || "",
      postalAddress: n.postalAddress || "",
    }))
    : [emptyNominee],
  investments: client.investments || [],
  
});

export const useClient = (clientId: number) => {
  return useQuery({
    queryKey: ["client", clientId],
    queryFn: () => getClientById(clientId),
    select: mapClientToFormData,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    enabled: !!clientId,
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

export const emptyBeneficiary = {
  fullName: "",
  nic: "",
  phone: "",
  bankName: "",
  bankBranch: "",
  accountNo: "",
  relationship: "",
};

export const emptyNominee = {
  nic: "",
  fullName: "",
  permanentAddress: "",
  postalAddress: "",
};