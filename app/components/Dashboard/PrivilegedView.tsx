import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BarChart2, BriefcaseBusiness, CalendarDays, ChevronRight, Map, Users, Wallet } from "lucide-react";
import { ClientRegistrationChart } from "@/app/features/dashboard/chart";
import { FloatingKpiCard } from "./FloatingKpiCard";
import { MaturityPipeline } from "./MaturityPipeline";
import { useMaturityPipeline } from "@/app/hooks/useMaturityPipeline";
import { BranchKpiTable } from "./BranchKpiTable";
import { CommissionLeaderboard } from "./CommissionLeaderboard";
import { IncentiveForecast } from "./IncentiveForecast";
import { PayrollBreakdown } from "./PayrollBreakdown";
import { UserAvatar } from "./UserAvatar";

export const PrivilegedView = ({ data, userName, userRole, achieved, achievement, target, percentage, isMounted }: any) => {
  const { data: maturityData, isLoading: maturityLoading } = useMaturityPipeline();
  const [period] = useState("This year");
  const firstName = (userName || "there").split(" ")[0];

  const modules = [
    { title: "Client management", description: `${data.totClients ?? 0} active records`, icon: Users, href: "/features/clients", color: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300" },
    { title: "Investment portfolio", description: "Review performance", icon: BriefcaseBusiness, href: "/features/investments", color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" },
    { title: "People & payroll", description: `${data.totMembers ?? 0} team members`, icon: Wallet, href: "/features/hr/payroll", color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300" },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-6 px-4 pb-10 pt-5 sm:px-7 sm:pt-8">
      <div className="flex flex-col gap-5 rounded-3xl border border-primary/10 bg-gradient-to-br from-[#5556d6] via-[#6768df] to-[#8788ef] p-6 text-white shadow-[0_18px_45px_rgba(91,92,226,0.22)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/65"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Live workspace</div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[30px]">Good morning, {firstName}</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-white/70">Stay on top of your organization&apos;s performance, clients, and team activity from one calm, connected workspace.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:min-w-[190px]">
          <div className="h-11 w-11 overflow-hidden rounded-xl border border-white/20 bg-white/20"><UserAvatar seed={userName || "user"} className="h-full w-full" /></div>
          <div><p className="text-xs font-bold text-white">{userName || "Administrator"}</p><p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/60">{userRole || "Admin"}</p></div>
        </div>
      </div>

      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-3 flex items-center justify-between"><div><p className="saas-eyebrow">Overview</p><h2 className="mt-1 text-lg">Business at a glance</h2></div><div className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-semibold text-muted-foreground sm:flex"><CalendarDays size={14} /> {period}</div></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FloatingKpiCard icon={<Wallet className="h-4 w-4" />} title="Investment capital" value={`Rs. ${(Math.floor(achieved / 10000) / 100).toFixed(2)}M`} subValue="Real-time aggregation" trend="up" trendValue={data.momTrend ? `${data.momTrend > 0 ? "+" : ""}${data.momTrend}%` : "Stable"} />
          <FloatingKpiCard icon={<Users className="h-4 w-4" />} title="Active participants" value={data.totClients.toLocaleString()} subValue="Verified investors" trend="up" trendValue="+5" />
          <FloatingKpiCard icon={<Map className="h-4 w-4" />} title="Branch network" value={data.totMembers.toLocaleString()} subValue="Island-wide staff" trend="neutral" trendValue="Stable" />
          <FloatingKpiCard icon={<BarChart2 className="h-4 w-4" />} title="Total achievement" value={`${percentage}%`} subValue="Against annual target" trend={percentage >= 50 ? "up" : "neutral"} trendValue={`Rs. ${(achievement / 1000000).toFixed(1)}M / ${(target / 1000000).toFixed(1)}M`} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="saas-surface min-h-[350px] overflow-hidden rounded-2xl p-5 sm:p-6 lg:col-span-2">
          <div className="mb-4 flex items-start justify-between"><div><p className="saas-eyebrow">Activity</p><h2 className="mt-1 text-base">Branch registrations</h2><p className="mt-1 text-[11px] text-muted-foreground">New registrations across your network</p></div><button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><ArrowUpRight size={16} /></button></div>
          <div className="h-[255px] w-full">{data.initialChartData ? <ClientRegistrationChart initialData={data.initialChartData} /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Loading chart...</div>}</div>
        </section>

        <section className="saas-surface min-h-[350px] overflow-hidden rounded-2xl">
          <div className="flex items-start justify-between border-b border-border/70 p-5 sm:p-6"><div><p className="saas-eyebrow">Live feed</p><h2 className="mt-1 text-base">Recent activity</h2></div><Link href="/features/investments" className="text-[10px] font-bold text-primary hover:underline">View all</Link></div>
          <div className="divide-y divide-border/60">
            {data.recentInvestments?.slice(0, 5).map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30 sm:px-6"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10"><UserAvatar seed={inv.client?.fullName || "User"} className="h-5 w-5 opacity-80" /></div><div className="min-w-0"><p className="truncate text-xs font-bold text-foreground">{inv.client?.fullName}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{isMounted ? new Date(inv.investmentDate).toLocaleDateString() : ""} · {inv.advisor?.nameWithInitials?.split(" ")[0] || "Unassigned"}</p></div></div><p className="shrink-0 text-xs font-bold text-foreground">Rs. {isMounted ? inv.amount.toLocaleString() : inv.amount}</p></div>
            ))}
          </div>
        </section>
      </div>

      <section><div className="mb-3 flex items-end justify-between"><div><p className="saas-eyebrow">Performance</p><h2 className="mt-1 text-lg">Network performance</h2></div><span className="text-[10px] font-semibold text-muted-foreground">Updated just now</span></div><BranchKpiTable /></section>

      <section><div className="mb-3"><p className="saas-eyebrow">Pipeline</p><h2 className="mt-1 text-lg">Maturity overview</h2></div>{maturityLoading || !maturityData ? <div className="saas-surface flex min-h-40 items-center justify-center rounded-2xl text-xs text-muted-foreground">Loading pipeline...</div> : <MaturityPipeline investments={maturityData} />}</section>

      <section><div className="mb-3"><p className="saas-eyebrow">Operations</p><h2 className="mt-1 text-lg">Team & finance</h2></div><div className="grid grid-cols-1 gap-5 lg:grid-cols-3"><CommissionLeaderboard /><IncentiveForecast /><PayrollBreakdown /></div></section>

      <section><div className="mb-3 flex items-end justify-between"><div><p className="saas-eyebrow">Shortcuts</p><h2 className="mt-1 text-lg">Jump back in</h2></div><Link href="/features/profile" className="hidden items-center gap-1 text-[11px] font-bold text-primary sm:flex">Manage workspace <ChevronRight size={14} /></Link></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{modules.map((mod) => { const Icon = mod.icon; return <Link key={mod.title} href={mod.href} className="group saas-surface flex items-center justify-between rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_38px_rgba(34,43,72,0.09)]"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${mod.color}`}><Icon size={18} /></div><div><h3 className="text-sm font-bold">{mod.title}</h3><p className="mt-0.5 text-[10px] font-medium text-muted-foreground">{mod.description}</p></div></div><ArrowUpRight size={16} className="text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" /></Link>; })}</div></section>
    </div>
  );
};
