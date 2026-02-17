type Commission = { amount: number };

export const setEarning = async (commissions: any) => {
  const total = commissions.commissions.reduce(
    (acc: number, curr: Commission) => acc + curr.amount,
    0,
  );

  const res = await fetch("/api/src/profit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commissions,
      total,
    }),
  });

  const data = await res.json();
  console.log("API response:", data);
};
