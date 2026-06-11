"use client";

import { getEmployeePerformance } from "@/app/features/branches/employees/[branchId]/[empId]/getEmployeePerfomance";
import { getEmployeeMonthlyGoal } from "@/app/features/employees/actions";
import {
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { PWAInstallButton } from "../Buttons/PWAInstallButton";
import { ThemeToggle } from "../ThemeToggle";
import { AchievementBadges } from "./AchievementBadges";
import { FooterCTA } from "./FooterCTA";
import { NetPay } from "./NetPay";
import { ProgressBar } from "./ProgressBar";
import { StatCard } from "./StatCard";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-LK", {
    maximumFractionDigits: 0,
  }).format(amount);
};

interface EmployeeGoal {
  achieved: number;
  target: number;
  percentage: number;
  incentiveHit: boolean;
  allowanceHit: boolean;
}

interface EmployeePerformance {
  status: "PROBATION" | "PERMANENT";
  probationStartDate?: string | null;
  monthsElapsed?: number;
  periodNumber?: number;
  monthInPeriod?: number;
  target?: {
    id: number;
    positionId: number;
    periodNumber: number;
    monthNumber: number;
    targetAmount: number;
    bonusAmount: number;
    excessRate: number;
    partialBonus: number;
    partialThreshold: number;
    bonusThresholdPct: number;
    minActiveAdvisors: number;
    minActiveBMs: number;
    minActiveFMs: number;
    teamActiveAmount: number;
    teamActiveThresholdPct: number;
    vehicleAmount: number;
    vehicleThresholdPct: number;
    after6MonthTarget: number;
  } | null;
  evaluation?: any;
  salary?: any | null;
  currentPayroll?: {
    volumeAchieved: number;
    monthlyTarget: number;
    incentiveHit: boolean;
    allowanceHit: boolean;
    netPay: number;
    year: number;
    month: number;
  } | null;
  payrollHistory?: Array<{
    volumeAchieved: number;
    monthlyTarget: number;
    incentiveHit: boolean;
    allowanceHit: boolean;
    netPay: number;
    year: number;
    month: number;
  }>;
  proposals?: {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    approvedAmount: number;
    pendingAmount: number;
  };
}

interface RestrictedViewProps {
  userName: string | null | undefined;
  userRole: string | null | undefined;
  isMounted: boolean;
  memberId: number | null | undefined;
}

export const RestrictedView = ({
  userName,
  userRole,
  isMounted,
  memberId,
}: RestrictedViewProps) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [goal, setGoal] = useState<EmployeeGoal | null>(null);
  const [performance, setPerformance] = useState<EmployeePerformance | null>(null);

  useEffect(() => {
    if (!memberId) return;
    Promise.all([
      getEmployeeMonthlyGoal(memberId, year, month),
      getEmployeePerformance(memberId, year, month),
    ]).then(([g, p]) => {
      setGoal(g);
      setPerformance(p);
    });
  }, [memberId, year, month]);

  const achieved = goal?.achieved ?? 0;
  const target = goal?.target ?? 0;
  const percentage =
    target > 0 ? Math.round((achieved / target) * 100) : 0;

  const firstName = userName?.split(" ")[0] ?? "there";

  // Loading states
  const isLoading = !isMounted || goal === null || performance === null;

  return (
    <div className="max-w-2xl mx-auto min-h-screen p-4 sm:p-8 flex flex-col gap-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <PWAInstallButton />
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Hello, <span className="text-primary">{firstName}</span>.
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            {MONTH_NAMES[now.getMonth()]} {year} · {userRole}
          </p>

          {/* Employee Status Badge */}
          {performance && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              performance.status === "PERMANENT"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-blue-100 text-blue-800"
            }`}
            >
              {performance.status === "PERMANENT" ? "Permanent" : "Probation"}
            </span>
          )}
        </div>

        {/* Employee Performance Section */}
        {!isLoading && performance && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Salary Info (for permanent employees) */}
              {performance.status === "PERMANENT" && performance.salary && (
                <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-[2rem] p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <span className="text-emerald-500">💰</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Salary</p>
                      <p className="text-lg font-black text-foreground">
                        {formatCurrency(
                          (performance.salary.basic ?? 0) +
                          (performance.salary.allowances ?? 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Probation Progress (for probation employees) */}
              {performance.status === "PROBATION" && (
                <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-[2rem] p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <span className="text-blue-500">🎯</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Probation Progress</p>
                      <div className="flex items-baseline space-x-1">
                        <p className="text-black font-bold">
                          {performance.monthInPeriod}/3
                        </p>
                        <span className="text-xs text-muted-foreground">months in period</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar for probation period */}
                  {performance.monthInPeriod !== undefined && (
                    <div className="mt-2 w-full bg-muted/30 rounded-full h-1.5">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min((performance.monthInPeriod / 3) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Current Payroll Summary */}
              {performance.currentPayroll && (
                <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-[2rem] p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <span className="text-amber-500">📊</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Current Month</p>
                      <p className="text-lg font-black text-foreground">
                        {formatCurrency(performance.currentPayroll.netPay ?? 0)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Net Pay • {performance.currentPayroll.month} / {performance.currentPayroll.year}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Proposals */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            My proposals this month
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {/* Pending */}
            <StatCard
              icon={<Clock className="w-4 h-4 text-amber-500" />}
              label="Pending"
              value={isLoading ? "—" : performance?.proposals?.pendingCount}
              amountFormatted={isLoading ? "—" : formatCurrency(performance?.proposals?.pendingAmount ?? 0)}
              amountLabel="Amount"
              color="amber"
            />

            {/* Approved */}
            <StatCard
              icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
              label="Approved"
              value={isLoading ? "—" : performance?.proposals?.approvedCount}
              amountFormatted={isLoading ? "—" : formatCurrency(performance?.proposals?.approvedAmount ?? 0)}
              amountLabel="Amount"
              color="emerald"
            />

            {/* Rejected */}
            <StatCard
              icon={<XCircle className="w-4 h-4 text-red-500" />}
              label="Rejected"
              value={isLoading ? "—" : performance?.proposals?.rejectedCount}
              color="red"
            />
          </div>
        </div>

        {/* Volume progress */}
        <ProgressBar
          achieved={achieved}
          target={target}
          percentage={percentage}
          isMounted={isMounted}
          formatCurrency={formatCurrency}
        />

        {/* Incentive / allowance badges */}
        <AchievementBadges
          incentiveHit={isLoading ? false : goal?.incentiveHit ?? false}
          allowanceHit={isLoading ? false : goal?.allowanceHit ?? false}
        />

        {/* No payroll record yet */}
        {!goal && isMounted && (
          <p className="text-xs text-muted-foreground font-medium italic">
            No payroll record for this month yet.
          </p>
        )}

        {/* Net pay — only show if processed */}
        <NetPay netPay={isLoading ? 0 : performance?.currentPayroll?.netPay ?? 0} isMounted={isMounted} formatCurrency={formatCurrency} />

        {/* Footer CTA */}
        <FooterCTA userName={userName} />
      </div>
    </div>
  );
};