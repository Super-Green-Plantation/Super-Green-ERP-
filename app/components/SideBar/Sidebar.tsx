"use client";

import { logout } from "@/app/auth/logout/action";
import {
  BanknoteArrowUp, Calculator, ChartCandlestick, ChevronLeft,
  GitBranch, IdCardLanyard, Landmark, LayoutDashboard,
  LogOut, Menu, Nfc, Percent, ReceiptText, Target, User, Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarSkeleton } from "./SidebarSkeleton";
import { useEffect, useRef, useState } from "react";

type SidebarProps = {
  role: string | null;
  loading: boolean;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  onNavigate: () => void;
};

const links = [
  { name: "Dashboard", href: "/features/dashboard", icon: LayoutDashboard, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "AGM"] },
  { name: "Branches", href: "/features/branches", icon: GitBranch, role: ["ADMIN", "HR", "DEV"] },
  { name: "Employee", href: "/features/branches/employees", icon: IdCardLanyard, role: ["ADMIN", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "AGM"] },
  { name: "Targets", href: "/features/hr/targets", icon: Target, role: ["ADMIN", "HR", "DEV"] },
  { name: "Evaluations", href: "/features/hr/evaluations", icon: ChartCandlestick, role: ["ADMIN", "HR", "DEV"] },
  { name: "Payroll", href: "/features/hr/payroll", icon: Nfc, role: ["ADMIN", "HR", "DEV"] },
  { name: "Financial Plans", href: "/features/financial_plans", icon: Landmark, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "AGM"] },
  { name: "Commissions", href: "/features/commissions", icon: Percent, role: ["ADMIN", "HR", "DEV"] },
  { name: "Investments", href: "/features/investments", icon: BanknoteArrowUp, role: ["ADMIN", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "AGM"] },
  { name: "Quotations", href: "/features/quotations", icon: ReceiptText, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "AGM"] },
  { name: "Calculations", href: "/features/calculations", icon: Calculator, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "AGM"] },
  { name: "Clients", href: "/features/clients", icon: Users, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "AGM"] },
  { name: "Users", href: "/features/users", icon: User, role: ["ADMIN", "HR", "DEV"] },
  { name: "Profile", href: "/features/profile", icon: User, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "AGM"] },
];

const Sidebar = ({ role, loading, isCollapsed, setIsCollapsed, onNavigate }: SidebarProps) => {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);

  // Touch swipe detection
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > 50 && deltaY < 80) {
        if (deltaX < 0) {
          // Swipe left → collapse
          setIsCollapsed(true);
        } else if (deltaX > 0 && isCollapsed) {
          // Swipe right → expand
          setIsCollapsed(false);
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isCollapsed, setIsCollapsed]);

  // Click outside to collapse
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !isCollapsed &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setIsCollapsed(true);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCollapsed, setIsCollapsed]);

  if (loading) return <SidebarSkeleton isCollapsed={isCollapsed} />;

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const filteredLinks = links.filter(link => role ? link.role.includes(role) : false);

  return (
    <>
          <aside
        ref={sidebarRef}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className={`flex-1 overflow-y-auto
          fixed left-0 top-0 h-screen
          bg-sidebar text-sidebar-foreground
          border-r border-sidebar-border
          transition-all duration-300
          z-50
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 overflow-hidden">
          {!isCollapsed && (
            <span className="flex text-xl font-bold tracking-tighter text-sidebar-foreground whitespace-nowrap animate-in fade-in duration-500">
              <div className="mr-3 overflow-hidden rounded-full bg-card flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="logo"
                  width={32}
                  height={32}
                  className="object-cover h-8 w-8"
                />
              </div>
              <span className="text-primary mr-2">SGP</span> ERP
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors ${isCollapsed ? "mx-auto" : ""}`}
          >
            {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2 overflow-y-auto mt-4">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const sortedLinks = [...links].sort(
              (a, b) => b.href.length - a.href.length
            );

            const isActive =
              sortedLinks.find((l) => pathname.startsWith(l.href))?.href === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                title={isCollapsed ? link.name : ""}
                onClick={() => {
                  onNavigate();
                  if (window.innerWidth <= 375) {
                    setIsCollapsed(true);
                  }

                }}
                className={`
                  flex items-center gap-4
                  px-4 py-3 rounded-xl
                  text-sm font-bold
                  transition-all duration-200
                  group
                  ${isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                `}
              >
                <div className="shrink-0">
                  <Icon
                    size={22}
                    className={isActive ? "text-primary-foreground" : "group-hover:text-primary"}
                  />
                </div>
                {!isCollapsed && (
                  <span className="whitespace-nowrap animate-in slide-in-from-left-2 duration-300">
                    {link.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar">
          <form action={logout}>
            <button
              type="submit"
              title={isCollapsed ? "Logout" : ""}
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all group w-full text-left"
            >
              <div className="shrink-0">
                <LogOut size={22} className="group-hover:rotate-12 transition-transform" />
              </div>
              {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
