"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Eye, Plus, Search, Trash2, Users, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { deleteMonthlyProposal, getMonthlyProposals } from "./actions";
import MonthlyProposalPrintButton from "@/app/components/MonthlyProposals/MonthlyProposalPrintButton";

const labels: Record<string, string> = { CHILD: "Child", MARGE: "Marriage", PENSION: "Retirement", RAN_ASWANU: "Ran Aswanu" };
const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
const frequency = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const initials = (name?: string) => (name || "NA").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export default function MonthlyProposalsPage() {
  const [search, setSearch] = React.useState("");
  const [plan, setPlan] = React.useState("ALL");
  const [activeSearch, setActiveSearch] = React.useState("");
  const { data, isLoading, refetch } = useQuery({ queryKey: ["monthly-proposals"], queryFn: () => getMonthlyProposals(1, 500) });
  const proposals = data?.proposals ?? [];
  const rows = proposals.filter((row: any) => {
    const term = activeSearch.toLowerCase();
    return (plan === "ALL" || row.planType === plan) && (!term || `${row.applicantName} ${row.proposalFormNo} ${row.client?.fullName} ${row.client?.nic}`.toLowerCase().includes(term));
  });

  async function remove(id: number) {
    if (!window.confirm("Delete this proposal?")) return;
    try { await deleteMonthlyProposal(id); toast.success("Proposal deleted"); refetch(); }
    catch (error: any) { toast.error(error.message || "Delete failed"); }
  }

  return (
    <main className="min-h-screen w-full space-y-4 px-3 pb-8 pt-4 sm:px-5 lg:px-7">
      <header className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary"><CalendarClock size={16} /><span className="text-[10px] font-bold uppercase tracking-[0.16em]">Monthly proposals</span></div>
          <h1 className="mt-1 text-xl font-black tracking-tight">Proposal directory</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Compact view of applicant, plan, payment, maturity, and ownership details.</p>
        </div>
        <Link href="/features/monthly-proposals/create" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm"><Plus size={15} /> New Proposal</Link>
      </header>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card px-3 py-2.5 shadow-sm"><div className="rounded-md bg-primary/10 p-2 text-primary"><WalletCards size={15} /></div><div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total proposals</p><p className="text-base font-black tabular-nums">{proposals.length}</p></div></div>
        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card px-3 py-2.5 shadow-sm"><div className="rounded-md bg-primary/10 p-2 text-primary"><Users size={15} /></div><div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Visible results</p><p className="text-base font-black tabular-nums">{rows.length}</p></div></div>
        <div className="col-span-2 flex items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2.5 shadow-sm lg:col-span-1"><div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total maturity value</p><p className="text-base font-black tabular-nums">{money(rows.reduce((sum: number, row: any) => sum + Number(row.maturityAmount || 0), 0))}</p></div><span className="text-[10px] font-semibold text-muted-foreground">filtered scope</span></div>
      </div>

      <section className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card/70 p-2.5 shadow-sm sm:flex-row">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setActiveSearch(search)} placeholder="Search applicant, client, NIC or proposal number" className="w-full rounded-lg border border-border bg-muted/20 py-2 pl-9 pr-3 text-xs outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" /></div>
        <select value={plan} onChange={(e) => setPlan(e.target.value)} className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs font-semibold"><option value="ALL">All plan types</option><option value="CHILD">Child</option><option value="MARGE">Marriage</option><option value="PENSION">Retirement</option><option value="RAN_ASWANU">Ran Aswanu</option></select>
        <button onClick={() => setActiveSearch(search)} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Search</button>
        {(activeSearch || plan !== "ALL") && <button onClick={() => { setSearch(""); setActiveSearch(""); setPlan("ALL"); }} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted">Clear</button>}
      </section>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-left">
            <thead className="border-b border-border/70 bg-muted/30 text-[9px] uppercase tracking-[0.16em] text-muted-foreground"><tr>{["Proposal", "Applicant / client", "Plan", "Payment", "Maturity", "Branch / source", "Status", "Actions"].map((head) => <th key={head} className={`px-4 py-2.5 font-black ${head === "Actions" ? "text-center" : ""}`}>{head}</th>)}</tr></thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? <tr><td colSpan={8} className="px-4 py-12 text-center text-xs text-muted-foreground">Loading proposals…</td></tr> : rows.length === 0 ? <tr><td colSpan={8} className="px-4 py-12 text-center text-xs text-muted-foreground">No monthly proposals found.</td></tr> : rows.map((row: any) => {
                const status = row.status || row.approvalStatus || "PENDING";
                return <tr key={row.id} className="group transition-colors hover:bg-primary/[0.025]">
                  <td className="px-4 py-3"><p className="font-mono text-[11px] font-bold text-primary">{row.proposalFormNo || `#${row.id}`}</p><p className="mt-1 text-[10px] text-muted-foreground">{new Date(row.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">{initials(row.applicantName)}</span><div className="min-w-0"><p className="truncate text-xs font-bold">{row.applicantName}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{row.client?.fullName || row.client?.nic || "Standalone proposal"}</p></div></div></td>
                  <td className="px-4 py-3"><span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{labels[row.planType] || row.planType}</span><p className="mt-1 text-[10px] text-muted-foreground">{row.duration} year{row.duration === 1 ? "" : "s"}</p></td>
                  <td className="px-4 py-3"><p className="text-xs font-bold">{money(row.premium)}</p><p className="mt-1 text-[10px] text-muted-foreground">{frequency(row.frequency)} · premium</p></td>
                  <td className="px-4 py-3"><p className="text-xs font-black text-foreground">{money(row.maturityAmount)}</p><p className="mt-1 text-[10px] text-muted-foreground">{Number(row.interestRate || 0).toFixed(1)}% p.a.</p></td>
                  <td className="px-4 py-3"><p className="text-xs font-semibold">{row.branch?.name || "Branch not assigned"}</p><p className="mt-1 text-[10px] text-muted-foreground">Source: {row.createdBy?.nameWithInitials || "System"}</p></td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${status === "ACTIVE" || status === "APPROVED" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : status === "REJECTED" ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{status}</span></td>
                  <td className="px-4 py-3"><div className="flex items-center justify-center gap-1"><Link title="View" href={`/features/monthly-proposals/${row.id}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"><Eye size={15} /></Link><MonthlyProposalPrintButton data={row} compact /><button title="Delete" onClick={() => remove(row.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={15} /></button></div></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
