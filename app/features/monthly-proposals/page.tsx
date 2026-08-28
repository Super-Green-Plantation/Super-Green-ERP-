"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Eye, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMonthlyProposal, getMonthlyProposals } from "./actions";
import MonthlyProposalPrintButton from "@/app/components/MonthlyProposals/MonthlyProposalPrintButton";

const labels: Record<string, string> = { CHILD: "Child", MARGE: "Marriage", PENSION: "Retirement" };
const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;

export default function MonthlyProposalsPage() {
  const [search, setSearch] = React.useState("");
  const [plan, setPlan] = React.useState("ALL");
  const [activeSearch, setActiveSearch] = React.useState("");
  const { data, isLoading, refetch } = useQuery({ queryKey: ["monthly-proposals"], queryFn: () => getMonthlyProposals(1, 500) });
  const rows = (data?.proposals ?? []).filter((row: any) => {
    const term = activeSearch.toLowerCase();
    return (plan === "ALL" || row.planType === plan) && (!term || `${row.applicantName} ${row.proposalFormNo}`.toLowerCase().includes(term));
  });
  async function remove(id: number) { if (!window.confirm("Delete this proposal?")) return; try { await deleteMonthlyProposal(id); toast.success("Proposal deleted"); refetch(); } catch (error: any) { toast.error(error.message || "Delete failed"); } }
  return <main className="mx-auto min-h-screen w-full max-w-[1480px] space-y-5 px-4 pb-12 pt-6 sm:px-7">
    <header className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-primary"><CalendarClock size={18} /><span className="text-xs font-bold uppercase tracking-widest">Investments</span></div><h1 className="mt-2 text-2xl font-black tracking-tight">Monthly Proposals</h1><p className="mt-1 text-sm text-muted-foreground">Standalone retirement, child, and marriage plan proposals.</p></div><Link href="/features/monthly-proposals/create" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><Plus size={17} /> New Proposal</Link></header>
    <section className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setActiveSearch(search)} placeholder="Search applicant or proposal number" className="w-full rounded-xl border border-border bg-muted/20 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" /></div><select value={plan} onChange={(e) => setPlan(e.target.value)} className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm"><option value="ALL">All plan types</option><option value="CHILD">Child</option><option value="MARGE">Marriage</option><option value="PENSION">Retirement</option></select><button onClick={() => setActiveSearch(search)} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Search</button></section>
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-sm"><table className="min-w-[980px] w-full text-left text-sm"><thead className="bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground"><tr>{["Proposal No.", "Plan Type", "Applicant", "Duration", "Frequency", "Premium", "Maturity", "Created", "Actions"].map((head) => <th key={head} className="px-4 py-3 font-black">{head}</th>)}</tr></thead><tbody className="divide-y divide-border/60">{isLoading ? <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">Loading proposals…</td></tr> : rows.length === 0 ? <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No monthly proposals found.</td></tr> : rows.map((row: any) => <tr key={row.id} className="hover:bg-muted/20"><td className="px-4 py-3 font-bold text-primary">{row.proposalFormNo || "—"}</td><td className="px-4 py-3">{labels[row.planType] || row.planType}</td><td className="px-4 py-3 font-semibold">{row.applicantName}</td><td className="px-4 py-3">{row.duration} yr</td><td className="px-4 py-3">{String(row.frequency).replace("_", " ")}</td><td className="px-4 py-3">{money(row.premium)}</td><td className="px-4 py-3">{money(row.maturityAmount)}</td><td className="px-4 py-3 text-muted-foreground">{new Date(row.createdAt).toLocaleDateString()}</td><td className="px-4 py-3"><div className="flex items-center gap-1"><Link title="View" href={`/features/monthly-proposals/${row.id}`} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary"><Eye size={16} /></Link><MonthlyProposalPrintButton data={row} compact /><button title="Delete" onClick={() => remove(row.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
  </main>;
}

import * as React from "react";
