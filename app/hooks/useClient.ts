import { useQuery } from "@tanstack/react-query";
import { getClientDetails } from "../services/clients.service";

const mapClientToFormData = (client: any) => ({
  applicant: {
    fullName: client.fullName || "",
    nic: client.nic || "",
    drivingLicense: client.drivingLicense || "",
    passportNo: client.passportNo || "",
    email: client.email || "",
    phoneMobile: client.phoneMobile ? `+94 ${client.phoneMobile}` : "",
    phoneLand: client.phoneLand ? `+94 ${client.phoneLand}` : "",
    investmentAmount: client.investmentAmount
      ? `${client.investmentAmount}`
      : "",
    dateOfBirth: client.dateOfBirth
      ? new Date(client.dateOfBirth).toISOString().split("T")[0]
      : "",
    occupation: client.occupation || "",
    address: client.address || "",
    branchId: client.branch?.name || "",
    idFront: client.idFront || "",
    idBack: client.idBack || "",
    proposal: client.proposal || "",
    agreement: client.agreement || "",
    signature: client.signature || "",
  },
  investment: {
    planId: client.investments?.[0]?.planId?.toString() || "N/A",
  },
  beneficiary: client.beneficiary
    ? {
        fullName: client.beneficiary.fullName || "",
        nic: client.beneficiary.nic || "",
        phone: client.beneficiary.phone || "",
        bankName: client.beneficiary.bankName || "",
        bankBranch: client.beneficiary.bankBranch || "",
        accountNo: client.beneficiary.accountNo || "",
        relationship: client.beneficiary.relationship || "",
      }
    : {},
  nominee: client.nominee
    ? {
        fullName: client.nominee.fullName || "",
        permanentAddress: client.nominee.permanentAddress || "",
        postalAddress: client.nominee.postalAddress || "",
      }
    : {},
});

export const useClient = (clientId: number) => {
  return useQuery({
    queryKey: ["client", clientId],
    queryFn: () => getClientDetails(clientId),
    select: (client) => mapClientToFormData(client),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    enabled: !!clientId,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
