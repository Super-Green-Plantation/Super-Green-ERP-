"use client";
import Error from "@/app/components/Status/Error";
import Loading from "@/app/components/Status/Loading";
import { useDashboard } from "@/app/hooks/useDashboard";
import {
  Bell, Mail, Search, ChevronRight, Play, TrendingUp, Users, MapPin,
  Briefcase, Star, Plus, MoreHorizontal, User, LayoutGrid, Target, ShieldCheck
} from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { useState } from "react";
import Link from "next/link";

const DashboardPage = () => {
  const { data, isLoading, isError } = useDashboard();
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) return <Loading />;
  if (isError) return <Error />;
  if (!data) return null;

  const target = 500000000;
  const achieved = data.investmentSum._sum.amount || 0;
  const percentage = Math.min(Math.round((achieved / target) * 100), 100);

  const modules = [
    {
      title: "Client Management Dashboard",
      tag: `ACTIVE: ${data.totClients}`,
      author: "System",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
      href: "/features/clients"
    },
    {
      title: "Financial Investment Tracking",
      tag: `MODULE`,
      author: "Finance",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      href: "/features/investments"
    },
    {
      title: "Employee Payroll & HR System",
      tag: `STAFF: ${data.totMembers}`,
      author: "HR",
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
      href: "/features/hr/payroll"
    }
  ];

  const userName = data.user?.name || data.user?.member?.nameWithInitials || "Administrator";
  const userRole = data.user?.role || "Super User";

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-transparent p-4 sm:p-8">
      {/* Premium Minimal Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-10 gap-6">
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="h-6 w-px bg-border/50 mx-2 hidden sm:block"></div>
            <p className="text-sm font-bold text-foreground tracking-tight hidden sm:block">Enterprise Hub</p>
          </div>
          
          <div className="flex items-center gap-3 bg-card/60 backdrop-blur-md border border-border/50 px-4 py-2 rounded-2xl shadow-sm text-card-foreground sm:hidden">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shadow-inner">
              <UserAvatar seed={userName} className="w-full h-full" />
            </div>
            <div className="xs:block">
              <p className="text-xs font-bold leading-none">{userName.split(' ')[0]}</p>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <p className="text-sm font-bold leading-none text-foreground">{userName}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mt-1">{userRole}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-card/60 backdrop-blur-md border border-border/50 flex items-center justify-center overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer">
            <UserAvatar seed={userName} className="w-full h-full" />
          </div>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-10">

        {/* Main Content */}
        <div className="flex-1 space-y-10 overflow-hidden">

          {/* Employee-Centric Getting Started Hero */}
          <div className="relative rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden p-6 sm:p-16 flex flex-col justify-center min-h-80 sm:min-h-105 border border-white/10  group animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {/* Soft Mesh Background */}
            <div className="absolute inset-0 bg-[#002A24]opacity-20">
              <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#004D40] rounded-full blur-[100px] opacity-70"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#00BFA5] rounded-full blur-[100px] opacity-40"></div>
              <div className="absolute inset-0 bg-white/2 mix-blend-overlay"></div>
            </div>
            
            <div className="relative z-10 w-full">
              <div className="max-w-xl">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-1.5 inline-flex items-center gap-3 mb-8 animate-pulse">
                  <div className="relative flex h-2 w-2 pt-0.5">
                    <div className=" absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 "></div>
                    <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 border border-emerald-400/50 "></div>
                  </div>
                  <span className="text-white text-[10px] font-bold uppercase tracking-widest">Systems Online</span>
                </div>
                
                <h1 className="text-4xl sm:text-6xl font-bold text-white leading-[1.05] tracking-tighter mb-6">
                  {new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening"}, <br />
                  <span className="text-accent">Let's Get Started.</span>
                </h1>
                
                <p className="text-white/70 text-base sm:text-lg max-w-md leading-relaxed mb-10 tracking-tight">
                  Welcome back to your workspace. Monitor your activities, track performance, and manage your modules with real-time enterprise intelligence.
                </p>
                
                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/features/investments" className="bg-white text-[#002A24] px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-accent hover:text-white transition-all duration-300 shadow-xl">
                    View My Modules <ChevronRight className="w-4 h-4" />
                  </Link>
                 
                </div>
              </div>

            
            </div>

            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-1000 hidden sm:block">
              <ShieldCheck className="w-80 h-80 text-white" />
            </div>
          </div>

          {/* Floating KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <FloatingKpiCard
              icon={<TrendingUp className="w-6 h-6 text-accent" />}
              title="Investment Capital"
              value={`Rs. ${(achieved / 1000000).toFixed(2)}M`}
              subValue="Real-time aggregation"
              trend="up"
            />
            <FloatingKpiCard
              icon={<Users className="w-6 h-6 text-accent" />}
              title="Active Participants"
              value={data.totClients.toLocaleString()}
              subValue="Verified investors"
              trend="up"
            />
            <FloatingKpiCard
              icon={<LayoutGrid className="w-6 h-6 text-accent" />}
              title="Network Nodes"
              value={data.totMembers.toLocaleString()}
              subValue="Global staff distribution"
              trend="neutral"
            />
          </div>

          {/* Curated Modules Grid */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tighter">Core Enterprise Modules</h2>
                <p className="text-sm text-muted-foreground mt-1">Direct access to mission-critical systems</p>
              </div>
              {/* <div className="flex gap-3">
                <NavButton icon={<ChevronRight className="w-5 h-5 rotate-180 text-accent" />} />
                <NavButton icon={<ChevronRight className="w-5 h-5 text-accent" />} active={true} />
              </div> */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {modules.map((mod, i) => (
                <Link key={i} href={mod.href || "#"} className="group bg-card rounded-[2rem] p-4 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer border border-border/30 hover:-translate-y-2">
                  <div className="w-full h-40 rounded-[1.5rem] bg-muted mb-5 overflow-hidden relative">
                    <img src={mod.image} alt={mod.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-white font-bold text-xs flex items-center gap-1">Click to Navigate <ChevronRight className="w-3 h-3" /></span>
                    </div>
                  </div>
                  <div className="px-2">
                    <h3 className="font-bold text-card-foreground mt-4 mb-5 leading-tight text-lg group-hover:text-primary transition-colors">{mod.title}</h3>
                    
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Editorial Recent Investments */}
          <section>
            <div className="flex items-center justify-between mb-8 mt-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tighter">Recent Financial Activity</h2>
                <p className="text-sm text-muted-foreground mt-1">Live audit log of all incoming assets</p>
              </div>
              <Link href="/features/investments"

                className="text-sm font-bold text-primary hover:text-accent transition-colors flex items-center gap-2 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 tracking-tight">
                VIEW FINANCIAL LEDGER <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className=" overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-175 md:min-w-0">
                  <thead>
                    <tr className="bg-muted/20 border-b border-border/50">
                      <th className="p-8 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] text-left">Source Entity</th>
                      <th className="p-8 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] text-left">Amount (Rs.)</th>
                      <th className="p-8 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] text-left">Advisor / Rank</th>
                      <th className="p-8 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {data.recentInvestments?.map((inv: any) => {
                      const advisorBranchId = inv.advisor?.branches?.[0]?.branchId;
                      const advisorId = inv.advisor?.id;
                      const advisorHref = advisorBranchId && advisorId ? `/features/branches/employees/${advisorBranchId}/${advisorId}` : "#";

                      return (
                        <tr key={inv.id} className="hover:bg-muted/30 transition-all duration-300 group">
                          <td className="p-8">
                            <Link href={`/features/clients/${inv.client.id}`} className="flex items-center gap-4">
                              {/* <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border/50 overflow-hidden shadow-inner group-hover:scale-105 transition-transform shrink-0">
                                <UserAvatar seed={inv.client?.fullName || "unnamed"} className="w-full h-full" />
                              </div> */}
                              <div className="min-w-0">
                                <p className="font-bold text-foreground text-base tracking-tight leading-none group-hover:text-primary transition-colors truncate">{inv.client?.fullName}</p>
                                <p className="text-[10px] text-muted-foreground/80 font-bold mt-2 uppercase tracking-tighter whitespace-nowrap">
                                  {new Date(inv.investmentDate).toLocaleDateString()} • {new Date(inv.investmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </Link>
                          </td>
                          <td className="p-8">
                            <span className="text-xs font-bold text-accent bg-accent/5 px-4 py-2 rounded-xl border border-accent/10 shadow-sm whitespace-nowrap">
                              Rs. {inv.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-8">
                            <div className="flex flex-col">
                              <Link href={advisorHref} className="text-sm text-foreground font-bold tracking-tight hover:text-primary transition-colors truncate">
                                {inv.advisor?.nameWithInitials || "Unknown Advisor"}
                              </Link>
                              <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">{inv.advisor?.position?.title || "Staff Agent"}</p>
                            </div>
                          </td>
                          <td className="p-8 text-right">
                            <Link href={`/features/clients/${inv.client.id}`} className="inline-flex w-10 h-10 rounded-2xl bg-primary text-primary-foreground items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all">
                              <ChevronRight className="w-5 h-5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </div>

        {/* Dynamic Sidebar */}
        <aside className="w-full xl:w-95 flex flex-col gap-8">

          {/* High-Fidelity Stats Card */}
          <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-border/50 relative overflow-hidden group text-card-foreground">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
              <Target className="w-32 h-32 text-primary" />
            </div>

            <div className="flex items-center justify-between mb-10 relative z-10">
              <h2 className="font-bold text-xl tracking-tighter text-foreground">Global Stat Insight</h2>
             
            </div>

            {/* SVG Circular Progress */}
            <div className="flex flex-col items-center mb-10 relative z-10">
              <div className="relative w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/30"
                  />
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl sm:text-5xl font-bold text-foreground tracking-tighter">{percentage}%</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1">Achieved</span>
                </div>
              </div>

              <div className="text-center mt-10">
                <h3 className="font-bold text-2xl text-foreground mb-2 leading-none">Welcome, {userName.split(' ')[0]} 🔥</h3>
                <p className="text-xs text-muted-foreground font-bold tracking-tight px-4">Your enterprise systems are operating at peak efficiency today.</p>
              </div>
            </div>

            {/* Real Data Heatmap */}
            <div className="flex items-end justify-between h-32 gap-3 px-2 pt-4 border-t border-border/30">
              {data.heatmap?.map((count: number, i: number) => (
                <div key={i} className="w-full flex flex-col gap-3 items-center group/bar">
                  <div className="relative w-full h-full flex items-end">
                    <div
                      className={`w-full rounded-xl transition-all duration-500 ${i === 6 ? 'bg-accent shadow-lg shadow-accent/20' : 'bg-primary/20 group-hover/bar:bg-primary/50'}`}
                      style={{ height: `${Math.max((count / (Math.max(...data.heatmap) || 1)) * 100, 10)}%` }}
                    ></div>
                    {i === 6 && count > 0 && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent ring-4 ring-accent/20 animate-pulse"></div>}
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-tighter ${i === 6 ? 'text-accent' : 'text-muted-foreground/50'}`}>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][(new Date().getDay() + i + 1) % 7]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Personnel Panel */}
          <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-border/50 flex-1 relative overflow-hidden text-card-foreground">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-bold text-xl tracking-tighter text-foreground leading-none">Command Structure</h2>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest font-bold">Core Oversight Team</p>
              </div>
              
            </div>

            <div className="space-y-6">
              {data.keyPersonnel?.map((p: any, i: number) => {
                const branchId = p.branches?.[0]?.branchId;
                const empId = p.id;
                const profileHref = branchId && empId ? `/features/branches/employees/${branchId}/${empId}` : "#";

                return (
                  <div key={p.id} className="flex items-center justify-between gap-4 group cursor-pointer hover:bg-muted/30 p-2 rounded-2xl transition-all">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl border-2 border-border/50 overflow-hidden shadow-md group-hover:scale-110 transition-transform">
                          <UserAvatar seed={p.nameWithInitials} className="w-full h-full" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-[6px] border-2 border-card bg-emerald-500`}></div>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">{p.nameWithInitials}</p>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">{p.position?.title || "Agent"}</p>
                      </div>
                    </div>
                    <Link href={profileHref} 
                    className="text-[10px] font-bold text-primary px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary hover:text-white transition-all tracking-widest uppercase">
                      Profile
                    </Link>
                  </div>
                );
              })}
            </div>

            <Link href="/features/branches" 
            className="w-full px-6 py-5 mt-10 rounded-[1.5rem] bg-muted/50 text-foreground font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-border/50 block text-center hover:shadow-lg hover:shadow-primary/20">
              Global Directory
            </Link>
          </div>

        </aside>
      </div>
    </div>
  );
};

// --- Atomic Components ---

function FloatingKpiCard({ icon, title, value, subValue, trend }: { icon: React.ReactNode, title: string, value: string, subValue: string, trend: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-[2rem] p-6 flex flex-col shadow-sm group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-700">
        {icon}
      </div>
      <div className={`w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center shrink-0 mb-6 group-hover:bg-primary transition-all duration-500 shadow-inner border border-border/20`}>
        <div className="group-hover:text-white group-hover:scale-110 transition-all duration-500 text-primary">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-[10px] font-bold text-muted-foreground/40 mb-2 uppercase tracking-[0.2em] leading-none">{title}</h3>
        <p className="text-2xl font-bold text-foreground tracking-tighter mb-2 group-hover:text-primary transition-colors">{value}</p>
        <div className="flex items-center gap-1.5">
          {trend === 'up' && <div className="w-1 h-1 rounded-full bg-emerald-500"></div>}
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">{subValue}</p>
        </div>
      </div>
    </div>
  );
}

function IconButton({ icon, badge }: { icon: React.ReactNode, badge?: boolean }) {
  return (
    <button className="w-12 h-12 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center text-card-foreground hover:bg-primary hover:text-white hover:border-primary transition-all relative hover:-translate-y-0.5 active:translate-y-0 active:scale-95">
      {icon}
      {badge && <span className="absolute top-3 right-3 w-2 h-2 bg-accent shadow-[0_0_8px_rgba(0,191,165,0.5)] rounded-full ring-2 ring-card group-hover:ring-primary"></span>}
    </button>
  );
}

function NavButton({ icon, active }: { icon: React.ReactNode, active?: boolean }) {
  return (
    <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110' : 'bg-card border border-border/50 text-muted-foreground hover:bg-muted'}`}>
      {icon}
    </button>
  );
}

function UserAvatar({ seed, className = "w-8 h-8" }: { seed: string, className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=transparent`}
      alt="avatar"
      className={`bg-muted/30 ${className}`}
    />
  );
}

export default DashboardPage;
