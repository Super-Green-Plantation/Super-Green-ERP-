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
                <span className={`px-2 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest border
                ${period === 1
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-violet-50 text-violet-700 border-violet-200"
                  }`}
                >
                  Period {period} — {period === 1 ? "First 3 Months" : "Second 3 Months"}
                </span>
              </div>
              <div className="mb-4 ml-1">
                <span className="pb-5 text-[10px] text-slate-400">same config applies to all 3 months</span>
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