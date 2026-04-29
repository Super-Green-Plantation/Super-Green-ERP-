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
  onUpdateFa: (period: "p1" | "p2", field: keyof FaPeriodConfig, value: number) => void;
  onUpdateOrc: (status: string, value: number) => void;
  onSyncToggle: (period: number, month: number, checked: boolean) => void;
}

export default function PositionAccordion({
  position, isExpanded, isSaving, edit, syncedMonths, syncKey,
  onToggle, onSave, onUpdateRow, onUpdateFa, onUpdateOrc, onSyncToggle, onUpdateAfter6Month
}: PositionAccordionProps) {
  const isFa = position.rank === 1;
  const rankColor = RANK_COLORS[position.rank] ?? RANK_COLORS[1];
  const hasTargets = position.positionTargets?.length > 0;
  const [probation, setProbation] = useState(position.isProbation);

  return (
    <>{probation && (
      <div>
        <div className={`bg-card rounded-2xl border transition-all duration-300 overflow-hidden
      ${isExpanded ? "border-primary/30 shadow-xl" : "border-border shadow-sm"}`}
        >
          {/* Header */}
          <div
            role="button" tabIndex={0}
            onClick={onToggle}
            onKeyDown={(e) => e.key === "Enter" && onToggle()}
            className="w-full flex items-center justify-between px-6 py-5 hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <div className="sm:flex items-center gap-4">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold border uppercase tracking-widest ${rankColor}`}>
                {position.title}
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tighter">Rank {position.rank}</span>
              {hasTargets && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full uppercase tracking-tight">
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
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 disabled:opacity-50 hover:opacity-90 shadow-lg shadow-primary/10"
                >
                  {isSaving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                    : <><Save className="w-3.5 h-3.5" /> Save Changes</>
                  }
                </button>
              )}
              {isExpanded
                ? <ChevronDown className="w-4 h-4 text-slate-400" />
                : <ChevronRight className="w-4 h-4 text-slate-400" />
              }
            </div>
          </div>

          {/* Body */}
          {isExpanded && edit && (
            <div className="border-t border-border px-6 pb-8 pt-8 bg-card">
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
