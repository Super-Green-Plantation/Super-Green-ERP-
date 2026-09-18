"use client";

import CommissionAccordionList from "@/app/components/Commission/CommissionAccordionList";
import Heading from "@/app/components/Heading";
import { useState } from "react";
import { Wallet, CalendarClock } from "lucide-react";
import MPCommissionAccordionList from "@/app/components/Commission/MPCommissionAccordionList";

type Tab = "yearly" | "monthly";

const Commission = () => {
  const [tab, setTab] = useState<Tab>("yearly");

  return (
    <div className="min-h-screen w-full space-y-4 px-3 pb-8 pt-4 sm:px-5 lg:px-7">
      {/* Header */}
      <div className="flex flex-col sm:justify-between space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:items-center">
        <Heading>Commission</Heading>
      </div>

      {/* Tab toggle */}
      <div className="flex w-fit gap-1 rounded-lg bg-muted/60 p-1">
        <TabBtn
          active={tab === "yearly"}
          icon={<Wallet className="w-3.5 h-3.5" />}
          onClick={() => setTab("yearly")}
        >
          Yearly Investments
        </TabBtn>
        <TabBtn
          active={tab === "monthly"}
          icon={<CalendarClock className="w-3.5 h-3.5" />}
          onClick={() => setTab("monthly")}
        >
          Monthly Proposals
        </TabBtn>
      </div>

      {/* Content */}
      <div>
        {tab === "yearly"  && <CommissionAccordionList />}
        {tab === "monthly" && <MPCommissionAccordionList />}
      </div>
    </div>
  );
};

function TabBtn({
  active, icon, onClick, children,
}: {
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md border px-3.5 py-2 text-[11px] font-bold uppercase tracking-widest transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow"
          : "bg-card text-muted-foreground border-border hover:border-primary/50"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

export default Commission;