import { Target, TrendingUp } from "lucide-react";
import { PWAInstallButton } from "../Buttons/PWAInstallButton";
import { ThemeToggle } from "../ThemeToggle";
import { UserAvatar } from "./UserAvatar";
import Link from "next/link";

export  const RestrictedView = ({ data, userName, userRole, achieved, target, percentage, isMounted }: any) => {
  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-transparent p-4 sm:p-8 flex flex-col items-center justify-center">
      {/* Top Header with Theme Toggle */}
      <div className="w-full flex justify-end mb-8">
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="h-6 w-px bg-border/50 mx-2 hidden sm:block"></div>
        </div>
      </div>
          <PWAInstallButton />


      <div className="w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Core Business Performance</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-foreground tracking-tighter leading-[0.9]">
            Hello, <span className="text-primary">{userName.split(' ')[0]}</span>.
            <br />
            Our Goal is <span className="text-accent">Rs. {(target / 1000000).toFixed(0)}M</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Real-time synchronization of enterprise targets and collective achievements.
          </p>
        </div>

        {/* Massive Progress Visualization */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-linear-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[4rem] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>

          <div className="relative bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 sm:p-20 shadow-2xl overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Target className="w-64 h-64 text-primary" />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">

              {/* Circular Indicator */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-muted/10"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - percentage / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                  <span className="text-6xl sm:text-8xl font-black text-foreground tracking-tighter">{percentage}%</span>
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mt-2">Achieved</span>
                </div>
              </div>

              {/* Data Breakdown */}
              <div className="flex-1 space-y-12 w-full">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Current Volume</p>
                  <p className="text-4xl sm:text-5xl font-black text-foreground tracking-tighter">
                    Rs. {(achieved / 1000000).toFixed(2)}M
                  </p>
                  <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden mt-4">
                    <div
                      className="h-full bg-linear-to-r from-emerald-500 to-sky-500 transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Target</p>
                    <p className="text-xl font-bold text-foreground tracking-tight">{(target / 1000000).toFixed(0)}M</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Remaining</p>
                    <p className="text-xl font-bold text-accent tracking-tight">{Math.max(0, (target - achieved) / 1000000).toFixed(2)}M</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-border/50">
                  <div className="flex items-center gap-4 text-sm font-bold text-foreground">
                    <div className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center">
                      <UserAvatar seed={userName} className="w-full h-full" />
                    </div>
                    <div>
                      <p>{userName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{userRole}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Encouraging Footer */}
        <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-foreground">Steady Growth Detected</p>
              <p className="text-xs text-muted-foreground">Keep pushing towards the enterprise vision.</p>
            </div>
          </div>

          <Link href="/features/clients" className="bg-foreground text-background px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl shadow-black/10">
            View My Contributions
          </Link>
        </div>

      </div>
    </div>
  );
};