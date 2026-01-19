export const getClients = async () => {
  const res = await fetch("/api/src/clients");
  if (!res.ok) {
    throw new Error("Failed to fetch clients");
  }

  return res.json();
};

export const getClientDetails = async (id: number) => {
  const res = await fetch(`/api/src/clients/${id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch client details");
  }

  return res.json();
};
