"use client";

import { getEmployeePerformance } from "@/app/features/branches/employees/[branchId]/[empId]/getEmployeePerfomance";
import { toggleEmployeeStatus } from "@/app/features/employees/actions";
import {
    Award,
    Banknote,
    Calendar,
    Car,
    CheckCircle2,
    ChevronRight,
    Clock, Loader2,
    Target,
    TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import Loading from "../Status/Loading";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    `Rs. ${Number(n).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;

const fmtM = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : `${(n / 1000).toFixed(0)}K`;

const MONTH_NAMES = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function ProgressBar({ achieved, target, color = "bg-blue-500" }: {
    achieved: number; target: number; color?: string;
}) {
    const pct = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;
    return (
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-700 ${color}`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

function StatPill({ label, value, highlight = false }: {
    label: string; value: string; highlight?: boolean;
}) {
    return (
        <div className={`rounded-xl p-3 border ${highlight ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"}`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <p className={`text-sm font-black ${highlight ? "text-emerald-600" : "text-slate-700"}`}>{value}</p>
        </div>
    );
}

// ─── Probation Section ────────────────────────────────────────────────────────

function ProbationStatus({ data, status, onToggle, toggling }: {
    data: any;
    status: "PROBATION" | "PERMANENT";
    onToggle: () => void;
    toggling: boolean;
}) {
    const {
        probationStartDate, monthsElapsed, periodNumber,
        monthInPeriod, target, evaluation,
    } = data;

    const volumeAchieved = evaluation?.volumeAchieved ?? 0;
    const targetAmount = target?.targetAmount ?? 0;
    const bonusEarned = evaluation?.bonusEarned ?? 0;
    const targetHit = evaluation?.targetHit ?? false;
    const partialHit =
        !targetHit &&
        target?.partialThreshold > 0 &&
        volumeAchieved >= target.partialThreshold;

    const progressColor = targetHit
        ? "bg-emerald-500"
        : partialHit
            ? "bg-amber-400"
            : "bg-blue-400";

    // Progress bar compares against full target
    const progressPct = targetAmount > 0
        ? Math.min((volumeAchieved / targetAmount) * 100, 100)
        : 0;

    return (
        <div className="space-y-4">
            {/* Status badge + period indicator */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={onToggle} disabled={toggling}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-[11px] font-black uppercase tracking-wider rounded-full transition-all hover:opacity-80 active:scale-95 ${status === "PERMANENT"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}
                >
                    {toggling
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : status === "PERMANENT"
                            ? <CheckCircle2 className="w-3 h-3" />
                            : <Clock className="w-3 h-3" />
                    }
                    {status === "PERMANENT" ? "Permanent" : "Probation"}
                </button>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-black uppercase tracking-wider rounded-full">
                    Period {periodNumber} — Month {monthInPeriod}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                    {monthsElapsed} month{monthsElapsed !== 1 ? "s" : ""} elapsed
                </span>
            </div>

            {/* Probation start date */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Started {new Date(probationStartDate).toLocaleDateString("en-LK", { year: "numeric", month: "long", day: "numeric" })}</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="font-semibold text-slate-600">
                    {6 - monthsElapsed > 0 ? `${6 - monthsElapsed} month${6 - monthsElapsed !== 1 ? "s" : ""} remaining` : "Confirmation due"}
                </span>
            </div>

            {/* Target progress */}
            {target ? (
                <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
                                This Month's Target
                            </span>
                        </div>
                        {evaluation ? (
                            targetHit ? (
                                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" /> Target Hit
                                </span>
                            ) : partialHit ? (
                                <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                                    Partial
                                </span>
                            ) : (
                                <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                                    In Progress
                                </span>
                            )
                        ) : (
                            <span className="text-[10px] font-black text-slate-300 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                                Not Evaluated
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-1.5">
                            <span className="text-xs font-bold text-slate-500">
                                {fmtM(volumeAchieved)} achieved
                            </span>
                            <span className="text-xs text-slate-400">
                                / {fmtM(targetAmount)} target
                            </span>
                        </div>
                        <ProgressBar achieved={volumeAchieved} target={targetAmount} color={progressColor} />
                        <p className="text-[10px] text-slate-400 mt-1 text-right">
                            {progressPct.toFixed(1)}%
                        </p>
                    </div>

                    {/* Bonus & partial threshold */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        <StatPill label="Full Bonus" value={fmt(target.bonusAmount)} />
                        {target.partialThreshold > 0 && (
                            <StatPill label={`Partial (${fmtM(target.partialThreshold)})`} value={fmt(target.partialBonus)} />
                        )}
                        <StatPill
                            label="Bonus Earned"
                            value={fmt(bonusEarned)}
                            highlight={bonusEarned > 0}
                        />
                    </div>
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-600 font-medium">
                    No target configured for Period {periodNumber}, Month {monthInPeriod}.
                    Set it up in HR → Targets.
                </div>
            )}
        </div>
    );
}

// ─── Permanent Section ────────────────────────────────────────────────────────

function PermanentStatus({ data, status, onToggle, toggling }: {
    data: any;
    status: "PROBATION" | "PERMANENT";
    onToggle: () => void;
    toggling: boolean;
}) {

    console.log(data);
    
    const { salary, currentPayroll, payrollHistory } = data;

    if (!salary) {
        return (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-400 font-medium">
                No salary configuration found for this position. Set it up in HR → Salary Config.
            </div>
        );
    }

    const volumeAchieved = currentPayroll?.volumeAchieved ?? 0;
    const monthlyTarget = salary.monthlyTarget;
    const incentiveEarned = currentPayroll?.incentiveEarned ?? 0;
    const allowanceEarned = currentPayroll?.allowanceEarned ?? 0;
    const netPay = currentPayroll?.netPay ?? 0;

    const allowanceThreshold = monthlyTarget; // permanent = 100%
    const progressPct = monthlyTarget > 0
        ? Math.min((volumeAchieved / monthlyTarget) * 100, 100)
        : 0;
    const progressColor = progressPct >= 100
        ? "bg-emerald-500"
        : progressPct >= 75
            ? "bg-blue-400"
            : "bg-slate-300";



    return (
        <div className="space-y-4">
            {/* Status badge */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={onToggle} disabled={toggling}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-[11px] font-black uppercase tracking-wider rounded-full transition-all hover:opacity-80 active:scale-95 ${status === "PERMANENT"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}
                >
                    {toggling
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : status === "PERMANENT"
                            ? <CheckCircle2 className="w-3 h-3" />
                            : <Clock className="w-3 h-3" />
                    }
                    {status === "PERMANENT" ? "Permanent" : "Probation"}
                </button>
                {currentPayroll ? (
                    <span className="text-xs text-slate-400 font-medium">
                        Payroll processed for {MONTH_NAMES[currentPayroll.month]} {currentPayroll.year}
                    </span>
                ) : (
                    <span className="text-xs text-slate-400 font-medium">
                        No payroll run yet this month
                    </span>
                )}
            </div>

            {/* Current month performance */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
                        This Month
                    </span>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-1.5">
                        <span className="text-xs font-bold text-slate-500">
                            {fmtM(volumeAchieved)} achieved
                        </span>
                        <span className="text-xs text-slate-400">
                            / {fmtM(monthlyTarget)} target
                        </span>
                    </div>
                    <ProgressBar achieved={volumeAchieved} target={monthlyTarget} color={progressColor} />
                    <p className="text-[10px] text-slate-400 mt-1 text-right">
                        {progressPct.toFixed(1)}%
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <StatPill label="Incentive Target" value={fmt(salary.incentiveAmount)} />
                    <StatPill label="Incentive Earned" value={fmt(incentiveEarned)} highlight={incentiveEarned > 0} />
                    <StatPill label="Allowance Target" value={fmt(salary.allowanceAmount)} />
                    <StatPill label="Allowance Earned" value={fmt(allowanceEarned)} highlight={allowanceEarned > 0} />
                </div>

                {currentPayroll && (
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-medium">Net Pay this month</span>
                        <span className="text-sm font-black text-slate-800">{fmt(netPay)}</span>
                    </div>
                )}
            </div>

            {/* Payroll history — last 6 months */}
            {payrollHistory.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-violet-500" />
                        <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
                            Payroll History
                        </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {payrollHistory.map((p: any) => (
                            <div key={`${p.year}-${p.month}`} className="px-4 py-3 flex items-center justify-between gap-4">
                                <span className="text-xs font-bold text-slate-500 w-20 shrink-0">
                                    {MONTH_NAMES[p.month]} {p.year}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <ProgressBar
                                        achieved={p.volumeAchieved}
                                        target={p.monthlyTarget}
                                        color={p.incentiveHit ? "bg-emerald-400" : p.allowanceHit ? "bg-blue-400" : "bg-slate-300"}
                                    />
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {p.incentiveHit && (
                                        <Award className="w-3.5 h-3.5 text-emerald-500" />
                                    )}
                                    {p.allowanceHit && (
                                        <Car className="w-3.5 h-3.5 text-blue-500" />
                                    )}
                                    <span className="text-xs font-black text-slate-700">{fmt(p.netPay)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function EmployeeStatusSection({
    memberId,
    status,
    onStatusChange,
}: {
    memberId: number;
    status: "PROBATION" | "PERMANENT";
    onStatusChange?: (newStatus: "PROBATION" | "PERMANENT") => void;
}) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);


    useEffect(() => {
        getEmployeePerformance(memberId).then((res) => {
            setData(res);
            setLoading(false);
        });
    }, [memberId]);

    const handleToggle = async () => {
        setToggling(true);
        const res = await toggleEmployeeStatus(memberId, status);
        if (res.success) {
            // triggers parent re-fetch via onStatusChange
            onStatusChange?.(res.newStatus);
        }
        setToggling(false);
    };


    if (loading) return <Loading />

    if (!data) return null;

    return (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 sm:px-6 py-3.5 border-b border-gray-50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" />
                <h2 className="font-black text-gray-800 text-xs uppercase tracking-widest">
                    Employment Status & Performance
                </h2>
            </div>
            <div className="p-4 sm:p-6">
                {data.status === "PROBATION" ? (
                    <ProbationStatus data={data} status={status} onToggle={handleToggle} toggling={toggling} />
                ) : (
                    <PermanentStatus data={data} status={status} onToggle={handleToggle} toggling={toggling} />
                )}
            </div>
        </section>
    );
}