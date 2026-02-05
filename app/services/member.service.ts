import { toast } from "sonner";

export const getMembers = async (id: number) => {
  const res = await fetch(`/api/src/branches/${id}/employee`);

  if (!res.ok) {
    throw new Error("Failed to get member - service");
  }
  return res.json();
};

export const UpdateMembers = async (
  id: string,
  empId: number | undefined,
  formData: any,
) => {
  const res = await fetch(`/api/src/branches/${id}/employee/${empId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  return res;
};

export const deletMember = async (empId: number) => {
  const res = await fetch(`/api/src/employee/id/${empId}`, {
    method: "DELETE",
  });

  return res;
};

export const getEligibleMembers = async (empNo: string, branchId: number) => {
  const members = await fetch(
    `/api/src/commissions/eligible/${empNo}/${branchId}`,
  );

  if (!members.ok) {
    throw new Error("Failed to get eligible members");
  }

  return members.json();
};

export const saveMember = async ({ formData }: any) => {
  try {
    await fetch("/api/src/employee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
  } catch (error) {
    throw new Error("Failed to save member - service" + error);
  }
};

export const getMemberDetails = async (empId: number, branchId: number) => {
  const data = await fetch(`/api/src/branches/${branchId}/employee/${empId}`);
  if (!data.ok) {
    throw new Error("Failed to fetch member details");
  }
  return data.json();
};

export const updateTotalCommission = async (
  empNo: string,
  commission: number,
) => {
  const res = await fetch(`/api/src/employee/id/${empNo}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commission }),
  });

  if (!res.ok) {
    throw new Error("Failed to update total commission");
  }

  return res.json();
};

export const getAllUpperMembers = async (empNo: string, branchId: number) => {
  if (!empNo || !branchId) return null;

  const res = await fetch(`/api/src/commissions/eligible/${empNo}/${branchId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch upper members");
  }

  return res.json();
};

export const handleOrcCommission = async (
  investmentId: number,
  empNo: string,
  branchId: number,
) => {
  const res = await fetch("/api/src/commissions/process", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", //  REQUIRED
    },
    body: JSON.stringify({ investmentId, empNo, branchId }),
  });

  const data = await res.json();
  if (!res.ok) {
    switch (data.error.code) {
      case "COMMISSION_ALREADY_PROCESSED":
        toast.warning("Commission already processed");
        break;

      case "INVESTMENT_NOT_FOUND":
        toast.error("Investment not found");
        break;

      case "ORC_NOT_SET":
        toast.error("Advisor ORC rate is missing");
        break;

      case "ORC_NOT_SET":
        toast.error("Advisor ORC rate is missing");
        break;

      case "ORC_RATE_TOO_HIGH":
        toast.error("ORC Commission rate too high! Possible config error.");
        break;

      case "PERSONAL_RATE_TOO_HIGH":
        toast.error(
          "Personal commission rate too high! Possible config error.",
        );
        break;

      case "NO_TIER":
        toast.error("No personal commission tier found");
        break;

      default:
        toast.error("Unexpected error occurred");
    }
  }
  if (data.receipt.alreadyProcessed) {
    toast.warning("Commission already processed — showing existing receipt");
  } else {
    toast.success("Commission created successfully");
  }

  console.log(data);

  return data.receipt; //  return only res since once did .json
};
