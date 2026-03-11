"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2, Play, RefreshCw, AlertTriangle, CheckCircle2,
  ChevronDown, TrendingUp, Banknote, Car, Percent
} from "lucide-react";
import { getBranches } from "@/app/features/branches/actions";
import { toast } from "sonner";
import { getPayrollPreview, runMonthlyPayroll } from "../payroll-action";

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">
          Monthly Payroll
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Enter volume achieved per employee and run payroll for the selected month.
        </p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer"
            value={selectedBranchId ?? ""}
            onChange={(e) => setSelectedBranchId(Number(e.target.value))}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <button
          onClick={handleRefreshPreview}
          disabled={loadingPreview}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold rounded-xl transition-all"
        >
          {loadingPreview
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <RefreshCw className="w-4 h-4" />
          }
          Refresh Preview
        </button>
      </div>

      {/* Warnings */}
      {alreadyProcessedCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {alreadyProcessedCount} employee{alreadyProcessedCount > 1 ? "s" : ""} already have payroll for this month.
          Use "Force Re-run" to overwrite.
        </div>
      )}
      {unconfiguredCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {unconfiguredCount} employee{unconfiguredCount > 1 ? "s" : ""} have no salary config — they will be skipped.
          Configure positions in the Salary Config page first.
        </div>
      )}

      {/* Summary Cards */}
      {preview.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total Gross", value: fmt(totalGross), icon: Banknote, color: "text-blue-600" },
            { label: "Total Net Pay", value: fmt(totalNet), icon: TrendingUp, color: "text-emerald-600" },
            { label: "EPF (Employee)", value: fmt(totalEpfEmployee), icon: Percent, color: "text-amber-600" },
            { label: "EPF (Employer)", value: fmt(totalEpfEmployer), icon: Percent, color: "text-orange-600" },
            { label: "ETF (Employer)", value: fmt(totalEtf), icon: Car, color: "text-violet-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
              <Icon className={`w-4 h-4 mb-2 ${color}`} />
              <p className="text-lg font-black text-slate-800">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loadingPreview ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : preview.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-slate-400">
            No employees found for this branch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Position</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Volume Achieved</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Basic</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Incentive</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Allowance</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Commission</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">EPF (emp)</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Net Pay</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {preview.map((row) => (
                  <tr key={row.memberId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-700">{row.name}</p>
                      <p className="text-[11px] text-slate-400">{row.empNo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-slate-500">{row.position}</span>
                      <span className={`ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        row.status === "PERMANENT"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      }`}>
                        {row.status === "PERMANENT" ? "Perm" : "Prob"}
                      </span>
                    </td>

                    {/* Editable volume input */}
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        value={volumes[row.memberId] ?? 0}
                        onChange={(e) => handleVolumeChange(row.memberId, Number(e.target.value))}
                        className="w-32 text-right px-2 py-1 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </td>

                    {!row.salaryConfigured ? (
                      <td colSpan={6} className="px-4 py-3 text-center text-xs text-red-400 font-medium">
                        No salary config — will be skipped
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                          {fmt(row.breakdown?.basicSalary ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold">
                          <span className={row.breakdown?.incentiveHit ? "text-emerald-600 font-bold" : "text-slate-400"}>
                            {fmt(row.breakdown?.incentiveEarned ?? 0)}
                            {row.breakdown?.incentiveHit && <CheckCircle2 className="inline w-3 h-3 ml-1" />}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold">
                          <span className={row.breakdown?.allowanceHit ? "text-blue-600 font-bold" : "text-slate-400"}>
                            {fmt(row.breakdown?.allowanceEarned ?? 0)}
                            {row.breakdown?.allowanceHit && <CheckCircle2 className="inline w-3 h-3 ml-1" />}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-violet-600">
                          {fmt(row.breakdown?.commissionEarned ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-red-500">
                          -{fmt(row.breakdown?.epfDeduction ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-black text-slate-800">
                          {fmt(row.breakdown?.netPay ?? 0)}
                        </td>
                      </>
                    )}

                    <td className="px-4 py-3">
                      {row.alreadyProcessed ? (
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                          Processed
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                          Pending
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
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleRunPayroll(false)}
            disabled={running}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run Payroll (skip processed)
          </button>
          <button
            onClick={() => handleRunPayroll(true)}
            disabled={running}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Force Re-run All
          </button>
        </div>
      )}
    </div>
  );
}