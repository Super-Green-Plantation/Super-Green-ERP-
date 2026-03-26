//Field, Section, formatIndicator, types

import { Position } from "@/app/types/Position";
import { PositionWithTargets } from "@/app/types/PositionWithTargets";
import React from "react";

export const formatIndicator = (value: number): string => {
    if (!value) return "";
    if (value >= 10_000_000) return `${(value / 1_000_000).toFixed(1)}Cr`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 100_000) return `${(value / 100_000).toFixed(1)}L`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return "";
};

export interface RowConfig {
    periodNumber: number;
    monthNumber: number;
    targetAmount: number;
    bonusAmount: number;
    bonusThresholdPct: number;
    vehicleAmount: number;
    vehicleThresholdPct: number;
    teamActiveAmount: number;
    teamActiveThresholdPct: number;
    minActiveAdvisors: number;
    minActiveFMs: number;
    minActiveBMs: number;
    excessRate: number;
    partialThreshold: number;
    partialBonus: number;
    after6MonthTarget: number;
}

export interface FaPeriodConfig {
    targetAmount: number;
    bonusAmount: number;
    partialThreshold: number;
    partialBonus: number;
    excessRate: number;
}



export type PositionEdits = Record<number, {
    rows: RowConfig[];
    fa: { p1: FaPeriodConfig; p2: FaPeriodConfig };
    orcRatePermanent: number;
    orcRateNonPermanent: number;
    after6MonthTarget: number;
}>;

export const RANK_COLORS: Record<number, string> = {
    1: "bg-primary/10 text-primary border-primary/20",
    2: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    3: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    4: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    5: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    6: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

export function blankRow(period: number, month: number): RowConfig {
    return {
        periodNumber: period, monthNumber: month,
        targetAmount: 0, bonusAmount: 0, bonusThresholdPct: 100,
        vehicleAmount: 0, vehicleThresholdPct: 0,
        teamActiveAmount: 0, teamActiveThresholdPct: 0,
        minActiveAdvisors: 0, minActiveFMs: 0, minActiveBMs: 0,
        excessRate: 0, partialThreshold: 0, partialBonus: 0,
        after6MonthTarget: 0,
    };
}

export function buildEdits(position: PositionWithTargets): PositionEdits[number] {
    const existing = position.positionTargets ?? [];

    const rows: RowConfig[] = [];
    for (let p = 1; p <= 2; p++) {
        for (let m = 1; m <= 3; m++) {
            const found = existing.find(t => t.periodNumber === p && t.monthNumber === m);
            rows.push(found ? {
                ...blankRow(p, m), ...found,
                bonusThresholdPct: found.bonusThresholdPct * 100,    // 0.75 → 75
                vehicleThresholdPct: found.vehicleThresholdPct * 100, // 0.60 → 60
                teamActiveThresholdPct: found.teamActiveThresholdPct * 100,
                excessRate: found.excessRate * 100,
            } : blankRow(p, m));
        }
    }

    const sourceRow = existing.find(t => t.periodNumber === 1 && t.monthNumber === 1);


    const p1row = rows[0];
    const p2row = rows[3];

    return {
        rows,
        fa: {
            p1: {
                targetAmount: p1row.targetAmount,
                bonusAmount: p1row.bonusAmount,
                partialThreshold: p1row.partialThreshold,
                partialBonus: p1row.partialBonus,
                excessRate: p1row.excessRate
            },
            p2: {
                targetAmount: p2row.targetAmount,
                bonusAmount: p2row.bonusAmount,
                partialThreshold: p2row.partialThreshold,
                partialBonus: p2row.partialBonus,
                excessRate: p2row.excessRate
            },
        },
        orcRatePermanent: Number(position.orc?.ratePermanent ?? 0) * 100,
        orcRateNonPermanent: Number(position.orc?.rateNonPermanent ?? 0) * 100,
        after6MonthTarget: sourceRow?.after6MonthTarget ?? 0,
    };
}

export function Field({
    label, value, onChange, prefix, suffix, hint, disabled = false,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    prefix?: string;
    suffix?: string;
    hint?: string;
    disabled?: boolean;
}) {
    const indicator = prefix === "Rs." ? formatIndicator(value) : null;
    return (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {label}
            </label>
            <div className={`flex items-center border rounded-xl overflow-hidden transition-all bg-muted/30
        ${disabled
                    ? "border-border/50 bg-muted/10 opacity-50"
                    : "border-border focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 shadow-sm"
                }`}
            >
                {prefix && (
                    <span className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                        {prefix}
                    </span>
                )}
                <input
                    type="number"
                    step="any"
                    value={value ?? 0}
                    disabled={disabled}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-foreground outline-none bg-transparent placeholder:text-muted-foreground/30 disabled:text-muted-foreground/50 min-w-0"
                />
                {indicator && (
                    <span className="px-3 py-2 text-[10px] font-bold text-green-600 shrink-0">
                        {indicator}
                    </span>
                )}
                {suffix && (
                    <span className="px-3 py-2 text-[10px] font-bold text-muted-foreground bg-muted border-l border-border uppercase tracking-widest shrink-0">
                        {suffix}
                    </span>
                )}
            </div>
            {hint && <p className="text-[10px] text-muted-foreground/70 font-medium mt-1.5 ml-1">{hint}</p>}
        </div>
    );
}

export function Section({
    icon, title, children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
                <span className="text-primary opacity-70">{icon}</span>
                <h3 className="text-[11px] font-bold text-foreground uppercase tracking-[0.2em]">{title}</h3>
            </div>
            {children}
        </div>
    );
}
