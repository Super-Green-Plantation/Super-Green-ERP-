"use client";

// app/features/hr/evaluations/page.tsx

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardList, Play, RotateCcw, ChevronDown,
  CheckCircle2, XCircle, Minus, Loader2,
  TrendingUp, Award, AlertCircle, Building2,
  Calendar, Users, SkipForward,
} from "lucide-react";
import { getBranches } from "@/app/features/branches/actions";
import {
  getEvaluationPreview,
  runBatchEvaluation,
} from "@/app/features/hr/evaluation-actions";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EvalPreview {
  memberId: number;
  name: string;
  empNo: string;
  positionTitle: string;
  status: string;
  periodNumber: number | null;
  monthInPeriod: number | null;
  volumeAchieved: number;
  targetAmount: number;
  bonusEarned: number;
  excessBonus: number;
  targetHit: boolean;
  alreadyEvaluated: boolean;
  totalPayout: number;
}

interface Branch {
  id: number;
  name: string;
  location: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const fmt = (n: number) =>
  n.toLocaleString("en-LK", { minimumFractionDigits: 0 });

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

// ── Status badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "PERMANENT") {
    return (
      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase">
        Permanent
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black uppercase">
      Probation
    </span>
  );
};

// ── Progress bar ──────────────────────────────────────────────────────────────

