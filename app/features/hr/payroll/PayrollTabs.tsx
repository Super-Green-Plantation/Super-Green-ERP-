"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const tabs = [
  { label: "Marketing Payroll", href: "/features/hr/payroll" },
  { label: "Head Office", href: "/features/hr/payroll/ho-payroll" },
];

export default function PayrollTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  return (
    <div className="border-b border-border bg-card px-4 sm:px-8 pt-6">
      <nav className="flex gap-1">
        {tabs.map(({ label, href }) => {
          const isActive = href === "/features/hr/payroll"
            ? pathname === href
            : pathname.startsWith(href);

          const params = new URLSearchParams();
          if (year) params.set("year", year);
          if (month) params.set("month", month);
          const fullHref = params.size > 0 ? `${href}?${params.toString()}` : href;

          return (
            <Link
              key={href}
              href={fullHref}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-t-lg border-b-2 transition-all ${
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}