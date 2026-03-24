"use client";

import { AlertCircle, Loader2, Target } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getPositions, upsertPositionOrc, upsertPositionTargets } from "../position-targets-actions";
import PositionAccordion from "./components/PositionAccordion";
import {
  FaPeriodConfig,
  PositionEdits, RowConfig,
  buildEdits,
} from "./components/shared";
import { PositionWithTargets } from "@/app/types/PositionWithTargets";
import Heading from "@/app/components/Heading";
import Loading from "@/app/components/Status/Loading";

export default function PositionTargetsPage() {
  const [positions, setPositions] = useState<PositionWithTargets[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [edits, setEdits] = useState<PositionEdits>({});
  const [syncedMonths, setSyncedMonths] = useState<Record<string, boolean>>({});

  const syncKey = (positionId: number, period: number, month: number) =>
    `${positionId}-${period}-${month}`;

  useEffect(() => {
    getPositions().then((data: PositionWithTargets[]) => {
      setPositions(data);
      const initial: PositionEdits = {};
      data.forEach(p => { initial[p.id] = buildEdits(p); });
      setEdits(initial);
      if (data.length > 0) setExpandedId(data[0].id);
      setLoading(false);
    });
  }, []);

  const updateRow = useCallback((
    positionId: number,
    period: number,
    month: number,
    field: keyof Omit<RowConfig, "periodNumber" | "monthNumber">,
    value: number
  ) => {
    setEdits(prev => ({
      ...prev,
      [positionId]: {
        ...prev[positionId],
        rows: prev[positionId].rows.map(r =>
          r.periodNumber === period && r.monthNumber === month
            ? { ...r, [field]: value } : r
        ),
      },
    }));

    // Propagate to synced months if this is month 1 of a period
    if (month === 1) {
      setEdits(prev => {
        const rows = prev[positionId].rows;
        const updated = rows.map(r => {
          if (r.periodNumber === period && r.monthNumber > 1 &&
            syncedMonths[syncKey(positionId, period, r.monthNumber)]) {
            return { ...r, [field]: value };
          }
          return r;
        });
        return { ...prev, [positionId]: { ...prev[positionId], rows: updated } };
      });
    }
  }, [syncedMonths]);

  const updateFa = useCallback((
    positionId: number,
    period: "p1" | "p2",
    field: keyof FaPeriodConfig,
    value: number
  ) => {
    setEdits(prev => ({
      ...prev,
      [positionId]: {
        ...prev[positionId],
        fa: {
          ...prev[positionId].fa,
          [period]: { ...prev[positionId].fa[period], [field]: value },
        },
      },
    }));
  }, []);

  const updateOrc = useCallback((positionId: number, status: string, value: number) => {
    setEdits(prev => ({
      ...prev,
      [positionId]: {
        ...prev[positionId],
        ...(status === "permanent"
          ? { orcRatePermanent: value }
          : { orcRateNonPermanent: value }
        ),
      },
    }));
  }, []);

  const handleSyncToggle = useCallback((
    positionId: number,
    period: number,
    month: number,
    checked: boolean
  ) => {
    const key = syncKey(positionId, period, month);
    setSyncedMonths(prev => ({ ...prev, [key]: checked }));

    if (checked) {
      setEdits(prev => {
        const source = prev[positionId].rows.find(
          r => r.periodNumber === period && r.monthNumber === 1
        );
        if (!source) return prev;
        return {
          ...prev,
          [positionId]: {
            ...prev[positionId],
            rows: prev[positionId].rows.map(r =>
              r.periodNumber === period && r.monthNumber === month
                ? { ...source, periodNumber: period, monthNumber: month }
                : r
            ),
          },
        };
      });
    }
  }, []);

  const updateAfter6Month = useCallback((positionId: number, value: number) => {
    setEdits(prev => ({
      ...prev,
      [positionId]: { ...prev[positionId], after6MonthTarget: value },
    }));
  }, []);


  const handleSave = async (positionId: number, isFa: boolean) => {
    setSaving(positionId);
    try {
      const edit = edits[positionId];
      let targets: RowConfig[];

      if (isFa) {
        const { p1, p2 } = edit.fa;
        targets = [
          ...[1, 2, 3].map(m => ({
            periodNumber: 1, monthNumber: m,
            targetAmount: p1.targetAmount, bonusAmount: p1.bonusAmount,
            bonusThresholdPct: 1.0,
            vehicleAmount: 0, vehicleThresholdPct: 0,
            teamActiveAmount: 0, teamActiveThresholdPct: 0,
            minActiveAdvisors: 0, minActiveFMs: 0, minActiveBMs: 0,
            excessRate: p1.excessRate / 100,
            partialThreshold: p1.partialThreshold,
            partialBonus: p1.partialBonus,
            after6MonthTarget: 0,
          })),
          ...[1, 2, 3].map(m => ({
            periodNumber: 2, monthNumber: m,
            targetAmount: p2.targetAmount, bonusAmount: p2.bonusAmount,
            bonusThresholdPct: 1.0,
            vehicleAmount: 0, vehicleThresholdPct: 0,
            teamActiveAmount: 0, teamActiveThresholdPct: 0,
            minActiveAdvisors: 0, minActiveFMs: 0, minActiveBMs: 0,
            excessRate: p2.excessRate / 100,
            partialThreshold: p2.partialThreshold,
            partialBonus: p2.partialBonus,
            after6MonthTarget: 0,
          })),
        ];
      } else {
        targets = edit.rows.map(r => ({
          ...r,
          bonusThresholdPct: r.bonusThresholdPct / 100,
          vehicleThresholdPct: r.vehicleThresholdPct / 100,
          teamActiveThresholdPct: r.teamActiveThresholdPct / 100,
          excessRate: r.excessRate / 100,
          after6MonthTarget: edit.after6MonthTarget, // ← write from position-level state

        }));
      }

      const [targetsRes, orcRes] = await Promise.all([
        upsertPositionTargets(positionId, targets),
        upsertPositionOrc(
          positionId,
          edit.orcRateNonPermanent / 100,
        ),
      ]);

      if (targetsRes.success && orcRes.success) toast.success("Saved successfully.");
      else toast.error("Failed to save.");
    } catch {
      toast.error("Unexpected error.");
    } finally {
      setSaving(null);
    }
  };


  if (loading) return <Loading/>

  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          
          <div>
            <Heading>Position Targets</Heading>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Configure probation-period monthly targets and bonuses per position.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">

          <Link
            href="/features/hr/salary"
            className="px-5 py-3 text-xs font-black uppercase tracking-widest text-white bg-slate-900 rounded-xl hover:bg-slate-700 transition-all"
          >
            Permanent Config
          </Link>
        </div>
      </div>

      {/* Accordions */}
      <div className="space-y-3 space-x-0 mx-auto">
        {positions.map((position) => (
          <PositionAccordion
            key={position.id}
            position={position}
            isExpanded={expandedId === position.id}
            isSaving={saving === position.id}
            edit={edits[position.id]}
            syncedMonths={syncedMonths}
            syncKey={syncKey}
            onToggle={() => setExpandedId(expandedId === position.id ? null : position.id)}
            onSave={() => handleSave(position.id, position.rank === 1)}
            onUpdateRow={(period, month, field, value) =>
              updateRow(position.id, period, month, field, value)}
            onUpdateFa={(period, field, value) =>
              updateFa(position.id, period, field, value)}
            onUpdateOrc={(status, value) => updateOrc(position.id, status, value)}
            onSyncToggle={(period, month, checked) =>
              handleSyncToggle(position.id, period, month, checked)}
            onUpdateAfter6Month={(value) => updateAfter6Month(position.id, value)}

          />
        ))}
      </div>
    </div>
  );
}