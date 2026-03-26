//FA 2-period simplified view

"use client";

import { TrendingUp, Percent } from "lucide-react";
import { Field, Section, FaPeriodConfig, formatIndicator } from "./shared";

interface FaTargetConfigProps {
  fa: { p1: FaPeriodConfig; p2: FaPeriodConfig };
  positionId: number;
  onUpdate: (period: "p1" | "p2", field: keyof FaPeriodConfig, value: number) => void;
}

export default function FaTargetConfig({ fa, onUpdate }: FaTargetConfigProps) {
  return (
    <div className="space-y-6">
      {(["p1", "p2"] as const).map((pk) => {
        const config = fa[pk];
        const period = pk === "p1" ? 1 : 2;

        return (
          <div key={pk} >
            <div >
              <div>
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] border
                ${period === 1
                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    : "bg-violet-500/10 text-violet-600 border-violet-500/20"
                  }`}
                >
                  Period {period} — {period === 1 ? "First 3 Months" : "Second 3 Months"}
                </span>
              </div>
              <div className="mb-6 ml-1 mt-2">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter opacity-70">same configuration applies to all 3 months</span>
              </div>

            </div>

            <Section icon={<TrendingUp className="w-4 h-4" />} title="Volume Target & Bonus">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Full Target"
                  value={config.targetAmount}
                  onChange={v => onUpdate(pk, "targetAmount", v)}
                  prefix="Rs."
                  hint={formatIndicator(config.targetAmount) ? `Currently: ${formatIndicator(config.targetAmount)}` : "Volume required for full bonus"}
                />
                <Field
                  label="Full Bonus"
                  value={config.bonusAmount}
                  onChange={v => onUpdate(pk, "bonusAmount", v)}
                  prefix="Rs."
                  hint="Paid when full target is achieved"
                />
                <Field
                  label="Partial Threshold"
                  value={config.partialThreshold}
                  onChange={v => onUpdate(pk, "partialThreshold", v)}
                  prefix="Rs."
                  hint={formatIndicator(config.partialThreshold) ? `Currently: ${formatIndicator(config.partialThreshold)}` : "Lower volume for partial bonus"}
                />
                <Field
                  label="Partial Bonus"
                  value={config.partialBonus}
                  onChange={v => onUpdate(pk, "partialBonus", v)}
                  prefix="Rs."
                  hint="Paid when partial threshold is hit"
                />
              </div>
            </Section>

            <Section icon={<Percent className="w-4 h-4" />} title="Excess Commission">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Excess Rate"
                  value={config.excessRate}
                  onChange={v => onUpdate(pk, "excessRate", v)}
                  suffix="%"
                  hint={`Currently: ${config.excessRate}% — applied to volume above full target`}
                />
              </div>
            </Section>
          </div>
        );
      })}
    </div>
  );
}
