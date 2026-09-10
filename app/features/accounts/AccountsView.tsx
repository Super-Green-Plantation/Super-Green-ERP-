"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Leaf,
  Landmark,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  getIncomingInvestments,
  getMonthlyHarvests,
  getOutgoingPayroll,
  getMonthlyExpenses,
  getExpenseCategories,
  createExpense,
  updateExpense,
  deleteExpense,
} from "./actions";

type Harvest = Awaited<ReturnType<typeof getMonthlyHarvests>>[number];
type Investment = Awaited<ReturnType<typeof getIncomingInvestments>>[number];
type Payroll = Awaited<ReturnType<typeof getOutgoingPayroll>>;
type Expense = Awaited<ReturnType<typeof getMonthlyExpenses>>[number];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(n);
const fmtFull = (n: number) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2 }).format(n);
const fmtDate = (v: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(v));
const fmtShort = (v: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(v));

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const monthLabel = (p: string) => { const [y, m] = p.split("-").map(Number); return `${MONTHS[m - 1]} ${y}`; };

type Tab = "harvest" | "investments" | "payroll" | "expenses";
type ModalMode = "create" | "edit";

interface ExpenseModalProps {
  mode: ModalMode;
  initial?: Expense;
  categories: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AccountsView() {
  const today = new Date();
  const currentPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [globalPeriod, setGlobalPeriod] = useState(currentPeriod);
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "alltime">("month");
  const [expensePeriodStr, setExpensePeriodStr] = useState(currentPeriod);
  const [dateStr, setDateStr] = useState(today.toISOString().split("T")[0]);
  const [weekStr, setWeekStr] = useState(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const wn = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(wn).padStart(2, "0")}`;
  });

  const [tab, setTab] = useState<Tab>("investments");
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [modal, setModal] = useState<{ mode: ModalMode; expense?: Expense } | null>(null);
  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const globalDateRange = useMemo(() => {
    const [year, month] = globalPeriod.split("-").map(Number);
    return {
      start: new Date(Date.UTC(year, month - 1, 1)),
      end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
    };
  }, [globalPeriod]);

  const expenseDateRange = useMemo(() => {
    let start: Date, end: Date;
    if (timeframe === "day") {
      start = new Date(dateStr + "T00:00:00Z");
      end = new Date(dateStr + "T23:59:59.999Z");
    } else if (timeframe === "week") {
      const [y, w] = weekStr.split("-W");
      const simple = new Date(parseInt(y), 0, 1 + (parseInt(w) - 1) * 7);
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
      getMonthlyExpenses(expenseDateRange.start, expenseDateRange.end),
      getExpenseCategories(),
    ])
      .then(([h, i, p, e, cats]) => {
        if (!active) return;
        setHarvests(h); setInvestments(i); setPayroll(p); setExpenses(e); setCategories(cats);
      })
      .catch((r) => active && setError(r instanceof Error ? r.message : "Unable to load accounts data."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  };

  useEffect(() => loadData(), [globalDateRange, expenseDateRange]);

  const harvestWeeks = useMemo(
    () => [1, 2, 3, 4].map((w) => ({ week: w, rows: harvests.filter((h) => h.week === w) })),
    [harvests]
  );

  const harvestTotal = harvests.reduce((t, r) => t + r.amount, 0);
  const investmentTotal = investments.reduce((t, r) => t + r.amount, 0);
  const expenseTotal = expenses.reduce((t, r) => t + r.amount, 0);
  const payrollTotal = (payroll?.payrollGross ?? 0) + (payroll?.commissionTotal ?? 0);
  const totalOutgoing = harvestTotal + expenseTotal + payrollTotal;
  const netCashflow = investmentTotal - totalOutgoing;
  const isPositive = netCashflow >= 0;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; amount: number; color: string }[] = [
    { id: "investments", label: "Income", icon: <ArrowDownLeft className="h-3.5 w-3.5" />, amount: investmentTotal, color: "text-emerald-600" },
    { id: "harvest", label: "Harvest", icon: <Leaf className="h-3.5 w-3.5" />, amount: harvestTotal, color: "text-amber-600" },
    { id: "payroll", label: "Payroll", icon: <Users className="h-3.5 w-3.5" />, amount: payrollTotal, color: "text-blue-600" },
    { id: "expenses", label: "Expenses", icon: <ReceiptText className="h-3.5 w-3.5" />, amount: expenseTotal, color: "text-red-500" },
  ];

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExpense(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (e: any) {
      alert(e.message || "Failed to delete expense.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f0f4f2] pb-10">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-[#0e2a1f] px-5 pt-6 pb-8">
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full border border-white/5" />
        <div className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full border border-white/5" />

        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] font-medium tracking-widest text-white/40 uppercase mb-0.5">Super Green Plantation</p>
            <h1 className="text-[17px] font-semibold text-white">Accounts Overview</h1>
          </div>
          <label className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70 cursor-pointer hover:bg-white/15 transition-colors">
            <CalendarDays className="h-3.5 w-3.5" />
            <input aria-label="Reporting month" type="month" value={globalPeriod}
              onChange={(e) => setGlobalPeriod(e.target.value)}
              className="bg-transparent outline-none text-xs w-[7rem]" />
          </label>
        </div>

        <div className="mb-1">
          <p className="text-xs text-white/40 mb-1">Net Cash-flow · {monthLabel(globalPeriod)}</p>
          <p className={`text-[2.75rem] font-bold leading-none tracking-tight ${isPositive ? "text-[#4ade80]" : "text-[#f87171]"}`}>
            {loading ? <span className="text-2xl text-white/20">Calculating…</span> : fmt(netCashflow)}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/8 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] text-white/50">Total Income</span>
            </div>
            <p className="text-base font-semibold text-white">{loading ? "—" : fmt(investmentTotal)}</p>
          </div>
          <div className="rounded-xl bg-white/8 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />
              <span className="text-[11px] text-white/50">Total Outgoing</span>
            </div>
            <p className="text-base font-semibold text-white">{loading ? "—" : fmt(totalOutgoing)}</p>
          </div>
        </div>
      </div>

      {/* ── Stats / Tab Strip ── */}
      <div className="px-4 -mt-2">
        <div className="grid grid-cols-4 gap-2 rounded-2xl bg-white shadow-sm border border-black/5 p-3">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1 rounded-xl py-2.5 px-1 transition-colors ${tab === t.id ? "bg-[#f0f4f2]" : "hover:bg-gray-50"}`}>
              <span className={`${t.color} ${tab === t.id ? "opacity-100" : "opacity-60"}`}>{t.icon}</span>
              <span className={`text-[10px] font-medium ${tab === t.id ? "text-gray-800" : "text-gray-400"}`}>{t.label}</span>
              <span className={`text-[11px] font-bold ${tab === t.id ? t.color : "text-gray-500"}`}>
                {loading ? "…" : fmt(t.amount)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Add Expense button (expenses tab only) ── */}
      {tab === "expenses" && (
        <div className="px-4 mt-4 flex justify-end">
          <button onClick={() => setModal({ mode: "create" })}
            className="flex items-center gap-2 rounded-full bg-[#24b47e] px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#1d9a6b] active:scale-95 transition-all">
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>
      )}

