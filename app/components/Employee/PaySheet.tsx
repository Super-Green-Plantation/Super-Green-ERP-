"use client";

import { useMemo, useState, useEffect } from "react";
import { ChevronDown, Download, ReceiptText, CalendarClock, Briefcase, Hash, Building2 } from "lucide-react";

export default function PaySheet({
  payrolls,
  member,
}: {
  payrolls: any[];
  member: any;
}) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  useEffect(() => {
    if (payrolls && payrolls.length > 0 && !selectedPeriod) {
      setSelectedPeriod(`${payrolls[0].year}-${payrolls[0].month}`);
    }
  }, [payrolls, selectedPeriod]);

  const currentPayroll = useMemo(() => {
    return payrolls.find((p) => `${p.year}-${p.month}` === selectedPeriod);
  }, [payrolls, selectedPeriod]);

  if (!payrolls || payrolls.length === 0) {
    return (
      <div className="bg-card/30 backdrop-blur-md rounded-[2.5rem] p-12 border border-border/50 text-center flex flex-col items-center justify-center min-h-100">
        <ReceiptText className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-bold text-foreground">No Salary Slips Available</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Payroll records have not been processed for this employee yet.
        </p>
      </div>
    );
  }

  const formatCurrency = (val: number) =>
    (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-700">
      {/* ── Header & Selection ── */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-card/50 backdrop-blur-md p-4 sm:p-6 rounded-[2rem] border border-border/40 gap-3 sm:gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <CalendarClock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Payroll Period</p>
            <div className="relative mt-1">
              <select
                className="appearance-none bg-transparent text-foreground font-bold text-lg pr-8 cursor-pointer focus:outline-none focus:ring-0 px-8"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                {payrolls.map((p) => {
                  const dateInfo = new Date(p.year, p.month - 1);
                  return (
                    <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`} className="bg-popover text-popover-foreground">
                      {dateInfo.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="px-8 w-4 h-4 text-muted-foreground absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
        
        {/*
        {currentPayroll && (
          <button className="flex items-center gap-2 px-6 py-3 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        )}
        */}
      </div>

      {/* ── Salary Slip Core ── */}
      {currentPayroll && (
        <div className="bg-card backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-xl overflow-hidden">
          
          {/* Slip Header */}
          <div className="bg-primary/5 p-6 sm:p-8 border-b border-border/50 text-center sm:text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-8 relative z-10">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground font-heading tracking-tight mb-2">
                  SUPER GREEN PLANTATION (Pvt) ltd
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-medium text-muted-foreground">
                  <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> No: 598/M, Hirimbura rd, Karapitiya, Galle</span>
                </div>
              </div>
              <div className="text-left sm:text-right bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-border/40 backdrop-blur-md w-full sm:w-auto mt-4 sm:mt-0">
                 <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-1">Salary Slip</p>
                 <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {new Date(currentPayroll.year, currentPayroll.month - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' }).replace(' ', '-')}
                 </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 p-4 sm:p-6 bg-card/60 backdrop-blur-md rounded-2xl border border-border/40 text-center sm:text-left">
               <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center sm:justify-start gap-1"><Hash className="w-3 h-3"/> Employee ID</p>
                  <p className="text-sm font-bold">{member.empNo}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center sm:justify-start gap-1"><Briefcase className="w-3 h-3"/> Designation</p>
                  <p className="text-sm font-bold">{member.position?.title || "Staff"}</p>
               </div>
               <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 text-center sm:text-left">Employee Name</p>
                  <p className="text-sm font-bold">{member.nameWithInitials}</p>
               </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              
              {/* Earnings Column */}
              <div className="space-y-6">
                 <h4 className="text-sm font-black uppercase tracking-widest border-b border-border/40 pb-4 text-foreground/80 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" /> Earnings
                 </h4>
                 <div className="space-y-4">
                    <Row label="Basic Salary" value={currentPayroll.basicSalaryPermanent} />
                    {currentPayroll.incentiveEarned > 0 && <Row label="Special Allowance" value={currentPayroll.incentiveEarned} />}
                    {currentPayroll.allowanceEarned > 0 && <Row label="Travelling Allowance" value={currentPayroll.allowanceEarned} />}
                    {currentPayroll.orcEarned > 0 && <Row label="Other Allowance (ORC)" value={currentPayroll.orcEarned} />}
                    <Row label="Performance Commission" value={currentPayroll.commissionEarned} />
                 </div>
                 <div className="pt-4 border-t border-border/40 flex justify-between items-center">
                    <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Gross</p>
                    <p className="text-base sm:text-lg font-black text-foreground">Rs. {formatCurrency(currentPayroll.grossPay)}</p>
                 </div>
              </div>

              {/* Deductions Column */}
              <div className="space-y-6 mt-8 lg:mt-0">
                 <h4 className="text-sm font-black uppercase tracking-widest border-b border-border/40 pb-4 text-foreground/80 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-rose-500" /> Deductions
                 </h4>
                 <div className="space-y-4">
                    <Row label="EPF Contribution 8%" value={currentPayroll.epfDeduction} />
                    <Row label="Salary Advanced" value={0} />
                    <Row label="No pay Leave" value={0} />
                    <Row label="Company loan Installment" value={0} />
                 </div>
                 <div className="pt-4 border-t border-border/40 flex justify-between items-center">
                    <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Deductions</p>
                    <p className="text-base sm:text-lg font-black text-rose-500">Rs. {formatCurrency(currentPayroll.epfDeduction)}</p>
                 </div>
              </div>

            </div>
          </div>

          {/* ── Final Breakdown Footer ── */}
          <div className="bg-muted/10 p-6 sm:p-8 border-t border-border/50">
             
             {/* Net Row */}
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 p-6 sm:px-8 bg-primary dark:bg-primary/50 text-white rounded-[2rem] shadow-2xl shadow-primary/20 relative overflow-hidden group mb-6 sm:mb-8">
               <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                 <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
                  <div>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Total Net Salary</p>
                    <p className="text-2xl sm:text-3xl font-extrabold font-heading">
                      <span className="text-sm sm:text-lg opacity-60 mr-2">Rs.</span>
                      {formatCurrency(currentPayroll.netPay)}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 text-center sm:text-right space-y-1">
                    <p className="text-white/60 text-[9px] font-bold uppercase tracking-[0.2em]">Salary Remitted to Bank</p>
                    <p className="text-lg sm:text-xl font-bold">Rs. {formatCurrency(currentPayroll.netPay)}</p>
                  </div>
               </div>
             </div>

             {/* Company Contribution Row */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <CompanyRow label="EPF Employer Contribution 12%" value={currentPayroll.epfEmployer} />
                <CompanyRow label="ETF Employer Contribution 3%" value={currentPayroll.etfEmployer} />
                <div className="p-5 bg-card rounded-2xl border border-border/50 text-right shadow-sm flex flex-col justify-center">
                   <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Cost to Company</p>
                   <p className="text-base sm:text-lg font-black text-foreground">
                      Rs. {formatCurrency(currentPayroll.grossPay + currentPayroll.epfEmployer + currentPayroll.etfEmployer)}
                   </p>
                </div>
             </div>
             
          </div>

        </div>
      )}
    </div>
  );
}

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between items-center py-1">
    <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
    <p className="text-xs sm:text-sm font-bold text-foreground text-right tabular-nums">
      Rs. {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </p>
  </div>
);

const CompanyRow = ({ label, value }: { label: string; value: number }) => (
  <div className="p-4 sm:p-5 bg-card/50 rounded-2xl border border-border/40 flex justify-between items-center gap-4">
    <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider max-w-37.5">{label}</p>
    <p className="text-xs sm:text-sm font-bold text-foreground text-right tabular-nums whitespace-nowrap">
      Rs. {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </p>
  </div>
);
