export  function getRecentMonthOptions(count = 12) {
  const options: { label: string; year: number; month: number }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    });
  }
  return options;
}