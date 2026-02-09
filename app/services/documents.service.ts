export const updateClientDocuments = async (
  clientId: number,
  docUrls: Record<string, string | null>,
) => {
  const res = await fetch(`/api/src/clients/${clientId}/documents`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(docUrls),
  });

  if (!res.ok) throw new Error("Failed to update documents");
  return res.json();
};

export const deleteClientDocument = async (nic: any, docKey: string) => {
  console.log(nic, docKey);
  const res = await fetch(`/api/src/clients/${nic}/documents`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "DELETE",
    body: JSON.stringify({ field: docKey }),
  });
  if (!res.ok) return null;
  return res.json();
};
