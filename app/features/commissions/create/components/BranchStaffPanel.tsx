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
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
          Branch & Staff
        </h2>
      </div>

      <div className="relative space-y-6">
        {/* Connector Line */}
        <div className="absolute left-2.75 top-6 bottom-6 w-0.5 bg-muted" />

        {/* Branch Selection */}
        <div className="relative pl-8">
          <div className="absolute left-0 top-2 h-6 w-6 rounded-full border-2 border-card bg-primary/100 ring-2 ring-primary/20" />
          <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            1. Select Location
          </label>
          <select
            className="w-full appearance-none rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-semibold text-foreground outline-none transition-all focus:border-blue-500 focus:bg-card focus:ring-4 focus:ring-primary/10 cursor-pointer"
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
            className={`absolute left-0 top-2 h-6 w-6 rounded-full border-2 border-card ring-2 transition-all ${branch ? "bg-primary/100 ring-primary/20" : "bg-muted ring-border/50"}`}
          />
          <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            2. Assign Employee
          </label>
          <select
            disabled={!branch}
            className="w-full appearance-none rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-semibold text-foreground outline-none transition-all focus:border-blue-500 focus:bg-card focus:ring-4 focus:ring-primary/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            value={selectedEmpNo}
            onChange={(e) => onEmployeeChange(e.target.value)}
          >
            <option value="">
              {branch ? "All Employees" : "Select a branch first"}
            </option>
            {/* {branch?.members?.map((mb:any, index) => (
              <option key={index} value={mb.member.empNo}>
                {mb.member.nameWithInitials} ({mb.member.empNo})
              </option>
            ))} */}

            {/* display only active member for commission */}

            {branch?.members?.filter((m: any) => m.member && m.member.isActive).map((mb: any, index) => (
              <option key={index} value={mb.member.empNo}>
                {mb.member.nameWithInitials} ({mb.member.empNo})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
