export const getBranches = async () => {
  const res = await fetch("/api/src/branches");

  if (!res.ok) {
    throw new Error("Failed to fetch branches");
  }

  return res.json(); // { branches, count }
};

export const getBranchDetails = async (id: number) => {
  const res = await fetch(`/api/src/branches/${id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch branches");
  }

  return res.json();
};
