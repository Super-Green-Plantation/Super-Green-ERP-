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
  BarChart2
} from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "../ThemeToggle";

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
  const percentage =
    target > 0 ? Math.round((achieved / target) * 100) : 0;

  const firstName = userName?.split(" ")[0] ?? "there";

  // Loading states
  const isLoading = !isMounted || performance === null;

  return (
    <div className="w-full min-h-screen p-4 sm:p-8 flex flex-col gap-8  dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      {/* Top Navigation */}
      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-6 w-full">
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <ThemeToggle />
        </div>
        <div className="h-8 w-px bg-gray-300 dark:bg-gray-800"></div>
        <div className="flex items-center gap-3">
          <div className="text-right flex flex-col justify-center">
            <span className="text-sm font-semibold leading-tight">{firstName}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{userRole}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400 text-sm font-bold">{firstName[0]}</span>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col gap-8 max-w-300 w-full mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 sm:gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Hello, {firstName}.
            </h1>
            <p className="text-sm font-medium text-[#0f5132] dark:text-[#4ade80] mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 leading-relaxed">
              <span>{MONTH_NAMES[now.getMonth()]} {now.getDate()}, {year} •</span>
              <span className="flex flex-wrap gap-1">
                <span>{userRole}</span>
                {performance?.status && <span>/ {performance.status === "PERMANENT" ? "Permanent" : "Probation"}</span>}
              </span>
            </p>
          </div>
          <button className="bg-[#0f5132] dark:bg-[#166534] hover:bg-[#0b3d25] dark:hover:bg-[#14532d] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm w-fit sm:w-auto">
            <PlusCircle className="w-5 h-5" />
            <span>New Proposal</span>
          </button>
        </div>


        {/* Cards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Volume Achieved Card - spans 3 columns */}
          <div className="lg:col-span-3 bg-[#F4F5F1] dark:bg-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-center justify-between gap-8 sm:gap-6 transition-colors duration-300">
            <div className="flex flex-col items-center sm:items-start gap-4 z-10 text-center sm:text-left">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Volume Achieved</p>
              <div className="flex flex-row items-center sm:items-baseline gap-2">
                <span className="text-7xl sm:text-6xl font-bold text-[#0f5132] dark:text-[#4ade80] leading-none">{formatCurrency(achieved)}</span>
                <span className="text-xl font-semibold text-gray-500 dark:text-gray-400 w-24 sm:w-auto text-left leading-tight">({percentage}% of target)</span>
              </div>

              {target > achieved && (
                <div className="inline-flex items-center gap-1.5 bg-[#f8d7da] dark:bg-red-900/30 text-[#842029] dark:text-red-400 px-4 sm:px-3 py-2 sm:py-1.5 rounded-full text-sm sm:text-xs font-bold w-fit mt-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Remaining {formatCurrency(target - achieved)}
                </div>
              )}
            </div>

            <div className="z-10 bg-[#E8EAE6] dark:bg-gray-800 rounded-2xl p-6 w-full sm:w-64 flex flex-col justify-center gap-4 transition-colors duration-300">
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-[#0f5132] dark:bg-[#22c55e] h-2 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
              </div>
              <p className="text-xs font-medium text-center text-gray-600 dark:text-gray-400">Monthly Progress</p>
            </div>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white dark:bg-gray-800 rounded-full -translate-y-1/2 translate-x-1/4 opacity-40 dark:opacity-20 pointer-events-none"></div>
          </div>

          {/* Probation Progress Card - spans 2 columns */}
          <div className="lg:col-span-2 bg-[#F4F5F1] dark:bg-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Probation Progress</h3>
              <ShieldCheck className="w-6 h-6 text-[#0f5132] dark:text-[#4ade80]" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-500 dark:text-gray-400">Completion</span>
                <span className="text-gray-900 dark:text-gray-100">{performance?.monthInPeriod || 0} / 3 Months</span>
              </div>
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-[#0f5132] dark:bg-[#22c55e] h-2.5 rounded-full" style={{ width: `${Math.min(((performance?.monthInPeriod || 0) / 3) * 100, 100)}%` }}></div>
              </div>
            </div>

            <div className="w-full h-px bg-gray-300 dark:bg-gray-800 my-6"></div>

            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Target Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(performance?.target?.targetAmount || target)}</p>
            </div>
          </div>
        </div>

        {/* My Proposals Section */}
        <div className="mt-4 space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">My Proposals</h3>
            <div className="h-px bg-gray-300 dark:bg-gray-800 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Pending */}
            <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-4 transition-colors duration-300">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-[#e2e3e5] dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-[#41464b] dark:text-gray-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Pending</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">Amount: {formatCurrency(performance?.proposals?.pendingAmount || 0)}</p>
                </div>
              </div>
              <div className="mt-auto pt-2">
                <span className="inline-flex bg-[#e2e3e5] dark:bg-gray-800 text-[#41464b] dark:text-gray-300 px-3 py-1 rounded-full text-xs font-bold">Waiting for review</span>
              </div>
            </div>

            {/* Approved */}
            <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-4 transition-colors duration-300">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-[#d1e7dd] dark:bg-[#064e3b] rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-[#0f5132] dark:text-[#34d399]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Approved</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">Amount: {formatCurrency(performance?.proposals?.approvedAmount || 0)}</p>
                </div>
              </div>
              <div className="mt-auto pt-2">
                <span className="inline-flex bg-[#d1e7dd] dark:bg-[#064e3b] text-[#0f5132] dark:text-[#34d399] px-3 py-1 rounded-full text-xs font-bold">Verified Proposals</span>
              </div>
            </div>

            {/* Rejected */}
            <div className="bg-[#F4F5F1] dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-4 transition-colors duration-300">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-[#f8d7da] dark:bg-[#7f1d1d] rounded-xl flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6 text-[#842029] dark:text-[#f87171]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Rejected</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{performance?.proposals?.rejectedCount === 0 ? "No items found" : `Amount: ${formatCurrency(performance?.proposals?.rejectedCount || 0)}`}</p>
                </div>
              </div>
              <div className="mt-auto pt-2">
                <span className="inline-flex bg-[#f8d7da] dark:bg-[#7f1d1d] text-[#842029] dark:text-[#f87171] px-3 py-1 rounded-full text-xs font-bold">Action required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Client Registrations */}
        <div className="mt-4 bg-[#E8EAE6] dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700 overflow-hidden transition-colors duration-300">
          <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold text-sm sm:text-base">
              <BarChart2 className="w-5 h-5 text-[#0f5132] dark:text-[#4ade80]" />
              Recent Clients
            </div>
          </div>
          <div className="p-6">
            {!performance?.recentClients || performance.recentClients.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No recent client registrations found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-[#F4F5F1] dark:bg-gray-900 rounded-lg">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Client Name</th>
                      <th className="px-4 py-3">Registration Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 rounded-tr-lg">Approval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.recentClients.map((client) => (
                      <tr key={client.id} className="border-b border-gray-300 dark:border-gray-700 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{client.fullName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(client.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${client.status === "Active" ? "bg-[#d1e7dd] dark:bg-[#064e3b] text-[#0f5132] dark:text-[#34d399]" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${client.approvalStatus === "APPROVED" ? "bg-[#d1e7dd] dark:bg-[#064e3b] text-[#0f5132] dark:text-[#34d399]" :
                              client.approvalStatus === "PENDING" ? "bg-[#e2e3e5] dark:bg-gray-700 text-[#41464b] dark:text-gray-300" :
                                "bg-[#f8d7da] dark:bg-[#7f1d1d] text-[#842029] dark:text-[#f87171]"
                            }`}>
                            {client.approvalStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};