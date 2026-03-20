//non-FA 6-row view with ORC
"use client";

import { Percent, TrendingUp } from "lucide-react";
import { Field, Section, RowConfig, PositionEdits, formatIndicator } from "./shared";
import MonthRow from "./MonthRow";

interface NonFaTargetConfigProps {
  positionId: number;
  edit: PositionEdits[number];
  syncedMonths: Record<string, boolean>;
  syncKey: (positionId: number, period: number, month: number) => string;
  onUpdateRow: (
    period: number,
    month: number,
    field: keyof Omit<RowConfig, "periodNumber" | "monthNumber">,
    value: number
  ) => void;
  after6MonthTarget: number;
  onUpdateAfter6Month: (value: number) => void;

  onSyncToggle: (period: number, month: number, checked: boolean) => void;
  onUpdateOrc: (status: string, value: number) => void;
}

export default function NonFaTargetConfig({
  positionId, edit, syncedMonths, syncKey,
  onUpdateRow, onSyncToggle, onUpdateOrc, after6MonthTarget, onUpdateAfter6Month
}: NonFaTargetConfigProps) {
  return (
    <div className="space-y-6">
      {[1, 2].map(period => {
        const periodRows = edit.rows.filter(r => r.periodNumber === period);
        return (
          <div key={period} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest border
                ${period === 1
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-violet-50 text-violet-700 border-violet-200"
                }`}
              >
                Period {period} — {period === 1 ? "First 3 Months" : "Second 3 Months"}
              </span>
            </div>

            {periodRows.map(row => (
              <MonthRow
                key={`${positionId}-${row.periodNumber}-${row.monthNumber}`}
                row={row}
                positionId={positionId}
                isSynced={!!syncedMonths[syncKey(positionId, row.periodNumber, row.monthNumber)]}
                onUpdate={(field, value) => onUpdateRow(row.periodNumber, row.monthNumber, field, value)}
                onSyncToggle={checked => onSyncToggle(row.periodNumber, row.monthNumber, checked)}
              />
            ))}
          </div>
        );
      })}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <Section icon={<TrendingUp className="w-4 h-4" />} title="After 6th Month Target">
          <Field
            label="Monthly Target — After 6 Months"
            value={after6MonthTarget}
            onChange={onUpdateAfter6Month}
            prefix="Rs."
            hint={
              formatIndicator(after6MonthTarget)
                ? `Currently: ${formatIndicator(after6MonthTarget)} — ongoing target after probation period`
                : "Volume target applicable after completing 6 months"
            }
          />
        </Section>

        <Section icon={<Percent className="w-4 h-4" />} title="ORC Rate">
          <Field
            label="ORC Rate — Non-Permanent"
            value={edit.orcRateNonPermanent}
            onChange={v => onUpdateOrc("nonPermanent", v)}
            suffix="%×100"
            hint={`Currently: ${edit.orcRateNonPermanent}%`}
          />
        </Section>
      </div>
    </div>
  );
}