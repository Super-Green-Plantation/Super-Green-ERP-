import type { ReactNode } from "react";

export function FloatingKpiCard({ icon, title, value, subValue, trend, trendValue }: { icon: ReactNode; title: string; value: string; subValue: string; trend: "up" | "down" | "neutral"; trendValue?: string }) {
  const trendClass = trend === "up" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : trend === "down" ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" : "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300";

  return (
    <div className="group flex min-h-[148px] flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-[0_10px_35px_rgba(34,43,72,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(34,43,72,0.09)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">{icon}</div>
      </div>
      <div>
        <div className="mb-1.5 flex items-end gap-2">
          <p className="text-[27px] font-bold leading-none tracking-tight text-foreground">{value}</p>
          {trendValue && <span className={`mb-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${trendClass}`}>{trend === "up" ? "↗ " : ""}{trendValue}</span>}
        </div>
        <p className="text-[11px] font-medium text-muted-foreground">{subValue}</p>
      </div>
    </div>
  );
}
