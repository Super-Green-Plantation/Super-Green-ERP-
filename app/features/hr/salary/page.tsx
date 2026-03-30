"use client";

import Back from "@/app/components/Buttons/Back";
import Loading from "@/app/components/Status/Loading";
import {
  Banknote,
  Car,
  CheckCircle2,
  ChevronDown, ChevronRight,
  Loader2,
  Percent,
  Save,
  Target, TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getPositionSalaries, upsertPositionSalary } from "../salary-config-action";

// ─── Types ────────────────────────────────────────────────────────────────────

type SalaryForm = {
  basicSalaryPermanent: number;
  basicSalaryProbation: number;
  monthlyTarget: number;
  incentiveAmount: number;
  allowanceAmount: number;
  orcRatePermanent: number;
  commRateLow: number;
  commRateHigh: number;
  commThreshold: number;
  epfEmployee: number;
  epfEmployer: number;
  etfEmployer: number;
  allowanceThresholdPermanent: number;
  allowanceThresholdProbation: number;
};

const DEFAULT_FORM: SalaryForm = {
  basicSalaryPermanent: 0,
  orcRatePermanent: 0,
  basicSalaryProbation: 0,
  monthlyTarget: 0,
  incentiveAmount: 0,
  allowanceAmount: 0,
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

const pctDisplay = (n: number) => `${n.toFixed(2)}%`;

// ─── Field component ──────────────────────────────────────────────────────────

export const formatIndicator = (value: number): string => {
    if (!value) return "";
    if (value >= 10_000_000) return `${(value / 1_000_000).toFixed(1)}Cr`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 100_000) return `${(value / 100_000).toFixed(1)}L`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return "";
};

