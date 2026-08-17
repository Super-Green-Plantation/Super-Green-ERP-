"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, Landmark, ReceiptText, Wallet } from "lucide-react";
import { getIncomingInvestments, getMonthlyHarvests, getOutgoingPayroll } from "./actions";

type Harvest = Awaited<ReturnType<typeof getMonthlyHarvests>>[number];
type Investment = Awaited<ReturnType<typeof getIncomingInvestments>>[number];
type Payroll = Awaited<ReturnType<typeof getOutgoingPayroll>>;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2 }).format(amount);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));

export default function AccountsView() {
  const today = new Date();
  const [period, setPeriod] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
  const [tab, setTab] = useState<"harvest" | "investments" | "payroll">("harvest");
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [year, month] = period.split("-").map(Number);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([getMonthlyHarvests(year, month), getIncomingInvestments(year, month), getOutgoingPayroll(year, month)])
      .then(([nextHarvests, nextInvestments, nextPayroll]) => {
        if (!active) return;
        setHarvests(nextHarvests);
        setInvestments(nextInvestments);
        setPayroll(nextPayroll);
      })
      .catch((reason) => active && setError(reason instanceof Error ? reason.message : "Unable to load accounts data."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [year, month]);

  const harvestWeeks = useMemo(() => [1, 2, 3, 4].map((week) => ({
    week,
    rows: harvests.filter((harvest) => harvest.week === week),
  })), [harvests]);
  const harvestTotal = harvests.reduce((total, row) => total + row.amount, 0);
  const investmentTotal = investments.reduce((total, row) => total + row.amount, 0);

  return (
    <main className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">Monthly incoming and outgoing cash-flow overview.</p>
        </div>
        <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium">
          <CalendarDays className="h-4 w-4" />
          <input aria-label="Reporting month" className="bg-transparent outline-none" type="month" value={period} onChange={(event) => setPeriod(event.target.value)} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={<Wallet />} label="Harvest due" value={formatCurrency(harvestTotal)} />
        <SummaryCard icon={<Landmark />} label="Investment income" value={formatCurrency(investmentTotal)} />
        <SummaryCard icon={<ReceiptText />} label="Payroll & commissions" value={formatCurrency((payroll?.payrollGross ?? 0) + (payroll?.commissionTotal ?? 0))} />
      </div>

      <div className="flex gap-2 border-b" role="tablist">
        <TabButton active={tab === "harvest"} onClick={() => setTab("harvest")} icon={<CalendarDays />} label="Monthly Harvest" />
        <TabButton active={tab === "investments"} onClick={() => setTab("investments")} icon={<Landmark />} label="Investments" />
        <TabButton active={tab === "payroll"} onClick={() => setTab("payroll")} icon={<BookOpen />} label="Salaries / Commissions" />
      </div>

      {loading ? <p className="py-12 text-center text-sm text-muted-foreground">Loading accounts data…</p> : error ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : (
        <section className="rounded-xl border bg-card shadow-sm">
          {tab === "harvest" && <HarvestTable weeks={harvestWeeks} />}
          {tab === "investments" && <InvestmentsTable rows={investments} total={investmentTotal} />}
          {tab === "payroll" && payroll && <PayrollSummary payroll={payroll} />}
        </section>
      )}
    </main>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border bg-card p-4 shadow-sm"><div className="mb-3 flex items-center gap-2 text-muted-foreground">{icon}<span className="text-sm">{label}</span></div><p className="text-xl font-bold">{value}</p></div>;
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button role="tab" aria-selected={active} onClick={onClick} className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{icon}{label}</button>;
}

function HarvestTable({ weeks }: { weeks: { week: number; rows: Harvest[] }[] }) {
  return <div className="divide-y">{weeks.map(({ week, rows }) => <div key={week} className="p-4"><h2 className="mb-3 font-semibold">Week {week} <span className="text-sm font-normal text-muted-foreground">({rows.length} payments)</span></h2><DataTable headers={["Payment date", "Client", "Plan", "Amount"]} rows={rows.map((row) => [formatDate(row.paymentDate), row.clientName, row.plan, formatCurrency(row.amount)])} empty="No harvest payments due." /></div>)}</div>;
}

function InvestmentsTable({ rows, total }: { rows: Investment[]; total: number }) {
  return <div className="p-4"><div className="mb-4 flex justify-between"><h2 className="font-semibold">Incoming investments</h2><span className="font-semibold text-emerald-600">{formatCurrency(total)}</span></div><DataTable headers={["Received date", "Client", "Plan", "Capital received"]} rows={rows.map((row) => [formatDate(row.receivedAt), row.clientName, row.plan, formatCurrency(row.amount)])} empty="No investments received in this month." /></div>;
}

function PayrollSummary({ payroll }: { payroll: Payroll }) {
  const items: Array<[string, number]> = [
    ["MonthlyPayroll total (net pay)", payroll.payrollNet],
    ["MonthlyPayroll gross cost", payroll.payrollGross],
    ["Payroll records", payroll.payrollCount],
    ["Commissions", payroll.commissionTotal],
    ["Commission records", payroll.commissionCount],
  ];
  return <div className="p-4"><h2 className="mb-4 font-semibold">Salaries and commissions</h2><dl className="grid gap-3 sm:grid-cols-2">{items.map(([label, value]) => <div key={String(label)} className="rounded-lg bg-muted/50 p-4"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-bold">{label.endsWith("records") ? value : formatCurrency(value)}</dd></div>)}</dl></div>;
}

function DataTable({ headers, rows, empty }: { headers: string[]; rows: string[][]; empty: string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y bg-muted/40 text-muted-foreground"><tr>{headers.map((header) => <th key={header} className="px-3 py-2 font-medium">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-b last:border-0">{row.map((cell, cellIndex) => <td key={cellIndex} className={`px-3 py-3 ${cellIndex === row.length - 1 ? "font-medium" : ""}`}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
