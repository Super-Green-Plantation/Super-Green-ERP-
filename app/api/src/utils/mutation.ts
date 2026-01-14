export const updateBranch = async (
  id: number,
  body: { name: string; location: string }
) => {
  const res = await fetch(`/api/src/branches/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Failed to update branch");

  return res.json();
};

export const addBranch = async (body: { name: string; location: string }) => {
  const res = await fetch("/api/src/branches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Failed to add branch");

  return res.json();
};

export const deleteBranch = async (id: number) => {
  const res = await fetch(`/api/src/branches/${id}`, { method: "DELETE" });

  if (!res.ok) throw new Error("Failed to delete branch");

  return res.json();
};
