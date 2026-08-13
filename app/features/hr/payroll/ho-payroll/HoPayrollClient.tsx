"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Loader2, Play, RefreshCw, ChevronDown, CheckCircle2,
  AlertTriangle, Save, ChevronRight, Info, TrendingUp, FileDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  getHoPayrollPreview,
  runHoPayroll,
  rerunSingleMember,
  markManagementSalaryPaid,
  upsertHoPayrollConfig,
  getHoPayrollExport,
  type HoPayrollOverrides,
} from "../ho-payroll-action";
import { exportHoPayrollToExcel } from "../exportHoPayrollToExcel";
import Heading from "@/app/components/Heading";
import React from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtSmall = (n: number) =>
  n === 0 ? "—" : `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtPct = (p: number) => `${(p * 100).toFixed(1)}%`;

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type PreviewRow = {
  memberId: number;
  name: string;
  empNo: string;
  position: string;
  primaryBranch: string;
  isManagementStaff: boolean;
  isPermBmTrack: boolean;
  receivesOrc: boolean;
  baseSalaryConfigured: boolean;

  // Fixed-salary HO fields
  basicSalary: number;
  fixedAllowance: number;
  vehicleAllowance: number;
  fuelAllowance: number;
  channelOperation: number;
  attendanceAllowance: number;
  attendanceAllowanceHit: boolean;
  leavesTaken: number;

  // Perm BM breakdown
  tenureMonth: number;
  basicSalaryThresholdPct: number | null;
  basicSalaryHit: boolean | null;
  volumeAchieved: number;
  monthlyTarget: number;
  achievementPct: number;
  incentive75Hit: boolean | null;
  incentive75Earned: number;
  incentive100Hit: boolean | null;
  incentive100Earned: number;
  vehicleFuelHit: boolean | null;
  vehicleFuelEarned: number;

  orcEarned: number;
  personalCommission: number;
  personalIncentive: number;
  mgmtExcessCommission: number;
  mgmtFaTarget: number;
  mgmtFaAchievementPct: number;
  grossPay: number;
  epfDeduction: number;
  epfEmployer: number;
  etfEmployer: number;
  loanInstalments: number;
  festivalAdvance: number;
  merchandiseDeduction: number;
  advanceDeducted: number;
  advanceTypes: string[];
  outstandingAdvanceRemaining: number;
  netPay: number;
  alreadyProcessed: boolean;
  status: string;
  paidAt: string | null;
};

type LocalOverrides = {
  basicSalary?: number;
  fixedAllowance?: number;
  vehicleAllowance?: number;
  fuelAllowance?: number;
  channelOperation?: number;
  attendanceAllowance?: number;
  leavesTaken?: number;
  loanInstalments?: number;
  festivalAdvance?: number;
  merchandiseDeduction?: number;
};

type HoPayrollClientProps = {
  initialYear: number;
  initialMonth: number;
  initialPreview: PreviewRow[];
};

// ─── Achievement badge ────────────────────────────────────────────────────────

function AchieveBadge({ pct, hit }: { pct: number; hit: boolean }) {
  const cls = hit
    ? "bg-green-500/10 text-green-700 border-green-500/20"
    : "bg-red-500/10 text-red-600 border-red-500/20";
  return (
    <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full uppercase ${cls}`}>
      {hit ? "✓" : "✗"} {fmtPct(pct)}
    </span>
  );
}

// ─── Perm BM breakdown panel ─────────────────────────────────────────────────

