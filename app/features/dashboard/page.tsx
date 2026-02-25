"use client";
import Error from "@/app/components/Error";
import InvestmentTable from "@/app/components/InvestmentTable";
import Loading from "@/app/components/Loading";
import { StatCard } from "@/app/components/StatCard";
import { useDashboard } from "@/app/hooks/useDashboard";
import { Briefcase, MapPin, TrendingUp, Users } from "lucide-react";

const DashboardPage =  () => {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <Loading />;

  if (isError) return <Error />;
  if (!data) {
    return null;
  }

  


  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
      {/* 1. Main Page Header */}
      <header className="mb-10 px-2 ">
        <h1 className="text-4xl font-semibold text-slate-900 tracking-tighter">
          Dashboard<span className="text-blue-600">.</span>
        </h1>
      </header>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Investment Card */}
        <StatCard
          label="Investment Sum"
          value={`Rs. ${data.investmentSum._sum.amount?.toLocaleString() || 0}`}
          subText={`Profit: Rs. ${data.totProfit._sum.totalProfit?.toLocaleString() || 0}`}
          icon={<TrendingUp size={20} />}
          color="emerald"
        />

        {/* Clients Card */}
        <StatCard
          label="Total Clients"
          value={data.totClients.toString()}
          subText="Active Accounts"
          icon={<Users size={20} />}
          color="blue"
        />

        {/* Staff Card */}
        <StatCard
          label="Staff Count"
          value={data.totMembers.toString()}
          subText={`Payout: Rs. ${data.totCommissionPayout._sum.commissionPayout?.toLocaleString() || 0}`}
          icon={<Briefcase size={20} />}
          color="purple"
        />

        {/* Branches Card */}
        <StatCard
          label="Branches"
          value={data.totBranchs.toString()}
          subText="Island-wide"
          icon={<MapPin size={20} />}
          color="orange"
        />
      </div>

      {/* 3. Table Header Section */}
      <section className="mt-16 mb-8 px-2">
        <div className="flex items-end justify-between border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-2xl text-slate-900 tracking-tight uppercase">
              Investments
            </h2>
            <p className="mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
              Capital Contribution Ledger
            </p>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                System Status
              </p>
              <p className="text-xs font-bold text-emerald-500 flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Syncing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Table Component */}
      <div className="px-1">
        <InvestmentTable investments={data} />
      </div>
    </div>
  );
};

export default DashboardPage;
