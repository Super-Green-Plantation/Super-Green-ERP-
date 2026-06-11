import { useMemo } from "react";

interface ProgressBarProps {
  achieved: number;
  target: number;
  percentage: number;
  isMounted: boolean;
  formatCurrency: (amount: number) => string;
}

export const ProgressBar = ({
  achieved,
  target,
  percentage,
  isMounted,
  formatCurrency,
}: ProgressBarProps) => {
  const progressColor = useMemo(() => {
    if (percentage >= 100) return "bg-emerald-500";
    if (percentage >= 60) return "bg-amber-500";
    return "bg-red-500";
  }, [percentage]);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Volume achieved
          </p>
          <p className="text-3xl font-black text-foreground tracking-tight mt-1 tabular-nums">
            {isMounted ? formatCurrency(achieved) : "—"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-black tabular-nums"
            style={{
              color:
                percentage >= 100
                  ? "rgb(16 185 129)"
                  : percentage >= 60
                  ? "rgb(245 158 11)"
                  : "rgb(239 68 68)",
            }}
          >
            {isMounted ? `${percentage}%` : "—"}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
            of target
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColor}`}
          style={{ width: isMounted ? `${Math.min(percentage, 100)}%` : "0%" }}
        />
      </div>

      <div className="flex justify-between text-xs font-semibold text-muted-foreground">
        <span>
          Target{" "}
          <span className="text-foreground font-black">
            {isMounted ? formatCurrency(target) : "—"}
          </span>
        </span>
        <span>
          Remaining{" "}
          <span className="text-foreground font-black">
            {isMounted
              ? formatCurrency(Math.max(0, target - achieved))
              : "—"}
          </span>
        </span>
      </div>
    </div>
  );
};