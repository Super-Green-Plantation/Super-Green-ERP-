"use client";

// app/features/hr/targets/page.tsx

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Target, Save, ChevronDown, ChevronRight,
  TrendingUp, Award, Percent, Loader2,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { getPositions, upsertPositionTargets } from "../position-targets-actions";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PositionTarget {
  periodNumber: number;
  monthNumber: number;
  targetAmount: number;
  bonusAmount: number;
  partialThreshold: number;
  partialBonus: number;
  excessRate: number;
}

interface Position {
  id: number;
  title: string;
  rank: number;
  positionTargets: PositionTarget[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PERIOD_LABELS = ["First 3 Months", "Second 3 Months"];
const RANK_COLORS: Record<number, string> = {
  1: "bg-slate-100 text-slate-600 border-slate-200",
  2: "bg-blue-50 text-blue-600 border-blue-200",
  3: "bg-violet-50 text-violet-600 border-violet-200",
  4: "bg-amber-50 text-amber-600 border-amber-200",
  5: "bg-orange-50 text-orange-600 border-orange-200",
  6: "bg-rose-50 text-rose-600 border-rose-200",
};

// Build a blank 6-row target grid for a position
function buildDefaultTargets(existing: PositionTarget[]): PositionTarget[] {
  const rows: PositionTarget[] = [];
  for (let p = 1; p <= 2; p++) {
    for (let m = 1; m <= 3; m++) {
      const found = existing.find(t => t.periodNumber === p && t.monthNumber === m);
      rows.push(found ?? {
        periodNumber: p,
        monthNumber: m,
        targetAmount: 0,
        bonusAmount: 0,
        partialThreshold: 0,
        partialBonus: 0,
        excessRate: 0,
      });
    }
  }
  return rows;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const MoneyInput = ({
  value,
  onChange,
  placeholder = "0",
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
      Rs.
    </span>
    <input
      type="number"
      min={0}
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
    />
  </div>
);

const RateInput = ({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) => (
  <div className="relative">
    <input
      type="number"
      min={0}
      max={100}
      step={0.1}
      value={value || ""}
      placeholder="0"
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full pl-3 pr-8 py-2 border rounded-lg text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
        ${disabled
          ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
          : "bg-white border-slate-200 text-slate-800"
        }`}
    />
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</span>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PositionTargetsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  // Local edits keyed by positionId
  const [edits, setEdits] = useState<Record<number, PositionTarget[]>>({});

  useEffect(() => {
    getPositions().then((data: Position[]) => {
      setPositions(data);
      const initial: Record<number, PositionTarget[]> = {};
      data.forEach((p) => {
        initial[p.id] = buildDefaultTargets(p.positionTargets ?? []);
      });
      setEdits(initial);
      // Auto-expand first position
      if (data.length > 0) setExpandedId(data[0].id);
      setLoading(false);
    });
  }, []);

  const updateTarget = (
    positionId: number,
    periodNumber: number,
    monthNumber: number,
    field: keyof Omit<PositionTarget, "periodNumber" | "monthNumber">,
    value: number
  ) => {
    setEdits((prev) => ({
      ...prev,
      [positionId]: prev[positionId].map((t) =>
        t.periodNumber === periodNumber && t.monthNumber === monthNumber
          ? { ...t, [field]: value }
          : t
      ),
    }));
  };

  const handleSave = async (positionId: number) => {
    setSaving(positionId);
    try {
      const res = await upsertPositionTargets(positionId, edits[positionId]);
      if (res.success) {
        toast.success("Targets saved successfully.");
      } else {
        toast.error(res.error ?? "Failed to save targets.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/20">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Position Targets
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Configure probation-period monthly targets and bonuses per position.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-[11px] font-bold text-amber-700">
            Changes apply to future evaluations only
          </p>
        </div>
      </div>
      <div>
        <Link href={"/features/hr/salary"}>
        For Permeant Employee
        </Link>
      </div>

      {/* ── Legend ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { icon: <TrendingUp className="w-4 h-4 text-blue-500" />, label: "Full Target", desc: "Volume to hit for full bonus" },
          { icon: <Award className="w-4 h-4 text-emerald-500" />, label: "Full Bonus", desc: "Paid when full target is hit" },
          { icon: <TrendingUp className="w-4 h-4 text-amber-500" />, label: "Partial Threshold", desc: "Lower volume for partial bonus" },
          { icon: <Award className="w-4 h-4 text-amber-400" />, label: "Partial Bonus", desc: "Paid when partial threshold is hit" },
          { icon: <Percent className="w-4 h-4 text-violet-500" />, label: "Excess Rate", desc: "Period 2 only — % above target" },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="p-1.5 bg-white rounded-lg shadow-sm shrink-0">{item.icon}</div>
            <div>
              <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide">{item.label}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Position Accordions ── */}
      <div className="space-y-3">
        {positions.map((position) => {
          const isExpanded = expandedId === position.id;
          const isSaving = saving === position.id;
          const targets = edits[position.id] ?? [];
          const rankColor = RANK_COLORS[position.rank] ?? "bg-slate-100 text-slate-600 border-slate-200";
          const hasTargets = position.positionTargets?.length > 0;

          return (
            <div
              key={position.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                isExpanded ? "border-slate-300 shadow-md" : "border-slate-100 shadow-sm"
              }`}
            >
              {/* Accordion Header */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(isExpanded ? null : position.id)}
                onKeyDown={(e) => e.key === "Enter" && setExpandedId(isExpanded ? null : position.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-black border uppercase tracking-wider ${rankColor}`}>
                    {position.title}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">Rank {position.rank}</span>
                  {hasTargets && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Configured
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {isExpanded && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleSave(position.id); }}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                    >
                      {isSaving ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                      ) : (
                        <><Save className="w-3 h-3" /> Save</>
                      )}
                    </button>
                  )}
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-slate-400" />
                    : <ChevronRight className="w-4 h-4 text-slate-400" />
                  }
                </div>
              </div>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-6 border-t border-slate-100">
                  {[1, 2].map((period) => {
                    const periodTargets = targets.filter(t => t.periodNumber === period);
                    const isPeriod2 = period === 2;

                    return (
                      <div key={period} className="pt-5">
                        {/* Period header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest border ${
                            isPeriod2
                              ? "bg-violet-50 text-violet-700 border-violet-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>
                            Period {period} — {PERIOD_LABELS[period - 1]}
                          </div>
                          {isPeriod2 && (
                            <span className="text-[10px] text-violet-500 font-bold italic">
                              Excess commission active
                            </span>
                          )}
                        </div>

                        {/* Column headers */}
                        <div className="grid grid-cols-6 gap-2 mb-2 px-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Month</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-blue-400" /> Full Target
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Award className="w-3 h-3 text-emerald-400" /> Full Bonus
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-amber-400" /> Partial Threshold
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-400" /> Partial Bonus
                          </p>
                          <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                            isPeriod2 ? "text-slate-400" : "text-slate-200"
                          }`}>
                            <Percent className="w-3 h-3 text-violet-400" /> Excess %
                          </p>
                        </div>

                        {/* Month rows */}
                        <div className="space-y-2">
                          {periodTargets.map((t) => (
                            <div
                              key={`${t.periodNumber}-${t.monthNumber}`}
                              className="grid grid-cols-6 gap-2 items-center p-3 bg-slate-50/50 rounded-xl border border-slate-100"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-xs font-black text-slate-700 shadow-sm">
                                  {t.monthNumber}
                                </div>
                              </div>
                              <MoneyInput
                                value={t.targetAmount}
                                onChange={(v) => updateTarget(position.id, t.periodNumber, t.monthNumber, "targetAmount", v)}
                              />
                              <MoneyInput
                                value={t.bonusAmount}
                                onChange={(v) => updateTarget(position.id, t.periodNumber, t.monthNumber, "bonusAmount", v)}
                              />
                              <MoneyInput
                                value={t.partialThreshold}
                                onChange={(v) => updateTarget(position.id, t.periodNumber, t.monthNumber, "partialThreshold", v)}
                              />
                              <MoneyInput
                                value={t.partialBonus}
                                onChange={(v) => updateTarget(position.id, t.periodNumber, t.monthNumber, "partialBonus", v)}
                              />
                              <RateInput
                                value={t.excessRate * 100}
                                disabled={!isPeriod2}
                                onChange={(v) => updateTarget(position.id, t.periodNumber, t.monthNumber, "excessRate", v / 100)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}