      {/* ── Transaction Panel ── */}
      <div className="px-4 mt-3">
        <div className="rounded-2xl bg-white shadow-sm border border-black/5 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className={tabs.find((t) => t.id === tab)?.color}>
                {tabs.find((t) => t.id === tab)?.icon}
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {tab === "investments" && "Incoming Investments"}
                {tab === "harvest" && "Monthly Harvest"}
                {tab === "payroll" && "Salaries & Commissions"}
                {tab === "expenses" && "Expenses"}
              </span>
            </div>

            {tab === "expenses" && (
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {(["day", "week", "month", "alltime"] as const).map((tf) => (
                  <button key={tf} onClick={() => setTimeframe(tf)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${timeframe === tf ? "bg-[#24b47e] text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                    {tf === "alltime" ? "All" : tf.charAt(0).toUpperCase() + tf.slice(1)}
                  </button>
                ))}
                {timeframe === "day" && (
                  <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)}
                    className="ml-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] outline-none" />
                )}
                {timeframe === "week" && (
                  <input type="week" value={weekStr} onChange={(e) => setWeekStr(e.target.value)}
                    className="ml-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] outline-none" />
                )}
                {timeframe === "month" && (
                  <input type="month" value={expensePeriodStr} onChange={(e) => setExpensePeriodStr(e.target.value)}
                    className="ml-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] outline-none" />
                )}
              </div>
            )}
          </div>

