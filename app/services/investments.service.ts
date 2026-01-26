export const updateAdvisorId = async (id: number, empNo: string) => {
  console.log(id);
  const res = await fetch(`/api/src/investments/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({empNo}),
  });
};
