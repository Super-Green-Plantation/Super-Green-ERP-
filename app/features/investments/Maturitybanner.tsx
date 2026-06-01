"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, LogOut, X, Clock } from "lucide-react";
import { dismissMaturityNotification, leaveInvestment, renewInvestment } from "./renewInvestment";

// ─── Maturity helpers ─────────────────────────────────────────────────────────

export function getDaysUntilMaturity(maturityDate: string | Date, planDuration?: number, investmentDate?: string | Date): number {
  // Prefer explicit maturityDate if set, else calculate from plan duration
  let target: Date;
  if (maturityDate) {
    target = new Date(maturityDate);
  } else if (investmentDate && planDuration) {
    target = new Date(investmentDate);
    target.setMonth(target.getMonth() + planDuration);
  } else {
    return Infinity;
  }
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

type MaturityStage = "critical" | "warning" | "approaching" | null;

export function getMaturityStage(daysUntil: number): MaturityStage {
  if (daysUntil > 30) return null;
  if (daysUntil <= 3) return "critical";
  if (daysUntil <= 15) return "warning";
  return "approaching";
}

const stageConfig = {
  critical: {
    bg: "bg-red-500/10 border-red-500/30",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    badge: "bg-red-500 text-white",
    label: "Matures in",
    urgency: "Immediate action required",
    glow: "shadow-red-500/10",
  },
  warning: {
    bg: "bg-amber-500/10 border-amber-500/30",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500 text-white",
    label: "Matures in",
    urgency: "Action needed soon",
    glow: "shadow-amber-500/10",
  },
  approaching: {
    bg: "bg-emerald-500/10 border-emerald-500/30",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500 text-white",
    label: "Matures in",
    urgency: "Plan ahead",
    glow: "shadow-emerald-500/10",
  },
};

// ─── Maturity Banner (inside each card) ──────────────────────────────────────

interface MaturityBannerProps {
  investment: any;
  onActionComplete?: () => void;
}

export function MaturityBanner({ investment, onActionComplete }: MaturityBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const daysUntil = getDaysUntilMaturity(
    investment.maturityDate,
    investment.plan?.duration,
    investment.investmentDate
  );

  const stage = getMaturityStage(daysUntil);

  // Already acted on or not near maturity
  if (!stage || investment.status === "Renewed" || investment.status === "Matured" || investment.isMatured) {
    return null;
  }

  // User dismissed — hide until page reload (server-persisted via maturityNotified)
  // But if daysUntil <= 0 (matured), always show regardless
  if (dismissed && daysUntil > 0) return null;

  const cfg = stageConfig[stage];
  const isPast = daysUntil <= 0;

  const handleDismiss = () => {
    setDismissed(true);
    startTransition(async () => {
      await dismissMaturityNotification(investment.id);
    });
  };

  return (
    <>
      <div className={`mt-5 rounded-2xl border p-4 ${cfg.bg} ${cfg.glow} shadow-lg transition-all`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 w-2 h-2 rounded-full ${cfg.dot} animate-pulse shrink-0 mt-1.5`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.text}`}>
                {isPast ? "Investment Matured" : cfg.urgency}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                {isPast ? "Today" : `${daysUntil}d`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isPast
                ? "This investment has reached maturity. Choose to renew or withdraw."
                : `${cfg.label} ${daysUntil} day${daysUntil !== 1 ? "s" : ""}. Choose to renew or withdraw your funds.`}
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-colors ${cfg.bg} border-current ${cfg.text} hover:opacity-80`}
              >
                <Clock size={10} />
                Take Action
              </button>

              {/* Dismiss only available before maturity */}
              {!isPast && (
                <button
                  onClick={handleDismiss}
                  disabled={isPending}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border hover:bg-muted/40 transition-colors"
                >
                  <X size={9} />
                  Ignore
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <MaturityActionModal
          investment={investment}
          daysUntil={daysUntil}
          stage={stage}
          onClose={() => setModalOpen(false)}
          onComplete={() => {
            setModalOpen(false);
            onActionComplete?.();
          }}
        />
      )}
    </>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface MaturityActionModalProps {
  investment: any;
  daysUntil: number;
  stage: MaturityStage;
  onClose: () => void;
  onComplete: () => void;
}

function MaturityActionModal({ investment, daysUntil, stage, onClose, onComplete }: MaturityActionModalProps) {
  const [choice, setChoice] = useState<"renew" | "leave" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string; refNumber?: string } | null>(null);

  const cfg = stage ? stageConfig[stage] : stageConfig.approaching;
  const principal = parseFloat(investment.amount) || 0;
  const renewalBonus = principal * 0.25;
  const newMaturityDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + (investment.plan?.duration ?? 12));
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  })();

  const handleConfirm = () => {
    if (!choice) return;
    startTransition(async () => {
      try {
        if (choice === "renew") {
          const res = await renewInvestment(investment.id);
          setResult({ success: true, message: "Investment renewed successfully.", refNumber: res.refNumber });
        } else {
          await leaveInvestment(investment.id);
          setResult({ success: true, message: "Investment marked as matured. Funds will be processed." });
        }
      } catch (e: any) {
        setResult({ success: false, message: e.message ?? "Something went wrong." });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={!result ? onClose : undefined} />

      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
        {/* Stage color strip */}
        <div className={`h-1 w-full ${cfg.dot}`} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${cfg.text} mb-1`}>
                {daysUntil <= 0 ? "Investment Matured" : `Matures in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`}
              </p>
              <h2 className="text-lg font-black tracking-tight">Choose Your Path</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{investment.refNumber} · {investment.plan?.name}</p>
            </div>
            {!result && (
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted/40 transition-colors">
                <X size={14} className="text-muted-foreground" />
              </button>
            )}
          </div>

          {!result ? (
            <>
              {/* Investment summary */}
              <div className="bg-muted/30 rounded-2xl p-4 mb-5 border border-border">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground font-bold uppercase tracking-wider text-[9px] mb-0.5">Principal</p>
                    <p className="font-black">LKR {principal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-bold uppercase tracking-wider text-[9px] mb-0.5">Total Return</p>
                    <p className="font-black">LKR {((parseFloat(investment.totalHarvest) || 0) + principal).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-5">
                {/* Renew */}
                <button
                  onClick={() => setChoice("renew")}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    choice === "renew"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/20 hover:border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${choice === "renew" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <RefreshCw size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black mb-0.5">Renew Investment</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Roll over for another {investment.plan?.duration ?? 12} months. New maturity: <span className="font-bold text-foreground">{newMaturityDate}</span>.
                      </p>
                      {investment.advisorId && (
                        <p className="text-[10px] mt-1.5 text-primary font-bold">
                          + LKR {renewalBonus.toLocaleString()} advisor target credit (25%)
                        </p>
                      )}
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${choice === "renew" ? "border-primary" : "border-border"}`}>
                      {choice === "renew" && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                  </div>
                </button>

                {/* Leave */}
                <button
                  onClick={() => setChoice("leave")}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    choice === "leave"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/20 hover:border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${choice === "leave" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <LogOut size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black mb-0.5">Withdraw Funds</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Close investment and receive <span className="font-bold text-foreground">LKR {((parseFloat(investment.totalHarvest) || 0) + principal).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> total return.
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${choice === "leave" ? "border-primary" : "border-border"}`}>
                      {choice === "leave" && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={handleConfirm}
                disabled={!choice || isPending}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                {isPending ? "Processing…" : choice ? `Confirm ${choice === "renew" ? "Renewal" : "Withdrawal"}` : "Select an option"}
              </button>
            </>
          ) : (
            /* Result state */
            <div className="text-center py-4">
              <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${result.success ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                <CheckCircle2 size={22} className={result.success ? "text-emerald-500" : "text-red-500"} />
              </div>
              <p className="font-black text-base mb-1">{result.success ? "Done!" : "Error"}</p>
              <p className="text-xs text-muted-foreground mb-1">{result.message}</p>
              {result.refNumber && (
                <p className="text-[10px] font-bold text-primary mt-1">New Ref: {result.refNumber}</p>
              )}
              <button
                onClick={onComplete}
                className="mt-5 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}