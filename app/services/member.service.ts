export const getMembers = async (id: number) => {
  const res = await fetch(`/api/src/members/${id}`);

  if (!res.ok) {
    throw new Error("Failed to get member - service");
  }

  console.log(res);
  

  return res.json();
};
