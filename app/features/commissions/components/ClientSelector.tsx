interface ClientSelectorProps {
  clients: any[];
  selectedClientId: number | null;
  onChange: (id: number | null) => void;
}

const ClientSelector = ({
  clients,
  selectedClientId,
  onChange,
}: ClientSelectorProps) => {
  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm">
      <h2 className="text-sm font-bold uppercase text-blue-600 mb-4">
        Client Details
      </h2>

      <label className="block mb-1 text-xs font-medium text-gray-500">
        Select Client
      </label>

      <select
        className="w-full rounded-lg border px-3 py-2 bg-gray-50"
        value={selectedClientId ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">Choose a client</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.fullName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ClientSelector;
