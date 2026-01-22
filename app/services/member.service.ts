import { Member } from "../types/member";

export const getMembers = async (id: number) => {
  const res = await fetch(`/api/src/branches/${id}/employee`);

  if (!res.ok) {
    throw new Error("Failed to get member - service");
  }
  return res.json();
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
