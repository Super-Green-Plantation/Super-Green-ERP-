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
    <div className="bg-white p-5 rounded-xl border shadow-sm">
      <h2 className="text-sm font-bold uppercase text-blue-600 mb-4">
        Branch & Staff
      </h2>

      <label className="block mb-1 text-xs font-medium text-gray-500">
        Select Branch
      </label>
      <select
        className="w-full rounded-lg border px-3 py-2 mb-4 bg-gray-50"
        onChange={(e) =>
          onBranchChange(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">Choose a branch</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <label className="block mb-1 text-xs font-medium text-gray-500">
        Select Employee
      </label>
      <select
        className="w-full rounded-lg border px-3 py-2 bg-gray-50"
        value={selectedEmpNo}
        onChange={(e) => onEmployeeChange(e.target.value)}
      >
        <option value="">All Employees</option>
        {branch?.members?.map((m) => (
          <option key={m.empNo} value={m.empNo}>
            {m.name} ({m.empNo})
          </option>
        ))}
      </select>
    </div>
  );
}
