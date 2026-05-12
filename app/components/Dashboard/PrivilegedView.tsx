import { getClientRegistrationByBranch } from "@/app/features/dashboard/analytics";
import { useEffect, useState } from "react";
import { ThemeToggle } from "../ThemeToggle";
import { PWAInstallButton } from "../Buttons/PWAInstallButton";
import { UserAvatar } from "./UserAvatar";
import Link from "next/link";
import { ChevronRight, LayoutGrid, TrendingUp, Users } from "lucide-react";
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
    dailyAmount: number[];  // ← new
    total: number;
    totalAmount: number;    // ← new
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
      title: "Payroll & HR System",
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
    <div className="max-w-7xl mx-auto min-h-screen bg-transparent  sm:p-8">
      {/* Premium Minimal Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-10 gap-6">
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="h-6 w-px bg-border/50 mx-2 hidden sm:block"></div>
            <PWAInstallButton />
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
              <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#00c7a6] rounded-full blur-[100px] opacity-70"></div>
              <div className="absolute bottom-[-30%] right-[-30%] w-[60%] h-[60%] bg-[#017263] rounded-full blur-[100px] opacity-90"></div>
              <div className="absolute inset-0 bg-white/2 mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 w-full">
              <div className="max-w-xl">
                <h1 className="text-4xl sm:text-6xl font-bold text-white leading-[1.05] tracking-tighter mb-6">
                  {isMounted ? (new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening") : "Welcome back"}, <br />
                  <span className="text-accent">Let's Get Started.</span>
                </h1>

                <p className="dark:text-white/70 text-base sm:text-lg max-w-md leading-relaxed mb-10 tracking-tight">
                  Welcome back to your workspace. Monitor your activities, track performance, and manage your modules with real time.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/features/investments" className="bg-white text-[#002A24] px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-accent hover:text-white transition-all duration-300 shadow-xl">
                    Investments <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-5 absolute -bottom-10 right-0 opacity-80 hidden sm:block">
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


              </div>
            </div>
          </div>

          <div className="border-t border-border/30 pt-4 mt-2 px-2">
            <h2 className="text-2xl font-bold text-foreground tracking-tighter my-5">
              Client registrations by branch
            </h2>
            {chartData ? (
              <ClientRegistrationChart initialData={chartData} />
            ) : (
              <div className="h-48 flex items-center justify-center">
                <span className="text-[11px] text-muted-foreground/40 uppercase tracking-widest">Loading...</span>
              </div>
            )}
          </div>

          {/* Curated Modules Grid */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tighter">Quick Navigation To Modules</h2>
                <p className="text-sm text-muted-foreground mt-1">Direct access to mission-critical systems</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {modules.map((mod, i) => (
                <Link key={i} href={mod.href || "#"} className="group bg-card rounded-[2rem] p-4 shadow-xs hover:shadow-xl transition-all duration-500 cursor-pointer border border-border/30 hover:-translate-y-2">
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
            <div className="flex items-center justify-between mb-2 mt-2">
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tighter">Recent Client Activity</h2>
              </div>
            </div>

            <div className=" overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-175 md:min-w-0">
                  <thead>
                    <tr className="bg-muted/20 border-b border-border/50">
                      <th className="p-5 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] text-left">Client</th>
                      <th className="p-5 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] text-left">Amount (Rs.)</th>
                      <th className="p-5 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] text-left">Advisor / Rank</th>
                      <th className="p-5 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] text-right">Action</th>
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
                              <div className="min-w-0">
                                <p className="font-bold text-foreground text-base tracking-tight leading-none group-hover:text-primary transition-colors truncate">{inv.client?.fullName}</p>
                                <p className="text-[10px] text-muted-foreground/80 font-bold mt-2 uppercase tracking-tighter whitespace-nowrap">
                                  {isMounted ? (
                                    <>
                                      {new Date(inv.investmentDate).toLocaleDateString()} • {new Date(inv.investmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </>
                                  ) : "..."}
                                </p>
                              </div>
                            </Link>
                          </td>
                          <td className="p-8">
                            <span className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 shadow-sm whitespace-nowrap">
                              Rs. {isMounted ? inv.amount.toLocaleString() : inv.amount}
                            </span>
                          </td>
                          <td className="p-8">
                            <div className="flex flex-col">
                              <Link href={advisorHref} className="text-sm text-foreground font-bold tracking-tight hover:text-primary transition-colors truncate">
                                {inv.advisor?.nameWithInitials || "Unassigned"}
                              </Link>
                              <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">{inv.advisor?.position?.title || "-"}</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-3 gap-6">
            <FloatingKpiCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Investment Capital"
              value={`Rs. ${(Math.floor(achieved / 10000) / 100).toFixed(2)}M`}
              subValue="Real-time aggregation"
              trend="up"
            />
            <FloatingKpiCard
              icon={<Users className="w-6 h-6" />}
              title="Active Participants"
              value={data.totClients.toLocaleString()}
              subValue="Verified investors"
              trend="up"
            />
            <FloatingKpiCard
              icon={<LayoutGrid className="w-6 h-6" />}
              title="Branch Network"
              value={data.totMembers.toLocaleString()}
              subValue="Islan wide staff"
              trend="neutral"
            />
          </div>
        </aside>
      </div>
    </div>
  );
};