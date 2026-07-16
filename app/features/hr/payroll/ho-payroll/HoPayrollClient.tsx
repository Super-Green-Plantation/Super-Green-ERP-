"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Loader2, Play, RefreshCw, ChevronDown, CheckCircle2, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";
import {
  getHoPayrollPreview,
  runHoPayroll,
  markManagementSalaryPaid,
  upsertManagementBaseSalary,
} from "../ho-payroll-action";
import Heading from "@/app/components/Heading";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type HoPayrollClientProps = {
  initialYear: number;
  initialMonth: number;
  initialPreview: any[];
};

export default function HoPayrollClient({
  initialYear,
  initialMonth,
  initialPreview,
}: HoPayrollClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [overrides, setOverrides] = useState<Record<number, number>>({});
  const [running, setRunning] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [savingDefaultId, setSavingDefaultId] = useState<number | null>(null);

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
  } = useQuery({
    queryKey,
    queryFn: () => {
      const mapped = Object.fromEntries(
        Object.entries(overrides).map(([id, val]) => [id, { basicSalary: val }])
      );
      return getHoPayrollPreview(year, month, mapped);
    },
    enabled: false,
    initialData: year === initialYear && month === initialMonth ? initialPreview : undefined,
    placeholderData: keepPreviousData,
  });

  // Seed base-salary overrides from the fetched rows so the input reflects
  // the default/snapshotted base salary until the user edits it.
  useEffect(() => {
    setOverrides((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const r of preview) {
        if (!(r.memberId in next)) {
          next[r.memberId] = r.baseSalary;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [preview]);

  const handleBaseSalaryChange = (memberId: number, value: number) => {
    setOverrides((prev) => ({ ...prev, [memberId]: value }));
  };

  const handleSearch = async () => {
    await refetch();
  };

  const handleRunPayroll = async (force = false) => {
    setRunning(true);
    try {
      const mapped = Object.fromEntries(
        Object.entries(overrides).map(([id, val]) => [id, { basicSalary: val }])
      );
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

  const handleSaveDefault = async (memberId: number) => {
    setSavingDefaultId(memberId);
    try {
      await upsertManagementBaseSalary(memberId, overrides[memberId] ?? 0);
      toast.success("Standing base salary updated");
      await refetch();
    } catch {
      toast.error("Failed to update base salary");
    } finally {
      setSavingDefaultId(null);
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

  const totalGross = useMemo(() => preview.reduce((s: number, r: any) => s + (r.grossPay ?? 0), 0), [preview]);
  const totalNet = useMemo(() => preview.reduce((s: number, r: any) => s + (r.netPay ?? 0), 0), [preview]);
  const totalEpf = useMemo(() => preview.reduce((s: number, r: any) => s + (r.epfDeduction ?? 0), 0), [preview]);
  const unconfiguredCount = useMemo(() => preview.filter((r: any) => !r.baseSalaryConfigured).length, [preview]);

  return (
    <div className="w-full min-h-screen p-4 sm:p-8 flex flex-col gap-6 sm:gap-8 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div>
        <Heading>Head Office Payroll</Heading>
        <p className="text-sm text-muted-foreground mt-2 font-medium max-w-2xl">
          Management salaries (RM / ZM / AGM / COO and fixed-salary HO staff). Base salary
          defaults from each member&apos;s standing salary and can be overridden per run.
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
            {Array.from({ length: 6 }, (_, i) => today_year() - 3 + i).map((y) => (
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
            {unconfiguredCount} member{unconfiguredCount > 1 ? "s" : ""} without a base salary configured
          </div>
        )}
      </div>

      {/* Summary cards */}
      {preview.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <SummaryCard label="Total Gross" value={fmt(totalGross)} />
          <SummaryCard label="Total EPF (Emp)" value={fmt(totalEpf)} />
          <SummaryCard label="Total Net" value={fmt(totalNet)} />
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
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Employee</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Base Salary</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Personal Comm.</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ORC</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">EPF (emp)</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Advance</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gross</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Net Pay</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.map((row: any) => (
                  <tr key={row.memberId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-foreground text-sm leading-tight">{row.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter mt-0.5">{row.empNo}</p>
                      <span className="text-xs font-bold text-muted-foreground">{row.position}</span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          value={overrides[row.memberId] ?? row.baseSalary}
                          onChange={(e) => handleBaseSalaryChange(row.memberId, Number(e.target.value))}
                          disabled={row.status === "PAID"}
                          className="w-28 text-right px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
                        />
                        <button
                          onClick={() => handleSaveDefault(row.memberId)}
                          disabled={savingDefaultId === row.memberId || row.status === "PAID"}
                          title="Save as this member's standing base salary"
                          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all disabled:opacity-40"
                        >
                          {savingDefaultId === row.memberId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {!row.baseSalaryConfigured && (
                        <p className="text-[9px] font-bold text-amber-600/80 uppercase tracking-wider mt-1">No default set</p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-xs font-bold text-primary">
                      {fmt(row.personalCommissionEarned ?? 0)}
                    </td>
                    <td className="px-5 py-4 text-right text-xs font-bold text-blue-600">
                      {fmt(row.orcEarned ?? 0)}
                    </td>
                    <td className="px-5 py-4 text-right text-xs font-bold text-destructive">
                      -{fmt(row.epfDeduction ?? 0)}
                    </td>

                    <td className="px-5 py-4 text-right text-xs font-bold">
                      {row.advanceDeducted > 0 ? (
                        <div
                          className="flex flex-col items-end gap-0.5 cursor-help"
                          title={
                            row.outstandingAdvanceRemaining > row.advanceDeducted
                              ? `${fmt(row.outstandingAdvanceRemaining - row.advanceDeducted)} remaining after this deduction`
                              : "Fully paid off after this deduction"
                          }
                        >
                          <span className="text-destructive">-{fmt(row.advanceDeducted)}</span>
                          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                            {row.advanceTypes?.join(" + ")}
                          </span>
                        </div>
                      ) : row.outstandingAdvanceRemaining > 0 ? (
                        <div className="flex flex-col items-end gap-0.5 cursor-help" title={`${fmt(row.outstandingAdvanceRemaining)} remaining`}>
                          <span className="text-amber-600">Rs. 0</span>
                          <span className="text-[9px] font-bold text-amber-600/70 uppercase tracking-wider">Pending</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                      {fmt(row.grossPay ?? 0)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-bold text-foreground">
                      {fmt(row.netPay ?? 0)}
                    </td>

                    <td className="px-5 py-4 text-center">
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
                          Wait
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {preview.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
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

function today_year() {
  return new Date().getFullYear();
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}
