"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Download,
  ReceiptText,
  CalendarClock,
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Printer,
} from "lucide-react";
import { generateMemberPayslipPDF } from "@/app/pdf/generateMemberPayslipPDF";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MonthlyPayrollRecord = {
  id: number;
  year: number;
  month: number;
  payrollCategory: "HEAD_OFFICE" | "MARKETING" | null;

  // Marketing fields
  volumeAchieved: number;
  monthlyTarget: number;
  targetBudgetSalary: number;
  incentiveEarned: number;
  incentivePartialEarned: number;
  excessCommission: number;
  excessEarned: number;
  vehicleEarned: number;
  activationAllowanceEarned: number;
  commissionEarned: number;
  orcEarned: number;

  // HO fields
  basicSalaryPermanent: number;
  fixedAllowance: number;
  fuelAllowance: number;
  channelOperation: number;
  attendanceAllowance: number;
  loanInstalments: number;
  festivalAdvance: number;
  merchandiseDeduction: number;

  // Common
  grossPay: number;
  netPay: number;
  epfDeduction: number;
  epfEmployer: number;
  etfEmployer: number;
  advanceDeducted: number;

  // Status flags
  incentiveHit: boolean;
  incentivePartialHit: boolean;
  vehicleHit: boolean;
  tenureMonthCount: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (val: number | null | undefined) =>
  (val ?? 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const LKR = (val: number | null | undefined) => `LKR ${fmt(val)}`;

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1)
    .toLocaleString("en-US", { month: "short", year: "2-digit" })
    .replace(" ", "-");
}

