"use client";

import { logout } from "@/app/auth/logout/action";
import {
  BanknoteArrowUp, Calculator, ChevronLeft, ChevronRight,
  CircleUserRound, IdCardLanyard, Landmark, LayoutDashboard,
  LogOut, Menu, Nfc, Package, Percent, ReceiptText, Target, User, Users, X,
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
  { name: "Dashboard", href: "/features/dashboard", icon: LayoutDashboard, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
  { name: "Employee", href: "/features/branches/employees", icon: IdCardLanyard, role: ["ADMIN", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
  { name: "Inventory", href: "/features/inventory", icon: Package, role: ["ADMIN", "HR", "DEV"], },
  { name: "Targets", href: "/features/hr/targets", icon: Target, role: ["ADMIN", "HR", "DEV"] },
  { name: "Payroll", href: "/features/hr/payroll", icon: Nfc, role: ["ADMIN", "HR", "DEV"] },
  { name: "Financial Plans", href: "/features/financial_plans", icon: Landmark, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
  { name: "Commissions", href: "/features/commissions", icon: Percent, role: ["ADMIN", "HR", "DEV"] },
  { name: "Investments", href: "/features/investments", icon: BanknoteArrowUp, role: ["ADMIN", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
  { name: "Quotations", href: "/features/quotations", icon: ReceiptText, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
  { name: "Calculations", href: "/features/calculations", icon: Calculator, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
  { name: "Clients", href: "/features/clients", icon: Users, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "ZONAL_MANAGER", "AGM"] },
  { name: "Users", href: "/features/users", icon: User, role: ["ADMIN", "HR", "DEV"] },
  { name: "Profile", href: "/features/profile", icon: CircleUserRound, role: ["ADMIN", "EMPLOYEE", "HR", "DEV", "BRANCH_MANAGER", "REGIONAL_MANAGER", "AGM"] },
];

// Single breakpoint used everywhere so mobile/desktop logic never disagrees.
const MOBILE_BREAKPOINT = 768;

const Sidebar = ({ role, loading, isCollapsed, setIsCollapsed, onNavigate }: SidebarProps) => {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);

  // Tracks whether we're currently under the mobile breakpoint.
  // This is the ONE thing that decides whether "collapsed" means
  // "icon rail" (desktop) or "fully hidden drawer" (mobile).
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Touch swipe detection (mobile only)
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
        if (deltaX < 0) setIsCollapsed(true);   // swipe left -> close
        else if (deltaX > 0) setIsCollapsed(false); // swipe right -> open
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
  }, [isMobile, setIsCollapsed]);

  // Click outside to close (mobile only — desktop icon rail should stay put)
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

  const filteredLinks = links.filter(link => role ? link.role.includes(role) : false);

  // On mobile the "open" state is always full width with labels,
  // there's no separate icon-only rail — it's either a drawer or nothing.
  const showLabels = isMobile ? !isCollapsed : !isCollapsed;

  return (
    <>
      {/* Mobile-only floating trigger, shown only while the drawer is closed */}
      {isMobile && isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          aria-label="Open menu"
          className="fixed top-4 left-4 z-40 p-2 rounded-xl bg-sidebar-accent shadow-md md:hidden"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Backdrop, mobile-only, only while drawer is open */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside
        ref={sidebarRef}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className={`
          overflow-y-auto fixed left-0 top-0 h-screen flex flex-col
          bg-sidebar text-sidebar-foreground border-r border-sidebar-border
          z-50 transition-transform duration-300 md:transition-all
          w-64
          ${isCollapsed
            ? "-translate-x-full md:translate-x-0 md:w-20"
            : "translate-x-0 md:w-64"
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 overflow-hidden shrink-0">
          {showLabels && (
            <span className="flex text-xl font-bold tracking-tighter text-sidebar-foreground whitespace-nowrap">
              <div className="mr-3 overflow-hidden rounded-full bg-card flex items-center justify-center">
                <Image src="/logo.png" alt="logo" width={32} height={32} className="object-cover h-8 w-8" />
              </div>
              <span className="text-primary mr-2">SGP</span> ERP
            </span>
          )}

          {/* Mobile: close (X). Desktop: icon-rail collapse toggle. */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`p-2 rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors ${isCollapsed ? "md:mx-auto" : ""}`}
          >
            <span className="md:hidden">
              <X size={20} />
            </span>
            <span className="hidden md:inline">
              {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2 overflow-y-auto mt-4">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const sortedLinks = [...links].sort((a, b) => b.href.length - a.href.length);
            const isActive = sortedLinks.find((l) => pathname.startsWith(l.href))?.href === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                title={!showLabels ? link.name : ""}
                onClick={() => {
                  onNavigate();
                  if (isMobile) setIsCollapsed(true);
                }}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold
                  transition-all duration-200 group
                  ${isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                `}
              >
                <div className="shrink-0">
                  <Icon size={22} className={isActive ? "text-primary-foreground" : "group-hover:text-primary"} />
                </div>
                {showLabels && (
                  <span className="whitespace-nowrap group-hover:text-primary">
                    {link.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar shrink-0">
          <form action={logout}>
            <button
              type="submit"
              title={!showLabels ? "Logout" : ""}
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all group w-full text-left"
            >
              <div className="shrink-0">
                <LogOut size={22} className="group-hover:rotate-12 transition-transform" />
              </div>
              {showLabels && <span className="whitespace-nowrap">Logout</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;