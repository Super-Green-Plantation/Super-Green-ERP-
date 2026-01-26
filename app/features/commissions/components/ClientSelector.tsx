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
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
  {/* Header with Icon */}
  <div className="flex items-center gap-3 mb-6">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
    <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">
      Client Details
    </h2>
  </div>

  <div className="relative">
    {/* Visual Node */}
    <div className="relative pl-8">
      <div className="absolute left-0 top-2 h-6 w-6 rounded-full border-2 border-white bg-blue-500 ring-2 ring-blue-100" />
      
      <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        Primary Contact
      </label>

      <div className="relative group">
        <select
          className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
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

        {/* Custom Arrow for consistency */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 group-focus-within:text-blue-500">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</div>
  );
};

export default ClientSelector;
