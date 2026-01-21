export const getMembers = async (id: number) => {
  const res = await fetch(`/api/src/members/${id}`);

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
