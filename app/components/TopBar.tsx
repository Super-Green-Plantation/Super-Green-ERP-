"use client";

// app/components/TopBar.tsx
//
// App-wide top navigation bar, rendered in FeaturesLayout so it appears on
// every authenticated page. Shows the mobile menu toggle, page-level breadcrumb
// (current route name), theme toggle, notification bell (admin roles only),
// and the logged-in user's avatar + name.

import { ThemeToggle } from "@/app/components/ThemeToggle";
import { UserAvatar } from "@/app/components/Dashboard/UserAvatar";
import { NotificationBell } from "@/app/components/NotificationBell";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

const BELL_ROLES = ["ADMIN", "HR", "DEV"];

// Derive a human-readable page title from the current pathname
function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  // Drop the leading "features" segment
  const relevant = segments.filter((s) => s !== "features");
  if (relevant.length === 0) return "Dashboard";

  const last = relevant[relevant.length - 1];

  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    branches: "Branches",
    employees: "Employees",
    clients: "Clients",
    investments: "Investments",
    commissions: "Commissions",
    payroll: "Payroll",
    salary: "Salary",
    targets: "Targets",
    evaluations: "Evaluations",
    financial_plans: "Financial Plans",
    users: "Users",
    profile: "Profile",
    quotations: "Quotations",
    calculations: "Calculations",
    inventory: "Inventory",
    advances: "Advances",
    hr: "HR",
    email: "Email",
    createClient: "New Client",
    create: "New",
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


  return (
    <header
      className={`
        fixed top-0 right-0 z-30
        h-14
        flex items-center justify-between
        px-4 gap-3
        bg-background/80 backdrop-blur-md
        border-b border-border/60
        transition-all duration-300
        ${isCollapsed ? "left-0 md:left-20" : "left-0 md:left-60"}
      `}
    >
      {/* Left — mobile menu toggle + page title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger — only visible when sidebar is collapsed */}
        {isCollapsed && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-2 shrink-0">
 <ThemeToggle />
        {role && BELL_ROLES.includes(role) && <NotificationBell />}

        <div className="hidden sm:block h-5 w-px bg-border mx-1" />

        {/* User pill */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:flex flex-col justify-center leading-none">
            <span className="text-xs font-bold text-foreground">{userName || "User"}</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
              {role ?? ""}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-border shrink-0">
            <UserAvatar seed={userName || "user"} className="w-full h-full" />
          </div>
        </div>
      </div>
    </header>
  );
}