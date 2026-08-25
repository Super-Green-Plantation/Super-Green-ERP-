"use client";

import { ThemeToggle } from "@/app/components/ThemeToggle";
import { UserAvatar } from "@/app/components/Dashboard/UserAvatar";
import { NotificationBell } from "@/app/components/NotificationBell";
import { Command, Menu, Search, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const BELL_ROLES = ["ADMIN", "HR", "DEV"];

function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const relevant = segments.filter((s) => s !== "features");
  if (relevant.length === 0) return "Dashboard";
  const last = relevant[relevant.length - 1];
  const labels: Record<string, string> = {
    dashboard: "Dashboard", branches: "Branches", employees: "Employees", clients: "Clients", investments: "Investments",
    commissions: "Commissions", payroll: "Payroll", salary: "Salary", targets: "Targets", evaluations: "Evaluations",
    financial_plans: "Financial Plans", users: "Users", profile: "Profile", quotations: "Quotations", calculations: "Calculations",
    inventory: "Inventory", advances: "Advances", hr: "HR", email: "Email", createClient: "New Client", create: "New",
  };
  return labels[last] ?? last.charAt(0).toUpperCase() + last.slice(1);
}

interface TopBarProps {
  role: string | null;
  userName: string;
  isCollapsed: boolean;
  onMenuClick: () => void;
}

export function TopBar({ role, userName, isCollapsed, onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const isDashboard = pageTitle === "Dashboard";

  return (
    <header className={`fixed top-0 right-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl transition-all duration-300 sm:px-7 ${isCollapsed ? "left-0 md:left-[76px]" : "left-0 md:left-[248px]"}`}>
      <div className="flex min-w-0 items-center gap-3">
        {isCollapsed && <button onClick={onMenuClick} aria-label="Open menu" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"><Menu size={19} /></button>}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
            <span className="hidden sm:inline">Workspace</span>
            <span className="hidden text-border sm:inline">/</span>
            <span className="truncate text-foreground/75">{pageTitle}</span>
          </div>
          {isDashboard && <p className="mt-0.5 hidden text-[10px] font-medium text-muted-foreground sm:block">Good morning — here&apos;s what&apos;s happening today.</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button type="button" className="hidden h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-[11px] font-semibold text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-foreground lg:flex">
          <Search size={14} />
          <span>Search anything</span>
          <span className="ml-2 flex items-center gap-0.5 rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[9px] text-muted-foreground"><Command size={9} /> K</span>
        </button>
        <ThemeToggle />
        {role && BELL_ROLES.includes(role) && <NotificationBell />}
        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right sm:flex sm:flex-col sm:justify-center sm:leading-none">
            <span className="text-xs font-bold text-foreground">{userName || "User"}</span>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{role ?? ""}</span>
          </div>
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm"><UserAvatar seed={userName || "user"} className="h-full w-full" /></div>
        </div>
      </div>
    </header>
  );
}
