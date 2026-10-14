"use client";

import React from "react";
import {
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  Users,
  Car,
  Percent,
  Coins,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Briefcase,
  Layers,
} from "lucide-react";

const fmt = (n: number | null | undefined) =>
  `Rs. ${(n ?? 0).toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const fmtPct = (p: number | null | undefined) => `${(p ?? 0).toFixed(1)}%`;

function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "Not specified";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMonthYear(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export type SalaryCriteriaRow = {
  memberId: number;
  name: string;
  empNo: string;
  position: string;
  status: string;
  payrollCategory: string;
  dateOfJoin?: string | Date | null;
  probationStartDate?: string | Date | null;
  effectiveProbationStart?: string | Date | null;
  tenureMonthCount?: number;
  monthsInProbation?: number;
  probationPeriod?: number;
  probationMonthInPeriod?: number;
  isAfter6Months?: boolean;
  monthlyTarget?: number;
  volumeAchieved: number;
  achievementPct?: number;
  targetDiff?: number;
  activeTeamCounts?: { advisors: number; fms: number; bms: number };
  advanceDeducted?: number;
  advanceTypes?: string[];
  outstandingAdvanceRemaining?: number;
  breakdown?: any;
  criteria?: any;
  orcEarned?: number;
  personalCommissionEarned?: number;
  excessEarned?: number;
};

export default function SalaryCriteriaPanel({ row }: { row: SalaryCriteriaRow }) {
  const c = row.criteria || {};
  const isMarketing = row.payrollCategory === "MARKETING" || row.status === "PROBATION";

  const target = row.monthlyTarget ?? c.monthlyTarget ?? row.breakdown?.monthlyTarget ?? 0;
  const volume = row.volumeAchieved ?? c.volumeAchieved ?? 0;
  const achPct = target > 0 ? (volume / target) * 100 : 0;
  const diff = volume - target;

  const joinDate = row.dateOfJoin ?? c.dateOfJoin;
  const probationStart = row.probationStartDate ?? c.probationStartDate;
  const monthsServing = row.tenureMonthCount ?? c.monthsServing ?? 1;
  const monthsProbation = row.monthsInProbation ?? c.monthsInProbation ?? monthsServing;
  const periodNumber = row.probationPeriod ?? c.probationPeriod ?? 1;
  const monthInPeriod = row.probationMonthInPeriod ?? c.probationMonthInPeriod ?? 1;
  const isAfter6 = row.isAfter6Months ?? c.isAfter6Months ?? (monthsProbation > 6);

  // Target Budget (FA)
  const tb = c.targetBudget || {};
  const isFa = tb.isFa ?? (row.position?.toLowerCase().includes("advisor") || row.breakdown?.targetBudgetSalary > 0);
  const tbEarned = row.breakdown?.targetBudgetSalary ?? tb.earned ?? 0;
  const tbHit = tbEarned > 0;

  // Basic / Partial Incentive (FA)
  const bi = c.basicIncentive || {};
  const biEarned = row.breakdown?.incentiveEarned ?? bi.earned ?? 0;
  const biHit = row.breakdown?.incentiveHit ?? bi.hit ?? (biEarned > 0);
  const biHurdlePct = bi.hurdleRatePct ?? (monthsServing <= 3 ? 6.6 : 20.0);
  const biHurdleAmt = bi.hurdleAmount ?? (target * (biHurdlePct / 100));

  // Full Incentive (Non-FA)
  const fi = c.fullIncentive || {};
  const fiEarned = row.breakdown?.fullIncentive ?? fi.earned ?? 0;
  const fiHit = row.breakdown?.fullIncentiveHit ?? fi.hit ?? (fiEarned > 0);
  const fiThresholdPct = fi.thresholdPct ?? 100;
  const fiThresholdAmt = fi.thresholdAmount ?? (target * (fiThresholdPct / 100));

  // Vehicle Allowance
  const va = c.vehicleAllowance || {};
  const vaEarned = row.breakdown?.vehicleEarned ?? va.earned ?? 0;
  const vaHit = row.breakdown?.vehicleHit ?? va.hit ?? (vaEarned > 0);
  const vaThresholdAmt = va.thresholdAmount ?? 0;
  const vaThresholdPct = va.thresholdPct ?? 0;

  // Team Activation Allowance
  const ta = c.teamActivation || {};
  const taEarned = row.breakdown?.teamActiveEarned ?? ta.earned ?? 0;
  const taHit = row.breakdown?.teamActiveHit ?? ta.hit ?? (taEarned > 0);
  const activeAdvisors = row.activeTeamCounts?.advisors ?? ta.actualHeadcount?.advisors ?? 0;
  const activeFms = row.activeTeamCounts?.fms ?? ta.actualHeadcount?.fms ?? 0;
  const activeBms = row.activeTeamCounts?.bms ?? ta.actualHeadcount?.bms ?? 0;
  const minAdvisors = ta.minHeadcount?.advisors ?? 0;
  const minFms = ta.minHeadcount?.fms ?? 0;
  const minBms = ta.minHeadcount?.bms ?? 0;

  // Excess Commission
  const ec = c.excessCommission || {};
  const ecEarned = row.breakdown?.excessCommission ?? ec.earned ?? 0;
  const ecSurplus = Math.max(0, volume - target);

  // Commissions
  const personalComm = row.personalCommissionEarned ?? c.commissions?.personal ?? 0;
  const orcEarned = row.orcEarned ?? c.commissions?.orc ?? 0;

  // Deductions
  const epfEmp = row.breakdown?.epfDeduction ?? c.deductions?.epfEmployee ?? 0;
  const advDeducted = row.advanceDeducted ?? c.deductions?.advanceDeducted ?? 0;
  const advTypes = row.advanceTypes ?? c.deductions?.advanceDetails?.map((d: any) => d.type) ?? [];
  const advRemaining = row.outstandingAdvanceRemaining ?? c.deductions?.outstandingAdvanceRemaining ?? 0;

  const grossPay = row.breakdown?.grossPay ?? c.grossPay ?? 0;
  const netPay = row.breakdown?.netPay ?? c.netPay ?? 0;

  return (
    <div className="w-full rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card/95 to-primary/5 p-4 sm:p-6 shadow-xl my-2 text-foreground space-y-6 animate-in fade-in-50 duration-300">
      
      {/* ── Top Header Banner: Employee Service & Tenure Context ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-black tracking-tight text-foreground">{row.name}</span>
            <span className="text-xs font-mono font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
              {row.empNo}
            </span>
            <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
              {row.position}
            </span>
            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wide ${
                row.status === "PERMANENT"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/30"
              }`}
            >
              {row.status}
            </span>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Comprehensive Salary Calculation Audit & Criteria Verification
          </p>
        </div>

        {/* Badges for service and probation metrics */}
        <div className="flex flex-wrap items-center gap-2">
          {joinDate && (
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card/80 px-3 py-1.5 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <div className="text-left">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Joined</p>
                <p className="text-xs font-bold text-foreground">
                  {formatDate(joinDate)} <span className="text-muted-foreground font-normal">({formatMonthYear(joinDate)})</span>
                </p>
              </div>
            </div>
          )}

          {probationStart && (
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card/80 px-3 py-1.5 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="text-left">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Probation Start</p>
                <p className="text-xs font-bold text-foreground">{formatDate(probationStart)}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 shadow-xs">
            <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
            <div className="text-left">
              <p className="text-[9px] font-bold uppercase tracking-wider text-primary">Tenure Serving</p>
              <p className="text-xs font-extrabold text-foreground">
                Month {monthsServing} {row.status === "PROBATION" && (
                  <span className="text-muted-foreground font-medium">
                    ({isAfter6 ? "After 6-Mo Period" : `Period ${periodNumber}, Mo ${monthInPeriod}`})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 1: Target vs Volume Achieved Progress Meter ── */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Target & Achievement Criteria</h4>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="text-muted-foreground">
              Target: <strong className="text-foreground">{fmt(target)}</strong>
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              Achieved: <strong className="text-foreground">{fmt(volume)}</strong>
            </span>
            <span className="text-muted-foreground">•</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-black border ${
                achPct >= 100
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : achPct >= 75
                  ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                  : achPct >= 25
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  : "bg-rose-500/10 text-rose-600 border-rose-500/30"
              }`}
            >
              {fmtPct(achPct)} Achieved
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1">
          <div className="relative w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                achPct >= 100
                  ? "bg-gradient-to-r from-emerald-500 to-green-400"
                  : achPct >= 75
                  ? "bg-gradient-to-r from-blue-500 to-teal-400"
                  : achPct >= 25
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                  : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(achPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
            <span>0%</span>
            <span className="text-amber-600 font-bold">25% (FA Budget Hurdle)</span>
            <span className="text-blue-600 font-bold">75% (Partial Tier)</span>
            <span>100% Target Baseline</span>
            {diff > 0 && <span className="text-emerald-600 font-bold">Surplus: +{fmt(diff)}</span>}
            {diff < 0 && <span className="text-rose-500 font-bold">Shortfall: {fmt(Math.abs(diff))}</span>}
          </div>
        </div>
      </div>

      {/* ── Section 2: Detailed Component Criteria Breakdown Grid ── */}
      <div>
        <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-primary" />
          Component-by-Component Eligibility & Rules Audit
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

          {/* 1. Target Budget Salary (FA only) */}
          <div className={`rounded-xl border p-3.5 flex flex-col justify-between space-y-2.5 transition-all ${
            tbHit
              ? "border-emerald-500/30 bg-emerald-500/[0.03]"
              : isFa
              ? "border-amber-500/20 bg-amber-500/[0.02]"
              : "border-border/50 bg-muted/20 opacity-60"
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  Target Budget Salary (FA)
                </span>
                {isFa ? (
                  tbHit ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Met
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> &lt;25%
                    </span>
                  )
                ) : (
                  <span className="text-[9px] font-semibold text-muted-foreground">N/A (Non-FA)</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                {isFa ? (
                  <>
                    Rule: Requires <strong>&ge;25%</strong> target achievement. Scaled linearly to 100% (Ceiling: <strong>Rs. 30,000</strong>).
                    <br />
                    Formula: <span className="font-mono text-[10px]">min(30K, 30K &times; {fmtPct(achPct)})</span>
                  </>
                ) : (
                  "Target Budget is exclusive to Field Advisors (Position target budget > 0)."
                )}
              </p>
            </div>
            <div className="flex items-end justify-between pt-2 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground font-medium">Earned Amount:</span>
              <span className={`text-sm font-black ${tbHit ? "text-emerald-600" : "text-muted-foreground/60"}`}>
                {fmt(tbEarned)}
              </span>
            </div>
          </div>

          {/* 2. Basic / Partial Incentive (FA partial 20K) */}
          <div className={`rounded-xl border p-3.5 flex flex-col justify-between space-y-2.5 transition-all ${
            biHit
              ? "border-emerald-500/30 bg-emerald-500/[0.03]"
              : isFa
              ? "border-amber-500/20 bg-amber-500/[0.02]"
              : "border-border/50 bg-muted/20 opacity-60"
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-primary" />
                  Partial Incentive (20K)
                </span>
                {isFa ? (
                  biHit ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Hurdle Passed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Missed
                    </span>
                  )
                ) : (
                  <span className="text-[9px] font-semibold text-muted-foreground">N/A</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                {isFa ? (
                  <>
                    Tenure Hurdle: Month {monthsServing} requires <strong>{biHurdlePct}%</strong> of target ({fmt(biHurdleAmt)}).
                    <br />
                    Volume Achieved: <strong className="text-foreground">{fmt(volume)}</strong> ({volume >= biHurdleAmt ? "Cleared ✓" : "Shortfall ✗"})
                  </>
                ) : (
                  "Partial 20K tier is exclusive to Field Advisors."
                )}
              </p>
            </div>
            <div className="flex items-end justify-between pt-2 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground font-medium">Earned Amount:</span>
              <span className={`text-sm font-black ${biHit ? "text-primary" : "text-muted-foreground/60"}`}>
                {fmt(biEarned)}
              </span>
            </div>
          </div>

          {/* 3. Full Incentive (Non-FA: TL, BM, etc.) */}
          <div className={`rounded-xl border p-3.5 flex flex-col justify-between space-y-2.5 transition-all ${
            fiHit
              ? "border-emerald-500/30 bg-emerald-500/[0.03]"
              : !isFa && fiThresholdAmt > 0
              ? "border-amber-500/20 bg-amber-500/[0.02]"
              : "border-border/50 bg-muted/20 opacity-60"
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  Full Role Incentive
                </span>
                {!isFa && fiThresholdAmt > 0 ? (
                  fiHit ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Target Hit
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Shortfall
                    </span>
                  )
                ) : (
                  <span className="text-[9px] font-semibold text-muted-foreground">FA handled by Budget</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                {!isFa && fiThresholdAmt > 0 ? (
                  <>
                    Rule: Requires <strong>{fiThresholdPct}%</strong> of target ({fmt(fiThresholdAmt)}).
                    <br />
                    Volume: <strong className="text-foreground">{fmt(volume)}</strong> ({fiHit ? "Unlocked ✓" : `Shortfall of ${fmt(fiThresholdAmt - volume)} ✗`})
                  </>
                ) : (
                  "Non-FA roles earn position target incentive bonus at threshold."
                )}
              </p>
            </div>
            <div className="flex items-end justify-between pt-2 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground font-medium">Earned Amount:</span>
              <span className={`text-sm font-black ${fiHit ? "text-primary" : "text-muted-foreground/60"}`}>
                {fmt(fiEarned)}
              </span>
            </div>
          </div>

          {/* 4. Vehicle Allowance */}
          <div className={`rounded-xl border p-3.5 flex flex-col justify-between space-y-2.5 transition-all ${
            vaHit
              ? "border-emerald-500/30 bg-emerald-500/[0.03]"
              : vaThresholdAmt > 0
              ? "border-amber-500/20 bg-amber-500/[0.02]"
              : "border-border/50 bg-muted/20 opacity-60"
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-primary" />
                  Vehicle Allowance
                </span>
                {vaThresholdAmt > 0 ? (
                  vaHit ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Qualified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Under Target
                    </span>
                  )
                ) : (
                  <span className="text-[9px] font-semibold text-muted-foreground">Not Configured</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                {vaThresholdAmt > 0 ? (
                  <>
                    Rule: Requires <strong>{vaThresholdPct}%</strong> volume threshold ({fmt(vaThresholdAmt)}).
                    <br />
                    Achieved: <strong className="text-foreground">{fmt(volume)}</strong> ({vaHit ? "Met ✓" : `Deficit: ${fmt(vaThresholdAmt - volume)} ✗`})
                  </>
                ) : (
                  "Vehicle allowance is not set for this role / tenure tier."
                )}
              </p>
            </div>
            <div className="flex items-end justify-between pt-2 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground font-medium">Earned Amount:</span>
              <span className={`text-sm font-black ${vaHit ? "text-primary" : "text-muted-foreground/60"}`}>
                {fmt(vaEarned)}
              </span>
            </div>
          </div>

          {/* 5. Team Activation Allowance */}
          <div className={`rounded-xl border p-3.5 flex flex-col justify-between space-y-2.5 transition-all ${
            taHit
              ? "border-emerald-500/30 bg-emerald-500/[0.03]"
              : minAdvisors > 0 || minFms > 0
              ? "border-amber-500/20 bg-amber-500/[0.02]"
              : "border-border/50 bg-muted/20 opacity-60"
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Team Activation Allowance
                </span>
                {minAdvisors > 0 || minFms > 0 ? (
                  taHit ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Team Hit
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Incomplete
                    </span>
                  )
                ) : (
                  <span className="text-[9px] font-semibold text-muted-foreground">Not Configured</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                {minAdvisors > 0 || minFms > 0 ? (
                  <>
                    Active Headcount: <strong>{activeAdvisors}/{minAdvisors} FA</strong>, <strong>{activeFms}/{minFms} FM</strong>, <strong>{activeBms}/{minBms} BM</strong>.
                    <br />
                    Volume threshold: <strong>{ta.volumeHit ? "Satisfied ✓" : "Not met ✗"}</strong>
                  </>
                ) : (
                  "Team activation headcount criteria is not set for this role."
                )}
              </p>
            </div>
            <div className="flex items-end justify-between pt-2 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground font-medium">Earned Amount:</span>
              <span className={`text-sm font-black ${taHit ? "text-primary" : "text-muted-foreground/60"}`}>
                {fmt(taEarned)}
              </span>
            </div>
          </div>

          {/* 6. Excess Commission (0.5%) */}
          <div className={`rounded-xl border p-3.5 flex flex-col justify-between space-y-2.5 transition-all ${
            ecEarned > 0
              ? "border-emerald-500/30 bg-emerald-500/[0.03]"
              : "border-border/50 bg-muted/20 opacity-60"
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-primary" />
                  Excess Commission (0.5%)
                </span>
                {ecEarned > 0 ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Surplus Bonus
                  </span>
                ) : (
                  <span className="text-[9px] font-semibold text-muted-foreground">No Surplus</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                {ecSurplus > 0 ? (
                  <>
                    Volume exceeded 100% target baseline by <strong>+{fmt(ecSurplus)}</strong>.
                    <br />
                    Formula: <span className="font-mono text-[10px]">+{fmt(ecSurplus)} &times; 0.5%</span>
                  </>
                ) : (
                  "Requires volume to exceed 100% of the assigned monthly target."
                )}
              </p>
            </div>
            <div className="flex items-end justify-between pt-2 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground font-medium">Earned Amount:</span>
              <span className={`text-sm font-black ${ecEarned > 0 ? "text-emerald-600" : "text-muted-foreground/60"}`}>
                {fmt(ecEarned)}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Section 3: Commissions & Deductions Reconciliation ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Direct & Team Commissions */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-2.5">
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-blue-500" />
            Field & Network Sales Commissions
          </h5>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">Personal Sales Commission:</span>
              <span className="font-bold text-foreground">{fmt(personalComm)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">ORC / Upline Team Commission:</span>
              <span className="font-bold text-blue-600">{fmt(orcEarned)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Additional Surplus Commission:</span>
              <span className="font-bold text-emerald-600">{fmt(ecEarned)}</span>
            </div>
          </div>
        </div>

        {/* Statutory & Advance Deductions */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-2.5">
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-destructive" />
            Statutory & Salary Advance Deductions
          </h5>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">EPF Employee (8%):</span>
              <span className="font-bold text-destructive">{epfEmp > 0 ? `-${fmt(epfEmp)}` : "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <div>
                <span className="text-muted-foreground">Salary Advances Deducted:</span>
                {advTypes.length > 0 && (
                  <p className="text-[10px] text-muted-foreground font-semibold">({advTypes.join(", ")})</p>
                )}
              </div>
              <span className="font-bold text-destructive">{advDeducted > 0 ? `-${fmt(advDeducted)}` : "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Outstanding Advance Balance After This Month:</span>
              <span className="font-bold text-amber-600">{fmt(advRemaining)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Final Reconciliation Formula Box ── */}
      <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5" />
            Total Monthly Reconciliation Formula
          </p>
          <p className="text-xs text-foreground/80 font-medium">
            Gross Pay ({fmt(grossPay)}) &minus; Deductions ({fmt(epfEmp + advDeducted)}) = <strong className="text-foreground">Net Pay to Bank</strong>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Gross Earnings</p>
            <p className="text-sm font-black text-foreground">{fmt(grossPay)}</p>
          </div>
          <span className="text-muted-foreground text-lg">&minus;</span>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Deductions</p>
            <p className="text-sm font-black text-destructive">-{fmt(epfEmp + advDeducted)}</p>
          </div>
          <span className="text-muted-foreground text-lg">=</span>
          <div className="text-right rounded-xl bg-card border border-primary/30 px-3.5 py-1.5 shadow-sm">
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-primary">Net to Bank</p>
            <p className="text-base font-black text-primary">{fmt(netPay)}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
