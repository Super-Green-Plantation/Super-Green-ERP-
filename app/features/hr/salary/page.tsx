"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown, ChevronRight, Save, Loader2, CheckCircle2,
  Banknote, Target, TrendingUp, Car, Percent
} from "lucide-react";
import { toast } from "sonner";
import { getPositionSalaries, upsertPositionSalary } from "../salary-config-action";
import Back from "@/app/components/Buttons/Back";
import Loading from "@/app/components/Status/Loading";

// ─── Types ────────────────────────────────────────────────────────────────────

type SalaryForm = {
  basicSalaryPermanent: number;
  basicSalaryProbation: number;
  monthlyTarget: number;
  incentiveAmount: number;
  allowanceAmount: number;
  orcRatePermanent: number;   // ← add this
  commRateLow: number;     // e.g. 0.05
  commRateHigh: number;    // e.g. 0.08
  commThreshold: number;   // e.g. 500000
  epfEmployee: number;     // 0.08
  epfEmployer: number;     // 0.12
  etfEmployer: number;     // 0.03
  allowanceThresholdPermanent: number; // e.g. 1.0 (100% of target)
  allowanceThresholdProbation: number; // e.g. 0.75 (75% of target)
};

const DEFAULT_FORM: SalaryForm = {
  basicSalaryPermanent: 0,
  orcRatePermanent: 0,   // ← default to 0
  basicSalaryProbation: 0,
  monthlyTarget: 0,
  incentiveAmount: 0,
  allowanceAmount: 0,
  // remove orcRate
  commRateLow: 0.05,
  commRateHigh: 0.08,
  commThreshold: 500000,
  epfEmployee: 0.08,
  epfEmployer: 0.12,
  etfEmployer: 0.03,
  allowanceThresholdPermanent: 1.0,
  allowanceThresholdProbation: 0.75,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(0)}K`
      : String(n);

// for fields stored as whole % in form state (ORC, EPF, commRate)
const pctDisplay = (n: number) => `${n.toFixed(2)}%`;

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
  label, value, onChange, prefix, suffix, hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </label>
      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
        {prefix && (
          <span className="px-3 py-2 text-xs font-bold text-slate-400 bg-slate-50 border-r border-slate-200">
            {prefix}
          </span>
        )}
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 px-3 py-2 text-sm font-semibold text-slate-700 outline-none bg-white"
        />
        {suffix && (
          <span className="px-3 py-2 text-xs font-bold text-slate-400 bg-slate-50 border-l border-slate-200">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SalaryConfigPage() {
  const [positions, setPositions] = useState<any[]>([]);
  const [forms, setForms] = useState<Record<number, SalaryForm>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Load all positions + existing salary configs
  useEffect(() => {
    getPositionSalaries().then((data: any) => {
      setPositions(data);

      // Pre-fill forms: use existing config if available, else defaults
      const initial: Record<number, SalaryForm> = {};
      for (const p of data) {
        initial[p.id] = p.salary
          ? {
            basicSalaryPermanent: p.salary.basicSalaryPermanent ?? 0,
            basicSalaryProbation: p.salary.basicSalaryProbation ?? 0,
            monthlyTarget: p.salary.monthlyTarget ?? 0,
            incentiveAmount: p.salary.incentiveAmount ?? 0,
            allowanceAmount: p.salary.allowanceAmount ?? 0,
            orcRatePermanent: (p.orc?.ratePermanent ?? 0) * 100,  // ← from CommissionRate
            commRateLow: p.salary.commRateLow ?? 0.05,
            commRateHigh: p.salary.commRateHigh ?? 0.08,
            commThreshold: p.salary.commThreshold ?? 500000,
            epfEmployee: p.salary.epfEmployee ?? 0.08,
            epfEmployer: p.salary.epfEmployer ?? 0.12,
            etfEmployer: p.salary.etfEmployer ?? 0.03,
            allowanceThresholdPermanent: p.salary.allowanceThresholdPermanent ?? 1.0,
            allowanceThresholdProbation: p.salary.allowanceThresholdProbation ?? 0.75,
          }
          : { ...DEFAULT_FORM };
      }
      setForms(initial);

      // Auto-expand first unconfigured position
      const first = data.find((p: any) => !p.salary);
      if (first) setExpandedId(first.id);

      setLoading(false);
    });
  }, []);

  const setField = (positionId: number, field: keyof SalaryForm, value: number) => {
    setForms((prev) => ({
      ...prev,
      [positionId]: { ...prev[positionId], [field]: value },
    }));
  };

  const handleSave = async (positionId: number) => {
    setSavingId(positionId);
    try {
      const result = await upsertPositionSalary({ positionId, ...forms[positionId] });
      if (result.success) {
        toast.success("Salary config saved");
        // Mark as configured in local state
        setPositions((prev) =>
          prev.map((p) =>
            p.id === positionId ? { ...p, salary: forms[positionId] } : p
          )
        );
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <Loading/>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-3">
      {/* Header */}
      <div className="mb-6">
        <div className="flex gap-3 items-center">
          <Back />
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            Salary Configuration
          </h1>
        </div>

        <p className="text-sm text-slate-400 mt-1">
          Configure basic salary, targets, incentives, allowances and commission rates per position.
        </p>
      </div>

      {positions.map((position) => {
        const isExpanded = expandedId === position.id;
        const isConfigured = !!position.salary;
        const isSaving = savingId === position.id;
        const form = forms[position.id] ?? DEFAULT_FORM;

        return (
          <div
            key={position.id}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
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
                <span className="px-3 py-1 rounded-lg text-xs font-black border uppercase tracking-wider bg-slate-100 text-slate-600 border-slate-200">
                  {position.title}
                </span>
                <span className="text-xs text-slate-400 font-bold">Rank {position.rank}</span>

                {isConfigured && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Configured
                  </span>
                )}

                {isConfigured && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    Basic: Rs.{fmt(position.salary.basicSalaryPermanent)} · Target: Rs.{fmt(position.salary.monthlyTarget)}
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
                    {isSaving
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                      : <><Save className="w-3 h-3" /> Save</>
                    }
                  </button>
                )}
                {isExpanded
                  ? <ChevronDown className="w-4 h-4 text-slate-400" />
                  : <ChevronRight className="w-4 h-4 text-slate-400" />
                }
              </div>
            </div>

            {/* Expanded Form */}
            {isExpanded && (
              <div className="px-5 pb-6 border-t border-slate-100 space-y-6 pt-5">

                {/* Basic & Target */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Banknote className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Basic Salary & Target
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Basic Salary (Rs.)"
                      value={form.basicSalaryPermanent}
                      onChange={(v) => setField(position.id, "basicSalaryPermanent", v)}
                      prefix="Rs."
                      hint="Fixed monthly salary before deductions"
                    />
                    <Field
                      label="Monthly Target (Rs.)"
                      value={form.monthlyTarget}
                      onChange={(v) => setField(position.id, "monthlyTarget", v)}
                      prefix="Rs."
                      hint={`Currently: ${fmt(form.monthlyTarget)}`}
                    />
                  </div>
                </div>

                {/* Incentive & Allowance */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Performance Pay
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Incentive Amount (100% target)"
                      value={form.incentiveAmount}
                      onChange={(v) => setField(position.id, "incentiveAmount", v)}
                      prefix="Rs."
                      hint="Paid when full target is achieved"
                    />
                    <Field
                      label="Vehicle & Fuel Allowance (75% target)"
                      value={form.allowanceAmount}
                      onChange={(v) => setField(position.id, "allowanceAmount", v)}
                      prefix="Rs."
                      hint="Paid when 75% of target is achieved"
                    />
                  </div>
                </div>

                {/* Commission */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Commission Rates
                    </span>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg mb-3 text-xs text-amber-700 font-medium">
                    These rates apply to <strong>Permanent</strong> employees. Probation employees automatically use 7% / 10%.
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Field
                      label="Rate below threshold"
                      value={form.commRateLow}
                      onChange={(v) => setField(position.id, "commRateLow", v)}
                      suffix="%×100"
                      hint={`Currently: ${pctDisplay (form.commRateLow)}`}
                    />
                    <Field
                      label="Rate above threshold"
                      value={form.commRateHigh}
                      onChange={(v) => setField(position.id, "commRateHigh", v)}
                      suffix="%×100"
                      hint={`Currently: ${pctDisplay (form.commRateHigh)}`}
                    />
                    <Field
                      label="Volume threshold (Rs.)"
                      value={form.commThreshold}
                      onChange={(v) => setField(position.id, "commThreshold", v)}
                      prefix="Rs."
                      hint={`Currently: ${fmt(form.commThreshold)}`}
                    />
                  </div>
                </div>

                {/* ORC */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Percent className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                      ORC Rate
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="ORC Rate (decimal)"
                      value={form.orcRatePermanent}
                      onChange={(v) => setField(position.id, "orcRatePermanent", v)}
                      suffix="%×100"
                      hint={`Currently: ${pctDisplay (form.orcRatePermanent)} — 0 if not applicable`}
                    />
                  </div>
                </div>

                {/* EPF / ETF */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                      EPF / ETF (on basic salary only)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Field
                      label="EPF — Employee"
                      value={form.epfEmployee}
                      onChange={(v) => setField(position.id, "epfEmployee", v)}
                      suffix="%×100"
                      hint={`Deducted from pay: ${pctDisplay (form.epfEmployee)}`}
                    />
                    <Field
                      label="EPF — Employer"
                      value={form.epfEmployer}
                      onChange={(v) => setField(position.id, "epfEmployer", v)}
                      suffix="%×100"
                      hint={`Employer cost: ${pctDisplay (form.epfEmployer)}`}
                    />
                    <Field
                      label="ETF — Employer"
                      value={form.etfEmployer}
                      onChange={(v) => setField(position.id, "etfEmployer", v)}
                      suffix="%×100"
                      hint={`Employer cost: ${pctDisplay (form.etfEmployer)}`}
                    />
                  </div>
                </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}