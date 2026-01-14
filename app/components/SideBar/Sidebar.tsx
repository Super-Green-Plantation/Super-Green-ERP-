"use client";

import {  LayoutDashboard,
  GitBranch,
  Landmark,
  Percent,
  Users,
  User, 
  LogOut,
  IdCardLanyard} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { name: "Dashboard", href: "/features/dashboard", icon: LayoutDashboard  },
  { name: "Branches", href: "/features/branches", icon: GitBranch },
  { name: "Employee", href: "/features/branches/employee", icon: IdCardLanyard },
  { name: "Financial Plans", href: "/features/financial_plans", icon: Landmark },
  { name: "Commissions", href: "/features/commissions", icon: Percent },
  { name: "Clients", href: "/features/clients", icon: Users },
  { name: "Profile", href: "/features/profile", icon: User },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside
      className="
        hidden md:flex
        fixed left-0 top-0
        h-screen w-60
        flex-col
        bg-gray-900 text-gray-100
        border-r border-gray-800
      "
    >
      {/* Logo / Title */}
      <div className="px-6 py-5 text-2xl font-bold tracking-wide">
        SGP ERP
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center gap-3
                px-4 py-2.5 rounded-md
                text-sm font-medium
                transition-colors
                ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }
              `}
            >
              <Icon size={18} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <Link
          href="/logout"
          className="
            flex items-center gap-3
            px-4 py-2.5 rounded-md
            text-sm font-medium
            text-gray-400
            hover:bg-red-500/10 hover:text-red-400
            transition-colors
          "
        >
          <LogOut size={18} />
          Logout
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
