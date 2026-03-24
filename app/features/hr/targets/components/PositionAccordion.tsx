//single position card (header + body)
"use client";

import { Save, ChevronDown, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { PositionEdits, RowConfig, FaPeriodConfig, RANK_COLORS } from "./shared";
import FaTargetConfig from "./FaTargetConfig";
import NonFaTargetConfig from "./NonFaTargetConfig";
import { Position } from "@/app/types/Position";
import { PositionWithTargets } from "@/app/types/PositionWithTargets";

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
  onToggle, onSave, onUpdateRow, onUpdateFa, onUpdateOrc, onSyncToggle,onUpdateAfter6Month
}: PositionAccordionProps) {
  const isFa = position.rank === 1;
  const rankColor = RANK_COLORS[position.rank] ?? RANK_COLORS[1];
  const hasTargets = position.positionTargets?.length > 0;

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden
      ${isExpanded ? "border-slate-300 shadow-md" : "border-slate-100 shadow-sm"}`}
    >
      {/* Header */}
      <div
        role="button" tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <div className="sm:flex items-center gap-3">
          <span className={`px-3 py-1 mb-2 rounded-lg text-xs font-black border uppercase tracking-wider ${rankColor}`}>
            {position.title}
          </span>
          <span className="text-xs text-slate-400 font-bold pl-2">Rank {position.rank}</span>
          {hasTargets && (
            <span className="flex items-center gap-1 text-[10px] mt-2 font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Configured
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isExpanded && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
            >
              {isSaving
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                : <><Save className="w-3 h-3" /> Save</>
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
        <div className="border-t border-slate-100 px-5 pb-6 pt-5">
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
  );
}