"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, Landmark, ReceiptText, Wallet } from "lucide-react";
import { getIncomingInvestments, getMonthlyHarvests, getOutgoingPayroll, getMonthlyExpenses, createExpense } from "./actions";

type Harvest = Awaited<ReturnType<typeof getMonthlyHarvests>>[number];
type Investment = Awaited<ReturnType<typeof getIncomingInvestments>>[number];
type Payroll = Awaited<ReturnType<typeof getOutgoingPayroll>>;
type Expense = Awaited<ReturnType<typeof getMonthlyExpenses>>[number];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2 }).format(amount);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));

export default function AccountsView() {
  const today = new Date();

  const [globalPeriod, setGlobalPeriod] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "alltime">("month");
  const [expensePeriodStr, setExpensePeriodStr] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );
  const [dateStr, setDateStr] = useState(today.toISOString().split("T")[0]);
  const [weekStr, setWeekStr] = useState(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  });

  const [tab, setTab] = useState<"harvest" | "investments" | "payroll" | "expenses">("harvest");
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const globalDateRange = useMemo(() => {
    const [year, month] = globalPeriod.split("-").map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { start, end };
  }, [globalPeriod]);

  const expenseDateRange = useMemo(() => {
    let start: Date;
    let end: Date;

    if (timeframe === "day") {
      start = new Date(dateStr + "T00:00:00Z");
      end = new Date(dateStr + "T23:59:59.999Z");
    } else if (timeframe === "week") {
      const [y, w] = weekStr.split("-W");
      const year = parseInt(y, 10);
      const week = parseInt(w, 10);
      const simple = new Date(year, 0, 1 + (week - 1) * 7);
      const dow = simple.getDay();
      start = new Date(simple);
      start.setDate(simple.getDate() - dow + (dow === 0 ? -6 : 1));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (timeframe === "month") {
      const [y, m] = expensePeriodStr.split("-").map(Number);
      start = new Date(Date.UTC(y, m - 1, 1));
      end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    } else {
      start = new Date("2000-01-01T00:00:00Z");
      end = new Date("2100-01-01T00:00:00Z");
    }
    return { start, end };
  }, [timeframe, dateStr, weekStr, expensePeriodStr]);

  const loadData = () => {
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      getMonthlyHarvests(globalDateRange.start, globalDateRange.end),
      getIncomingInvestments(globalDateRange.start, globalDateRange.end),
      getOutgoingPayroll(globalDateRange.start, globalDateRange.end),
      getMonthlyExpenses(expenseDateRange.start, expenseDateRange.end)
    ])
      .then(([nextHarvests, nextInvestments, nextPayroll, nextExpenses]) => {
        if (!active) return;
        setHarvests(nextHarvests);
        setInvestments(nextInvestments);
        setPayroll(nextPayroll);
        setExpenses(nextExpenses);
      })
      .catch((reason) => active && setError(reason instanceof Error ? reason.message : "Unable to load accounts data."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  };

  useEffect(() => {
    return loadData();
  }, [globalDateRange, expenseDateRange]);

  const harvestWeeks = useMemo(() => [1, 2, 3, 4].map((week) => ({
    week,
    rows: harvests.filter((harvest) => harvest.week === week),
  })), [harvests]);
  const harvestTotal = harvests.reduce((total, row) => total + row.amount, 0);
  const investmentTotal = investments.reduce((total, row) => total + row.amount, 0);
  const expenseTotal = expenses.reduce((total, row) => total + row.amount, 0);
  
  const payrollTotal = (payroll?.payrollGross ?? 0) + (payroll?.commissionTotal ?? 0);
  const totalOutgoing = harvestTotal + expenseTotal + payrollTotal;
  const totalIncome = investmentTotal;
  const netProfit = totalIncome - totalOutgoing;
  const outgoingPercentage = totalIncome > 0 ? (totalOutgoing / totalIncome) * 100 : 0;

  return (
    <main className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">Incoming and outgoing cash-flow overview.</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium">
            <CalendarDays className="h-4 w-4" />
            <input aria-label="Reporting month" className="bg-transparent outline-none" type="month" value={globalPeriod} onChange={(event) => setGlobalPeriod(event.target.value)} />
          </label>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add Expense
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard icon={<Landmark />} label="Income (Investments)" value={formatCurrency(totalIncome)} />
        <SummaryCard icon={<Wallet />} label="Total Outgoing" value={formatCurrency(totalOutgoing)} 
          subText={totalIncome > 0 ? `${outgoingPercentage.toFixed(1)}% of Income` : undefined} />
        <SummaryCard icon={<ReceiptText />} label="Net Cash-flow" value={formatCurrency(netProfit)} 
          className={netProfit >= 0 ? "text-emerald-600" : "text-red-600"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mt-4">
        <SummaryCard icon={<Wallet />} label="Harvest due" value={formatCurrency(harvestTotal)} />
        <SummaryCard icon={<ReceiptText />} label="Payroll & commissions" value={formatCurrency(payrollTotal)} />
        <SummaryCard icon={<BookOpen />} label="Expenses" value={formatCurrency(expenseTotal)} />
      </div>

      <div className="flex gap-2 border-b" role="tablist">
        <TabButton active={tab === "harvest"} onClick={() => setTab("harvest")} icon={<CalendarDays />} label="Monthly Harvest" />
        <TabButton active={tab === "investments"} onClick={() => setTab("investments")} icon={<Landmark />} label="Investments" />
        <TabButton active={tab === "payroll"} onClick={() => setTab("payroll")} icon={<BookOpen />} label="Salaries / Commissions" />
        <TabButton active={tab === "expenses"} onClick={() => setTab("expenses")} icon={<ReceiptText />} label="Expenses" />
      </div>

      {loading ? <p className="py-12 text-center text-sm text-muted-foreground">Loading accounts data…</p> : error ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : (
        <section className="rounded-xl border bg-card shadow-sm">
          {tab === "harvest" && <HarvestTable weeks={harvestWeeks} />}
          {tab === "investments" && <InvestmentsTable rows={investments} total={investmentTotal} />}
          {tab === "payroll" && payroll && <PayrollSummary payroll={payroll} />}
          {tab === "expenses" && (
            <div>
              <div className="border-b p-4 flex justify-between items-center bg-muted/20">
                <h2 className="text-sm font-medium text-muted-foreground">Filter Expenses</h2>
                <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1 shadow-sm">
                  <CalendarDays className="h-4 w-4 ml-2 text-muted-foreground" />
                  <select
                    value={timeframe}
                    onChange={e => setTimeframe(e.target.value as any)}
                    className="bg-transparent outline-none text-sm font-medium pr-2 cursor-pointer"
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="alltime">All Time</option>
                  </select>
                  <div className="w-px h-4 bg-border mx-1" />
                  {timeframe === "day" && (
                    <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} className="bg-transparent outline-none text-sm font-medium cursor-pointer" />
                  )}
                  {timeframe === "week" && (
                    <input type="week" value={weekStr} onChange={e => setWeekStr(e.target.value)} className="bg-transparent outline-none text-sm font-medium cursor-pointer" />
                  )}
                  {timeframe === "month" && (
                    <input type="month" value={expensePeriodStr} onChange={e => setExpensePeriodStr(e.target.value)} className="bg-transparent outline-none text-sm font-medium cursor-pointer" />
                  )}
                  {timeframe === "alltime" && (
                    <span className="text-sm text-muted-foreground px-2 font-medium">All Time</span>
                  )}
                </div>
              </div>
              <ExpensesTable rows={expenses} total={expenseTotal} />
            </div>
          )}
        </section>
      )}

      {isExpenseModalOpen && (
        <ExpenseModal
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={() => {
            setIsExpenseModalOpen(false);
            loadData();
          }}
        />
      )}
    </main>
  );
}

function ExpenseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const date = fd.get("date") as string;
    const amount = Number(fd.get("amount"));
    const category = fd.get("category") as string;
    const description = fd.get("description") as string;

    try {
      await createExpense({ date, amount, category, description });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Add Expense</h2>
        {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Date</label>
            <input required name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="w-full rounded border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Amount</label>
            <input required name="amount" type="number" step="0.01" placeholder="0.00" className="w-full rounded border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <input required name="category" type="text" placeholder="e.g. Utility Bills, Travel" className="w-full rounded border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <input name="description" type="text" placeholder="Optional notes" className="w-full rounded border px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              {loading ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, subText, className }: { icon: React.ReactNode; label: string; value: string; subText?: string; className?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className={`text-xl font-bold ${className || ""}`}>{value}</p>
      {subText && <p className="mt-1 text-xs text-muted-foreground">{subText}</p>}
    </div>
  );
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

function ExpensesTable({ rows, total }: { rows: Expense[]; total: number }) {
  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between">
        <h2 className="font-semibold">Monthly Expenses</h2>
        <span className="font-semibold text-red-600">{formatCurrency(total)}</span>
      </div>
      <DataTable
        headers={["Date", "Category", "Description", "Amount", "Added By"]}
        rows={rows.map((row) => [
          formatDate(row.date),
          row.category,
          row.description || "—",
          formatCurrency(row.amount),
          row.createdBy,
        ])}
        empty="No expenses recorded for this month."
      />
    </div>
  );
}

function DataTable({ headers, rows, empty }: { headers: string[]; rows: string[][]; empty: string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y bg-muted/40 text-muted-foreground"><tr>{headers.map((header) => <th key={header} className="px-3 py-2 font-medium">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-b last:border-0">{row.map((cell, cellIndex) => <td key={cellIndex} className={`px-3 py-3 ${cellIndex === row.length - 1 ? "font-medium" : ""}`}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
