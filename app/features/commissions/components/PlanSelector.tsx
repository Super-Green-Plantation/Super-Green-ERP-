interface PlanSelectorProps {
  investments: any[];
  selectedInvestmentId: number | null;
  onChange: (id: number | null) => void;
}

const PlanSelector = ({
  investments,
  selectedInvestmentId,
  onChange,
}: PlanSelectorProps) => {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        Select Plan
      </label>

      <select
        className="w-full rounded-lg border px-3 py-2 bg-gray-50"
        value={selectedInvestmentId ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">Choose a plan</option>

        {investments?.map((inv) => (
          <option key={inv.id} value={inv.id}>
            {inv.plan?.name ?? "Plan"} — Rs.{" "}
            {inv.amount.toLocaleString()}
          </option>
        ))}
      </select>

      {investments?.length === 0 && (
        <p className="text-xs text-red-500 mt-1 italic">
          No investments found
        </p>
      )}
    </div>
  );
};

export default PlanSelector;
