"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, History } from "lucide-react";

const tabs = [
  { label: "Users & Access", href: "/features/users", icon: Users },
  { label: "Activity Log", href: "/features/activity-logs", icon: History },
];

export default function AdministrationTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-card/60 backdrop-blur-sm px-3 sm:px-5 lg:px-7 pt-3">
      <nav className="flex gap-2">
        {tabs.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg border-b-2 transition-all ${
                isActive
                  ? "border-primary text-primary bg-primary/10 shadow-sm"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