const VolumeBar = ({ achieved, target }: { achieved: number; target: number }) => {
  if (target === 0) return <span className="text-xs text-slate-400">—</span>;
  const pct = Math.min((achieved / target) * 100, 100);
  return (
    <div className="space-y-1 w-full">
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-blue-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] font-bold text-slate-400">
        {pct.toFixed(0)}% of target
      </p>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EvaluationsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [previews, setPreviews] = useState<EvalPreview[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    getBranches().then((data: any) => setBranches(data));
  }, []);

  const handlePreview = async () => {
    if (!selectedBranchId) {
      toast.error("Please select a branch");
      return;
    }
    setLoadingPreview(true);
    setPreviews([]);
    setRan(false);
    try {
      const res = await getEvaluationPreview(selectedBranchId, selectedYear, selectedMonth);
      if (res.success) {
        setPreviews(res.previews as EvalPreview[]);
      } else {
        toast.error(res.error ?? "Failed to load preview");
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleRun = async (force = false) => {
    if (!selectedBranchId) return;
    setRunning(true);
    try {
      const res = await runBatchEvaluation(selectedBranchId, selectedYear, selectedMonth, force);
      if (res.success) {
        toast.success("Evaluation completed successfully.");
        setRan(true);
        // Refresh preview to show updated state
        await handlePreview();
      } else {
        toast.error(res.error ?? "Evaluation failed");
      }
    } finally {
      setRunning(false);
    }
  };

  // Summary stats
  const totalEmployees = previews.length;
  const probationCount = previews.filter(p => p.status === "PROBATION").length;
  const targetHitCount = previews.filter(p => p.targetHit).length;
  const totalPayout = previews.reduce((s, p) => s + p.totalPayout, 0);
  const alreadyEvaluatedCount = previews.filter(p => p.alreadyEvaluated).length;

  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/20">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Monthly Evaluations
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Run probation target evaluations by branch and month.
            </p>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Branch selector */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Branch
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedBranchId ?? ""}
                onChange={(e) => {
                  setSelectedBranchId(Number(e.target.value));
                  setPreviews([]);
                  setRan(false);
                }}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
              >
                <option value="" disabled>Select branch...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Month selector */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Month
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(Number(e.target.value)); setPreviews([]); setRan(false); }}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
              >
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Year selector */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Year
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(Number(e.target.value)); setPreviews([]); setRan(false); }}
                className="w-full px-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Preview button */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handlePreview}
            disabled={!selectedBranchId || loadingPreview}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-300 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
          >
            {loadingPreview
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
              : <><Users className="w-4 h-4" /> Preview Employees</>
            }
          </button>
        </div>
      </div>

      {/* ── Preview Results ── */}
      {previews.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Employees", value: totalEmployees, icon: <Users className="w-4 h-4 text-slate-500" />, color: "bg-slate-50 border-slate-100" },
              { label: "On Probation", value: probationCount, icon: <AlertCircle className="w-4 h-4 text-amber-500" />, color: "bg-amber-50 border-amber-100" },
              { label: "Targets Hit", value: `${targetHitCount} / ${probationCount}`, icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, color: "bg-emerald-50 border-emerald-100" },
              { label: "Total Bonuses", value: `Rs. ${fmt(totalPayout)}`, icon: <Award className="w-4 h-4 text-blue-500" />, color: "bg-blue-50 border-blue-100" },
            ].map((s) => (
              <div key={s.label} className={`p-4 rounded-xl border ${s.color} flex items-center gap-3`}>
                <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide truncate">{s.label}</p>
                  <p className="text-sm font-black text-slate-800 truncate">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Already evaluated warning */}
          {alreadyEvaluatedCount > 0 && !ran && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-amber-800">
                {alreadyEvaluatedCount} employee{alreadyEvaluatedCount > 1 ? "s" : ""} already evaluated this month.
                Running again will skip them. Use <span className="font-black">Force Re-run</span> to overwrite.
              </p>
            </div>
          )}

          {/* Employee table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                {MONTHS[selectedMonth - 1]} {selectedYear} — {branches.find(b => b.id === selectedBranchId)?.name}
              </h3>
              <span className="text-xs text-slate-400 font-bold">{previews.length} employees</span>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Employee", "Position", "Status", "Volume vs Target", "Bonus", "Excess", "Total Payout", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {previews.map((p) => (
                    <tr key={p.memberId} className={`transition-colors ${p.alreadyEvaluated ? "bg-slate-50/50" : "hover:bg-blue-50/20"}`}>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">#{p.empNo}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase">
                          {p.positionTitle}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-4 min-w-35">
                        {p.targetAmount > 0 ? (
                          <div>
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Rs. {fmt(p.volumeAchieved)}
                              <span className="text-slate-400 font-medium"> / {fmt(p.targetAmount)}</span>
                            </p>
                            <VolumeBar achieved={p.volumeAchieved} target={p.targetAmount} />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {p.bonusEarned > 0
                          ? <span className="text-sm font-black text-emerald-600">+{fmt(p.bonusEarned)}</span>
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-4">
                        {p.excessBonus > 0
                          ? <span className="text-sm font-black text-violet-600">+{fmt(p.excessBonus)}</span>
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-4">
                        {p.totalPayout > 0
                          ? <span className="text-sm font-black text-blue-700">Rs. {fmt(p.totalPayout)}</span>
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-4">
                        {p.alreadyEvaluated && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-slate-400">
                            <SkipForward className="w-3 h-3" /> Done
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-50">
              {previews.map((p) => (
                <div key={p.memberId} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{p.name}</p>
                      <p className="text-[10px] text-slate-400">#{p.empNo} · {p.positionTitle}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  {p.targetAmount > 0 && (
                    <VolumeBar achieved={p.volumeAchieved} target={p.targetAmount} />
                  )}
                  {p.totalPayout > 0 && (
                    <div className="flex gap-3 text-xs">
                      {p.bonusEarned > 0 && <span className="text-emerald-600 font-black">Bonus: +{fmt(p.bonusEarned)}</span>}
                      {p.excessBonus > 0 && <span className="text-violet-600 font-black">Excess: +{fmt(p.excessBonus)}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Run buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => handleRun(false)}
              disabled={running}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              {running
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Running...</>
                : <><Play className="w-4 h-4" /> Run Evaluation</>
              }
            </button>
            {alreadyEvaluatedCount > 0 && (
              <button
                onClick={() => handleRun(true)}
                disabled={running}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" /> Force Re-run All
              </button>
            )}
          </div>

          {/* Success state */}
          {ran && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in duration-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-black text-emerald-800">Evaluation complete</p>
                <p className="text-xs text-emerald-600 font-medium">
                  Records saved for {MONTHS[selectedMonth - 1]} {selectedYear}.
                  Total bonuses: Rs. {fmt(totalPayout)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loadingPreview && previews.length === 0 && selectedBranchId && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-2xl">
          <div className="p-4 bg-slate-50 rounded-2xl mb-4">
            <TrendingUp className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-400">Click "Preview Employees" to load results</p>
        </div>
      )}
    </div>
  );
}