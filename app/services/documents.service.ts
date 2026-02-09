export const updateClientDocuments = async (
  clientId: number,
  docUrls: Record<string, string | null>
) => {
  const res = await fetch(`/api/src/clients/${clientId}/documents`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(docUrls),
  });

  if (!res.ok) throw new Error("Failed to update documents");
  return res.json();
};
