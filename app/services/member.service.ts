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

export const saveOrcCommission = async (
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

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to save commission");
  }

  return res.json(); //  IMPORTANT
};