function PermBmPanel({ row }: { row: PreviewRow }) {
  const achPct = row.achievementPct;
  const tgt    = row.monthlyTarget;

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4 flex flex-wrap gap-5">
      {/* Volume vs target */}
      <div className="flex flex-col gap-1 min-w-[160px]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Volume / Target</p>
        <p className="text-sm font-bold text-foreground">{fmt(row.volumeAchieved)}</p>
        <p className="text-xs text-muted-foreground">/ {fmt(tgt)}</p>
        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
          <div
            className={`h-1.5 rounded-full transition-all ${achPct >= 1 ? "bg-green-500" : achPct >= 0.75 ? "bg-amber-500" : achPct >= 0.5 ? "bg-blue-500" : "bg-red-400"}`}
            style={{ width: `${Math.min(achPct * 100, 100)}%` }}
          />
        </div>
        <p className="text-[10px] font-bold text-muted-foreground">{fmtPct(achPct)} achieved</p>
      </div>

      {/* Tenure / basic threshold */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Basic Salary</p>
        <p className="text-sm font-bold text-foreground">{fmtSmall(row.basicSalary)}</p>
        <p className="text-[10px] text-muted-foreground">
          Month {row.tenureMonth} — need {fmtPct(row.basicSalaryThresholdPct ?? 0)}
        </p>
        <AchieveBadge pct={row.basicSalaryThresholdPct ?? 0} hit={!!row.basicSalaryHit} />
      </div>

      {/* 75% incentive */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Incentive @75%</p>
        <p className={`text-sm font-bold ${row.incentive75Hit ? "text-amber-600" : "text-muted-foreground/40"}`}>
          {fmtSmall(row.incentive75Earned)}
        </p>
        {row.incentive100Hit
          ? <span className="text-[9px] font-bold text-blue-500 uppercase">Superseded by 100%</span>
          : <AchieveBadge pct={0.75} hit={!!row.incentive75Hit} />
        }
      </div>

      {/* 100% incentive */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Incentive @100%</p>
        <p className={`text-sm font-bold ${row.incentive100Hit ? "text-green-600" : "text-muted-foreground/40"}`}>
          {fmtSmall(row.incentive100Earned)}
        </p>
        <AchieveBadge pct={1.0} hit={!!row.incentive100Hit} />
      </div>

      {/* Vehicle + fuel */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vehicle & Fuel</p>
        <p className={`text-sm font-bold ${row.vehicleFuelHit ? "text-blue-600" : "text-muted-foreground/40"}`}>
          {fmtSmall(row.vehicleFuelEarned)}
        </p>
        {row.vehicleFuelHit && row.tenureMonth <= 4 && row.achievementPct < 0.5 ? (
          <span className="text-[9px] font-bold text-blue-500 uppercase">Unconditional (month {row.tenureMonth})</span>
        ) : (
          <AchieveBadge pct={0.50} hit={!!row.vehicleFuelHit} />
        )}
      </div>
    </div>
  );
}

// ─── Management FA breakdown panel ───────────────────────────────────────────

function ManagementFaPanel({ row }: { row: PreviewRow }) {
  const target     = row.mgmtFaTarget;
  const vol        = row.volumeAchieved;
  const achPct     = row.mgmtFaAchievementPct;
  const hasAchieved = vol > 0;
  const excessVol   = Math.max(0, vol - target);

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4 flex flex-wrap gap-5">
      {/* Volume vs target */}
      <div className="flex flex-col gap-1 min-w-[180px]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Volume / Target (FA Package)</p>
        {hasAchieved ? (
          <>
            <p className="text-sm font-bold text-foreground">{fmt(vol)}</p>
            <p className="text-xs text-muted-foreground">/ {fmt(target)}</p>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div
                className={`h-1.5 rounded-full transition-all ${achPct >= 1 ? "bg-green-500" : achPct >= 0.5 ? "bg-amber-500" : "bg-blue-400"}`}
                style={{ width: `${Math.min(achPct * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground">{fmtPct(achPct)} achieved</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground/40 font-bold">No volume this month</p>
        )}
      </div>

      {/* Excess commission */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Excess Commission (0.5%)</p>
        {row.mgmtExcessCommission > 0 ? (
          <>
            <p className="text-sm font-bold text-emerald-600">{fmt(row.mgmtExcessCommission)}</p>
            <p className="text-[10px] text-muted-foreground">
              on {fmt(excessVol)} surplus above {fmt(target)}
            </p>
            <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase self-start">
              ✓ Earned
            </span>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-muted-foreground/40">—</p>
            <p className="text-[10px] text-muted-foreground/60">
              {hasAchieved ? `Need ${fmt(Math.max(0, target - vol))} more to exceed target` : "No volume recorded"}
            </p>
            <span className="text-[9px] font-bold bg-red-500/10 text-red-600 border border-red-500/20 px-1.5 py-0.5 rounded-full uppercase self-start">
              ✗ Not earned
            </span>
          </>
        )}
      </div>

      {/* Personal commission summary */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Personal Commission</p>
        <p className="text-sm font-bold text-primary">{row.personalCommission > 0 ? fmt(row.personalCommission) : "—"}</p>
        {hasAchieved && (
          <p className="text-[10px] text-muted-foreground">
            {vol >= 500_000 ? "10%" : "7%"} of {fmt(vol)}
          </p>
        )}
      </div>

      {/* Flat incentive */}
      {row.personalIncentive > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Flat Incentive</p>
          <p className="text-sm font-bold text-emerald-600">{fmt(row.personalIncentive)}</p>
          <p className="text-[10px] text-muted-foreground">≥ 500K threshold</p>
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HoPayrollClient({
  initialYear,
  initialMonth,
  initialPreview,
}: HoPayrollClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [year, setYear]   = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [overrides, setOverrides] = useState<Record<number, LocalOverrides>>({});
  const [running, setRunning]         = useState(false);
  const [exporting, setExporting]     = useState(false);
  const [payingId, setPayingId]       = useState<number | null>(null);
  const [savingId, setSavingId]   = useState<number | null>(null);
  const [rerunningId, setRerunningId] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(year));
    params.set("month", String(month));
    router.replace(`?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const { data: preview = [], isFetching, refetch } = useQuery<PreviewRow[]>({
    queryKey: ["ho-payroll-preview", year, month],
    queryFn: () => {
      const mapped: Record<number, HoPayrollOverrides> = {};
      for (const [id, ov] of Object.entries(overrides)) mapped[Number(id)] = ov as HoPayrollOverrides;
      return getHoPayrollPreview(year, month, mapped);
    },
    enabled: false,
    initialData: year === initialYear && month === initialMonth ? initialPreview : undefined,
    placeholderData: keepPreviousData,
  });

  // Seed overrides from fetched preview
  useEffect(() => {
    setOverrides((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const r of preview) {
        if (!(r.memberId in next)) {
          next[r.memberId] = {
            basicSalary:          r.basicSalary,
            fixedAllowance:       r.fixedAllowance,
            vehicleAllowance:     r.vehicleAllowance,
            fuelAllowance:        r.fuelAllowance,
            channelOperation:     r.channelOperation,
            attendanceAllowance:  r.attendanceAllowance,
            leavesTaken:          r.leavesTaken,
            loanInstalments:      r.loanInstalments,
            festivalAdvance:      r.festivalAdvance,
            merchandiseDeduction: r.merchandiseDeduction,
          };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [preview]);

  const setField = useCallback((memberId: number, field: keyof LocalOverrides, value: number) => {
    setOverrides((prev) => ({ ...prev, [memberId]: { ...prev[memberId], [field]: value } }));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = await getHoPayrollExport(year, month);
      if (rows.length === 0) { toast.warning("No processed HO payroll records found for this period."); return; }
      exportHoPayrollToExcel(rows, month, year);
      toast.success(`Exported ${rows.length} HO payroll records`);
    } catch { toast.error("Export failed"); }
    finally { setExporting(false); }
  };

  const handleSearch = async () => { await refetch(); };

  const handleRunPayroll = async (force = false) => {
    setRunning(true);
    try {
      const mapped: Record<number, HoPayrollOverrides> = {};
      for (const [id, ov] of Object.entries(overrides)) mapped[Number(id)] = ov as HoPayrollOverrides;
      const result = await runHoPayroll(year, month, mapped, force);
      if (result.success) {
        toast.success(`HO payroll processed: ${result.processed} employees`);
        if (result.skipped > 0) toast.warning(`${result.skipped} skipped`);
        if (result.errors.length > 0) toast.error(`Errors: ${result.errors.join(", ")}`);
        await refetch();
      }
    } catch { toast.error("Failed to run HO payroll"); }
    finally { setRunning(false); }
  };

  const handleRerunSingle = async (row: PreviewRow) => {
    setRerunningId(row.memberId);
    try {
      const ov = overrides[row.memberId] ?? {};
      const result = await rerunSingleMember(row.memberId, year, month, ov as HoPayrollOverrides);
      if (result.success) { toast.success(`${row.name} re-processed`); await refetch(); }
      else toast.error(result.error ?? "Re-run failed");
    } catch { toast.error("Re-run failed"); }
    finally { setRerunningId(null); }
  };

  const handleSaveConfig = async (row: PreviewRow) => {
    setSavingId(row.memberId);
    try {
      const ov = overrides[row.memberId] ?? {};
      await upsertHoPayrollConfig(row.memberId, {
        basicSalary:         ov.basicSalary         ?? row.basicSalary,
        fixedAllowance:      ov.fixedAllowance       ?? row.fixedAllowance,
        vehicleAllowance:    ov.vehicleAllowance     ?? row.vehicleAllowance,
        fuelAllowance:       ov.fuelAllowance        ?? row.fuelAllowance,
        channelOperation:    ov.channelOperation     ?? row.channelOperation,
        attendanceAllowance: ov.attendanceAllowance  ?? row.attendanceAllowance,
      });
      toast.success("Standing salary config saved");
      await refetch();
    } catch { toast.error("Failed to save config"); }
    finally { setSavingId(null); }
  };

  const handleMarkPaid = async (memberId: number) => {
    setPayingId(memberId);
    try {
      await markManagementSalaryPaid(memberId, year, month);
      toast.success("Marked as paid");
      await refetch();
    } catch { toast.error("Failed to mark as paid"); }
    finally { setPayingId(null); }
  };

  const toggleExpand = (memberId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(memberId) ? next.delete(memberId) : next.add(memberId);
      return next;
    });
  };

  const totalGross = useMemo(() => preview.reduce((s, r) => s + r.grossPay,     0), [preview]);
  const totalNet   = useMemo(() => preview.reduce((s, r) => s + r.netPay,       0), [preview]);
  const totalEpf   = useMemo(() => preview.reduce((s, r) => s + r.epfDeduction, 0), [preview]);
  const totalEpfEr = useMemo(() => preview.reduce((s, r) => s + r.epfEmployer,  0), [preview]);
  const totalEtf   = useMemo(() => preview.reduce((s, r) => s + r.etfEmployer,  0), [preview]);
  const unconfiguredCount = useMemo(
    () => preview.filter((r) => !r.baseSalaryConfigured).length,
    [preview],
  );

  return (
    <div className="w-full min-h-screen p-4 sm:p-8 flex flex-col gap-6 sm:gap-8 font-sans text-gray-900 dark:text-gray-100">
      <div>
        <Heading>Head Office Payroll</Heading>
        <p className="text-sm text-muted-foreground mt-2 font-medium max-w-2xl">
          Permanent BM/RM/ZM/AGM are volume-gated (basic requires achievement ramp, incentives at 75%/100%, vehicle+fuel at 50%).
          RM and above receive vehicle+fuel unconditionally for their first 4 months.
          Fixed-salary HO staff use flat config amounts.
        </p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <select className="appearance-none pl-4 pr-10 py-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 cursor-pointer shadow-sm transition-all"
            value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
        <div className="relative">
          <select className="appearance-none pl-4 pr-10 py-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 cursor-pointer shadow-sm transition-all"
            value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
        <button onClick={handleSearch} disabled={isFetching}
          className="px-6 py-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground shadow-sm hover:bg-muted/40 transition-all disabled:opacity-50 flex items-center gap-2">
          {isFetching && <Loader2 className="w-4 h-4 animate-spin" />} Search
        </button>
        {unconfiguredCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            {unconfiguredCount} member{unconfiguredCount > 1 ? "s" : ""} without base salary configured
          </div>
        )}
      </div>

      {/* Summary cards */}
      {preview.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <SummaryCard label="Total Gross" value={fmt(totalGross)} />
          <SummaryCard label="Total Net"   value={fmt(totalNet)} />
          <SummaryCard label="EPF (Employee)" value={fmt(totalEpf)} />
          <SummaryCard label="EPF (Employer)" value={fmt(totalEpfEr)} />
          <SummaryCard label="ETF (Employer)" value={fmt(totalEtf)} />
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {preview.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground font-medium">
            {isFetching ? "Loading…" : "No management members found. Click Search to load."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="w-8 px-4 py-3" />
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Employee</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Basic</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Incentive</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">V&F / Allow.</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Attend.</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Leaves</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ORC</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">P.Incentive</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">P.Commission</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Excess</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gross</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">EPF (emp)</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ETF</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Advance</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Net Pay</th>
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.map((row) => {
                  const ov        = overrides[row.memberId] ?? {};
                  const isExpanded = expandedRows.has(row.memberId);
                  const isPaid    = row.status === "PAID";

                  return (
                    <React.Fragment key={row.memberId}>
                      <tr className="hover:bg-muted/30 transition-colors">
                        {/* Expand */}
                        <td className="px-4 py-4">
                          <button onClick={() => toggleExpand(row.memberId)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </button>
                        </td>

                        {/* Employee */}
                        <td className="px-4 py-4">
                          <p className="font-bold text-foreground text-sm leading-tight">{row.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter mt-0.5">{row.empNo}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-xs font-bold text-muted-foreground">{row.position}</span>
                            {row.isPermBmTrack && (
                              <span className="text-[9px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 px-1.5 py-0.5 rounded-full uppercase">
                                M{row.tenureMonth} · {fmtPct(row.achievementPct)}
                              </span>
                            )}
                            {row.isManagementStaff && (
                              <span className="text-[9px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20 px-1.5 py-0.5 rounded-full uppercase">Mgmt</span>
                            )}
                          </div>
                        </td>

                        {/* Basic */}
                        <td className="px-3 py-4 text-right">
                          {row.isPermBmTrack ? (
                            <div className="flex flex-col items-end">
                              <span className={`text-xs font-bold ${row.basicSalaryHit ? "text-foreground" : "text-muted-foreground/40"}`}>
                                {fmtSmall(row.basicSalary)}
                              </span>
                              {!row.basicSalaryHit && (
                                <span className="text-[9px] text-destructive/70 font-bold uppercase">Not earned</span>
                              )}
                            </div>
                          ) : (
                            <NumInput value={ov.basicSalary ?? row.basicSalary} disabled={isPaid}
                              onChange={(v) => setField(row.memberId, "basicSalary", v)} />
                          )}
                        </td>

                        {/* Incentive (perm BM) or fixed allowances (HO) */}
                        <td className="px-3 py-4 text-right text-xs font-bold">
                          {row.isPermBmTrack ? (
                            <div className="flex flex-col items-end gap-0.5">
                              {row.incentive100Hit ? (
                                <span className="text-green-600">{fmt(row.incentive100Earned)} <span className="text-[9px] text-green-500">@100%</span></span>
                              ) : row.incentive75Hit ? (
                                <span className="text-amber-600">{fmt(row.incentive75Earned)} <span className="text-[9px] text-amber-500">@75%</span></span>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-foreground">{fmtSmall(ov.channelOperation ?? row.channelOperation)}</span>
                          )}
                        </td>

                        {/* Vehicle+Fuel (perm BM) or vehicle/fuel flat (HO) */}
                        <td className="px-3 py-4 text-right text-xs font-bold">
                          {row.isPermBmTrack ? (
                            <div className="flex flex-col items-end">
                              <span className={row.vehicleFuelHit ? "text-blue-600" : "text-muted-foreground/40"}>
                                {fmtSmall(row.vehicleFuelEarned)}
                              </span>
                              {row.vehicleFuelHit && (
                                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">
                                  {row.tenureMonth <= 4 && row.achievementPct < 0.5 ? "Unconditional" : "@50%"}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span>{fmtSmall(ov.vehicleAllowance ?? row.vehicleAllowance)}</span>
                              {(ov.fuelAllowance ?? row.fuelAllowance) > 0 && (
                                <span className="text-[10px] text-muted-foreground/60">+{fmtSmall(ov.fuelAllowance ?? row.fuelAllowance)} fuel</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Attendance */}
                        <td className="px-3 py-4 text-right">
                          {!row.isPermBmTrack && (
                            <span className={`text-xs font-bold ${row.attendanceAllowanceHit ? "text-green-600" : "text-muted-foreground/50"}`}>
                              {fmtSmall(ov.attendanceAllowance ?? row.attendanceAllowance)}
                            </span>
                          )}
                          {row.isPermBmTrack && <span className="text-muted-foreground/30 text-xs">N/A</span>}
                        </td>

                        {/* Leaves */}
                        <td className="px-3 py-4 text-right">
                          {!row.isPermBmTrack ? (
                            <input type="number" min={0} step={0.5}
                              value={ov.leavesTaken ?? row.leavesTaken}
                              disabled={isPaid}
                              onChange={(e) => setField(row.memberId, "leavesTaken", Number(e.target.value))}
                              className="w-16 text-right px-2 py-1.5 bg-muted/30 border border-border rounded-lg text-xs font-bold text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
                            />
                          ) : <span className="text-muted-foreground/30 text-xs">N/A</span>}
                        </td>

                        {/* ORC */}
                        <td className="px-3 py-4 text-right text-xs font-bold">
                          {row.receivesOrc
                            ? <span className="text-blue-600">{fmtSmall(row.orcEarned)}</span>
                            : <span className="text-muted-foreground/30">N/A</span>}
                        </td>

                        {/* Personal Incentive — management staff only (15K at 500K+) */}
                        <td className="px-3 py-4 text-right text-xs font-bold">
                          {row.isManagementStaff ? (
                            row.personalIncentive > 0 ? (
                              <div className="flex flex-col items-end">
                                <span className="text-emerald-600">{fmt(row.personalIncentive)}</span>
                                <span className="text-[9px] text-muted-foreground/60 uppercase">
                                  Vol {(row.volumeAchieved / 1000).toFixed(0)}K
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="text-muted-foreground/40">—</span>
                                {row.volumeAchieved > 0 && (
                                  <span className="text-[9px] text-muted-foreground/50 uppercase">
                                    {(row.volumeAchieved / 1000).toFixed(0)}K / 500K
                                  </span>
                                )}
                              </div>
                            )
                          ) : (
                            <span className="text-muted-foreground/30">N/A</span>
                          )}
                        </td>

                        {/* Personal Commission — all non-management HO + management staff */}
                        <td className="px-3 py-4 text-right text-xs font-bold">
                          {row.isManagementStaff ? (
                            // Management: volume-based 7%/10% + excess commission
                            row.personalCommission > 0 || row.mgmtExcessCommission > 0 ? (
                              <div className="flex flex-col items-end gap-0.5">
                                {row.personalCommission > 0 && (
                                  <>
                                    <span className="text-primary">{fmtSmall(row.personalCommission)}</span>
                                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">
                                      {row.volumeAchieved >= 500000 ? "10%" : "7%"} of {(row.volumeAchieved / 1000).toFixed(0)}K
                                    </span>
                                  </>
                                )}
                                {/* {row.mgmtExcessCommission > 0 && (
                                  <>
                                    <span className="text-emerald-600">+{fmtSmall(row.mgmtExcessCommission)}</span>
                                    <span className="text-[9px] font-bold text-emerald-500/80 uppercase">0.5% excess</span>
                                  </>
                                )} */}
                              </div>
                            ) : <span className="text-muted-foreground/40">—</span>
                          ) : (
                            // Non-management (perm BM/RM/ZM/COO/GM): PERSONAL commission from DB
                            row.personalCommission > 0
                              ? <span className="text-primary">{fmtSmall(row.personalCommission)}</span>
                              : <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Excess Commission — management staff only */}
                        <td className="px-3 py-4 text-right text-xs font-bold">
                          {row.isManagementStaff ? (
                            row.mgmtExcessCommission > 0
                              ? <div className="flex flex-col items-end">
                                  <span className="text-emerald-600">{fmtSmall(row.mgmtExcessCommission)}</span>
                                  <span className="text-[9px] font-bold text-emerald-500/80 uppercase">0.5%</span>
                                </div>
                              : <span className="text-muted-foreground/30">—</span>
                          ) : <span className="text-muted-foreground/30">N/A</span>}
                        </td>

                        {/* Gross */}
                        <td className="px-3 py-4 text-right text-xs font-bold text-muted-foreground">
                          {fmt(row.grossPay)}
                        </td>

                        {/* EPF employee */}
                        <td className="px-3 py-4 text-right text-xs font-bold text-destructive">
                          -{fmtSmall(row.epfDeduction)}
                        </td>

                        {/* ETF employer */}
                        <td className="px-3 py-4 text-right text-xs font-bold text-muted-foreground"
                          title="Employer contribution — not deducted from net pay">
                          {fmtSmall(row.etfEmployer)}
                        </td>

                        {/* Advance */}
                        <td className="px-3 py-4 text-right text-xs font-bold">
                          {row.advanceDeducted > 0 ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-destructive">-{fmt(row.advanceDeducted)}</span>
                              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">{row.advanceTypes?.join(" + ")}</span>
                            </div>
                          ) : row.outstandingAdvanceRemaining > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="text-amber-600">Rs. 0</span>
                              <span className="text-[9px] font-bold text-amber-600/70 uppercase">Pending</span>
                            </div>
                          ) : <span className="text-muted-foreground/30">—</span>}
                        </td>

                        {/* Net Pay */}
                        <td className="px-3 py-4 text-right text-sm font-bold text-foreground">
                          {fmt(row.netPay)}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-4 text-center">
                          {row.status === "PAID" ? (
                            <span className="text-[10px] font-bold text-green-600 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full uppercase">Paid</span>
                          ) : row.alreadyProcessed ? (
                            <button onClick={() => handleMarkPaid(row.memberId)}
                              disabled={payingId === row.memberId}
                              className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase hover:bg-primary/20 transition-all disabled:opacity-50">
                              {payingId === row.memberId ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              Mark Paid
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground/50 bg-muted border border-border px-3 py-1 rounded-full uppercase">Pending</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded panel */}
                      {isExpanded && (
                        <tr key={`${row.memberId}-expand`} className="bg-muted/10 border-b border-border">
                          <td colSpan={17} className="px-8 py-5">
                            {/* Perm BM: show achievement breakdown */}
                            {row.isPermBmTrack && <PermBmPanel row={row} />}

                            {/* Management staff: show FA package breakdown */}
                            {row.isManagementStaff && <ManagementFaPanel row={row} />}

                            {/* Fixed-salary HO: show editable allowance inputs */}
                            {!row.isPermBmTrack && (
                              <div className="flex flex-wrap gap-4 items-end">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-full mb-1">
                                  Override allowances for this run
                                </p>
                                <AllowanceInput label="Channel Op / Fixed Allow." value={ov.channelOperation ?? row.channelOperation} disabled={isPaid} onChange={(v) => setField(row.memberId, "channelOperation", v)} />
                                <AllowanceInput label="Vehicle Allowance" value={ov.vehicleAllowance ?? row.vehicleAllowance} disabled={isPaid} onChange={(v) => setField(row.memberId, "vehicleAllowance", v)} />
                                <AllowanceInput label="Fuel Allowance" value={ov.fuelAllowance ?? row.fuelAllowance} disabled={isPaid} onChange={(v) => setField(row.memberId, "fuelAllowance", v)} />
                                <AllowanceInput label="Attendance Allowance" value={ov.attendanceAllowance ?? row.attendanceAllowance} disabled={isPaid} onChange={(v) => setField(row.memberId, "attendanceAllowance", v)} />
                                <AllowanceInput label="Other Fixed Allowance" value={ov.fixedAllowance ?? row.fixedAllowance} disabled={isPaid} onChange={(v) => setField(row.memberId, "fixedAllowance", v)} />
                                <div className="border-l border-border pl-4 flex flex-wrap gap-4">
                                  <AllowanceInput label="Loan Instalments" value={ov.loanInstalments ?? row.loanInstalments} disabled={isPaid} onChange={(v) => setField(row.memberId, "loanInstalments", v)} isDeduction />
                                  <AllowanceInput label="Festival Advance" value={ov.festivalAdvance ?? row.festivalAdvance} disabled={isPaid} onChange={(v) => setField(row.memberId, "festivalAdvance", v)} isDeduction />
                                  <AllowanceInput label="Merchandise Deduct." value={ov.merchandiseDeduction ?? row.merchandiseDeduction} disabled={isPaid} onChange={(v) => setField(row.memberId, "merchandiseDeduction", v)} isDeduction />
                                </div>
                              </div>
                            )}

                            {/* Perm BM: show deduction inputs */}
                            {row.isPermBmTrack && (
                              <div className="flex flex-wrap gap-4 items-end mt-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-full">
                                  Deductions
                                </p>
                                <AllowanceInput label="Loan Instalments" value={ov.loanInstalments ?? row.loanInstalments} disabled={isPaid} onChange={(v) => setField(row.memberId, "loanInstalments", v)} isDeduction />
                                <AllowanceInput label="Festival Advance" value={ov.festivalAdvance ?? row.festivalAdvance} disabled={isPaid} onChange={(v) => setField(row.memberId, "festivalAdvance", v)} isDeduction />
                                <AllowanceInput label="Merchandise Deduct." value={ov.merchandiseDeduction ?? row.merchandiseDeduction} disabled={isPaid} onChange={(v) => setField(row.memberId, "merchandiseDeduction", v)} isDeduction />
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 mt-4">
                              <button onClick={() => handleRerunSingle(row)} disabled={rerunningId === row.memberId || isPaid}
                                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-xl hover:bg-amber-500/20 transition-all disabled:opacity-40">
                                {rerunningId === row.memberId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                Re-run
                              </button>
                              {!row.isPermBmTrack && (
                                <button onClick={() => handleSaveConfig(row)} disabled={savingId === row.memberId || isPaid}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-all disabled:opacity-40">
                                  {savingId === row.memberId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                  Save as Default
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EPF/ETF note */}
      {preview.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            EPF Employer ({fmt(totalEpfEr)}) and ETF ({fmt(totalEtf)}) are employer contributions — displayed for records but <strong>not deducted</strong> from net pay.
          </span>
        </div>
      )}

      {/* Run + Export buttons */}
      {preview.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button onClick={() => handleRunPayroll(false)} disabled={running}
            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 disabled:opacity-50 hover:opacity-90 shadow-xl shadow-primary/20">
            {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
            Run Standard Batch
          </button>
          <button onClick={() => handleRunPayroll(true)} disabled={running}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 border border-destructive/20 hover:bg-destructive/20">
            <RefreshCw className="w-5 h-5" />
            Force Re-run (unpaid only)
          </button>
          <button onClick={handleExport} disabled={exporting || running}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-card border border-border text-foreground text-xs font-bold uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 hover:bg-muted/40 disabled:opacity-50 shadow-sm">
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
            Export Excel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

function NumInput({ value, disabled, onChange }: { value: number; disabled?: boolean; onChange: (v: number) => void }) {
  return (
    <input type="number" value={value} disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-28 text-right px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50"
    />
  );
}

function AllowanceInput({ label, value, disabled, onChange, isDeduction }: {
  label: string; value: number; disabled?: boolean; onChange: (v: number) => void; isDeduction?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className={`text-[10px] font-bold uppercase tracking-widest ${isDeduction ? "text-destructive/70" : "text-muted-foreground"}`}>
        {label}
      </label>
      <input type="number" value={value} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-32 text-right px-3 py-2 bg-muted/30 border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
          isDeduction
            ? "border-destructive/20 focus:border-destructive/40 focus:ring-destructive/10 text-destructive"
            : "border-border focus:border-primary/50 focus:ring-primary/10"
        }`}
      />
    </div>
  );
}