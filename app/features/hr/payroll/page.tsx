"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2, Play, RefreshCw, AlertTriangle, CheckCircle2,
  ChevronDown, TrendingUp, Banknote, Car, Percent, Users
} from "lucide-react";
import { getBranches } from "@/app/features/branches/actions";
import { toast } from "sonner";
import { getPayrollPreview, runMonthlyPayroll } from "../payroll-action";
import Heading from "@/app/components/Heading";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const today = new Date();

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [preview, setPreview] = useState<any[]>([]);
  const [volumes, setVolumes] = useState<Record<number, number>>({});
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [running, setRunning] = useState(false);

  // Load branches once
  useEffect(() => {
    getBranches().then((data: any[]) => {
      setBranches(data);
      if (data.length > 0) setSelectedBranchId(data[0].id);
    });
  }, []);

  // Load preview whenever branch / month / year changes
  const loadPreview = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoadingPreview(true);
    try {
      const rows = await getPayrollPreview(selectedBranchId, year, month, volumes);
      setPreview(rows);
      // Seed volumes from existing payroll records on first load
      const seedVolumes: Record<number, number> = {};
      for (const r of rows) {
        if (!(r.memberId in volumes)) {
          seedVolumes[r.memberId] = r.volumeAchieved ?? 0;
        }
      }
      if (Object.keys(seedVolumes).length > 0) {
        setVolumes((prev) => ({ ...seedVolumes, ...prev }));
      }
    } catch {
      toast.error("Failed to load preview");
    } finally {
      setLoadingPreview(false);
    }
  }, [selectedBranchId, year, month]); // intentionally excludes volumes to avoid loop

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  // Refresh preview when volume changes (debounced via button)
  const handleVolumeChange = (memberId: number, value: number) => {
    setVolumes((prev) => ({ ...prev, [memberId]: value }));
  };

  const handleRefreshPreview = async () => {
    if (!selectedBranchId) return;
    setLoadingPreview(true);
    try {
      const rows = await getPayrollPreview(selectedBranchId, year, month, volumes);
      setPreview(rows);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleRunPayroll = async (force = false) => {
    if (!selectedBranchId) return;
    setRunning(true);
    try {
      const result = await runMonthlyPayroll(selectedBranchId, year, month, volumes, force);
      if (result.success) {
        toast.success(`Payroll processed: ${result.processed} employees`);
        if (result.skipped > 0) toast.warning(`${result.skipped} already processed — skipped`);
        if (result.errors.length > 0) toast.error(`Errors: ${result.errors.join(", ")}`);
        await loadPreview();
      }
    } catch {
      toast.error("Failed to run payroll");
    } finally {
      setRunning(false);
    }
  };



  // Derived stats
  const totalGross = preview.reduce((s, r) => s + (r.breakdown?.grossPay ?? 0), 0);
  const totalNet = preview.reduce((s, r) => s + (r.breakdown?.netPay ?? 0), 0);
  const totalEpfEmployee = preview.reduce((s, r) => s + (r.breakdown?.epfDeduction ?? 0), 0);
  const totalEpfEmployer = preview.reduce((s, r) => s + (r.breakdown?.epfEmployer ?? 0), 0);
  const totalEtf = preview.reduce((s, r) => s + (r.breakdown?.etfEmployer ?? 0), 0);
  const alreadyProcessedCount = preview.filter((r) => r.alreadyProcessed).length;
  const unconfiguredCount = preview.filter((r) => !r.salaryConfigured).length;

  console.log(preview);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div>
        <Heading>
          Monthly Payroll
        </Heading>
        <p className="text-sm text-muted-foreground mt-2 font-medium max-w-2xl">
          Enter volume achieved per employee and run payroll for the selected month.
        </p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            className="appearance-none pl-4 pr-10 py-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 cursor-pointer shadow-sm transition-all"
            value={selectedBranchId ?? ""}
            onChange={(e) => setSelectedBranchId(Number(e.target.value))}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        <div className="relative">
          <select
            className="appearance-none pl-4 pr-10 py-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 cursor-pointer shadow-sm transition-all"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
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
            {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        <button
          onClick={handleRefreshPreview}
          disabled={loadingPreview}
          className="flex items-center gap-2 px-6 py-3 bg-card border border-border hover:bg-muted text-foreground text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          {loadingPreview
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <RefreshCw className="w-4 h-4" />
          }
          Refresh
        </button>
      </div>

      {/* Warnings */}
      {alreadyProcessedCount > 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm font-bold text-amber-600 uppercase tracking-tight">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{alreadyProcessedCount} employee{alreadyProcessedCount > 1 ? "s" : ""} already processed — use "Force Re-run" to overwrite.</span>
        </div>
      )}
      {unconfiguredCount > 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm font-bold text-destructive uppercase tracking-tight">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{unconfiguredCount} employee{unconfiguredCount > 1 ? "s" : ""} missing salary configuration.</span>
        </div>
      )}

      {/* Summary Cards */}
      {preview.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total Gross", value: fmt(totalGross), icon: Banknote, color: "text-primary" },
            { label: "Total Net Pay", value: fmt(totalNet), icon: TrendingUp, color: "text-green-600" },
            { label: "EPF (Employee)", value: fmt(totalEpfEmployee), icon: Percent, color: "text-amber-600" },
            { label: "EPF (Employer)", value: fmt(totalEpfEmployer), icon: Percent, color: "text-orange-600" },
            { label: "ETF (Employer)", value: fmt(totalEtf), icon: Car, color: "text-muted-foreground" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className={`p-2 w-fit rounded-lg bg-muted mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums tracking-tight">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 opacity-70">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loadingPreview ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : preview.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-sm text-muted-foreground gap-4">
            <Users size={48} strokeWidth={1} className="opacity-20" />
            <p className="font-bold uppercase tracking-[0.2em] text-xs">No employees found for this branch</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Position</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Volume Achieved</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Basic</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Incentive</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Allowance</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Commission</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">EPF (emp)</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Pay</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.map((row) => (
                  <tr key={row.memberId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-foreground text-sm leading-tight">{row.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter mt-0.5">{row.empNo}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-muted-foreground">{row.position}</span>
                        <div className="flex">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${row.status === "PERMANENT"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}>
                            {row.status === "PERMANENT" ? "Permanent" : "Probation"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Editable volume input */}
                    <td className="px-5 py-4 text-right">
                      <input
                        type="number"
                        value={volumes[row.memberId] ?? 0}
                        onChange={(e) => handleVolumeChange(row.memberId, Number(e.target.value))}
                        className="w-32 text-right px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      />
                    </td>

                    {!row.salaryConfigured ? (
                      <td colSpan={6} className="px-4 py-3 text-center text-xs text-red-400 font-medium">
                        No salary config — will be skipped
                      </td>
                    ) : (
                      <>
                        <td className="px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                          {fmt(row.breakdown?.basicSalaryPermanent ?? 0)}
                        </td>
                        <td className="px-5 py-4 text-right text-xs font-bold">
                          <span className={row.breakdown?.incentiveHit ? "text-green-600" : "text-muted-foreground/40"}>
                            {fmt(row.breakdown?.incentiveEarned ?? 0)}
                            {row.breakdown?.incentiveHit && <CheckCircle2 className="inline w-3 h-3 ml-1" />}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-xs font-bold">
                          <span className={row.breakdown?.allowanceHit ? "text-primary" : "text-muted-foreground/40"}>
                            {fmt(row.breakdown?.allowanceEarned ?? 0)}
                            {row.breakdown?.allowanceHit && <CheckCircle2 className="inline w-3 h-3 ml-1" />}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-xs font-bold text-primary">
                          {fmt(row.breakdown?.commissionEarned ?? 0)}
                        </td>
                        <td className="px-5 py-4 text-right text-xs font-bold text-destructive">
                          -{fmt(row.breakdown?.epfDeduction ?? 0)}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-bold text-foreground">
                          {fmt(row.breakdown?.netPay ?? 0)}
                        </td>
                      </>
                    )}

                    <td className="px-5 py-4 text-center">
                      {row.alreadyProcessed ? (
                        <span className="text-[10px] font-bold text-green-600 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full uppercase tracking-tight">
                          Done
                        </span>
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
            Force Re-run All
          </button>
        </div>
      )}
    </div>
  );
}
