//single position card (header + body)
"use client";

import { Save, ChevronDown, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { PositionEdits, RowConfig, FaPeriodConfig, RANK_COLORS } from "./shared";
import FaTargetConfig from "./FaTargetConfig";
import NonFaTargetConfig from "./NonFaTargetConfig";
import { Position } from "@/app/types/Position";
import { PositionWithTargets } from "@/app/types/PositionWithTargets";
import { useState } from "react";

interface PositionAccordionProps {
  position: PositionWithTargets;
  isExpanded: boolean;
  isSaving: boolean;
  edit: PositionEdits[number];
  syncedMonths: Record<string, boolean>;
  syncKey: (positionId: number, period: number, month: number) => string;
  onToggle: () => void;
  onSave: () => void;
  onUpdateRow: (
    period: number,
    month: number,
    field: keyof Omit<RowConfig, "periodNumber" | "monthNumber">,
    value: number
  ) => void;

  onUpdateAfter6Month: (value: number) => void;
  onUpdateAfter6MonthIncentivePct: (value: number) => void;
  onUpdateFa: (period: "p1" | "p2", field: keyof FaPeriodConfig, value: number) => void;
  onUpdateOrc: (status: string, value: number) => void;
  onSyncToggle: (period: number, month: number, checked: boolean) => void;
}

export default function PositionAccordion({
  position, isExpanded, isSaving, edit, syncedMonths, syncKey,
  onToggle, onSave, onUpdateRow, onUpdateFa, onUpdateOrc, onSyncToggle, onUpdateAfter6Month, onUpdateAfter6MonthIncentivePct
}: PositionAccordionProps) {
  const isFa = position.rank === 1;
  const rankColor = RANK_COLORS[position.rank] ?? RANK_COLORS[1];
  const hasTargets = position.positionTargets?.length > 0;
  const [probation, setProbation] = useState(position.isProbation);

  return (
    <>{probation && (
      <div>
        <div className={`bg-card rounded-2xl border transition-all duration-300 overflow-hidden
      ${isExpanded ? "border-primary/30 shadow-md" : "border-border/70 shadow-sm"}`}
        >
          {/* Header */}
          <div
            role="button" tabIndex={0}
            onClick={onToggle}
            onKeyDown={(e) => e.key === "Enter" && onToggle()}
            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30 cursor-pointer"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              <span className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${rankColor}`}>
                {position.title}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Rank {position.rank}</span>
              {hasTargets && (
                <span className="flex items-center gap-1 rounded-lg border border-emerald-500/15 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isExpanded && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSave(); }}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[10px] font-bold tracking-wide text-primary-foreground shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                >
                  {isSaving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                    : <><Save className="w-3.5 h-3.5" /> Save Changes</>
                  }
                </button>
              )}
              {isExpanded
                ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                : <ChevronRight className="w-4 h-4 text-muted-foreground" />
              }
            </div>
          </div>

          {/* Body */}
          {isExpanded && edit && (
            <div className="border-t border-border/70 bg-muted/15 px-4 pb-5 pt-4 sm:px-5">
              {isFa ? (
                <FaTargetConfig
                  fa={edit.fa}
                  positionId={position.id}
                  onUpdate={onUpdateFa}
                />
              ) : (
                <NonFaTargetConfig
                  positionId={position.id}
                  edit={edit}
                  syncedMonths={syncedMonths}
                  syncKey={syncKey}
                  onUpdateRow={onUpdateRow}
                  onSyncToggle={onSyncToggle}
                  onUpdateOrc={onUpdateOrc}
                  after6MonthTarget={edit.after6MonthTarget}
                  onUpdateAfter6Month={onUpdateAfter6Month}
                  after6MonthIncentivePct={edit.after6MonthIncentivePct}
                  onUpdateAfter6MonthIncentivePct={onUpdateAfter6MonthIncentivePct}
                />
              )}
            </div>
          )}
        </div>
      </div>
    )}
    </>


  );
}
