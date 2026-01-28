export const updateAdvisorId = async (id: number, empNo: string) => {
  if(!empNo || !id) return null;
  
  await fetch(`/api/src/investments/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({empNo}),
  });
};

export const getAllInvestments = async()=>{
  const res = await fetch("/api/src/investments/details/")
  if (!res.ok) {
    return null;
  }

  return res.json()
}

export const getInvestmentById = async(id:number)=>{
  //fetch investment from id - investment/details/[inveId]

}