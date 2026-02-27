"use client";

import { logout } from "@/app/auth/logout/action";
import {
  BanknoteArrowUp,
  Calculator,
  ChevronLeft,
  GitBranch,
  IdCardLanyard,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Percent,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarSkeleton } from "../SidebarSkeleton";

type SidebarProps = {
  role: string | null;
  loading: boolean;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};


const links = [
  { name: "Dashboard", href: "/features/dashboard", icon: LayoutDashboard, role: ["ADMIN", "EMPLOYEE", "HR", "IT_DEV", "BRANCH_MANAGER"] },
  { name: "Branches", href: "/features/branches", icon: GitBranch, role: ["ADMIN", "HR", "IT_DEV"] },
  {
    name: "Employee",
    href: "/features/branches/employees",
    icon: IdCardLanyard,
    role: ["ADMIN", "HR", "IT_DEV", "BRANCH_MANAGER"]
  },
  {
    name: "Financial Plans",
    href: "/features/financial_plans",
    icon: Landmark,
    role: ["ADMIN", "EMPLOYEE", "HR", "IT_DEV", "BRANCH_MANAGER"]
  },
  { name: "Commissions", href: "/features/commissions", icon: Percent, role: ["ADMIN", "HR", "IT_DEV", "BRANCH_MANAGER"] },
  { name: "Investments", href: "/features/investments", icon: BanknoteArrowUp, role: ["ADMIN", "EMPLOYEE", "HR", "IT_DEV", "BRANCH_MANAGER"] },
  { name: "Calculations", href: "/features/calculations", icon: Calculator, role: ["ADMIN", "EMPLOYEE", "HR", "IT_DEV", "BRANCH_MANAGER"] },
  { name: "Clients", href: "/features/clients", icon: Users, role: ["ADMIN", "EMPLOYEE", "HR", "IT_DEV", "BRANCH_MANAGER"] },
  { name: "Users", href: "/features/users", icon: User, role: ["ADMIN", "HR", "IT_DEV"] },
  { name: "Profile", href: "/features/profile", icon: User, role: ["ADMIN", "EMPLOYEE", "HR", "IT_DEV", "BRANCH_MANAGER"] },
];


const Sidebar = ({ role, loading, isCollapsed, setIsCollapsed }: SidebarProps) => {

  if (loading) {
    return <SidebarSkeleton isCollapsed={isCollapsed} />
  }
  const pathname = usePathname();
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const filteredLinks = links.filter(link =>
    role ? link.role.includes(role) : false
  );

  return (
    <aside
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      className={`flex-1 overflow-y-auto
    fixed left-0 top-0 h-screen
    bg-gray-900 text-gray-100
    border-r border-gray-800
    transition-all duration-300
    z-50
    ${isCollapsed ? "w-20" : "w-64"}
  `}
    >
      {/* Header Area */}
      <div className="flex items-center justify-between px-6 py-6 overflow-hidden">
        {!isCollapsed && (
          <span className="flex text-xl font-black tracking-tighter text-white whitespace-nowrap animate-in fade-in duration-500">
            <div className="mr-3  overflow-hidden rounded-full bg-white flex items-center justify-center">
              <Image
                src="/logo.jpeg"
                alt="logo"
                width={32}
                height={32}
                className="object-cover h-8 w-8"
              />
            </div>
            <span className="text-green-500 mr-2">SGP</span> ERP
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors ${isCollapsed ? "mx-auto" : ""}`}
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2 overflow-y-auto mt-4">
        {filteredLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              title={isCollapsed ? link.name : ""}
              className={`
                flex items-center gap-4
                px-4 py-3 rounded-xl
                text-sm font-bold
                transition-all duration-200
                group
                ${isActive
                  ? "bg-gray-600 text-white shadow-lg shadow-blue-900/20"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }
              `}
            >
              <div className="shrink-0">
                <Icon
                  size={22}
                  className={
                    isActive ? "text-white" : "group-hover:text-blue-400"
                  }
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
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <form action={logout}>
          <button
            type="submit"
            title={isCollapsed ? "Logout" : ""}
            className="
            flex items-center gap-4
            px-4 py-3 rounded-xl
            text-sm font-bold
            text-gray-400
            hover:bg-red-500/10 hover:text-red-500
            transition-all group
            w-full text-left
          "
          >
            <div className="shrink-0">
              <LogOut
                size={22}
                className="group-hover:rotate-12 transition-transform"
              />
            </div>
            {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
          </button>
        </form>
      </div>



    </aside>
  );
};

export default Sidebar;
