"use client";

import { logout } from "@/app/auth/logout/action";
import {
  BanknoteArrowUp, Calculator, ChevronLeft, ChevronRight,
  CircleUserRound, IdCardLanyard, Landmark, LayoutDashboard,
  LogOut, Menu, Nfc, Package, Percent, ReceiptText, Target, User, Users, Wallet,
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

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  role: string[];
};

const links: NavItem[] = [
  { name: "Dashboard", href: "/features/dashboard", icon: LayoutDashboard, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
  { name: "Employee", href: "/features/branches/employees", icon: IdCardLanyard, role: ["ADMIN", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
  { name: "Clients", href: "/features/clients", icon: Users, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
  { name: "Investments", href: "/features/investments", icon: BanknoteArrowUp, role: ["ADMIN", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
  { name: "Financial Plans", href: "/features/financial_plans", icon: Landmark, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
  { name: "Quotations", href: "/features/quotations", icon: ReceiptText, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
  { name: "Calculations", href: "/features/calculations", icon: Calculator, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
  { name: "Inventory", href: "/features/inventory", icon: Package, role: ["ADMIN", "HR", "DEV"] },
  { name: "Targets", href: "/features/hr/targets", icon: Target, role: ["ADMIN", "HR", "DEV"] },
  { name: "Payroll", href: "/features/hr/payroll", icon: Nfc, role: ["ADMIN", "HR", "DEV"] },
  { name: "Accounts", href: "/features/accounts", icon: Wallet, role: ["ADMIN", "HR", "DEV", "ACC", "CHAIRMAN"] },
  { name: "Commissions", href: "/features/commissions", icon: Percent, role: ["ADMIN", "HR", "DEV"] },
  { name: "Users", href: "/features/users", icon: User, role: ["ADMIN", "HR", "DEV"] },
  { name: "Profile", href: "/features/profile", icon: CircleUserRound, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
];

const groups = [
  { label: "Workspace", items: ["Dashboard", "Employee", "Clients", "Investments", "Financial Plans", "Quotations", "Calculations"] },
  { label: "Operations", items: ["Inventory", "Targets", "Payroll", "Accounts", "Commissions"] },
  { label: "Administration", items: ["Users", "Profile"] },
];

const MOBILE_BREAKPOINT = 768;

const Sidebar = ({ role, loading, isCollapsed, setIsCollapsed, onNavigate }: SidebarProps) => {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  useEffect(() => {
    if (!isMobile) return;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      if (Math.abs(deltaX) > 50 && deltaY < 80) {
        if (deltaX < 0) setIsCollapsed(true);
        else setIsCollapsed(false);
      }
      touchStartX.current = null;
      touchStartY.current = null;
    };
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, setIsCollapsed]);

  useEffect(() => {
    if (!isMobile) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!isCollapsed && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsCollapsed(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, isCollapsed, setIsCollapsed]);

  if (loading) return <SidebarSkeleton isCollapsed={isCollapsed} />;

  const filteredLinks = links.filter((link) => role ? link.role.includes(role) : false);
  const linkByName = new Map(filteredLinks.map((link) => [link.name, link]));
  const showLabels = !isCollapsed;

  return (
    <>
      {isMobile && isCollapsed && (
        <button onClick={() => setIsCollapsed(false)} aria-label="Open menu" className="fixed top-3.5 left-3.5 z-40 rounded-xl border border-border bg-card p-2.5 text-muted-foreground shadow-lg md:hidden">
          <Menu size={18} />
        </button>
      )}
      {isMobile && !isCollapsed && <div className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] md:hidden" onClick={() => setIsCollapsed(true)} />}

      <aside
        ref={sidebarRef}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ${isCollapsed ? "-translate-x-full md:translate-x-0 md:w-[76px]" : "translate-x-0 md:w-[248px]"} w-[270px]`}
      >
        <div className={`relative flex h-[72px] shrink-0 items-center border-b border-sidebar-border px-5 ${showLabels ? "justify-between" : "justify-center"}`}>
          {showLabels ? (
            <Link href="/features/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-primary shadow-lg shadow-primary/20">
                <Image src="/logo.png" alt="SGP ERP" width={30} height={30} className="h-7 w-7 object-cover" />
              </span>
              <span className="leading-none">
                <span className="block text-[15px] font-bold tracking-tight text-foreground">SGP ERP</span>
                <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">Workspace</span>
              </span>
            </Link>
          ) : (
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Image src="/logo.png" alt="SGP ERP" width={30} height={30} className="h-7 w-7 object-cover" />
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground ${isCollapsed ? "absolute right-2 top-1/2 hidden -translate-y-1/2 md:block" : ""}`}
          >
            {isCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-5">
          {groups.map((group) => {
            const items = group.items.map((name) => linkByName.get(name)).filter(Boolean) as NavItem[];
            if (!items.length) return null;
            return (
              <div key={group.label} className="mb-6 last:mb-0">
                {showLabels && <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">{group.label}</p>}
                <div className="space-y-1">
                  {items.map((link) => {
                    const Icon = link.icon;
                    const matching = [...links].sort((a, b) => b.href.length - a.href.length).find((item) => pathname.startsWith(item.href));
                    const isActive = matching?.href === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        title={!showLabels ? link.name : undefined}
                        onClick={() => { onNavigate(); if (isMobile) setIsCollapsed(true); }}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"} ${!showLabels ? "justify-center" : ""}`}
                      >
                        <Icon size={17} className={`shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"}`} />
                        {showLabels && <span className="truncate">{link.name}</span>}
                        {showLabels && isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {showLabels && (
          <div className="mx-3 mb-3 rounded-2xl border border-primary/10 bg-primary/[0.07] p-3.5">
            <p className="text-[10px] font-bold text-foreground">Need a hand?</p>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Your workspace is ready for today&apos;s work.</p>
            <Link href="/features/dashboard" className="mt-2 inline-flex text-[10px] font-bold text-primary hover:underline">View profile <ChevronRight size={12} /></Link>
          </div>
        )}

        <div className="border-t border-sidebar-border p-3">
          <form action={logout}>
            <button type="submit" title={!showLabels ? "Logout" : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-sidebar-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive ${!showLabels ? "justify-center" : ""}`}>
              <LogOut size={17} className="shrink-0" />
              {showLabels && <span>Log out</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
