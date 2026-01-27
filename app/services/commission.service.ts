export const calculatePersonalCommission = (
  position: string,
  invAmount: number
) => {
  let threshold = 500_000; // default threshold

  if (position === "AGM") {
    threshold = 1_500_000;
  }

  const rate = invAmount > threshold ? 10 : 7;
  const personalCommission = (invAmount * rate) / 100;

  return personalCommission;
};

export const updateOrc = async(members: [], invId:number)=>{
  console.log(members, invId);
  
}