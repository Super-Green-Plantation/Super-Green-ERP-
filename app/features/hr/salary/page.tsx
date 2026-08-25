"use client";

import Back from "@/app/components/Buttons/Back";
import Loading from "@/app/components/Status/Loading";
import {
  Banknote,
  Car,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Percent,
  Save,
  Target,
  Users
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
  incentivePartialThreshold: number;
  incentivePartialAmount: number;
  vehicleThresholdPct: number;
  vehicleAmount: number;
  teamActiveThresholdPct: number;
  teamActiveAmount: number;
  minActiveAdvisors: number;
  minActiveFMs: number;
  minActiveBMs: number;
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
  incentivePartialThreshold: 0.75,
  incentivePartialAmount: 0,
  vehicleThresholdPct: 0,
  vehicleAmount: 0,
  teamActiveThresholdPct: 0,
  teamActiveAmount: 0,
  minActiveAdvisors: 0,
  minActiveFMs: 0,
  minActiveBMs: 0,
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
            <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {label}
            </label>
            <div className={`flex items-center overflow-hidden rounded-lg border border-border/70 bg-background/55 transition-all
        ${disabled
                    ? "border-border/50 bg-muted/10 opacity-50"
                    : "border-border focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 shadow-sm"
                }`}
            >
                {prefix && (
                    <span className="shrink-0 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                        {prefix}
                    </span>
                )}
                <input
                    type="number"
                    step="any"
                    value={value ?? 0}
                    disabled={disabled}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="min-w-0 flex-1 bg-transparent px-2.5 py-1.5 text-xs font-bold text-foreground outline-none placeholder:text-muted-foreground/30 disabled:text-muted-foreground/50"
                />
                {indicator && (
                    <span className="shrink-0 px-2.5 py-1.5 text-[9px] font-bold text-emerald-600">
                        {indicator}
                    </span>
                )}
                {suffix && (
                    <span className="shrink-0 border-l border-border bg-muted px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                        {suffix}
                    </span>
                )}
            </div>
            {hint && <p className="text-[10px] text-muted-foreground font-medium mt-1 ml-1">{hint}</p>}
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
            incentivePartialThreshold: p.salary.incentivePartialThreshold ?? 0.75,
            incentivePartialAmount: p.salary.incentivePartialAmount ?? 0,
            vehicleThresholdPct: p.salary.vehicleThresholdPct ?? 0,
            vehicleAmount: p.salary.vehicleAmount ?? 0,
            teamActiveThresholdPct: p.salary.teamActiveThresholdPct ?? 0,
            teamActiveAmount: p.salary.teamActiveAmount ?? 0,
            minActiveAdvisors: p.salary.minActiveAdvisors ?? 0,
            minActiveFMs: p.salary.minActiveFMs ?? 0,
            minActiveBMs: p.salary.minActiveBMs ?? 0,
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
    <div className="mx-auto min-h-screen w-full max-w-[1480px] space-y-5 px-4 pb-10 pt-5 sm:px-7 sm:pt-8">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-6 items-center">
          <Back />
          <div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-[30px]">
              Financial Architecture
            </h1>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Configure basic salary, growth targets, and commission structures per role.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {positions.filter(p => !p.isProbation && !p.isManagement).map((position) => {
          const isExpanded = expandedId === position.id;
          const isConfigured = !!position.salary;
          const isSaving = savingId === position.id;
          const form = forms[position.id] ?? DEFAULT_FORM;

          return (
            <div
              key={position.id}
              className={`bg-card rounded-2xl border transition-all duration-300 overflow-hidden
      ${isExpanded ? "border-primary/30 shadow-md" : "border-border/70 shadow-sm"}`}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(isExpanded ? null : position.id)}
                onKeyDown={(e) => e.key === "Enter" && setExpandedId(isExpanded ? null : position.id)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 transition-all hover:bg-muted/30 cursor-pointer ${isExpanded ? 'bg-muted/10' : ''}`}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-4">
                    <span className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${isConfigured ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-border'}`}>
                      {position.title}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Rank {position.rank}</span>
                  </div>

                  {isConfigured && (
                    <div className="hidden items-center gap-3 border-l border-border/50 pl-4 h-6 md:flex">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                        <CheckCircle2 className="w-4 h-4" /> ACTIVE STRUCTURE
                      </span>
                      <span className="hidden md:inline text-[10px] text-muted-foreground font-bold uppercase tracking-tighter opacity-80">
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
                      className="hidden items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[10px] font-bold tracking-wide text-primary-foreground shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 sm:flex"
                    >
                      {isSaving
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Committing...</>
                        : <><Save className="w-4 h-4" /> Save</>
                      }
                    </button>
                  )}
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-primary text-white border-primary' : 'bg-card text-muted-foreground'}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="space-y-5 border-t border-border/70 bg-muted/15 px-4 pb-5 pt-4 animate-in slide-in-from-top-4 duration-300 sm:px-5">

                  {/* Basic & Target */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(180px,1fr)_2fr]">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-primary/10 bg-primary/10 p-2.5 text-primary">
                          <Banknote className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground">Basic Salary</h3>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                      <Field
                        label="Monthly Salary (Rs.)"
                        value={form.basicSalaryPermanent}
                        onChange={(v) => setField(position.id, "basicSalaryPermanent", v)}
                        prefix="Rs."
                        hint="Fixed component paid irrespective of performance."
                      />
                      <Field
                        label="Target (Rs.)"
                        value={form.monthlyTarget}
                        onChange={(v) => setField(position.id, "monthlyTarget", v)}
                        prefix="Rs."
                        hint={`Current threshold: ${fmt(form.monthlyTarget)} PKR`}
                      />
                    </div>
                  </div>

                  {/* Incentive & Allowance */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(180px,1fr)_2fr]">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-primary/10 bg-primary/10 p-2.5 text-primary">
                          <Target className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground">Performance Bonuses</h3>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                      <Field
                        label="Incentive (100% Target)"
                        value={form.incentiveAmount}
                        onChange={(v) => setField(position.id, "incentiveAmount", v)}
                        prefix="Rs."
                        hint="One-time bonus for full target completion."
                      />
                      <Field
                        label="Incentive (75% Threshold)"
                        value={form.incentivePartialAmount}
                        onChange={(v) => setField(position.id, "incentivePartialAmount", v)}
                        prefix="Rs."
                        hint="Partial bonus when 75% of target is achieved."
                      />
                      <Field
                        label="Fuel Allowance"
                        value={form.allowanceAmount}
                        onChange={(v) => setField(position.id, "allowanceAmount", v)}
                        prefix="Rs."
                        hint="Fixed fuel and vehicle support subsidy."
                      />
                      <Field
                        label="Vehicle Threshold %"
                        value={form.vehicleThresholdPct}
                        onChange={(v) => setField(position.id, "vehicleThresholdPct", v)}
                        suffix="%"
                        hint="Target % to qualify for vehicle allowance."
                      />
                      <Field
                        label="Vehicle Amount"
                        value={form.vehicleAmount}
                        onChange={(v) => setField(position.id, "vehicleAmount", v)}
                        prefix="Rs."
                        hint="Vehicle allowance amount when threshold is met."
                      />
                      <Field
                        label="Team Active Threshold %"
                        value={form.teamActiveThresholdPct}
                        onChange={(v) => setField(position.id, "teamActiveThresholdPct", v)}
                        suffix="%"
                        hint="Target % to qualify for team active bonus."
                      />
                      <Field
                        label="Team Active Amount"
                        value={form.teamActiveAmount}
                        onChange={(v) => setField(position.id, "teamActiveAmount", v)}
                        prefix="Rs."
                        hint="Team active bonus when threshold is met."
                      />
                    </div>
                  </div>

                  {/* Team Minimums */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(180px,1fr)_2fr]">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-primary/10 bg-primary/10 p-2.5 text-primary">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground">Team Minimums Carpet</h3>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                      <Field
                        label="Min Active Advisors"
                        value={form.minActiveAdvisors}
                        onChange={(v) => setField(position.id, "minActiveAdvisors", v)}
                        hint="Minimum active advisors required."
                      />
                      <Field
                        label="Min Active FMs"
                        value={form.minActiveFMs}
                        onChange={(v) => setField(position.id, "minActiveFMs", v)}
                        hint="Minimum active FMs required."
                      />
                      <Field
                        label="Min Active BMs"
                        value={form.minActiveBMs}
                        onChange={(v) => setField(position.id, "minActiveBMs", v)}
                        hint="Minimum active BMs required."
                      />
                    </div>
                  </div>

                  {/* Commission */}
                  <div className="space-y-4">
                   

                    <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-[10px] font-bold uppercase tracking-wide text-primary">
                      Alert: These rates apply to <span className="text-foreground underline underline-offset-4">Permanent</span> staff. Probation tiers are locked at 7% / 10%.
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
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
                        label="Target Threshold (Rs.)"
                        value={form.commThreshold}
                        onChange={(v) => setField(position.id, "commThreshold", v)}
                        prefix="Rs."
                        hint={`Tier bridge at: ${fmt(form.commThreshold)}`}
                      />
                    </div>
                  </div>

                  {/* ORC & Statutory */}
                  <div className="grid grid-cols-1 gap-5 border-t border-border/70 pt-4 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent className="w-5 h-5 text-primary" />
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground">Hierarchy Override (ORC)</span>
                      </div>
                      <Field
                        label="ORC Rate"
                        value={form.orcRatePermanent}
                        onChange={(v) => setField(position.id, "orcRatePermanent", v)}
                        suffix="%×100"
                        hint={`Currently: ${pctDisplay(form.orcRatePermanent)}`}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="w-5 h-5 text-primary" />
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground">EPF Structure</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
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
                      {isSaving ? 'Saving...' : 'Save'}
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
