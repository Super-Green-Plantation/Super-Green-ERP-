import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, Users, Map, BarChart2 } from "lucide-react";
import { FloatingKpiCard } from "./FloatingKpiCard";
import Heading from "../Heading";

import { MaturityPipeline } from "./MaturityPipeline";
import { useMaturityPipeline } from "@/app/hooks/useMaturityPipeline";
import { IncentiveForecast } from "./IncentiveForecast";
import { useManagerDashboard } from "@/app/hooks/useManagerDashboard";

export const ManagerialView = ({ data, branchId }: any) => {

  const { data: maturityData, isLoading: maturityLoading } = useMaturityPipeline(branchId);
  const { data: managerData } = useManagerDashboard();

  const modules = [
    {
      title: "Client Management",
      tag: `ACTIVE: ${data.totClients}`,
      author: "System",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
      href: "/features/clients"
    },
    {
      title: "Investment",
      tag: `MODULE`,
      author: "Finance",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      href: "/features/investments"
    }
  ];

  return (
    <div className="w-full min-h-screen p-4 sm:p-8 flex flex-col gap-6 sm:gap-8 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col gap-6 w-full mx-auto max-w-350">
        <Heading>
          Manager Dashboard{managerData ? ` — ${managerData.scopeLabel}` : ""}
        </Heading>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <FloatingKpiCard
            icon={<Wallet className="w-5 h-5" />}
            title="Investment Capital"
            value={`Rs. ${((managerData?.investmentTotal ?? 0) / 1000000).toFixed(2)}M`}
            subValue="Assigned scope"
            trend="up"
            trendValue={managerData?.momTrend != null ? `${managerData.momTrend > 0 ? '+' : ''}${managerData.momTrend}%` : "No prior month data"}
          />
          <FloatingKpiCard
            icon={<Users className="w-5 h-5" />}
            title="Active Participants"
            value={(managerData?.clientCount ?? 0).toLocaleString()}
            subValue="Clients in scope"
            trend="up"
            trendValue="Current assignment"
          />
          <FloatingKpiCard
            icon={<Map className="w-5 h-5" />}
            title="Team Members"
            value={(managerData?.staffCount ?? 0).toLocaleString()}
            subValue="Staff in scope"
            trend="neutral"
            trendValue="Stable"
          />
          <FloatingKpiCard
            icon={<BarChart2 className="w-5 h-5" />}
            title="Efficiency Rate"
            value={`${managerData?.percentage ?? 0}%`}
            subValue="This month against target"
            trend={(managerData?.percentage ?? 0) >= 50 ? "up" : "neutral"}
            trendValue={`Rs. ${((managerData?.currentMonthInvestment ?? 0) / 1000000).toFixed(1)}M / ${((managerData?.target ?? 0) / 1000000).toFixed(1)}M`}
          />
        </div>

        {/* Maturity Pipeline & Incentive Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {maturityLoading || !maturityData ? (
             <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center min-h-87.5">
                <span className="text-xs text-gray-400">Loading pipeline...</span>
             </div>
          ) : (
            <MaturityPipeline investments={maturityData} />
          )}
          <IncentiveForecast branchId={branchId} />
        </div>

        {/* Quick Access Section */}
        <div className="mt-2">
          <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Quick Access</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {modules.map((mod, idx) => (
              <Link key={idx} href={mod.href} className="group relative h-36 sm:h-44 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all block">
                <img src={mod.image} alt={mod.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-linear-to-t from-[#0f5132]/90 via-[#0f5132]/40 to-transparent dark:from-black/90 dark:via-black/40"></div>
                <div className="absolute bottom-5 left-5 right-5">
                  <h4 className="text-white font-bold text-lg sm:text-xl leading-tight tracking-tight drop-shadow-md">{mod.title}</h4>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
