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
    <div className="max-w-5xl mx-auto rounded-[2.5rem] sm:rounded-[3.5rem] p-4 sm:p-8 relative overflow-hidden group">
      
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="border-b border-border/50 pb-6 mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 relative z-10">
        <div className="space-y-6">
          <div className="flex items-center gap-5">
            {/* <div className="p-4 sm:p-5 bg-primary/20 backdrop-blur-md rounded-[1.5rem] border border-primary/20 shrink-0 shadow-lg shadow-primary/5">
              <FileText className="w-8 h-8 text-primary" />
            </div> */}
            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tighter leading-none">
                Financial <br /><span className="text-primary italic font-serif">Statement</span>
              </h1>
            </div>
          </div>
          <div className="flex gap-10">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Advisor ID</p>
              <p className="text-sm font-bold text-foreground">{memberNo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Statement Date</p>
              <p className="text-sm font-bold text-foreground">
                {new Date().toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12 relative z-10">
        <div className="p-6 sm:p-10 bg-linear-to-br from-primary/50 via-primary/95 to-[#00574b] rounded-[2rem] sm:rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-primary/20 group/card transition-transform hover:scale-[1.02] duration-500">
          <Wallet className="absolute -right-8 -bottom-8 w-32 h-32 sm:w-40 sm:h-40 text-white/10 group-hover/card:scale-110 transition-transform duration-700" />
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.3em] mb-3 sm:mb-4">Total Earned</p>
          <h2 className="text-xl text-white sm:text-4xl lg:text-5xl font-extrabold tracking-tighter leading-none mb-2">
            <span className="text-xs text-white sm:text-sm font-medium opacity-60 mr-1.5 sm:mr-2">Rs.</span>
            {totalEarned.toLocaleString()}
          </h2>
        </div>

        <div className="p-6 sm:p-10 bg-card/60 backdrop-blur-md border border-border/50 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm hover:bg-muted/50 transition-all duration-300">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-3 sm:mb-4">Total Volume</p>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tighter leading-none">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground mr-1 sm:mr-1.5">Rs.</span>
            {totalVolume.toLocaleString()}
          </h2>
          <div  className="pt-5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-3 sm:mb-4">Transactions</p>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tighter leading-none">
            {commissions.length}
          </h2>
        </div>
        </div>

       
      </div>

      {/* Monthly Sections */}
      <div className="space-y-8 relative z-10">
        {grouped.map(({ year, month, items }) => {
          const monthTotal = items.reduce((s, c) => s + c.amount, 0);
          const monthVolume = items.reduce((s, c) => s + (c.investment?.amount || 0), 0);

          return (
            <div key={`${year}-${month}`} className="animate-in fade-in slide-in-from-bottom-5 duration-700">

              {/* Month header — editorial style */}
              <div className="bg-primary dark:bg-primary/50 backdrop-blur-md p-5 sm:px-8 sm:py-5 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between border border-white/10 shadow-xl mb-4 group/header">
                <div className="flex items-center gap-5">
                  <div className="sm:text-left">
                    <span className="text-xl font-extrabold text-white tracking-tight">
                      {MONTHS[month - 1]} <span className="text-secondary">{year}</span>
                    </span>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mt-1">
                      {items.length} ARCHIVED RECORDS
                    </p>
                  </div>
                </div>
                <div className="flex-col flex mt-4 sm:mt-0 px-2 py-2.5 bg-white/5 rounded-2xl border border-white/10 group-hover/header:bg-white/10 transition-all">
                  <span className="text-[9px] text-white/40 font-extrabold uppercase tracking-widest mr-3">Monthly Yield</span>
                  <span className="text-sm font-extrabold text-accent">Rs. {fmt(monthTotal)}</span>
                </div>
              </div>

              {/* High-Fidelity Table */}
              <div className="bg-card/30 backdrop-blur-sm rounded-[2rem] border border-border/40 overflow-hidden w-full">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-200">
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
              </div>
            </div>
          );
        })}
      </div>

      {/* Grand Total Footer Card */}
      <div className="mt-8 sm:mt-12 bg-primary dark:bg-primary/50 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-white shadow-2xl shadow-primary/30 relative overflow-hidden group/footer">
        <div className="absolute top-0 right-0 p-20 bg-white/10 rounded-full blur-[80px] pointer-events-none group-hover/footer:scale-125 transition-transform duration-1000" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-10">
          <div className="w-full sm:w-auto">
            <p className="text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-[0.3em] sm:tracking-[0.5em] mb-4 text-center sm:text-left">Cumulative All-Time Archive</p>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
               <div className="w-full sm:w-auto px-5 py-3 sm:py-2 bg-white/10 rounded-xl border border-white/10 border-dashed flex sm:block justify-between items-center">
                  <span className="text-lg sm:text-xl font-bold">{commissions.length}</span>
                  <span className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase sm:ml-3 tracking-widest whitespace-nowrap">Transactions</span>
               </div>
               <div className="w-full sm:w-auto px-5 py-3 sm:py-2 bg-white/10 rounded-xl border border-white/10 border-dashed flex sm:block justify-between items-center">
                  <span className="text-lg sm:text-xl font-bold">Rs. {Math.round(totalVolume/1000000)}M</span>
                  <span className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase sm:ml-3 tracking-widest whitespace-nowrap">Volume</span>
               </div>
            </div>
          </div>
          <div className=" sm:text-right w-full sm:w-auto p-6 sm:p-0 sm:bg-transparent rounded-2xl sm:rounded-3xl border border-white/5 sm:border-0 border-dashed">
            <p className="text-[10px] sm:text-[11px] text-white/50 font-bold uppercase tracking-[0.3em] sm:tracking-[0.5em] mb-2 sm:mb-4">Total Payout Disbursed</p>
            <p className="text-xl sm:text-5xl lg:text-7xl font-black tracking-tighter shadow-sm">
              <span className=" sm:text-xl text-sm mr-1 sm:mr-2 font-medium text-white/40">Rs.</span>
              {fmt(totalEarned)}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 border-t border-border/50 pt-6 text-center px-4 sm:px-20 relative z-10">
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
