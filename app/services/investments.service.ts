export const updateAdvisorId = async (id: number, empNo: string) => {
  if(!empNo || !id) return null;
  
  await fetch(`/api/src/investments/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({empNo}),
  });
};
