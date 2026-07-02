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
import { getEmployeeProposalStats } from "@/app/features/dashboard/getEmployeeProposalStats";
import { getRecentMonthOptions } from "@/lib/monthOptions";

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

  if (diffMins < 60) return `${Math.max(1, diffMins)}h ago`;
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

  const monthOptions = getRecentMonthOptions(12);
  type Period = { year: number; month: number } | "all";

  const [selectedPeriod, setSelectedPeriod] = useState<Period>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const [performance, setPerformance] = useState<EmployeePerformance | null>(null);
  const [proposalStats, setProposalStats] = useState<any>(null);

  useEffect(() => {
    if (!memberId) return;
    const [y, m] = selectedPeriod === "all" ? [null, null] : [selectedPeriod.year, selectedPeriod.month];
    getEmployeePerformance(memberId, y, m).then(setPerformance);
    getEmployeeProposalStats(memberId, y, m).then(setProposalStats);
  }, [memberId, selectedPeriod]);

  const achieved = performance?.goal?.achieved ?? 0;
  const target = performance?.goal?.target ?? 0;
  const percentage = target > 0 ? Math.round((achieved / target) * 100) : 0;
  const firstName = userName?.split(" ")[0] ?? "there";

  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).toUpperCase();

  // Draw semi-circular gauge arc SVG path - Adjusted for extreme mobile efficiency
  const renderGaugeArc = (pctValue: number) => {
    const strokeWidth = 8;
    const radius = 35;
    const circumference = Math.PI * radius;
    const clampedPct = Math.min(Math.max(pctValue / 100, 0), 1);
    const strokeDashoffset = circumference - clampedPct * circumference;

    return (
      <div className="relative flex flex-col items-center justify-center w-full h-20 sm:h-28 mt-1 sm:mt-2">
        <svg className="w-32 h-16 sm:w-40 sm:h-20" viewBox="0 0 100 50">
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
        <div className="absolute bottom-0 sm:bottom-1 text-center">
          <span className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100">
            {pctValue}%
          </span>
        </div>
      </div>
    );
  };

  const getWeeklyMonthlyTrendData = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const weekLabels = ["W1", "W2", "W3", "W4"];
    const counts = [0, 0, 0, 0];

    if (performance?.recentClients) {
      performance.recentClients.forEach((client) => {
        const clientDate = new Date(client.createdAt);
        if (clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear) {
          const dateNum = clientDate.getDate();
          if (dateNum <= 7) counts[0] += 1;
          else if (dateNum <= 14) counts[1] += 1;
          else if (dateNum <= 21) counts[2] += 1;
          else counts[3] += 1;
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
      <div className="w-full min-h-screen flex items-center justify-center bg-[#FAFBF9] text-gray-900 dark:text-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0f5132] dark:border-[#4ade80]"></div>
          <p className="text-sm font-medium animate-pulse">Loading overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen text-gray-900 dark:text-gray-100 font-sans pb-6 sm:pb-12 transition-colors duration-300">
      
      {/* Top Header bar - Reduced padding on mobile */}
      <div className="sticky top-0 z-20 backdrop-blur-md border-b border-gray-100 dark:border-gray-900/50 px-3 sm:px-8 py-2.5 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#E8EAE6] dark:bg-gray-800 overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-inner">
            <span className="text-[#0f5132] dark:text-[#4ade80] text-sm sm:text-base font-extrabold">{firstName[0]}</span>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Performance Insight
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400 transition-colors">
            <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500"></span>
          </button>
          {/* <ThemeToggle /> */}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto px-3 sm:px-6 mt-3 sm:mt-6 flex flex-col gap-4 sm:gap-6">

        {/* Title and date overview */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-bold tracking-widest text-[#0f5132] dark:text-[#4ade80]">
            {formattedDate}
          </span>
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              Employee Overview
            </h1>
            <div className="flex items-center gap-1 bg-[#d1e7dd] dark:bg-[#064e3b]/80 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold text-[#0f5132] dark:text-[#4ade80] shadow-sm shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{percentage}%</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-2">
          <button className="bg-[#0f5132] dark:bg-[#166534] hover:bg-[#0b3d25] dark:hover:bg-[#14532d] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-[0.98] shadow-sm">
            <span>New Proposal</span>
          </button>

          <select
            value={selectedPeriod === "all" ? "all" : `${selectedPeriod.year}-${selectedPeriod.month}`}
            onChange={(e) => {
              if (e.target.value === "all") {
                setSelectedPeriod("all");
              } else {
                const [year, month] = e.target.value.split("-").map(Number);
                setSelectedPeriod({ year, month });
              }
            }}
            className="text-[11px] sm:text-xs font-semibold bg-[#F4F5F1] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md sm:rounded-lg px-2 py-1.5"
          >
            <option value="all">All Time</option>
            {monthOptions.map((opt) => (
              <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Row 1: Performance Gauges Side-by-side or stacked cleanly */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6">
          {/* Yearly Performance Card */}
          <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                YEARLY PERF.
              </span>
              <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 hidden sm:block" />
            </div>
            {renderGaugeArc(percentage)}
            <div className="text-center mt-1 sm:mt-3">
              <p className="text-sm sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                {formatCurrency(achieved)}
              </p>
              <p className="text-[9px] sm:text-xs font-extrabold text-[#0f5132] dark:text-[#4ade80] uppercase mt-0.5">
                {percentage}% OF TARGET
              </p>
            </div>
          </div>

          {/* Monthly Target Card */}
          <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                MONTHLY GOAL
              </span>
              <Target className="w-4 h-4 text-gray-400 dark:text-gray-500 hidden sm:block" />
            </div>
            {renderGaugeArc(percentage)}
            <div className="text-center mt-1 sm:mt-3">
              <p className="text-sm sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                {percentage}%
              </p>
              <p className="text-[9px] sm:text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase mt-0.5 truncate max-w-full">
                {target > achieved ? `Lacking ${formatCurrency(target - achieved)}` : "ACHIEVED 🎉"}
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Tight 3-column Grid on Mobile to prevent massive stacking */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* Accepted badge */}
          <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-xl p-2 sm:p-4 border border-gray-200 dark:border-gray-800 border-l-2 sm:border-l-4 border-l-[#0f5132] dark:border-l-[#4ade80] shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[9px] sm:text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase">ACC.</p>
              <p className="text-base sm:text-3xl font-black text-[#0f5132] dark:text-[#4ade80] leading-none my-1">
                {proposalStats?.approvedCount ?? 0}
              </p>
              <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate">
                {formatCurrency(proposalStats?.approvedAmount ?? 0)}
              </p>
            </div>
            <CheckCircle className="w-4 h-4 text-[#0f5132] dark:text-[#4ade80] hidden sm:block shrink-0 ml-2" />
          </div>

          {/* Pending badge */}
          <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-xl p-2 sm:p-4 border border-gray-200 dark:border-gray-800 border-l-2 sm:border-l-4 border-l-[#e2e3e5] dark:border-l-gray-700 shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[9px] sm:text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase">PEND.</p>
              <p className="text-base sm:text-3xl font-black text-gray-800 dark:text-gray-200 leading-none my-1">
                {proposalStats?.pendingCount ?? 0}
              </p>
              <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate">
                {formatCurrency(proposalStats?.pendingAmount ?? 0)}
              </p>
            </div>
            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 hidden sm:block shrink-0 ml-2" />
          </div>

          {/* Rejected badge */}
          <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-xl p-2 sm:p-4 border border-gray-200 dark:border-gray-800 border-l-2 sm:border-l-4 border-l-[#f8d7da] dark:border-l-red-500 shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[9px] sm:text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase">REJ.</p>
              <p className="text-base sm:text-3xl font-black text-red-600 dark:text-red-400 leading-none my-1">
                {proposalStats?.rejectedCount ?? 0}
              </p>
              <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate">
                Action Req.
              </p>
            </div>
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 hidden sm:block shrink-0 ml-2" />
          </div>
        </div>

        {/* Row 3: Monthly Trend Chart - Shrunk height on mobile */}
        <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="mb-3 sm:mb-6">
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              MONTHLY TREND
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 h-24 sm:h-44 px-1 pt-2">
            {monthlyTrend.map((data, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-[#E8EAE6]/50 dark:bg-gray-800/50 rounded-t-md h-16 sm:h-36 flex items-end overflow-hidden relative">
                  <div
                    style={{ height: data.height }}
                    className="w-full bg-linear-to-t from-[#0f5132]/30 to-[#0f5132] dark:from-[#4ade80]/20 dark:to-[#4ade80] rounded-t-sm sm:rounded-t-md transition-all duration-700 ease-out"
                  ></div>
                  {data.count > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center sm:opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 dark:bg-white/5 pointer-events-none">
                      <span className="text-[8px] sm:text-[10px] font-bold bg-[#0f5132] dark:bg-[#4ade80] text-white dark:text-gray-900 px-1 py-0.5 rounded">
                        {data.count}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[8px] sm:text-[10px] font-extrabold text-gray-500 dark:text-gray-400 mt-1 uppercase">
                  {data.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 4: Client Activity list - Tighter rows */}
        <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-2.5 sm:mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              CLIENT ACTIVITY
            </span>
            <button className="text-[10px] sm:text-xs font-extrabold text-[#0f5132] dark:text-[#4ade80] uppercase hover:underline transition-all">
              LOGS
            </button>
          </div>

          {!performance?.recentClients || performance.recentClients.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic py-2 text-center">
              No recent activity.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {performance.recentClients.slice(0, 3).map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-2 sm:p-3.5 bg-[#FAFBF9] dark:bg-gray-950 rounded-lg sm:rounded-xl border border-gray-200/60 dark:border-gray-800/60"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#E8EAE6] dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-[#0f5132] dark:text-[#4ade80]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        {client.fullName}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                        {client.approvalStatus} • {client.status}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium shrink-0 ml-2">
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