          {/* Body */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#24b47e] border-t-transparent" />
              <p className="mt-3 text-xs text-gray-400">Loading data…</p>
            </div>
          ) : error ? (
            <div className="m-4 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">{error}</div>
          ) : (
            <>
              {tab === "investments" && <InvestmentsList rows={investments} total={investmentTotal} />}
              {tab === "harvest" && <HarvestList weeks={harvestWeeks} total={harvestTotal} />}
              {tab === "payroll" && payroll && <PayrollBreakdown payroll={payroll} />}
              {tab === "expenses" && (
                <ExpensesList
                  rows={expenses}
                  total={expenseTotal}
                  onEdit={(exp) => setModal({ mode: "edit", expense: exp })}
                  onDelete={(exp) => setDeleteTarget(exp)}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Expense Modal (create / edit) ── */}
      {modal && (
        <ExpenseModal
          mode={modal.mode}
          initial={modal.expense}
          categories={categories}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); loadData(); }}
        />
      )}

      {/* ── Delete Confirm Sheet ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="px-5 py-5">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mx-auto mb-4">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-center text-base font-bold text-gray-900 mb-1">Delete Expense?</h3>
              <p className="text-center text-sm text-gray-500 mb-1">
                <span className="font-medium text-gray-700">{deleteTarget.category}</span>
                {deleteTarget.description ? ` — ${deleteTarget.description}` : ""}
              </p>
              <p className="text-center text-sm font-semibold text-red-500 mb-5">{fmtFull(deleteTarget.amount)}</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeleteConfirm} disabled={deleting}
                  className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-colors">
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ─── Shared helpers ──────────────────────────────────────── */

function TotalRow({ label, value, color = "text-gray-800" }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{fmtFull(value)}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="py-14 text-center"><p className="text-sm text-gray-400">{message}</p></div>;
}

/* ─── Tab panels ──────────────────────────────────────────── */

function InvestmentsList({ rows, total }: { rows: Investment[]; total: number }) {
  if (!rows.length) return <EmptyState message="No investments received this period." />;
  return (
    <div>
      <div className="divide-y divide-gray-50">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <Landmark className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800">{row.clientName}</p>
              <p className="text-xs text-gray-400">{row.plan}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-emerald-600">+{fmtFull(row.amount)}</p>
              <p className="text-[11px] text-gray-400">{fmtShort(row.receivedAt)}</p>
            </div>
          </div>
        ))}
      </div>
      <TotalRow label="Total received" value={total} color="text-emerald-600" />
    </div>
  );
}

