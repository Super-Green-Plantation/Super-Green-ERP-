//single month row (memoized, fixes focus bug)
"use client";

import React from "react";
import { TrendingUp, Award, Car, Users } from "lucide-react";
import { Field, Section, RowConfig, formatIndicator } from "./shared";

interface MonthRowProps {
  row: RowConfig;
  positionId: number;
  isSynced: boolean;
  onUpdate: (field: keyof Omit<RowConfig, "periodNumber" | "monthNumber">, value: number) => void;
  onSyncToggle: (checked: boolean) => void;
}

const MonthRow = React.memo(({ row, isSynced, onUpdate, onSyncToggle }: MonthRowProps) => {
  const sourceMonthLabel = row.periodNumber === 1 ? 1 : 4;

  return (
    <div className="p-6 bg-card rounded-2xl border border-border space-y-6 shadow-sm">

      {/* Month badge + sync checkbox */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20">
            {row.monthNumber}
          </div>
          <span className="text-sm font-bold text-foreground uppercase tracking-tight">Month {row.monthNumber}</span>
        </div>

        {row.monthNumber > 1 && (
          <label className="flex items-center gap-2 cursor-pointer group">
            <div
              className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all
                ${isSynced
                  ? "bg-primary border-primary"
                  : "bg-muted border-border group-hover:border-primary/50"
                }`}
              onClick={() => onSyncToggle(!isSynced)}
            >
              {isSynced && (
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">
              Same as Month {sourceMonthLabel}
            </span>
          </label>
        )}
      </div>

      <div className={`space-y-8 ${isSynced ? "opacity-30 pointer-events-none grayscale" : ""}`}>

        <Section icon={<TrendingUp className="w-4 h-4" />} title="Volume Target">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Monthly Target"
              value={row.targetAmount}
              onChange={v => onUpdate("targetAmount", v)}
              prefix="Rs."
              hint={formatIndicator(row.targetAmount) ? `Currently: ${formatIndicator(row.targetAmount)}` : undefined}
            />
          </div>
        </Section>

        <Section icon={<Award className="w-4 h-4" />} title="Basic Incentive">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Incentive Amount"
              value={row.bonusAmount}
              onChange={v => onUpdate("bonusAmount", v)}
              prefix="Rs."
              hint="Paid when threshold is achieved"
            />
            <Field
              label="Threshold %"
              value={row.bonusThresholdPct}
              onChange={v => onUpdate("bonusThresholdPct", v)}
              suffix="%"
              hint={`Currently: ${row.bonusThresholdPct}% of monthly target`}
            />
          </div>
        </Section>

        <Section icon={<Car className="w-4 h-4" />} title="Vehicle & Fuel Allowance">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Allowance Amount"
              value={row.vehicleAmount}
              onChange={v => onUpdate("vehicleAmount", v)}
              prefix="Rs."
              hint="Paid when volume threshold is achieved"
            />
            <Field
              label="Threshold %"
              value={row.vehicleThresholdPct}
              onChange={v => onUpdate("vehicleThresholdPct", v)}
              suffix="%"
              hint={`Currently: ${row.vehicleThresholdPct}% of monthly target`}
            />
          </div>
        </Section>

        <Section icon={<Users className="w-4 h-4" />} title="Team Active">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Team Active Amount"
              value={row.teamActiveAmount}
              onChange={v => onUpdate("teamActiveAmount", v)}
              prefix="Rs."
              hint="Paid when volume + headcount conditions are met"
            />
            <Field
              label="Volume Threshold %"
              value={row.teamActiveThresholdPct}
              onChange={v => onUpdate("teamActiveThresholdPct", v)}
              suffix="%"
              hint={`Currently: ${row.teamActiveThresholdPct}% of monthly target`}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <Field
              label="Min. Advisors"
              value={row.minActiveAdvisors}
              onChange={v => onUpdate("minActiveAdvisors", v)}
              hint="FA codes"
            />
            <Field
              label="Min. FMs"
              value={row.minActiveFMs}
              onChange={v => onUpdate("minActiveFMs", v)}
              hint="TL codes"
            />
            <Field
              label="Min. BMs"
              value={row.minActiveBMs}
              onChange={v => onUpdate("minActiveBMs", v)}
              hint="BM codes"
            />
          </div>
        </Section>
      </div>
    </div>
  );
});

MonthRow.displayName = "MonthRow";
export default MonthRow;
