"use client";

import React, { useMemo } from "react";
import {
  FileText, Wallet, BadgeCheck, UserCheck, TrendingUp, Calendar
} from "lucide-react";

const fmt = (n: number) => n.toLocaleString("en-LK", { minimumFractionDigits: 2 });

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const CommissionStatementPage = ({ data }: { data: any }) => {
  const commissions: any[] = Array.isArray(data) ? data : (data?.res || data?.commissions || []);

  const totalEarned = commissions.reduce((sum, c) => sum + c.amount, 0);
  const totalVolume = commissions.reduce((sum, c) => sum + (c.investment?.amount || 0), 0);
  const memberNo = commissions[0]?.memberEmpNo || "N/A";

  // Group by year-month, sorted newest first
  const grouped = useMemo(() => {
    const map: Record<string, { year: number; month: number; items: any[] }> = {};

    for (const c of commissions) {
      const date = new Date(c.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { year: date.getFullYear(), month: date.getMonth() + 1, items: [] };
      map[key].items.push(c);
    }

    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([, v]) => v);
  }, [commissions]);

  if (commissions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-300">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-bold uppercase tracking-widest">No commission records</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto rounded-[2.5rem] sm:rounded-[3.5rem] bg-card/40 backdrop-blur-xl border border-border/50 p-6 sm:p-12 shadow-2xl relative overflow-hidden group">
      
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="border-b border-border/50 pb-10 mb-12 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-8 relative z-10">
        <div className="space-y-6">
          <div className="flex items-center gap-5">
            <div className="p-4 sm:p-5 bg-primary/20 backdrop-blur-md rounded-[1.5rem] border border-primary/20 shrink-0 shadow-lg shadow-primary/5">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tighter leading-none">
                Financial <br /><span className="text-primary italic font-serif">Statement</span>
              </h1>
            </div>
          </div>
          <div className="flex gap-10">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Advisor ID</p>
              <p className="text-sm font-bold text-foreground">#EMP-{memberNo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Statement Date</p>
              <p className="text-sm font-bold text-foreground">
                {new Date().toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>
        </div>
        <div className="sm:text-right">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#00BFA5]/10 text-[#00BFA5] rounded-2xl border border-[#00BFA5]/20 shadow-sm transition-all hover:bg-[#00BFA5]/20">
            <div className="relative flex h-2 w-2">
              <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
              <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
            </div>
            <BadgeCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Verified Payout</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative z-10">
        <div className="p-10 bg-linear-to-br from-primary via-primary/95 to-[#00BFA5] rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-primary/20 group/card transition-transform hover:scale-[1.02] duration-500">
          <Wallet className="absolute -right-8 -bottom-8 w-40 h-40 text-white/10 group-hover/card:scale-110 transition-transform duration-700" />
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.3em] mb-4">Total Earned</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter leading-none mb-2">
            <span className="text-sm font-medium opacity-60 mr-2">Rs.</span>
            {totalEarned.toLocaleString()}
          </h2>
          <div className="w-full h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
             <div className="h-full bg-accent w-full rounded-full shadow-[0_0_10px_rgba(0,191,165,1)] animate-pulse" />
          </div>
        </div>

        <div className="p-10 bg-card/60 backdrop-blur-md border border-border/50 rounded-[2.5rem] shadow-sm hover:bg-muted/50 transition-all duration-300">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4">Total Volume</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tighter leading-none">
            <span className="text-sm font-medium text-muted-foreground mr-1.5">Rs.</span>
            {totalVolume.toLocaleString()}
          </h2>
          <p className="text-[10px] text-[#00BFA5] font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
             <TrendingUp className="w-3 h-3" /> Growth Target met
          </p>
        </div>

        <div className="p-10 bg-card/60 backdrop-blur-md border border-border/50 rounded-[2.5rem] shadow-sm hover:bg-muted/50 transition-all duration-300">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4">Transactions</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tighter leading-none">
            {commissions.length}
          </h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-4">Successful cycles</p>
        </div>
      </div>

      {/* Monthly Sections */}
      <div className="space-y-12 relative z-10">
        {grouped.map(({ year, month, items }) => {
          const monthTotal = items.reduce((s, c) => s + c.amount, 0);
          const monthVolume = items.reduce((s, c) => s + (c.investment?.amount || 0), 0);

          return (
            <div key={`${year}-${month}`} className="animate-in fade-in slide-in-from-bottom-5 duration-700">

              {/* Month header — editorial style */}
              <div className="bg-primary/95 backdrop-blur-md p-6 sm:px-10 sm:py-7 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between border border-white/10 shadow-xl mb-6 group/header">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-3xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
                    <Calendar className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="text-xl font-extrabold text-white tracking-tight">
                      {MONTHS[month - 1]} <span className="text-secondary">{year}</span>
                    </span>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mt-1">
                      {items.length} ARCHIVED RECORDS
                    </p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 px-6 py-2.5 bg-white/5 rounded-2xl border border-white/10 group-hover/header:bg-white/10 transition-all">
                  <span className="text-[9px] text-white/40 font-extrabold uppercase tracking-widest mr-3">Monthly Yield</span>
                  <span className="text-lg font-extrabold text-accent">Rs. {fmt(monthTotal)}</span>
                </div>
              </div>

              {/* High-Fidelity Table */}
              <div className="bg-card/30 backdrop-blur-sm rounded-[2rem] border border-border/40 overflow-hidden">
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/40 p-4">
                        <th className="px-8 py-5 text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.3em]">Client Archive</th>
                        <th className="px-8 py-5 text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.3em]">Reference</th>
                        <th className="px-8 py-5 text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.3em]">Yield Type</th>
                        <th className="px-8 py-5 text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.3em] text-right">Investment</th>
                        <th className="px-8 py-5 text-[10px] font-extrabold text-primary uppercase tracking-[0.3em] text-right">Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-primary/5 transition-all duration-300 group/row">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-3xl bg-muted/50 flex items-center justify-center border border-border/50 group-hover/row:bg-primary/10 group-hover/row:border-primary/20 transition-all">
                                <UserCheck className="w-5 h-5 text-muted-foreground group-hover/row:text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground">
                                  {item.investment?.client?.fullName || `Client #${item.investment?.clientId}`}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">
                                  DATED: {new Date(item.createdAt).toLocaleDateString("en-GB")}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-[11px] text-muted-foreground font-mono bg-muted/30 px-3 py-1.5 rounded-lg border border-border/30 inline-block uppercase">{item.refNumber}</p>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 text-[9px] font-bold rounded-xl uppercase tracking-widest border
                              ${item.type === "PERSONAL"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-accent/10 text-accent border-accent/20"
                              }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right text-sm font-bold text-muted-foreground">
                            Rs. {fmt(item.investment?.amount ?? 0)}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <p className="text-base font-extrabold text-primary tracking-tight">+Rs. {fmt(item.amount)}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/20 border-t border-border/40">
                        <td colSpan={3} className="px-8 py-5 text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest italic">
                          Cycle Volume: <span className="text-foreground not-italic ml-2">Rs. {fmt(monthVolume)}</span>
                        </td>
                        <td className="px-8 py-5 text-right text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                          Cycle Total
                        </td>
                        <td className="px-8 py-5 text-right text-lg font-extrabold text-[#00BFA5]">
                          Rs. {fmt(monthTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile Cards (Restyled) */}
                <div className="sm:hidden divide-y divide-border/20">
                  {items.map((item: any) => (
                    <div key={item.id} className="p-8 hover:bg-primary/5 transition-all">
                      <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                          <p className="text-lg font-extrabold text-foreground tracking-tight">
                            {item.investment?.client?.fullName || `Client #${item.investment?.clientId}`}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                            {new Date(item.createdAt).toLocaleDateString("en-GB")} • {item.refNumber}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-[9px] font-bold rounded-xl uppercase border shrink-0
                          ${item.type === "PERSONAL" ? "bg-primary/10 text-primary border-primary/20" : "bg-accent/10 text-accent border-accent/20"}`}>
                          {item.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/20">
                        <div>
                          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Investment</p>
                          <p className="text-sm font-bold text-foreground">Rs. {fmt(item.investment?.amount ?? 0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Payout</p>
                          <p className="text-base font-extrabold text-primary tracking-tight">+Rs. {fmt(item.amount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-8 bg-muted/40 flex justify-between items-center">
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Month Archetype</span>
                    <span className="text-xl font-extrabold text-[#00BFA5]">Rs. {fmt(monthTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grand Total Footer Card */}
      <div className="mt-16 bg-primary rounded-[2.5rem] p-10 sm:p-14 text-white shadow-2xl shadow-primary/30 relative overflow-hidden group/footer">
        <div className="absolute top-0 right-0 p-20 bg-white/10 rounded-full blur-[80px] pointer-events-none group-hover/footer:scale-125 transition-transform duration-1000" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-10">
          <div>
            <p className="text-[11px] font-bold text-white/50 uppercase tracking-[0.5em] mb-4">Cumulative All-Time Archive</p>
            <div className="flex items-center gap-6">
               <div className="px-5 py-2 bg-white/10 rounded-xl border border-white/10 border-dashed">
                  <span className="text-xl font-bold">{commissions.length}</span>
                  <span className="text-[10px] text-white/40 font-bold uppercase ml-3 tracking-widest whitespace-nowrap">Transactions</span>
               </div>
               <div className="px-5 py-2 bg-white/10 rounded-xl border border-white/10 border-dashed">
                  <span className="text-xl font-bold">Rs. {Math.round(totalVolume/1000000)}M</span>
                  <span className="text-[10px] text-white/40 font-bold uppercase ml-3 tracking-widest whitespace-nowrap">Volume</span>
               </div>
            </div>
          </div>
          <div className="text-center sm:text-right w-full sm:w-auto p-8 sm:p-0 bg-white/5 sm:bg-transparent rounded-3xl border border-white/5 sm:border-0 border-dashed">
            <p className="text-[11px] text-white/50 font-bold uppercase tracking-[0.5em] mb-4">Total Payout Disbursed</p>
            <p className="text-5xl sm:text-7xl font-black tracking-tighter shadow-sm">
              <span className="text-xl mr-2 font-medium text-white/40">Rs.</span>
              {fmt(totalEarned)}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 border-t border-border/50 pt-10 text-center px-4 sm:px-20 relative z-10">
        <div className="flex items-center justify-center gap-4 mb-6">
           <div className="h-px w-12 bg-border"></div>
           <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.5em]">
             Confidential Enterprise Audit
           </p>
           <div className="h-px w-12 bg-border"></div>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground/80 font-medium italic max-w-2xl mx-auto">
          "The accuracy of this document is critical for enterprise transparency. This automated record 
          synchronizes all successfully processed investments as of {new Date().toLocaleDateString()}."
        </p>
      </div>
    </div>
  );
};

export default CommissionStatementPage;
