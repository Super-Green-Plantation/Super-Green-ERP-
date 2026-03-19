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
    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-5">

      {/* Month badge + sync checkbox */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-xs font-black text-white">
            {row.monthNumber}
          </div>
          <span className="text-xs font-bold text-slate-500">Month {row.monthNumber}</span>
        </div>

        {row.monthNumber > 1 && (
          <label className="flex items-center gap-2 cursor-pointer group">
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                ${isSynced
                  ? "bg-slate-900 border-slate-900"
                  : "bg-white border-slate-300 group-hover:border-slate-400"
                }`}
              onClick={() => onSyncToggle(!isSynced)}
            >
              {isSynced && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
              Same as Month {sourceMonthLabel}
            </span>
          </label>
        )}
      </div>

      <div className={`space-y-5 ${isSynced ? "opacity-50 pointer-events-none" : ""}`}>

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