"use client";

import { getEmployeePerformance } from "@/app/features/branches/employees/[branchId]/[empId]/getEmployeePerfomance";
import {
  Bell,
  CheckCircle,
  Clock,
  PlusCircle,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  TrendingUp,
  User,
  Target,
  FileText
} from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "../ThemeToggle";

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-LK", {
    maximumFractionDigits: 0,
  }).format(amount);
};

const getRelativeTime = (dateInput: Date | string) => {
  const date = new Date(dateInput);
  const diffMs = new Date().getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${Math.max(1, diffMins)}h ago`; // Fallback to hours or mins
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

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
    partialThresholdPct: number;
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
  goal?: {
    achieved: number;
    target: number;
    incentiveHit: boolean;
    allowanceHit: boolean;
  };
  recentClients?: Array<{
    id: number;
    fullName: string;
    createdAt: Date;
    status: string;
    approvalStatus: string;
  }>;
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

  const [performance, setPerformance] = useState<EmployeePerformance | null>(null);

  useEffect(() => {
    if (!memberId) return;
    getEmployeePerformance(memberId, year, month).then(setPerformance);
  }, [memberId, year, month]);

  const achieved = performance?.goal?.achieved ?? 0;
  const target = performance?.goal?.target ?? 0;
  const percentage = target > 0 ? Math.round((achieved / target) * 100) : 0;
  const firstName = userName?.split(" ")[0] ?? "there";

  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).toUpperCase();

  // Draw semi-circular gauge arc SVG path
  const renderGaugeArc = (pctValue: number) => {
    const strokeWidth = 8;
    const radius = 35;
    const circumference = Math.PI * radius; // semi-circle arc length
    const clampedPct = Math.min(Math.max(pctValue / 100, 0), 1);
    const strokeDashoffset = circumference - clampedPct * circumference;

    return (
      <div className="relative flex flex-col items-center justify-center w-full h-28 mt-2">
        <svg className="w-40 h-20" viewBox="0 0 100 50">
          <path
            d="M 15 48 A 35 35 0 0 1 85 48"
            fill="none"
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-800"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d="M 15 48 A 35 35 0 0 1 85 48"
            fill="none"
            stroke="currentColor"
            className="text-[#0f5132] dark:text-[#4ade80] transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute bottom-1 text-center">
          <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
            {pctValue}%
          </span>
        </div>
      </div>
    );
  };

  // Generate monthly trend using actual client registration counts grouped by week of the current month (Weeks 1-4)
  const getWeeklyMonthlyTrendData = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const weekLabels = ["WEEK 1", "WEEK 2", "WEEK 3", "WEEK 4"];
    const counts = [0, 0, 0, 0];

    if (performance?.recentClients) {
      performance.recentClients.forEach((client) => {
        const clientDate = new Date(client.createdAt);
        if (clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear) {
          const dateNum = clientDate.getDate();
          if (dateNum <= 7) {
            counts[0] += 1;
          } else if (dateNum <= 14) {
            counts[1] += 1;
          } else if (dateNum <= 21) {
            counts[2] += 1;
          } else {
            counts[3] += 1;
          }
        }
      });
    }

    const maxCount = Math.max(...counts, 1);

    return weekLabels.map((label, idx) => {
      const pct = (counts[idx] / maxCount) * 100;
      const barHeight = counts[idx] > 0 ? `${Math.max(pct, 10)}%` : "0%";
      return {
        label,
        height: barHeight,
        count: counts[idx],
      };
    });
  };

  const monthlyTrend = getWeeklyMonthlyTrendData();

  if (!isMounted || performance === null) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#FAFBF9]  text-gray-900 dark:text-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0f5132] dark:border-[#4ade80]"></div>
          <p className="text-sm font-medium animate-pulse">Loading overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen  text-gray-900 dark:text-gray-100 font-sans pb-12 transition-colors duration-300">

      {/* Top Header bar */}
      <div className="sticky top-0 z-50 backdrop-blur-md  border-b border-gray-100 dark:border-gray-900/50 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8EAE6] dark:bg-gray-800 overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-inner">
            <span className="text-[#0f5132] dark:text-[#4ade80] text-base font-extrabold">{firstName[0]}</span>
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Performance Insight
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500"></span>
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto px-4 sm:px-6 mt-6 flex flex-col gap-6">

        {/* Title and date overview */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-widest text-[#0f5132] dark:text-[#4ade80]">
            {formattedDate}
          </span>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              Employee Overview
            </h1>
            <div className="flex items-center gap-2 bg-[#d1e7dd] dark:bg-[#064e3b]/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0f5132] dark:text-[#4ade80] shadow-sm">
              <TrendingUp className="w-4 h-4" />
              <span>+{percentage}% vs target</span>
            </div>
          </div>
        </div>

        {/* Action Bar (New Proposal) */}
        <div className="md:flex items-center justify-between gap-4">

          <div className="flex items-center justify-between gap-4 bg-[#F4F5F1] dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Role</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{userRole} • {performance.status === "PERMANENT" ? "Permanent" : "Probation"}</span>
            </div>
          </div>
          <button className="bg-[#0f5132] dark:bg-[#166534] hover:bg-[#0b3d25] dark:hover:bg-[#14532d] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm">
            <PlusCircle className="w-4.5 h-4.5" />
            <span className="text-xs">New Proposal</span>
          </button>
        </div>




        {/* Row 1: Yearly Performance & Monthly Target */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Yearly Performance / Volume Achieved Card */}
          <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 relative group flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                YEARLY PERFORMANCE
              </span>
              <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>

            {renderGaugeArc(percentage)}

            <div className="text-center mt-3">
              <p className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                {formatCurrency(achieved)}
              </p>
              <p className="text-xs font-extrabold text-[#0f5132] dark:text-[#4ade80] uppercase tracking-wider mt-1">
                {percentage}% OF TARGET
              </p>
            </div>
          </div>

          {/* Monthly Target / Monthly Progress */}
          <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 relative group flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                MONTHLY TARGET
              </span>
              <Target className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>

            {renderGaugeArc(percentage)}

            <div className="text-center mt-3">
              <p className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                {percentage}%
              </p>
              <p className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
                {target > achieved
                  ? `${100 - Math.min(percentage, 100)}% TO GOAL (${formatCurrency(target - achieved)} Lacking)`
                  : "GOAL ACHIEVED 🎉"}
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Status Cards (Accepted, Pending, Rejected) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Accepted badge */}
          <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 border-l-4 border-l-[#0f5132] dark:border-l-[#4ade80] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ACCEPTED</p>
              <p className="text-3xl font-black text-[#0f5132] dark:text-[#4ade80] mt-1">
                {performance?.proposals?.approvedCount ?? 0}
              </p>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                {formatCurrency(performance?.proposals?.approvedAmount ?? 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#d1e7dd] dark:bg-[#064e3b]/80 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#0f5132] dark:text-[#4ade80]" />
            </div>
          </div>

          {/* Pending badge */}
          <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 border-l-4 border-l-[#e2e3e5] dark:border-l-gray-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">PENDING</p>
              <p className="text-3xl font-black text-gray-800 dark:text-gray-200 mt-1">
                {performance?.proposals?.pendingCount ?? 0}
              </p>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                {formatCurrency(performance?.proposals?.pendingAmount ?? 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          {/* Rejected badge */}
          <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 border-l-4 border-l-[#f8d7da] dark:border-l-red-500 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">REJECTED</p>
              <p className="text-3xl font-black text-red-600 dark:text-red-400 mt-1">
                {performance?.proposals?.rejectedCount ?? 0}
              </p>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                Action Required
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f8d7da] dark:bg-red-950/50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Row 3: Monthly Trend Bar Chart */}
        <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              MONTHLY TREND (CLIENT REGISTRATIONS)
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 h-44 px-2 pt-4">
            {monthlyTrend.map((data, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-[#E8EAE6]/50 dark:bg-gray-800/50 rounded-t-lg h-36 flex items-end overflow-hidden relative">
                  <div
                    style={{ height: data.height }}
                    className="w-full bg-gradient-to-t from-[#0f5132]/30 to-[#0f5132] dark:from-[#4ade80]/20 dark:to-[#4ade80] rounded-t-md transition-all duration-700 ease-out group-hover:opacity-85"
                  ></div>
                  {data.count > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 dark:bg-white/5 pointer-events-none">
                      <span className="text-[10px] font-bold bg-[#0f5132] dark:bg-[#4ade80] text-white dark:text-gray-900 px-1.5 py-0.5 rounded shadow">
                        {data.count}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 mt-2 uppercase">
                  {data.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 4: Client Activity list */}
        <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              CLIENT ACTIVITY
            </span>
            <button className="text-xs font-extrabold text-[#0f5132] dark:text-[#4ade80] uppercase hover:underline transition-all">
              VIEW LOGS
            </button>
          </div>

          {!performance?.recentClients || performance.recentClients.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic py-4 text-center">
              No recent client registrations found.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {performance.recentClients.slice(0, 3).map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3.5 bg-[#FAFBF9] dark:bg-gray-950 rounded-xl border border-gray-200/60 dark:border-gray-800/60 hover:scale-[1.005] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#E8EAE6] dark:bg-gray-800 flex items-center justify-center">
                      <User className="w-4.5 h-4.5 text-[#0f5132] dark:text-[#4ade80]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {client.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {client.approvalStatus} • {client.status}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    {getRelativeTime(client.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};