export function Field({
    label, value, onChange, prefix, suffix, hint, disabled = false,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    prefix?: string;
    suffix?: string;
    hint?: string;
    disabled?: boolean;
}) {
    const indicator = prefix === "Rs." ? formatIndicator(value) : null;
    return (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {label}
            </label>
            <div className={`flex items-center border rounded-xl overflow-hidden transition-all bg-muted/30
        ${disabled
                    ? "border-border/50 bg-muted/10 opacity-50"
                    : "border-border focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 shadow-sm"
                }`}
            >
                {prefix && (
                    <span className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                        {prefix}
                    </span>
                )}
                <input
                    type="number"
                    step="any"
                    value={value ?? 0}
                    disabled={disabled}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-foreground outline-none bg-transparent placeholder:text-muted-foreground/30 disabled:text-muted-foreground/50 min-w-0"
                />
                {indicator && (
                    <span className="px-3 py-2 text-[10px] font-bold text-green-600 shrink-0">
                        {indicator}
                    </span>
                )}
                {suffix && (
                    <span className="px-3 py-2 text-[10px] font-bold text-muted-foreground bg-muted border-l border-border uppercase tracking-widest shrink-0">
                        {suffix}
                    </span>
                )}
            </div>
            {hint && <p className="text-[10px] text-muted-foreground/70 font-medium mt-1.5 ml-1">{hint}</p>}
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

  useEffect(() => {
    getPositionSalaries().then((data: any) => {
      setPositions(data);
      const initial: Record<number, SalaryForm> = {};
      for (const p of data) {
        initial[p.id] = p.salary
          ? {
            basicSalaryPermanent: p.salary.basicSalaryPermanent ?? 0,
            basicSalaryProbation: p.salary.basicSalaryProbation ?? 0,
            monthlyTarget: p.salary.monthlyTarget ?? 0,
            incentiveAmount: p.salary.incentiveAmount ?? 0,
            allowanceAmount: p.salary.allowanceAmount ?? 0,
            orcRatePermanent: (p.orc?.ratePermanent ?? 0) * 100,
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

  if (loading) return <Loading />

  return (
    <div className="max-w-350 mx-auto sm:space-y-10 space-y-1 p-4 sm:p-10 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/50 pb-10 mb-6">
        <div className="flex gap-6 items-center">
          <Back />
          <div>
            <h1 className="text-3xl font-extrabold text-foreground uppercase tracking-tight leading-none mb-2">
              Financial Architecture
            </h1>
            <p className="text-sm text-muted-foreground font-bold tracking-tight opacity-70">
              Configure basic salary, growth targets, and commission structures per role.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {positions.filter(p => !p.isProbation && !p.isManagement).map((position) => {
          const isExpanded = expandedId === position.id;
          const isConfigured = !!position.salary;
          const isSaving = savingId === position.id;
          const form = forms[position.id] ?? DEFAULT_FORM;

          return (
            <div
              key={position.id}
              className={`bg-card rounded-2xl border transition-all duration-300 overflow-hidden
      ${isExpanded ? "border-primary/30 shadow-xl" : "border-border shadow-sm"}`}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(isExpanded ? null : position.id)}
                onKeyDown={(e) => e.key === "Enter" && setExpandedId(isExpanded ? null : position.id)}
                className={`w-full flex items-center justify-between px-8 py-3 hover:bg-muted/30 transition-all cursor-pointer ${isExpanded ? 'bg-muted/10' : ''}`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-2 rounded-2xl text-[11px] font-extrabold uppercase tracking-widest ${isConfigured ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-border'}`}>
                      {position.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/40 font-extrabold uppercase tracking-[0.2em]">Rank {position.rank}</span>
                  </div>

                  {isConfigured && (
                    <div className="flex items-center gap-4 border-l border-border/50 pl-6 h-6">
                      <span className="flex items-center gap-2 text-[10px] font-extrabold text-accent uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" /> ACTIVE STRUCTURE
                      </span>
                      <span className="hidden md:inline text-[10px] text-muted-foreground font-bold uppercase tracking-tighter opacity-40">
                        Base: Rs.{fmt(position.salary.basicSalaryPermanent)} · Plan: Rs.{fmt(position.salary.monthlyTarget)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  {isExpanded && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleSave(position.id); }}
                      disabled={isSaving}
                      className="hidden sm:flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-[0.2em] rounded-2xl transition-all hover:shadow-2xl hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50"
                    >
                      {isSaving
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Committing...</>
                        : <><Save className="w-4 h-4" /> Save Configuration</>
                      }
                    </button>
                  )}
                  <div className={`w-10 h-10 rounded-2xl border border-border flex items-center justify-center transition-transform duration-500 ${isExpanded ? 'rotate-180 bg-primary text-white border-primary' : 'bg-card text-muted-foreground'}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-10 pb-12 border-t border-border/50 space-y-12 pt-12 animate-in slide-in-from-top-4 duration-500">

                  {/* Basic & Target */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/10">
                          <Banknote className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground">Retainer & Growth</h3>
                          <p className="text-[10px] text-muted-foreground font-bold leading-tight">Monthly fixed pay and operational target.</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field
                        label="Standard Monthly Salary (Rs.)"
                        value={form.basicSalaryPermanent}
                        onChange={(v) => setField(position.id, "basicSalaryPermanent", v)}
                        prefix="Rs."
                        hint="Fixed component paid irrespective of performance."
                      />
                      <Field
                        label="Operational Target (Rs.)"
                        value={form.monthlyTarget}
                        onChange={(v) => setField(position.id, "monthlyTarget", v)}
                        prefix="Rs."
                        hint={`Current threshold: ${fmt(form.monthlyTarget)} PKR`}
                      />
                    </div>
                  </div>

                  {/* Incentive & Allowance */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-accent/10 text-accent border border-accent/10">
                          <Target className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground">Performance Bonuses</h3>
                          <p className="text-[10px] text-muted-foreground font-bold leading-tight">Additional payouts upon reaching milestones.</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field
                        label="Success Incentive (100% Target)"
                        value={form.incentiveAmount}
                        onChange={(v) => setField(position.id, "incentiveAmount", v)}
                        prefix="Rs."
                        hint="One-time bonus for full target completion."
                      />
                      <Field
                        label="Logistics & Mobility Allowance"
                        value={form.allowanceAmount}
                        onChange={(v) => setField(position.id, "allowanceAmount", v)}
                        prefix="Rs."
                        hint="Fixed fuel and vehicle support subsidy."
                      />
                    </div>
                  </div>

                  {/* Commission */}
                  <div className="space-y-10">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/10">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground">Revenue Scaling Model</h3>
                        <p className="text-[10px] text-muted-foreground font-bold leading-tight">Tiered commission based on sales volume.</p>
                      </div>
                    </div>

                    <div className="vibrant-alert">
                      Alert: These rates apply to <span className="text-accent underline underline-offset-4">Permanent</span> staff. Probation tiers are locked at 7% / 10%.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Field
                        label="Tier 1: Below Threshold"
                        value={form.commRateLow}
                        onChange={(v) => setField(position.id, "commRateLow", v)}
                        suffix="%×100"
                        hint={`Effective: ${pctDisplay(form.commRateLow)}`}
                      />
                      <Field
                        label="Tier 2: Above Threshold"
                        value={form.commRateHigh}
                        onChange={(v) => setField(position.id, "commRateHigh", v)}
                        suffix="%×100"
                        hint={`Effective: ${pctDisplay(form.commRateHigh)}`}
                      />
                      <Field
                        label="Volume Pivot Point (Rs.)"
                        value={form.commThreshold}
                        onChange={(v) => setField(position.id, "commThreshold", v)}
                        prefix="Rs."
                        hint={`Tier bridge at: ${fmt(form.commThreshold)}`}
                      />
                    </div>
                  </div>

                  {/* ORC & Statutory */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-6 border-t border-border/30">
                    <div className="space-y-8">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent className="w-5 h-5 text-primary" />
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground">Hierarchy Override (ORC)</span>
                      </div>
                      <Field
                        label="Overriding Rate (Decimal)"
                        value={form.orcRatePermanent}
                        onChange={(v) => setField(position.id, "orcRatePermanent", v)}
                        suffix="%×100"
                        hint={`Currently: ${pctDisplay(form.orcRatePermanent)}`}
                      />
                    </div>

                    <div className="space-y-8">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="w-5 h-5 text-muted-foreground/30" />
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground">Statutory & EPF Structure</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <Field label="EPF (Emp)" value={form.epfEmployee} onChange={(v) => setField(position.id, "epfEmployee", v)} suffix="%" />
                        <Field label="EPF (Comp)" value={form.epfEmployer} onChange={(v) => setField(position.id, "epfEmployer", v)} suffix="%" />
                        <Field label="ETF (Comp)" value={form.etfEmployer} onChange={(v) => setField(position.id, "etfEmployer", v)} suffix="%" />
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:hidden">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleSave(position.id); }}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-[0.2em] rounded-2xl"
                    >
                      {isSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
