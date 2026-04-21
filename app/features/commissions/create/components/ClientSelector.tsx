import { useState, useMemo } from "react";

interface ClientSelectorProps {
  clients: any[];
  selectedClientId: number | null;
  onChange: (id: number | null) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ClientSelector = ({
  clients,
  selectedClientId,
  onChange,
}: ClientSelectorProps) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Derive available years from client data
  const availableYears = useMemo(() => {
    const years = new Set(
      clients.map((c) => new Date(c.createdAt).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [clients]);

  // Filter clients by selected month + year
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const d = new Date(c.createdAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [clients, selectedMonth, selectedYear]);

  // Reset client selection if it's no longer in the filtered list
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    const stillVisible = filteredClients.some((c) => c.id === selectedClientId);
    if (!stillVisible) onChange(null);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    onChange(null);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
      {/* Header with Icon */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">
          Client Details
        </h2>
      </div>

      <div className="relative">
        <div className="relative pl-8 space-y-4">
          <div className="absolute left-0 top-2 h-6 w-6 rounded-full border-2 border-white bg-blue-500 ring-2 ring-blue-100" />

          {/* Month + Year Filter */}
          <div>
            <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Registration Period
            </label>
            <div className="flex gap-2">
              {/* Month Select */}
              <div className="relative group flex-1">
                <select
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                >
                  {MONTHS.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 group-focus-within:text-blue-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>

              {/* Year Select */}
              <div className="relative group w-28">
                <select
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
                  value={selectedYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 group-focus-within:text-blue-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Client Select */}
          <div>
            <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Primary Contact
              <span className="ml-2 normal-case font-medium text-gray-300">
                ({filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""})
              </span>
            </label>
            <div className="relative group">
              <select
                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                value={selectedClientId ?? ""}
                onChange={(e) =>
                  onChange(e.target.value ? Number(e.target.value) : null)
                }
                disabled={filteredClients.length === 0}
              >
                <option value="">
                  {filteredClients.length === 0
                    ? "No clients this month"
                    : "Choose a client"}
                </option>
                {filteredClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 group-focus-within:text-blue-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ClientSelector;