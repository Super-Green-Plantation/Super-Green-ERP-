"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardList, Play, RotateCcw, ChevronDown,
  CheckCircle2, Loader2, TrendingUp, Award,
  AlertCircle, Building2, Calendar, Users, SkipForward,
} from "lucide-react";
import { getBranches } from "@/app/features/branches/actions";
import { getEvaluationPreview, runBatchEvaluation } from "@/app/features/hr/evaluation-actions";
import Heading from "@/app/components/Heading";

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

interface Branch { id: number; name: string; location: string; }

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const fmt = (n: number) => n.toLocaleString("en-LK", { minimumFractionDigits: 0 });
const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

const StatusBadge = ({ status }: { status: string }) =>
  status === "PERMANENT" ? (
    <span className="px-3 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Permanent</span>
  ) : (
    <span className="px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Probation</span>
  );

const VolumeBar = ({ achieved, target }: { achieved: number; target: number }) => {
  const pct = Math.min((achieved / target) * 100, 100);
  return (
    <div className="space-y-1.5 w-full">
      <div className="h-2 bg-muted rounded-full overflow-hidden shadow-inner">
        <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-green-600" : "bg-primary"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">{pct.toFixed(0)}% of target</p>
    </div>
  );
};

export default function EvaluationsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [previews, setPreviews] = useState<EvalPreview[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "PROBATION" | "PERMANENT">("ALL");

  const filtered = filter === "ALL" ? previews : previews.filter(p => p.status === filter);

  useEffect(() => { getBranches().then((data: any) => setBranches(data)); }, []);

  const handlePreview = async () => {
    if (!selectedBranchId) { toast.error("Please select a branch"); return; }
    setLoadingPreview(true); setPreviews([]); setRan(false);
    try {
      const res = await getEvaluationPreview(selectedBranchId, selectedYear, selectedMonth);
      if (res.success) setPreviews(res.previews as EvalPreview[]);
      else toast.error(res.error ?? "Failed to load preview");
    } finally { setLoadingPreview(false); }
  };

  const handleRun = async (force = false) => {
    if (!selectedBranchId) return;
    setRunning(true);
    try {
      const res = await runBatchEvaluation(selectedBranchId, selectedYear, selectedMonth, force);
      if (res.success) { toast.success("Evaluation completed."); setRan(true); await handlePreview(); }
      else toast.error(res.error ?? "Evaluation failed");
    } finally { setRunning(false); }
  };

  console.log(previews);


  const probationCount = previews.filter(p => p.status === "PROBATION").length;
  const permanentCount = previews.length - probationCount;
  const targetHitCount = previews.filter(p => p.targetHit).length;
  const totalPayout = previews.reduce((s, p) => s + p.totalPayout, 0);
  const alreadyEvaluatedCount = previews.filter(p => p.alreadyEvaluated).length;

  return (
    <div className="max-w-6xl mx-auto sm:px-10 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4 pb-8 border-b border-border">
        
        <div className="w-full">
          <Heading>Monthly Evaluations</Heading>
          <p className="text-sm text-muted-foreground font-medium mt-2 max-w-2xl">Run probation target evaluations by branch and month to process bonuses.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card rounded-3xl border border-border shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 ml-1">Select Branch</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
              <select value={selectedBranchId ?? ""} onChange={(e) => { setSelectedBranchId(Number(e.target.value)); setPreviews([]); setRan(false); }} className="w-full pl-11 pr-10 py-3 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground appearance-none focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all cursor-pointer shadow-sm">
                <option value="" disabled>Select branch...</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 ml-1">Evaluation Month</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
              <select value={selectedMonth} onChange={(e) => { setSelectedMonth(Number(e.target.value)); setPreviews([]); setRan(false); }} className="w-full pl-11 pr-10 py-3 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground appearance-none focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all cursor-pointer shadow-sm">
                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 ml-1">Fiscal Year</label>
            <div className="relative">
              <select value={selectedYear} onChange={(e) => { setSelectedYear(Number(e.target.value)); setPreviews([]); setRan(false); }} className="w-full px-4 pr-10 py-3 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground appearance-none focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all cursor-pointer shadow-sm">
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Preview button + filter tabs */}
        <div className="sm:flex flex-wrap items-center gap-4 ">
          <button onClick={handlePreview} disabled={!selectedBranchId || loadingPreview} className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 disabled:opacity-50 hover:opacity-90 shadow-xl shadow-primary/10">
            {loadingPreview ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching...</> : <><Users className="w-4 h-4" /> Preview List</>}
          </button>

          {previews.length > 0 && (
            <div className="sm:flex sm:items-center gap-1 p-1 bg-muted rounded-2xl border border-border/50 shadow-inner">
              {(["ALL", "PROBATION", "PERMANENT"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${filter === f ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground opacity-60"
                    }`}
                >
                  {f === "ALL" ? `All (${previews.length})` : f === "PROBATION" ? `Probation (${probationCount})` : `Permanent (${permanentCount})`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {previews.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Employees", value: previews.length, icon: <Users className="w-4 h-4 text-muted-foreground" />, color: "bg-card border-border" },
              { label: "On Probation", value: probationCount, icon: <AlertCircle className="w-4 h-4 text-amber-600" />, color: "bg-amber-500/10 border-amber-500/20" },
              { label: "Targets Hit", value: `${targetHitCount} / ${probationCount}`, icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, color: "bg-green-500/10 border-green-500/20" },
              { label: "Total Bonuses", value: `Rs. ${fmt(totalPayout)}`, icon: <Award className="w-4 h-4 text-primary" />, color: "bg-primary/5 border-primary/20" },
            ].map((s) => (
              <div key={s.label} className={`p-5 rounded-3xl border ${s.color} flex items-center gap-4 shadow-sm`}>
                <div className="p-2.5 bg-card rounded-xl shadow-sm shrink-0 border border-border/50">{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate mb-0.5">{s.label}</p>
                  <p className="text-sm font-bold text-foreground truncate">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {alreadyEvaluatedCount > 0 && !ran && (
            <div className="flex items-start gap-4 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-amber-700 leading-relaxed uppercase tracking-tight">
                {alreadyEvaluatedCount} employee{alreadyEvaluatedCount > 1 ? "s" : ""} already evaluated. Use <span className="font-bold underline underline-offset-2 decoration-2">Force Re-run</span> to overwrite existing records.
              </p>
            </div>
          )}

          {/* Table */}
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {MONTHS[selectedMonth - 1]} {selectedYear} — {branches.find(b => b.id === selectedBranchId)?.name}
              </h3>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-tighter">{filtered.length} employees found</span>
            </div>

            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    {["Employee", "Position", "Status", "Volume Progress", "Bonus", "Excess", "Payout", "Eval Status"].map((h) => (
                      <th key={h} className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap first:pl-6 last:pr-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((p) => (
                    <tr key={p.memberId} className={`transition-colors h-20 ${p.alreadyEvaluated ? "bg-muted/30" : "hover:bg-muted/50"}`}>
                      <td className="px-5 py-4 pl-6">
                        <p className="text-sm font-bold text-foreground leading-tight">{p.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter mt-1">#{p.empNo}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-muted border border-border rounded-lg text-[9px] font-bold uppercase text-foreground/70">{p.positionTitle}</span>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={p.status} /></td>

                      {/* Volume column — single, filtered by status */}
                      <td className="px-4 py-4 min-w-40">
                        {p.status === "PROBATION" && p.targetAmount > 0 ? (
                          <div>
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Rs. {fmt(p.volumeAchieved)}
                              <span className="text-slate-400 font-medium"> / {fmt(p.targetAmount)}</span>
                            </p>
                            <VolumeBar achieved={p.volumeAchieved} target={p.targetAmount} />
                          </div>
                        ) : p.status === "PERMANENT" ? (
                          <span className="text-xs font-semibold text-slate-500">
                            {p.volumeAchieved > 0 ? `Rs. ${fmt(p.volumeAchieved)}` : "—"}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {p.bonusEarned > 0 ? <span className="text-sm font-bold text-green-600">+{fmt(p.bonusEarned)}</span> : <span className="text-muted-foreground/20">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        {p.excessBonus > 0 ? <span className="text-sm font-bold text-primary">+{fmt(p.excessBonus)}</span> : <span className="text-muted-foreground/20">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        {p.totalPayout > 0 ? <span className="text-sm font-bold text-foreground tabular-nums">Rs. {fmt(p.totalPayout)}</span> : <span className="text-muted-foreground/20">—</span>}
                      </td>
                      <td className="px-5 py-4 pr-6">
                        {p.alreadyEvaluated ? (
                          <span className="flex items-center gap-1.5 text-[9px] font-bold text-green-600 uppercase tracking-widest"><CheckCircle2 className="w-3.5 h-3.5" /> Evaluated</span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-slate-50">
              {filtered.map((p) => (
                <div key={p.memberId} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{p.name}</p>
                      <p className="text-[10px] text-slate-400">#{p.empNo} · {p.positionTitle}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  {p.status === "PROBATION" && p.targetAmount > 0 && <VolumeBar achieved={p.volumeAchieved} target={p.targetAmount} />}
                  {p.status === "PERMANENT" && p.volumeAchieved > 0 && <p className="text-xs text-slate-500 font-semibold">Volume: Rs. {fmt(p.volumeAchieved)}</p>}
                  {p.totalPayout > 0 && (
                    <div className="flex gap-3 text-xs">
                      {p.bonusEarned > 0 && <span className="text-emerald-600 font-bold">Bonus: +{fmt(p.bonusEarned)}</span>}
                      {p.excessBonus > 0 && <span className="text-violet-600 font-bold">Excess: +{fmt(p.excessBonus)}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button onClick={() => handleRun(false)} disabled={running} className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground text-sm font-bold uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 shadow-xl shadow-primary/20 hover:opacity-90 disabled:opacity-50">
              {running ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Play className="w-5 h-5 fill-current" /> Run Evaluation Batch</>}
            </button>
            {alreadyEvaluatedCount > 0 && (
              <button onClick={() => handleRun(true)} disabled={running} className="flex items-center justify-center gap-3 px-8 py-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 hover:bg-destructive/20">
                <RotateCcw className="w-5 h-5" /> Force Re-run
              </button>
            )}
          </div>

          {ran && (
            <div className="flex items-center gap-4 p-5 bg-green-500/10 border border-green-500/20 rounded-2xl animate-in zoom-in-95 duration-500">
              <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-600 uppercase tracking-widest">Process Synchronized</p>
                <p className="text-xs text-muted-foreground font-bold mt-1">Records successfully saved for {MONTHS[selectedMonth - 1]} {selectedYear}. Total payout: Rs. {fmt(totalPayout)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!loadingPreview && previews.length === 0 && selectedBranchId && (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-border rounded-[2rem] bg-muted/20">
          <div className="p-6 bg-card rounded-3xl mb-6 shadow-sm"><TrendingUp className="w-10 h-10 text-muted-foreground opacity-20" /></div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-40">Select options and click Preview</p>
        </div>
      )}
    </div>
  );
}
