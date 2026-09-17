import { Building2, CalendarDays, ExternalLink, Mail, Phone, User, Users } from "lucide-react";
import Link from "next/link";
import React from "react";

const getInitials = (name?: string) => {
  if (!name) return "CL";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();
};

const formatDate = (value?: string | Date) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatAmount = (value: unknown) => {
  const amount = Number(value || 0);
  return amount > 0 ? `LKR ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "No amount";
};

type ClientRow = {
  id?: number | string;
  fullName?: string;
  phoneMobile?: string;
  email?: string;
  nic?: string;
  status?: string;
  createdAt?: string | Date;
  branch?: { name?: string; code?: string };
  createdBy?: { nameWithInitials?: string; empNo?: string } | null;
  investments?: { id?: number; amount?: number | string }[];
};

type TableProps = { data?: ClientRow[] };

const Table = ({ data = [] }: TableProps) => {
  const clients = data;

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/70">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Users size={16} /></div>
          <div><p className="text-sm font-bold text-foreground">Client directory</p><p className="mt-0.5 text-[10px] font-medium text-muted-foreground">Identity, ownership, branch and investment context</p></div>
        </div>
        <span className="hidden rounded-lg bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground sm:inline-flex">{clients.length} visible</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left">
          <thead>
            <tr className="border-b border-border/70 bg-muted/35">
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">Client identity</th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">Branch / source</th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">Contact</th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">Portfolio</th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">Registered</th>
              <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {clients.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-16 text-center"><div className="mx-auto flex max-w-xs flex-col items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground/50"><User size={21} /></div><div><p className="text-sm font-bold text-foreground">No clients found</p><p className="mt-1 text-xs text-muted-foreground">Try adjusting your search or filters to find a client.</p></div></div></td></tr>
            ) : clients.map((client, index) => {
              const investments = client.investments ?? [];
              const totalAmount = investments.reduce((sum, investment) => sum + Number(investment.amount || 0), 0);
              const status = client.status || "Active";
              return (
                <tr key={client.id ?? index} className="group transition-colors hover:bg-primary/[0.025]">
                  <td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-[11px] font-bold text-primary ring-1 ring-primary/10">{getInitials(client.fullName)}</div><div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{client.fullName || "Unnamed client"}</p><p className="mt-1 text-[10px] font-medium text-muted-foreground">Client #{client.id ?? "—"} <span className="mx-1 text-border">•</span> {client.nic || "NIC pending"}</p><span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${status.toLowerCase() === "active" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{status}</span></div></div></td>
                  <td className="px-5 py-4 sm:px-6"><div className="space-y-2 text-[11px] font-medium"><div className="flex items-center gap-2 text-foreground"><Building2 size={13} className="text-primary" /><span>{client.branch?.name || "Branch not assigned"}</span></div><p className="pl-5 text-[10px] text-muted-foreground">Source: <span className="font-semibold text-foreground/80">{client.createdBy?.nameWithInitials || "System / not recorded"}</span>{client.createdBy?.empNo ? ` · ${client.createdBy.empNo}` : ""}</p></div></td>
                  <td className="px-5 py-4 sm:px-6"><div className="space-y-1.5 text-[11px] font-medium text-muted-foreground"><div className="flex items-center gap-2"><Phone size={12} className="text-muted-foreground/60" /><span>{client.phoneMobile || "No phone added"}</span></div><div className="flex items-center gap-2"><Mail size={12} className="text-muted-foreground/60" /><span className="max-w-[180px] truncate">{client.email || "No email added"}</span></div></div></td>
                  <td className="px-5 py-4 sm:px-6"><p className="text-sm font-bold text-foreground">{investments.length} <span className="text-[10px] font-medium text-muted-foreground">{investments.length === 1 ? "investment" : "investments"}</span></p><p className="mt-1 text-[10px] font-semibold text-primary">{formatAmount(totalAmount)}</p></td>
                  <td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground"><CalendarDays size={13} className="text-muted-foreground/60" />{formatDate(client.createdAt)}</div></td>
                  <td className="px-5 py-4 text-right sm:px-6"><Link href={`/features/clients/${client.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-bold text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary group-hover:border-primary/20">View profile <ExternalLink size={13} /></Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
