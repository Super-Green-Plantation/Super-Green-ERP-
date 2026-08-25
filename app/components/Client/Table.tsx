import { ExternalLink, Mail, Phone, User, Users } from "lucide-react";
import Link from "next/link";
import React from "react";

const getInitials = (name?: string) => {
  if (!name) return "CL";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();
};

type ClientRow = {
  id?: number | string;
  fullName?: string;
  phoneMobile?: string;
  email?: string;
  nic?: string;
};

type TableProps = { data?: ClientRow[] };

const Table = ({ data = [] }: TableProps) => {
  const clients = data;

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-card">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Users size={16} /></div>
          <div><p className="text-sm font-bold text-foreground">Client directory</p><p className="mt-0.5 text-[10px] font-medium text-muted-foreground">Manage and view client profiles</p></div>
        </div>
        <span className="hidden rounded-lg bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground sm:inline-flex">{clients.length} visible</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-border/70 bg-muted/35">
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">Client</th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">Contact</th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">NIC / ID</th>
              <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground/50"><User size={21} /></div>
                    <div><p className="text-sm font-bold text-foreground">No clients found</p><p className="mt-1 text-xs text-muted-foreground">Try adjusting your search or filters to find a client.</p></div>
                  </div>
                </td>
              </tr>
            ) : (
              clients.map((client, index) => (
                <tr key={client.id ?? index} className="group transition-colors hover:bg-primary/[0.025]">
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-[11px] font-bold text-primary ring-1 ring-primary/10">{getInitials(client.fullName)}</div>
                      <div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{client.fullName || "Unnamed client"}</p><p className="mt-0.5 text-[10px] font-medium text-muted-foreground">Client #{client.id ?? "—"}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <div className="space-y-1.5 text-[11px] font-medium text-muted-foreground">
                      <div className="flex items-center gap-2"><Phone size={12} className="text-muted-foreground/60" /><span>{client.phoneMobile || "No phone added"}</span></div>
                      <div className="flex items-center gap-2"><Mail size={12} className="text-muted-foreground/60" /><span className="max-w-[210px] truncate">{client.email || "No email added"}</span></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 sm:px-6"><span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wide ${client.nic ? "bg-muted text-foreground" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>{client.nic || "Pending"}</span></td>
                  <td className="px-5 py-4 text-right sm:px-6">
                    <Link href={`/features/clients/${client.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-bold text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary group-hover:border-primary/20">View profile <ExternalLink size={13} /></Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