function monthLongLabel(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// ─── Shared action bar ────────────────────────────────────────────────────────

function PayslipActions({
  onPrint,
  onDownload,
}: {
  onPrint: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button
        onClick={onPrint}
        className="flex items-center gap-2 px-5 py-2.5 bg-card hover:bg-muted text-foreground rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-border active:scale-95"
      >
        <Printer className="w-4 h-4" />
        Print
      </button>
      <button
        onClick={onDownload}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-primary/20 active:scale-95"
      >
        <Download className="w-4 h-4" />
        Download PDF
      </button>
    </div>
  );
}

// ─── Marketing / Incentive Pay Sheet ─────────────────────────────────────────

function FAPaySheet({
  payroll,
  member,
}: {
  payroll: MonthlyPayrollRecord;
  member: any;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const target             = payroll.monthlyTarget ?? 0;
  const achieved           = payroll.volumeAchieved ?? 0;
  const achievementPct     = target > 0 ? (achieved / target) * 100 : 0;
  const basicIncentive     = payroll.incentiveEarned ?? 0;
  const targetBudget       = payroll.targetBudgetSalary ?? 0;
  const excessComm         = (payroll.excessCommission ?? 0) + (payroll.excessEarned ?? 0);
  const vehicleEarned      = payroll.vehicleEarned ?? 0;
  const activationAllowance = payroll.activationAllowanceEarned ?? 0;
  const personalComm       = payroll.commissionEarned ?? 0;
  const orcEarned          = payroll.orcEarned ?? 0;
  const grossEarnings      = payroll.grossPay ?? 0;
  const advanceDeducted    = payroll.advanceDeducted ?? 0;
  const netToBankAmount    = payroll.netPay ?? 0;

  const positionTitle = member.position?.title ?? "Staff";

  const handlePrint = () => {
    if (!printRef.current) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${positionTitle} Incentive Pay Sheet — ${member.nameWithInitials} — ${monthLabel(payroll.year, payroll.month)}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 20px; }
            .wrap { max-width: 520px; margin: 0 auto; border: 2px solid #111; }
            .h1 { background: #1a472a; color: #fff; text-align: center; padding: 14px 10px 8px; font-size: 15px; font-weight: 800; letter-spacing: .5px; }
            .h2 { font-size: 11px; font-weight: 600; background: #2d6a4f; color: #fff; text-align: center; padding: 5px; border-top: 1px solid rgba(255,255,255,.2); }
            .sep { height: 8px; background: #f5f5f5; }
            .row { display: flex; justify-content: space-between; padding: 6px 16px; border-bottom: 1px solid #eee; font-size: 11px; }
            .lbl { color: #555; }
            .val { font-weight: 700; text-align: right; }
            .gross { display: flex; justify-content: space-between; padding: 7px 16px; background: #e8f5ee; font-weight: 800; font-size: 12px; color: #1a472a; }
            .net { display: flex; justify-content: space-between; padding: 11px 16px; background: #1a472a; color: #fff; font-weight: 800; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="h1">SUPER GREEN PLANTATION (PVT) LTD</div>
            <div class="h2">${positionTitle.toUpperCase()} INCENTIVE PAY SHEET</div>
            <div class="sep"></div>
            <div class="row"><span class="lbl">Employee Name</span><span class="val">${member.nameWithInitials ?? "—"}</span></div>
            <div class="row"><span class="lbl">Designation</span><span class="val">${positionTitle}</span></div>
            <div class="row"><span class="lbl">Branch</span><span class="val">${member.branches?.[0]?.branch?.name ?? "—"}</span></div>
            <div class="row"><span class="lbl">Joining Date</span><span class="val">${member.dateOfJoin ? new Date(member.dateOfJoin).toLocaleDateString("en-LK").replace(/\//g, ".") : "—"}</span></div>
            <div class="row"><span class="lbl">Month</span><span class="val">${monthLabel(payroll.year, payroll.month)}</span></div>
            <div class="sep"></div>
            <div class="row"><span class="lbl">Target</span><span class="val">${LKR(target)}</span></div>
            <div class="row"><span class="lbl">Achievement</span><span class="val">${LKR(achieved)}</span></div>
            <div class="row"><span class="lbl">Achievement %</span><span class="val">${achievementPct.toFixed(0)}%</span></div>
            <div class="sep"></div>
            ${basicIncentive  > 0 ? `<div class="row"><span class="lbl">Basic Incentive</span><span class="val">${LKR(basicIncentive)}</span></div>` : ""}
            ${targetBudget    > 0 ? `<div class="row"><span class="lbl">Target Budget</span><span class="val">${LKR(targetBudget)}</span></div>` : ""}
            ${excessComm      > 0 ? `<div class="row"><span class="lbl">Excess Commission</span><span class="val">${LKR(excessComm)}</span></div>` : ""}
            ${vehicleEarned   > 0 ? `<div class="row"><span class="lbl">Vehicle Allowance</span><span class="val">${LKR(vehicleEarned)}</span></div>` : ""}
            ${activationAllowance > 0 ? `<div class="row"><span class="lbl">Team Activation</span><span class="val">${LKR(activationAllowance)}</span></div>` : ""}
            ${personalComm    > 0 ? `<div class="row"><span class="lbl">Personal Commission</span><span class="val">${LKR(personalComm)}</span></div>` : ""}
            ${orcEarned       > 0 ? `<div class="row"><span class="lbl">ORC / Upline Commission</span><span class="val">${LKR(orcEarned)}</span></div>` : ""}
            <div class="gross"><span>Gross Earnings</span><span>${LKR(grossEarnings)}</span></div>
            <div class="row"><span class="lbl">Deductions</span><span class="val">${advanceDeducted > 0 ? LKR(advanceDeducted) : "LKR  —"}</span></div>
            <div class="net"><span>NET TO BANK</span><span>${LKR(netToBankAmount)}</span></div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const handleDownload = () => generateMemberPayslipPDF(payroll, member);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <PayslipActions onPrint={handlePrint} onDownload={handleDownload} />

      {/* ── Digital card view ── */}
      <div className="bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/40 overflow-hidden max-w-lg mx-auto shadow-lg">

        {/* Performance stat cards */}
        <div className="grid grid-cols-3 gap-px bg-border/30">
          <StatBox label="Target"      value={LKR(target)}    icon={<Target className="w-4 h-4" />}    color="text-blue-500" />
          <StatBox label="Achieved"    value={LKR(achieved)}  icon={<TrendingUp className="w-4 h-4" />} color="text-emerald-500" />
          <StatBox
            label="Achievement"
            value={`${achievementPct.toFixed(0)}%`}
            icon={achievementPct >= 25 ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            color={achievementPct >= 25 ? "text-emerald-500" : "text-rose-400"}
            highlight
          />
        </div>

        {/* Earnings */}
        <div className="p-6 space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Earnings</p>
          {basicIncentive     > 0 && <EarningRow label="Basic Incentive"          value={basicIncentive}     hit={payroll.incentivePartialHit ?? payroll.incentiveHit} />}
          {targetBudget       > 0 && <EarningRow label="Target Budget Salary"     value={targetBudget}       hit />}
          {excessComm         > 0 && <EarningRow label="Excess Commission"        value={excessComm} />}
          {vehicleEarned      > 0 && <EarningRow label="Vehicle Allowance"        value={vehicleEarned}      hit={payroll.vehicleHit} />}
          {activationAllowance > 0 && <EarningRow label="Team Activation Allowance" value={activationAllowance} />}
          {personalComm       > 0 && <EarningRow label="Personal Commission"      value={personalComm} />}
          {orcEarned          > 0 && <EarningRow label="ORC / Upline Commission"  value={orcEarned} />}

          <div className="pt-3 border-t border-border/40 flex justify-between items-center">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gross Earnings</p>
            <p className="text-lg font-extrabold">{LKR(grossEarnings)}</p>
          </div>
        </div>

        {/* Deductions */}
        <div className="px-6 pb-4 space-y-2 border-t border-border/30 pt-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Deductions</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Advance Deducted</span>
            <span className="font-bold text-rose-500">
              {advanceDeducted > 0 ? LKR(advanceDeducted) : "—"}
            </span>
          </div>
        </div>

        {/* Net to Bank */}
        <div className="bg-primary text-white px-6 py-5 flex justify-between items-center">
          <div>
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-[0.3em] mb-1">Net To Bank</p>
            <p className="text-2xl font-extrabold">{LKR(netToBankAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-white/50 uppercase tracking-widest">No EPF / ETF</p>
            <p className="text-xs font-bold text-white/70 mt-1">Marketing Track</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Head Office Salary Slip ──────────────────────────────────────────────────

function HOPaySheet({
  payroll,
  member,
}: {
  payroll: MonthlyPayrollRecord;
  member: any;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const fixedAllowance       = payroll.fixedAllowance ?? 0;
  const fuelAllowance        = payroll.fuelAllowance ?? 0;
  const channelOp            = payroll.channelOperation ?? 0;
  const attendanceAllowance  = payroll.attendanceAllowance ?? 0;
  const orcEarned            = payroll.orcEarned ?? 0;
  const commissionEarned     = payroll.commissionEarned ?? 0;
  const epfDeduction         = payroll.epfDeduction ?? 0;
  const loanInstalments      = payroll.loanInstalments ?? 0;
  const festivalAdvance      = payroll.festivalAdvance ?? 0;
  const merchandiseDeduction = payroll.merchandiseDeduction ?? 0;
  const advanceDeducted      = payroll.advanceDeducted ?? 0;
  const totalDeductions      = epfDeduction + loanInstalments + festivalAdvance + merchandiseDeduction + advanceDeducted;

  const handlePrint = () => {
    if (!printRef.current) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Salary Slip — ${member.nameWithInitials} — ${monthLabel(payroll.year, payroll.month)}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 20px; }
            .wrap { max-width: 620px; margin: 0 auto; border: 2px solid #111; }
            .h1 { background: #1a472a; color: #fff; text-align: center; padding: 14px 10px 8px; font-size: 15px; font-weight: 800; }
            .h2 { font-size: 11px; background: #2d6a4f; color: #fff; text-align: center; padding: 5px; }
            .info { display: grid; grid-template-columns: 1fr 1fr 1fr; border-bottom: 1px solid #ccc; }
            .info div { padding: 6px 12px; font-size: 11px; border-right: 1px solid #eee; }
            .info .lbl { color: #777; font-size: 10px; }
            .info .val { font-weight: 700; }
            .two-col { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #ccc; }
            .col-hd { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 12px; color: #555; border-bottom: 1px solid #eee; background: #fafafa; }
            .row { display: flex; justify-content: space-between; padding: 5px 12px; border-bottom: 1px solid #eee; font-size: 11px; }
            .lbl { color: #555; }
            .val { font-weight: 700; }
            .subtot { display: flex; justify-content: space-between; padding: 6px 12px; background: #f0f0f0; font-weight: 800; font-size: 11px; }
            .net { display: flex; justify-content: space-between; padding: 11px 16px; background: #1a472a; color: #fff; font-weight: 800; font-size: 14px; }
            .contrib { display: grid; grid-template-columns: repeat(3,1fr); text-align: center; padding: 8px; gap: 4px; }
            .contrib div { font-size: 10px; }
            .contrib .lbl { color: #777; margin-bottom: 2px; }
            .contrib .val { font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="h1">SUPER GREEN PLANTATION (PVT) LTD</div>
            <div class="h2">SALARY SLIP — ${monthLabel(payroll.year, payroll.month).toUpperCase()}</div>
            <div class="info">
              <div><div class="lbl">Employee Name</div><div class="val">${member.nameWithInitials ?? "—"}</div></div>
              <div><div class="lbl">Designation</div><div class="val">${member.position?.title ?? "Staff"}</div></div>
              <div><div class="lbl">Emp No</div><div class="val">${member.empNo ?? "—"}</div></div>
            </div>
            <div class="two-col">
              <div>
                <div class="col-hd">Earnings</div>
                <div class="row"><span class="lbl">Basic Salary</span><span class="val">${LKR(payroll.basicSalaryPermanent)}</span></div>
                ${fixedAllowance      > 0 ? `<div class="row"><span class="lbl">Fixed Allowance</span><span class="val">${LKR(fixedAllowance)}</span></div>` : ""}
                ${channelOp           > 0 ? `<div class="row"><span class="lbl">Channel Operation</span><span class="val">${LKR(channelOp)}</span></div>` : ""}
                ${fuelAllowance       > 0 ? `<div class="row"><span class="lbl">Fuel Allowance</span><span class="val">${LKR(fuelAllowance)}</span></div>` : ""}
                ${attendanceAllowance > 0 ? `<div class="row"><span class="lbl">Attendance Allowance</span><span class="val">${LKR(attendanceAllowance)}</span></div>` : ""}
                ${orcEarned           > 0 ? `<div class="row"><span class="lbl">ORC / Upline Comm.</span><span class="val">${LKR(orcEarned)}</span></div>` : ""}
                ${commissionEarned    > 0 ? `<div class="row"><span class="lbl">Personal Commission</span><span class="val">${LKR(commissionEarned)}</span></div>` : ""}
                <div class="subtot"><span>Total Gross</span><span>${LKR(payroll.grossPay)}</span></div>
              </div>
              <div>
                <div class="col-hd">Deductions</div>
                <div class="row"><span class="lbl">EPF 8%</span><span class="val">${LKR(epfDeduction)}</span></div>
                ${loanInstalments      > 0 ? `<div class="row"><span class="lbl">Loan Instalment</span><span class="val">${LKR(loanInstalments)}</span></div>` : ""}
                ${festivalAdvance      > 0 ? `<div class="row"><span class="lbl">Festival Advance</span><span class="val">${LKR(festivalAdvance)}</span></div>` : ""}
                ${merchandiseDeduction > 0 ? `<div class="row"><span class="lbl">Merchandise</span><span class="val">${LKR(merchandiseDeduction)}</span></div>` : ""}
                ${advanceDeducted      > 0 ? `<div class="row"><span class="lbl">Salary Advance</span><span class="val">${LKR(advanceDeducted)}</span></div>` : ""}
                <div class="subtot"><span>Total Deductions</span><span>${LKR(totalDeductions)}</span></div>
              </div>
            </div>
            <div class="net"><span>NET TO BANK</span><span>${LKR(payroll.netPay)}</span></div>
            <div class="contrib">
              <div><div class="lbl">EPF Employer 12%</div><div class="val">${LKR(payroll.epfEmployer)}</div></div>
              <div><div class="lbl">ETF Employer 3%</div><div class="val">${LKR(payroll.etfEmployer)}</div></div>
              <div><div class="lbl">Cost to Company</div><div class="val">${LKR((payroll.grossPay ?? 0) + (payroll.epfEmployer ?? 0) + (payroll.etfEmployer ?? 0))}</div></div>
            </div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const handleDownload = () => generateMemberPayslipPDF(payroll, member);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <PayslipActions onPrint={handlePrint} onDownload={handleDownload} />

      {/* Digital card */}
      <div className="bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/40 overflow-hidden max-w-lg mx-auto shadow-lg">

        {/* Earnings */}
        <div className="p-6 space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Earnings</p>
          <EarningRow label="Basic Salary"           value={payroll.basicSalaryPermanent} />
          {fixedAllowance      > 0 && <EarningRow label="Fixed Allowance"        value={fixedAllowance} />}
          {channelOp           > 0 && <EarningRow label="Channel Operation"      value={channelOp} />}
          {fuelAllowance       > 0 && <EarningRow label="Fuel Allowance"         value={fuelAllowance} />}
          {attendanceAllowance > 0 && <EarningRow label="Attendance Allowance"   value={attendanceAllowance} />}
          {orcEarned           > 0 && <EarningRow label="ORC / Upline Commission" value={orcEarned} />}
          {commissionEarned    > 0 && <EarningRow label="Personal Commission"    value={commissionEarned} />}

          <div className="pt-3 border-t border-border/40 flex justify-between items-center">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Gross</p>
            <p className="text-lg font-extrabold">{LKR(payroll.grossPay)}</p>
          </div>
        </div>

        {/* Deductions */}
        <div className="px-6 pb-4 border-t border-border/30 pt-4 space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Deductions</p>
          <EarningRow label="EPF Contribution 8%" value={epfDeduction}         isDeduction />
          {loanInstalments      > 0 && <EarningRow label="Loan Instalment"      value={loanInstalments}      isDeduction />}
          {festivalAdvance      > 0 && <EarningRow label="Festival Advance"     value={festivalAdvance}      isDeduction />}
          {merchandiseDeduction > 0 && <EarningRow label="Merchandise"          value={merchandiseDeduction} isDeduction />}
          {advanceDeducted      > 0 && <EarningRow label="Salary Advance"       value={advanceDeducted}      isDeduction />}
          <div className="pt-2 border-t border-border/40 flex justify-between items-center">
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Total Deductions</p>
            <p className="text-base font-extrabold text-rose-500">{LKR(totalDeductions)}</p>
          </div>
        </div>

        {/* Net to Bank */}
        <div className="bg-primary text-white px-6 py-5 flex justify-between items-center">
          <div>
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-[0.3em] mb-1">Net To Bank</p>
            <p className="text-2xl font-extrabold">{LKR(payroll.netPay)}</p>
          </div>
          <div className="text-right text-xs text-white/60 space-y-1">
            <p>EPF Employer 12% {LKR(payroll.epfEmployer)}</p>
            <p>ETF Employer 3%  {LKR(payroll.etfEmployer)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBox({
  label, value, icon, color, highlight,
}: {
  label: string; value: string; icon: React.ReactNode; color?: string; highlight?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-5 px-3 bg-card/60 ${highlight ? "bg-primary/5" : ""}`}>
      <div className={`mb-1 ${color ?? "text-muted-foreground"}`}>{icon}</div>
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xs font-extrabold text-center tabular-nums ${color ?? ""}`}>{value}</p>
    </div>
  );
}

function EarningRow({
  label, value, hit, isDeduction,
}: {
  label: string; value: number; hit?: boolean; isDeduction?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <div className="flex items-center gap-2">
        {hit !== undefined && (
          hit
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            : <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        )}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={`text-xs font-bold tabular-nums ${isDeduction ? "text-rose-500" : ""}`}>
        {LKR(value)}
      </span>
    </div>
  );
}

// ─── Main PaySheet ────────────────────────────────────────────────────────────

export default function PaySheet({
  payrolls,
  member,
}: {
  payrolls: MonthlyPayrollRecord[];
  member: any;
}) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  useEffect(() => {
    if (payrolls?.length > 0 && !selectedPeriod) {
      setSelectedPeriod(`${payrolls[0].year}-${payrolls[0].month}`);
    }
  }, [payrolls, selectedPeriod]);

  const currentPayroll = useMemo(
    () => payrolls.find((p) => `${p.year}-${p.month}` === selectedPeriod),
    [payrolls, selectedPeriod],
  );

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

  const isMarketing = currentPayroll?.payrollCategory === "MARKETING";

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-700">

      {/* Period selector */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-card/50 backdrop-blur-md p-4 sm:p-6 rounded-[2rem] border border-border/40 gap-3 sm:gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <CalendarClock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Select Payroll Period
            </p>
            <div className="relative mt-1">
              <select
                className="appearance-none bg-transparent text-foreground font-bold text-lg pr-8 cursor-pointer focus:outline-none focus:ring-0 pl-0"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                {payrolls.map((p) => (
                  <option
                    key={`${p.year}-${p.month}`}
                    value={`${p.year}-${p.month}`}
                    className="bg-popover text-popover-foreground"
                  >
                    {monthLongLabel(p.year, p.month)}
                    {p.payrollCategory === "MARKETING"
                      ? ` (${member.position?.title ?? "Staff"})`
                      : " (HO)"}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {currentPayroll && (
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
            isMarketing
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
          }`}>
            {isMarketing
              ? `${member.position?.title ?? "Staff"} — Incentive Track`
              : "Head Office Track"}
          </span>
        )}
      </div>

      {/* Sheet */}
      {currentPayroll && (
        isMarketing
          ? <FAPaySheet payroll={currentPayroll} member={member} />
          : <HOPaySheet payroll={currentPayroll} member={member} />
      )}
    </div>
  );
}

// named re-export so the employee page can import CalendarClock directly if needed
export { CalendarClock };