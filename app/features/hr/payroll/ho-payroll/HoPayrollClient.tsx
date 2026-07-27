"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Loader2, Play, RefreshCw, ChevronDown, CheckCircle2,
  AlertTriangle, Save, ChevronRight, Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  getHoPayrollPreview,
  runHoPayroll,
  markManagementSalaryPaid,
  upsertHoPayrollConfig,
  type HoPayrollOverrides,
} from "../ho-payroll-action";
import Heading from "@/app/components/Heading";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtSmall = (n: number) =>
  n === 0 ? "—" : `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type PreviewRow = {
  memberId: number;
  name: string;
  empNo: string;
  position: string;
  primaryBranch: string;
  isManagementStaff: boolean;
  receivesOrc: boolean;
  baseSalaryConfigured: boolean;
  basicSalary: number;
  fixedAllowance: number;
  vehicleAllowance: number;
  fuelAllowance: number;
  channelOperation: number;
  attendanceAllowance: number;
  attendanceAllowanceHit: boolean;
  leavesTaken: number;
  orcEarned: number;
  personalCommission: number;
  personalIncentive: number;
  volumeAchieved: number;
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

// Per-member local overrides (all editable fields)
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function HoPayrollClient({
  initialYear,
  initialMonth,
  initialPreview,
}: HoPayrollClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  // Per-member field overrides — seeded from preview on first load
  const [overrides, setOverrides] = useState<Record<number, LocalOverrides>>({});

  const [running, setRunning] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  // Expanded rows (show allowance input block)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(year));
    params.set("month", String(month));
    router.replace(`?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const queryKey = ["ho-payroll-preview", year, month];

  const {
    data: preview = [],
    isFetching,
    refetch,
  } = useQuery<PreviewRow[]>({
    queryKey,
    queryFn: () => {
      // Map local overrides to HoPayrollOverrides shape
      const mapped: Record<number, HoPayrollOverrides> = {};
      for (const [id, ov] of Object.entries(overrides)) {
        mapped[Number(id)] = ov as HoPayrollOverrides;
      }
      return getHoPayrollPreview(year, month, mapped);
    },
    enabled: false,
    initialData: year === initialYear && month === initialMonth ? initialPreview : undefined,
    placeholderData: keepPreviousData,
  });

  // Seed overrides from fetched preview rows (so inputs start populated)
  useEffect(() => {
    setOverrides((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const r of preview) {
        if (!(r.memberId in next)) {
          next[r.memberId] = {
            basicSalary: r.basicSalary,
            fixedAllowance: r.fixedAllowance,
            vehicleAllowance: r.vehicleAllowance,
            fuelAllowance: r.fuelAllowance,
            channelOperation: r.channelOperation,
            attendanceAllowance: r.attendanceAllowance,
            leavesTaken: r.leavesTaken,
            loanInstalments: r.loanInstalments,
            festivalAdvance: r.festivalAdvance,
            merchandiseDeduction: r.merchandiseDeduction,
          };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [preview]);

  const setField = useCallback(
    (memberId: number, field: keyof LocalOverrides, value: number) => {
      setOverrides((prev) => ({
        ...prev,
        [memberId]: { ...prev[memberId], [field]: value },
      }));
    },
    [],
  );

  const handleSearch = async () => { await refetch(); };

  const handleRunPayroll = async (force = false) => {
    setRunning(true);
    try {
      const mapped: Record<number, HoPayrollOverrides> = {};
      for (const [id, ov] of Object.entries(overrides)) {
        mapped[Number(id)] = ov as HoPayrollOverrides;
      }
      const result = await runHoPayroll(year, month, mapped, force);
      if (result.success) {
        toast.success(`HO payroll processed: ${result.processed} employees`);
        if (result.skipped > 0) toast.warning(`${result.skipped} skipped (already processed or paid)`);
        if (result.errors.length > 0) toast.error(`Errors: ${result.errors.join(", ")}`);
        await refetch();
      }
    } catch {
      toast.error("Failed to run HO payroll");
    } finally {
      setRunning(false);
    }
  };

  const handleSaveConfig = async (row: PreviewRow) => {
    setSavingId(row.memberId);
    try {
      const ov = overrides[row.memberId] ?? {};
      await upsertHoPayrollConfig(row.memberId, {
        basicSalary: ov.basicSalary ?? row.basicSalary,
        fixedAllowance: ov.fixedAllowance ?? row.fixedAllowance,
        vehicleAllowance: ov.vehicleAllowance ?? row.vehicleAllowance,
        fuelAllowance: ov.fuelAllowance ?? row.fuelAllowance,
        channelOperation: ov.channelOperation ?? row.channelOperation,
        attendanceAllowance: ov.attendanceAllowance ?? row.attendanceAllowance,
      });
      toast.success("Standing salary config saved");
      await refetch();
    } catch {
      toast.error("Failed to save config");
    } finally {
      setSavingId(null);
    }
  };

  const handleMarkPaid = async (memberId: number) => {
    setPayingId(memberId);
    try {
      await markManagementSalaryPaid(memberId, year, month);
      toast.success("Marked as paid");
      await refetch();
    } catch {
      toast.error("Failed to mark as paid");
    } finally {
      setPayingId(null);
    }
  };

  const toggleExpand = (memberId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(memberId) ? next.delete(memberId) : next.add(memberId);
      return next;
    });
  };

  const totalGross = useMemo(() => preview.reduce((s, r) => s + (r.grossPay ?? 0), 0), [preview]);
  const totalNet = useMemo(() => preview.reduce((s, r) => s + (r.netPay ?? 0), 0), [preview]);
  const totalEpf = useMemo(() => preview.reduce((s, r) => s + (r.epfDeduction ?? 0), 0), [preview]);
  const totalEpfEmployer = useMemo(() => preview.reduce((s, r) => s + (r.epfEmployer ?? 0), 0), [preview]);
  const totalEtf = useMemo(() => preview.reduce((s, r) => s + (r.etfEmployer ?? 0), 0), [preview]);
  const unconfiguredCount = useMemo(() => preview.filter((r) => !r.baseSalaryConfigured).length, [preview]);

  return (
    <div className="w-full min-h-screen p-4 sm:p-8 flex flex-col gap-6 sm:gap-8 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div>
        <Heading>Head Office Payroll</Heading>
        <p className="text-sm text-muted-foreground mt-2 font-medium max-w-2xl">
          Permanent BM / RM / ZM / AGM / COO / GM and fixed-salary HO staff.
          ORC applies to non-management ranks only. Management staff earning ≥ Rs. 500,000 in volume receive a 15K personal incentive + FA personal commission.
        </p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <select
            className="appearance-none pl-4 pr-10 py-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 cursor-pointer shadow-sm transition-all"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {months.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        <div className="relative">
          <select
            className="appearance-none pl-4 pr-10 py-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 cursor-pointer shadow-sm transition-all"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        <button
          onClick={handleSearch}
          disabled={isFetching}
          className="px-6 py-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground shadow-sm hover:bg-muted/40 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Search
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
          <SummaryCard label="Total Net" value={fmt(totalNet)} />
          <SummaryCard label="EPF (Employee)" value={fmt(totalEpf)} />
          <SummaryCard label="EPF (Employer)" value={fmt(totalEpfEmployer)} />
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
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-8"></th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Employee</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Basic</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fuel</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vehicle</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Allowance</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Attend.</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Leaves</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ORC</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">P.Incentive</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">P.Commission</th>
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
                  const ov = overrides[row.memberId] ?? {};
                  const isExpanded = expandedRows.has(row.memberId);
                  const isPaid = row.status === "PAID";

                  return (
                    <>
                      <tr
                        key={row.memberId}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Expand toggle */}
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleExpand(row.memberId)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit allowances for this run"
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </button>
                        </td>

                        {/* Employee */}
                        <td className="px-4 py-4">
                          <p className="font-bold text-foreground text-sm leading-tight">{row.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter mt-0.5">{row.empNo}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-bold text-muted-foreground">{row.position}</span>
                            {row.isManagementStaff && (
                              <span className="text-[9px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-tight">Mgmt</span>
                            )}
                          </div>
                        </td>

                        {/* Basic salary */}
                        <td className="px-3 py-4 text-right">
                          <NumInput
                            value={ov.basicSalary ?? row.basicSalary}
                            disabled={isPaid}
                            onChange={(v) => setField(row.memberId, "basicSalary", v)}
                          />
                          {!row.baseSalaryConfigured && (
                            <p className="text-[9px] font-bold text-amber-600/80 uppercase tracking-wider mt-0.5">No default</p>
                          )}
                        </td>

                        {/* Fuel */}
                        <td className="px-3 py-4 text-right text-xs font-bold text-foreground">
                          {fmtSmall(ov.fuelAllowance ?? row.fuelAllowance)}
                        </td>

                        {/* Vehicle */}
                        <td className="px-3 py-4 text-right text-xs font-bold text-foreground">
                          {fmtSmall(ov.vehicleAllowance ?? row.vehicleAllowance)}
                        </td>

                        {/* Fixed allowance (channelOperation) */}
                        <td className="px-3 py-4 text-right text-xs font-bold text-foreground">
                          {fmtSmall(ov.channelOperation ?? row.channelOperation)}
                        </td>

                        {/* Attendance allowance */}
                        <td className="px-3 py-4 text-right">
                          <span className={`text-xs font-bold ${row.attendanceAllowanceHit ? "text-green-600" : "text-muted-foreground/50"}`}>
                            {fmtSmall(ov.attendanceAllowance ?? row.attendanceAllowance)}
                          </span>
                          {!row.attendanceAllowanceHit && (ov.attendanceAllowance ?? row.attendanceAllowance) > 0 && (
                            <p className="text-[9px] text-destructive/70 font-bold uppercase">Missed</p>
                          )}
                        </td>

                        {/* Leaves taken input */}
                        <td className="px-3 py-4 text-right">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={ov.leavesTaken ?? row.leavesTaken}
                            disabled={isPaid}
                            onChange={(e) => setField(row.memberId, "leavesTaken", Number(e.target.value))}
                            className="w-16 text-right px-2 py-1.5 bg-muted/30 border border-border rounded-lg text-xs font-bold text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
                          />
                        </td>

                        {/* ORC */}
                        <td className="px-3 py-4 text-right text-xs font-bold">
                          {row.receivesOrc ? (
                            <span className="text-blue-600">{fmtSmall(row.orcEarned)}</span>
                          ) : (
                            <span className="text-muted-foreground/30">N/A</span>
                          )}
                        </td>

                        {/* Personal Incentive (management 500K+) */}
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

                        {/* Personal Commission */}
                        <td className="px-3 py-4 text-right text-xs font-bold">
                          {row.isManagementStaff ? (
                            <div className="flex flex-col items-end">
                              <span className={row.personalCommission > 0 ? "text-primary" : "text-muted-foreground/40"}>
                                {fmtSmall(row.personalCommission)}
                              </span>
                              {row.volumeAchieved > 0 && (
                                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">
                                  {row.volumeAchieved >= 500000 ? "10%" : "7%"} of {(row.volumeAchieved / 1000).toFixed(0)}K
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30">N/A</span>
                          )}
                        </td>

                        {/* Gross */}
                        <td className="px-3 py-4 text-right text-xs font-bold text-muted-foreground">
                          {fmt(row.grossPay)}
                        </td>

                        {/* EPF Employee */}
                        <td className="px-3 py-4 text-right text-xs font-bold text-destructive">
                          -{fmtSmall(row.epfDeduction)}
                        </td>

                        {/* ETF Employer */}
                        <td className="px-3 py-4 text-right text-xs font-bold text-muted-foreground">
                          <span title="Employer contribution — not deducted from net pay">
                            {fmtSmall(row.etfEmployer)}
                          </span>
                        </td>

                        {/* Advance */}
                        <td className="px-3 py-4 text-right text-xs font-bold">
                          {row.advanceDeducted > 0 ? (
                            <div
                              className="flex flex-col items-end gap-0.5 cursor-help"
                              title={
                                row.outstandingAdvanceRemaining > row.advanceDeducted
                                  ? `${fmt(row.outstandingAdvanceRemaining - row.advanceDeducted)} remaining`
                                  : "Fully paid off"
                              }
                            >
                              <span className="text-destructive">-{fmt(row.advanceDeducted)}</span>
                              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                                {row.advanceTypes?.join(" + ")}
                              </span>
                            </div>
                          ) : row.outstandingAdvanceRemaining > 0 ? (
                            <div className="flex flex-col items-end gap-0.5" title={`${fmt(row.outstandingAdvanceRemaining)} remaining`}>
                              <span className="text-amber-600">Rs. 0</span>
                              <span className="text-[9px] font-bold text-amber-600/70 uppercase tracking-wider">Pending</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>

                        {/* Net Pay */}
                        <td className="px-3 py-4 text-right text-sm font-bold text-foreground">
                          {fmt(row.netPay)}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-4 text-center">
                          {row.status === "PAID" ? (
                            <span className="text-[10px] font-bold text-green-600 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full uppercase tracking-tight">
                              Paid
                            </span>
                          ) : row.alreadyProcessed ? (
                            <button
                              onClick={() => handleMarkPaid(row.memberId)}
                              disabled={payingId === row.memberId}
                              className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-tight hover:bg-primary/20 transition-all disabled:opacity-50"
                            >
                              {payingId === row.memberId ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              Mark Paid
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground/50 bg-muted border border-border px-3 py-1 rounded-full uppercase tracking-tight">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded allowance editor */}
                      {isExpanded && (
                        <tr key={`${row.memberId}-expand`} className="bg-muted/10 border-b border-border">
                          <td colSpan={17} className="px-8 py-4">
                            <div className="flex flex-wrap gap-4 items-end">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-full mb-1">
                                Override allowances for this run — <span className="text-primary">changes apply on Search or Run</span>
                              </p>

                              <AllowanceInput label="Fixed Allowance (Channel Op)" value={ov.channelOperation ?? row.channelOperation} disabled={isPaid} onChange={(v) => setField(row.memberId, "channelOperation", v)} />
                              <AllowanceInput label="Vehicle Allowance" value={ov.vehicleAllowance ?? row.vehicleAllowance} disabled={isPaid} onChange={(v) => setField(row.memberId, "vehicleAllowance", v)} />
                              <AllowanceInput label="Fuel Allowance" value={ov.fuelAllowance ?? row.fuelAllowance} disabled={isPaid} onChange={(v) => setField(row.memberId, "fuelAllowance", v)} />
                              <AllowanceInput label="Attendance Allowance" value={ov.attendanceAllowance ?? row.attendanceAllowance} disabled={isPaid} onChange={(v) => setField(row.memberId, "attendanceAllowance", v)} />
                              <AllowanceInput label="Fixed Allowance (Other)" value={ov.fixedAllowance ?? row.fixedAllowance} disabled={isPaid} onChange={(v) => setField(row.memberId, "fixedAllowance", v)} />

                              <div className="border-l border-border pl-4 flex flex-wrap gap-4">
                                <AllowanceInput label="Loan Instalments (Deduct)" value={ov.loanInstalments ?? row.loanInstalments} disabled={isPaid} onChange={(v) => setField(row.memberId, "loanInstalments", v)} isDeduction />
                                <AllowanceInput label="Festival Advance (Deduct)" value={ov.festivalAdvance ?? row.festivalAdvance} disabled={isPaid} onChange={(v) => setField(row.memberId, "festivalAdvance", v)} isDeduction />
                                <AllowanceInput label="Merchandise Deduction" value={ov.merchandiseDeduction ?? row.merchandiseDeduction} disabled={isPaid} onChange={(v) => setField(row.memberId, "merchandiseDeduction", v)} isDeduction />
                              </div>

                              <button
                                onClick={() => handleSaveConfig(row)}
                                disabled={savingId === row.memberId || isPaid}
                                className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-all disabled:opacity-40"
                                title="Save as standing default for this member"
                              >
                                {savingId === row.memberId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                                Save as Default
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EPF/ETF employer totals note */}
      {preview.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            EPF Employer ({fmt(totalEpfEmployer)}) and ETF ({fmt(totalEtf)}) are employer contributions —
            they are displayed for payroll records but are <strong>not deducted</strong> from employee net pay.
          </span>
        </div>
      )}

      {/* Action Buttons */}
      {preview.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={() => handleRunPayroll(false)}
            disabled={running}
            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 disabled:opacity-50 hover:opacity-90 shadow-xl shadow-primary/20"
          >
            {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
            Run Standard Batch
          </button>
          <button
            onClick={() => handleRunPayroll(true)}
            disabled={running}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 border border-destructive/20 hover:bg-destructive/20"
          >
            <RefreshCw className="w-5 h-5" />
            Force Re-run (unpaid only)
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

function NumInput({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-28 text-right px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50"
    />
  );
}

function AllowanceInput({
  label,
  value,
  disabled,
  onChange,
  isDeduction,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
  isDeduction?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className={`text-[10px] font-bold uppercase tracking-widest ${isDeduction ? "text-destructive/70" : "text-muted-foreground"}`}>
        {label}
      </label>
      <input
        type="number"
        value={value}
        disabled={disabled}
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