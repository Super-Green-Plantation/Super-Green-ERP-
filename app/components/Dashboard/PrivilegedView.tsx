import { getClientRegistrationByBranch } from "@/app/features/dashboard/analytics";
import { useEffect, useState } from "react";
import { ThemeToggle } from "../ThemeToggle";
import { UserAvatar } from "./UserAvatar";
import Link from "next/link";
import { Bell, Wallet, Users, Map, BarChart2 } from "lucide-react";
import { ClientRegistrationChart } from "@/app/features/dashboard/chart";
import { FloatingKpiCard } from "./FloatingKpiCard";

type ClientRegChartData = {
  year: number;
  month: number;
  days: string[];
  branches: {
    branchId: number;
    branchName: string;
    daily: number[];
    dailyAmount: number[];
    total: number;
    totalAmount: number;
  }[];
};

export const PrivilegedView = ({ data, userName, userRole, achieved, target, percentage, isMounted }: any) => {

  const [chartData, setChartData] = useState<ClientRegChartData | null>(null);

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
    },
    {
      title: "Payroll & HR",
      tag: `STAFF: ${data.totMembers}`,
      author: "HR",
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
      href: "/features/hr/payroll"
    }
  ];

  const fetchChartData = async () => {
    const result = await getClientRegistrationByBranch();
    setChartData(result);
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  return (
    <div className="w-full min-h-screen p-4 sm:p-8 flex flex-col gap-6 sm:gap-8  font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full mb-2 sm:mb-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button className="text-[#0f5132] dark:text-[#4ade80] hover:text-green-800 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <ThemeToggle />
        </div>
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-800 hidden sm:block"></div>
        <div className="flex items-center gap-3">
          <div className="text-right flex flex-col justify-center">
            <span className="text-sm font-bold leading-none text-gray-900 dark:text-gray-100">{userName}</span>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">{userRole}</span>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
            <UserAvatar seed={userName} className="w-full h-full" />
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col gap-6 w-full mx-auto max-w-350">
        
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <FloatingKpiCard
            icon={<Wallet className="w-5 h-5" />}
            title="Investment Capital"
            value={`Rs. ${(Math.floor(achieved / 10000) / 100).toFixed(2)}M`}
            subValue="Real-time aggregation"
            trend="up"
            trendValue="~+2.4%"
          />
          <FloatingKpiCard
            icon={<Users className="w-5 h-5" />}
            title="Active Participants"
            value={data.totClients.toLocaleString()}
            subValue="Verified investors"
            trend="up"
            trendValue="+5"
          />
          <FloatingKpiCard
            icon={<Map className="w-5 h-5" />}
            title="Branch Network"
            value={data.totMembers.toLocaleString()}
            subValue="Island wide staff"
            trend="neutral"
            trendValue="Stable"
          />
          <FloatingKpiCard
            icon={<BarChart2 className="w-5 h-5" />}
            title="Efficiency Rate"
            value="16%"
            subValue="Overall performance target"
            trend="neutral"
          />
        </div>

        {/* Middle Section: Chart and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col min-h-87.5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Branch Registrations</h2>
              
            </div>
            <div className="flex-1 w-full">
              {chartData ? (
                <ClientRegistrationChart initialData={chartData} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span className="text-xs text-gray-400">Loading chart...</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-87.5">
            <div className="flex justify-between items-center p-5 px-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">Recent Activity</h2>
              <Link href="#" className="text-[10px] font-bold text-[#0f5132] dark:text-[#4ade80] uppercase tracking-wider hover:underline">View All</Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              {data.recentInvestments?.slice(0, 5).map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between p-4 px-6 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#f0f9f4] dark:bg-[#064e3b] flex items-center justify-center shrink-0 border border-green-100 dark:border-green-900">
                      <UserAvatar seed={inv.client?.fullName || "User"} className="w-5 h-5 opacity-80 mix-blend-luminosity" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate max-w-35 sm:max-w-50 lg:max-w-30 xl:max-w-45">{inv.client?.fullName}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{isMounted ? new Date(inv.investmentDate).toLocaleDateString() : ""} • {isMounted ? new Date(inv.investmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col shrink-0">
                    <span className="text-sm font-bold text-[#0f5132] dark:text-[#4ade80] whitespace-nowrap">Rs. {isMounted ? inv.amount.toLocaleString() : inv.amount}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-tighter truncate max-w-20">FA: {inv.advisor?.nameWithInitials?.split(' ')[0] || "Unassigned"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
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