function HarvestList({ weeks, total }: { weeks: { week: number; rows: Harvest[] }[]; total: number }) {
  const hasAny = weeks.some((w) => w.rows.length > 0);
  if (!hasAny) return <EmptyState message="No harvest payments due this period." />;
  return (
    <div>
      {weeks.map(({ week, rows }) =>
        rows.length === 0 ? null : (
          <div key={week}>
            <div className="px-4 py-2 bg-amber-50/60 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-700 tracking-wide">WEEK {week}</span>
              <span className="text-[11px] text-amber-500">{rows.length} payments · {fmt(rows.reduce((s, r) => s + r.amount, 0))}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
                    <Leaf className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{row.clientName}</p>
                    <p className="text-xs text-gray-400">{row.plan}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-amber-700">{fmtFull(row.amount)}</p>
                    <p className="text-[11px] text-gray-400">{fmtShort(row.paymentDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
      <TotalRow label="Total harvest due" value={total} color="text-amber-700" />
    </div>
  );
}

function PayrollBreakdown({ payroll }: { payroll: Payroll }) {
  const items = [
    { label: "Gross payroll cost", value: payroll.payrollGross, icon: <Users className="h-4 w-4 text-blue-500" /> },
    { label: "Net pay to employees", value: payroll.payrollNet, icon: <Wallet className="h-4 w-4 text-blue-400" /> },
    { label: "Total commissions", value: payroll.commissionTotal, icon: <TrendingUp className="h-4 w-4 text-indigo-500" /> },
  ];
  return (
    <div>
      <div className="divide-y divide-gray-50">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">{item.icon}</div>
            <span className="flex-1 text-sm text-gray-700">{item.label}</span>
            <span className="text-sm font-semibold text-gray-800">{fmtFull(item.value)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Payroll records:</span>
          <span className="text-xs font-bold text-gray-600">{payroll.payrollCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Commission records:</span>
          <span className="text-xs font-bold text-gray-600">{payroll.commissionCount}</span>
        </div>
      </div>
      <TotalRow label="Total payroll outgoing" value={payroll.payrollGross + payroll.commissionTotal} color="text-blue-600" />
    </div>
  );
}

function ExpensesList({
  rows, total, onEdit, onDelete,
}: {
  rows: Expense[]; total: number;
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => void;
}) {
  if (!rows.length) return <EmptyState message="No expenses recorded for this period." />;

  // Group by category
  const grouped = rows.reduce<Record<string, Expense[]>>((acc, row) => {
    (acc[row.category] = acc[row.category] || []).push(row);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="px-4 py-2 bg-red-50/40 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-red-600 tracking-wide uppercase">{category}</span>
            <span className="text-[11px] text-red-400">{fmt(items.reduce((s, r) => s + r.amount, 0))}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map((row) => (
              <div key={row.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
                  <ReceiptText className="h-4 w-4 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800">{row.description || row.category}</p>
                  <p className="text-[11px] text-gray-400">{row.createdBy}</p>
                </div>
                {/* Edit / Delete — visible on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => onEdit(row)}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-blue-50 transition-colors"
                    title="Edit expense"
                  >
                    <Pencil className="h-3.5 w-3.5 text-blue-500" />
                  </button>
                  <button
                    onClick={() => onDelete(row)}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                    title="Delete expense"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
                <div className="text-right shrink-0 ml-1">
                  <p className="text-sm font-semibold text-red-500">−{fmtFull(row.amount)}</p>
                  <p className="text-[11px] text-gray-400">{fmtShort(row.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <TotalRow label="Total expenses" value={total} color="text-red-500" />
    </div>
  );
}

/* ─── Expense Modal (create & edit) ──────────────────────── */

function CategoryInput({
  value,
  onChange,
  categories,
}: {
  value: string;
  onChange: (v: string) => void;
  categories: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = value.trim().length === 0
    ? categories
    : categories.filter((c) => c.toLowerCase().includes(value.toLowerCase()));

  const isNew = value.trim().length > 0 && !categories.some((c) => c.toLowerCase() === value.trim().toLowerCase());

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        required
        type="text"
        value={value}
        placeholder="e.g. Utility Bills, Travel"
        onFocus={() => setOpen(true)}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#24b47e] focus:ring-2 focus:ring-[#24b47e]/20 transition-all"
      />
      {open && (filtered.length > 0 || isNew) && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {filtered.map((cat) => (
            <button
              key={cat}
              type="button"
              onMouseDown={() => { onChange(cat); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-[#f0f4f2] transition-colors ${
                cat.toLowerCase() === value.toLowerCase() ? "text-[#24b47e] font-medium" : "text-gray-700"
              }`}
            >
              {cat}
              {cat.toLowerCase() === value.toLowerCase() && <Check className="h-3.5 w-3.5 text-[#24b47e]" />}
            </button>
          ))}
          {isNew && (
            <button
              type="button"
              onMouseDown={() => { setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-[#24b47e] font-medium hover:bg-emerald-50 border-t border-gray-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Create "{value.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ExpenseModal({ mode, initial, categories, onClose, onSuccess }: ExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(
    initial ? initial.date.slice(0, 10) : new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState(initial?.description ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim()) { setError("Category is required."); return; }
    setLoading(true);
    setError("");
    try {
      const payload = { amount: Number(amount), category, description, date };
      if (mode === "edit" && initial) {
        await updateExpense(initial.id, payload);
      } else {
        await createExpense(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save expense.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {mode === "edit" ? "Edit Expense" : "New Expense"}
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Date</label>
              <input
                required type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#24b47e] focus:ring-2 focus:ring-[#24b47e]/20 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Amount (LKR)</label>
              <input
                required type="number" step="0.01" placeholder="0.00" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#24b47e] focus:ring-2 focus:ring-[#24b47e]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Category
              <span className="ml-1.5 text-gray-400 font-normal">— select or type a new one</span>
            </label>
            <CategoryInput value={category} onChange={setCategory} categories={categories} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text" placeholder="Notes about this expense" value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#24b47e] focus:ring-2 focus:ring-[#24b47e]/20 transition-all"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-xl bg-[#24b47e] py-2.5 text-sm font-semibold text-white hover:bg-[#1d9a6b] disabled:opacity-60 transition-colors">
              {loading ? "Saving…" : mode === "edit" ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}