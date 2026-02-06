import { toast } from "sonner";

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

export const getClientsByBranch = async (branchId: number) => {
  const res = await fetch(`/api/src/clients/by-branch/${branchId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch branch clients");
  }
  return res.json();
};

export const deleteClient = async (nic: any) => {
  //client/[id]
  console.log(nic);
  const res = await fetch(`/api/src/clients/${nic}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    toast.error("Something went wrong, try again !");
    return null;
  } else {
    toast.success("Client deleted");
  }

  return res.json();
};

export const updateClient = async (formData: any, id:number) => {
  console.log("from service --- ", formData);
  console.log("id from service", id);
  
  // const nic = formData.applicant.nic;
  const res = await fetch(`/api/src/clients/${id}`, {
    method: "PUT",
    body: JSON.stringify({ formData }),
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
};
