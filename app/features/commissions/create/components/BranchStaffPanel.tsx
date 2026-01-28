import { Branch } from "@/app/types/branch";

interface Props {
  branches: Branch[];
  branch: Branch | null;
  selectedBranchId: number | null;
  selectedEmpNo: string;
  onBranchChange: (id: number | null) => void;
  onEmployeeChange: (empNo: string) => void;
}

export default function BranchStaffPanel({
  branches,
  branch,
  selectedEmpNo,
  onBranchChange,
  onEmployeeChange,
}: Props) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">
          Branch & Staff
        </h2>
      </div>

      <div className="relative space-y-6">
        {/* Connector Line */}
        <div className="absolute left-2.75 top-6 bottom-6 w-0.5 bg-gray-100" />

        {/* Branch Selection */}
        <div className="relative pl-8">
          <div className="absolute left-0 top-2 h-6 w-6 rounded-full border-2 border-white bg-blue-500 ring-2 ring-blue-100" />
          <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            1. Select Location
          </label>
          <select
            className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
            onChange={(e) =>
              onBranchChange(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Select a Branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Employee Selection */}
        <div className="relative pl-8">
          <div
            className={`absolute left-0 top-2 h-6 w-6 rounded-full border-2 border-white ring-2 transition-all ${branch ? "bg-blue-500 ring-blue-100" : "bg-gray-200 ring-gray-50"}`}
          />
          <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            2. Assign Employee
          </label>
          <select
            disabled={!branch}
            className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            value={selectedEmpNo}
            onChange={(e) => onEmployeeChange(e.target.value)}
          >
            <option value="">
              {branch ? "All Employees" : "Select a branch first"}
            </option>
            {branch?.members?.map((m) => (
              <option key={m.empNo} value={m.empNo}>
                {m.name} ({m.empNo})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
