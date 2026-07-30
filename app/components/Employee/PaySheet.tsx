"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Download,
  ReceiptText,
  CalendarClock,
  Briefcase,
  Hash,
  Building2,
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Printer,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MonthlyPayrollRecord = {
  id: number;
  year: number;
  month: number;
  payrollCategory: "HEAD_OFFICE" | "MARKETING" | null;

  // Marketing / FA fields
  volumeAchieved: number;
  monthlyTarget: number;
  targetBudgetSalary: number;
  incentiveEarned: number;          // basicIncentive for FA
  incentivePartialEarned: number;   // alias used in some rows
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
  return new Date(year, month - 1).toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
  }).replace(" ", "-");
}

function monthLongLabel(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// ─── FA Incentive Pay Sheet (Marketing Track) ─────────────────────────────────

function FAPaySheet({
  payroll,
  member,
}: {
  payroll: MonthlyPayrollRecord;
  member: any;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const target = payroll.monthlyTarget ?? 0;
  const achieved = payroll.volumeAchieved ?? 0;
  const achievementPct = target > 0 ? (achieved / target) * 100 : 0;

  const basicIncentive = payroll.incentiveEarned ?? 0;
  const targetBudget = payroll.targetBudgetSalary ?? 0;
  const excessComm = (payroll.excessCommission ?? 0) + (payroll.excessEarned ?? 0);
  const vehicleEarned = payroll.vehicleEarned ?? 0;
  const activationAllowance = payroll.activationAllowanceEarned ?? 0;
  const personalComm = payroll.commissionEarned ?? 0;
  const orcEarned = payroll.orcEarned ?? 0;

  const grossEarnings = payroll.grossPay ?? 0;
  const advanceDeducted = payroll.advanceDeducted ?? 0;
  const totalDeductions = advanceDeducted; // no EPF on marketing track
  const netToBankAmount = payroll.netPay ?? 0;

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${member.position?.title ?? "Staff"} Incentive Pay Sheet - ${member.nameWithInitials} - ${monthLabel(payroll.year, payroll.month)}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 20px; }
            .print-wrap { max-width: 520px; margin: 0 auto; border: 2px solid #111; }
            .header-top { background: #1a472a; color: white; text-align: center; padding: 14px 10px 8px; }
            .header-top h1 { font-size: 15px; font-weight: 800; letter-spacing: 0.5px; }
            .header-sub { font-size: 11px; font-weight: 600; background: #2d6a4f; color: white; text-align: center; padding: 5px; border-top: 1px solid rgba(255,255,255,0.2); }
            .section { border-bottom: 1px solid #ccc; }
            .row { display: flex; justify-content: space-between; padding: 6px 16px; border-bottom: 1px solid #eee; font-size: 12px; }
            .row:last-child { border-bottom: none; }
            .row .label { color: #333; }
            .row .value { font-weight: 700; text-align: right; }
            .row-total { display: flex; justify-content: space-between; padding: 7px 16px; background: #f5f5f5; font-weight: 800; font-size: 12px; }
            .net-row { display: flex; justify-content: space-between; padding: 10px 16px; background: #1a472a; color: white; font-weight: 800; font-size: 14px; }
            .pct-badge { font-weight: 800; }
            .spacer { height: 8px; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Print button */}
      <div className="flex justify-end">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-primary/20"
        >
          <Printer className="w-4 h-4" /> Print / Export
        </button>
      </div>

      {/* ── Printable Receipt ── */}
      <div ref={printRef}>
        <div className="print-wrap bg-white text-gray-900 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-xl max-w-lg mx-auto font-mono">

          {/* Header */}
          <div className="header-top bg-primary text-white text-center px-6 py-5">
            <h1 className="text-lg font-extrabold tracking-wide uppercase">
              Super Green Plantation (Pvt) Ltd
            </h1>
          </div>
          <div className="header-sub bg-primary/80 text-white text-center px-4 py-2 text-sm font-bold tracking-widest uppercase border-t border-white/20">
            {(member.position?.title ?? "Staff").toUpperCase()} Incentive Pay Sheet
          </div>

          {/* Employee Info */}
          <div className="section">
            <div className="row">
              <span className="label">Employee Name</span>
              <span className="value font-bold">{member.nameWithInitials}</span>
            </div>
            <div className="row">
              <span className="label">Designation</span>
              <span className="value">{member.position?.title ?? "Staff"}</span>
            </div>
            <div className="row">
              <span className="label">Branch</span>
              <span className="value">{member.branches?.[0]?.branch?.name ?? "—"}</span>
            </div>
            <div className="row">
              <span className="label">Joining Date</span>
              <span className="value">
                {member.joiningDate
                  ? new Date(member.joiningDate).toLocaleDateString("en-LK").replace(/\//g, ".")
                  : "—"}
              </span>
            </div>
            <div className="row">
              <span className="label">Month</span>
              <span className="value">{monthLabel(payroll.year, payroll.month)}</span>
            </div>
          </div>

          {/* Spacer */}
          <div className="spacer h-2" />

          {/* Performance */}
          <div className="section">
            <div className="row">
              <span className="label">Target</span>
              <span className="value">{LKR(target)}</span>
            </div>
            <div className="row">
              <span className="label">Achievement</span>
              <span className="value">{LKR(achieved)}</span>
            </div>
            <div className="row">
              <span className="label">Achievement %</span>
              <span className="value pct-badge">
                {achievementPct.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Spacer */}
          <div className="spacer h-2" />

          {/* Earnings */}
          <div className="section">
            {basicIncentive > 0 && (
              <div className="row">
                <span className="label">Basic Incentive</span>
                <span className="value">{LKR(basicIncentive)}</span>
              </div>
            )}
            {targetBudget > 0 && (
              <div className="row">
                <span className="label">Target Budget</span>
                <span className="value">{LKR(targetBudget)}</span>
              </div>
            )}
            {excessComm > 0 && (
              <div className="row">
                <span className="label">Excess Commission</span>
                <span className="value">{LKR(excessComm)}</span>
              </div>
            )}
            {vehicleEarned > 0 && (
              <div className="row">
                <span className="label">Vehicle Allowance</span>
                <span className="value">{LKR(vehicleEarned)}</span>
              </div>
            )}
            {activationAllowance > 0 && (
              <div className="row">
                <span className="label">Team Activation</span>
                <span className="value">{LKR(activationAllowance)}</span>
              </div>
            )}
            {personalComm > 0 && (
              <div className="row">
                <span className="label">Personal Commission</span>
                <span className="value">{LKR(personalComm)}</span>
              </div>
            )}
            {orcEarned > 0 && (
              <div className="row">
                <span className="label">ORC / Upline Commission</span>
                <span className="value">{LKR(orcEarned)}</span>
              </div>
            )}
            <div className="row-total">
              <span>Gross Earnings</span>
              <span>{LKR(grossEarnings)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="section">
            <div className="row">
              <span className="label">Deductions</span>
              <span className="value">
                {totalDeductions > 0 ? LKR(totalDeductions) : "LKR  -"}
              </span>
            </div>
          </div>

          {/* Net to Bank */}
          <div className="net-row bg-primary text-white px-6 py-4 flex justify-between items-center font-extrabold text-base">
            <span className="uppercase tracking-widest text-sm">Net To Bank</span>
            <span className="text-lg">{LKR(netToBankAmount)}</span>
          </div>

        </div>
      </div>

      {/* ── Digital Card View (for on-screen) ── */}
      <div className="bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/40 overflow-hidden max-w-lg mx-auto shadow-lg mt-6">

        {/* Performance Stat Cards */}
        <div className="grid grid-cols-3 gap-px bg-border/30">
          <StatBox
            label="Target"
            value={LKR(target)}
            icon={<Target className="w-4 h-4" />}
            color="text-blue-500"
          />
          <StatBox
            label="Achieved"
            value={LKR(achieved)}
            icon={<TrendingUp className="w-4 h-4" />}
            color="text-emerald-500"
          />
          <StatBox
            label="Achievement"
            value={`${achievementPct.toFixed(0)}%`}
            icon={achievementPct >= 25
              ? <CheckCircle2 className="w-4 h-4" />
              : <XCircle className="w-4 h-4" />}
            color={achievementPct >= 25 ? "text-emerald-500" : "text-rose-400"}
            highlight
          />
        </div>

        {/* Earnings breakdown */}
        <div className="p-6 space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Earnings</p>
          {basicIncentive > 0 && (
            <EarningRow
              label="Basic Incentive"
              value={basicIncentive}
              hit={payroll.incentivePartialHit ?? payroll.incentiveHit}
            />
          )}
          {targetBudget > 0 && (
            <EarningRow label="Target Budget Salary" value={targetBudget} hit />
          )}
          {excessComm > 0 && (
            <EarningRow label="Excess Commission" value={excessComm} />
          )}
          {vehicleEarned > 0 && (
            <EarningRow label="Vehicle Allowance" value={vehicleEarned} hit={payroll.vehicleHit} />
          )}
          {activationAllowance > 0 && (
            <EarningRow label="Team Activation Allowance" value={activationAllowance} />
          )}
          {personalComm > 0 && (
            <EarningRow label="Personal Commission" value={personalComm} />
          )}
          {orcEarned > 0 && (
            <EarningRow label="ORC / Upline Commission" value={orcEarned} />
          )}

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

// ─── HO Salary Slip (Head Office Track) ──────────────────────────────────────

function HOPaySheet({
  payroll,
  member,
}: {
  payroll: MonthlyPayrollRecord;
  member: any;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const fixedAllowance = payroll.fixedAllowance ?? 0;
  const fuelAllowance = payroll.fuelAllowance ?? 0;
  const channelOp = payroll.channelOperation ?? 0;
  const attendanceAllowance = payroll.attendanceAllowance ?? 0;
  const orcEarned = payroll.orcEarned ?? 0;
  const commissionEarned = payroll.commissionEarned ?? 0;

  const loanInstalments = payroll.loanInstalments ?? 0;
  const festivalAdvance = payroll.festivalAdvance ?? 0;
  const merchandiseDeduction = payroll.merchandiseDeduction ?? 0;
  const epfDeduction = payroll.epfDeduction ?? 0;
  const advanceDeducted = payroll.advanceDeducted ?? 0;
  const totalDeductions = epfDeduction + loanInstalments + festivalAdvance + merchandiseDeduction + advanceDeducted;

  const handlePrint = () => {
    if (!printRef.current) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Salary Slip - ${member.nameWithInitials} - ${monthLabel(payroll.year, payroll.month)}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 20px; }
            .print-wrap { max-width: 600px; margin: 0 auto; border: 2px solid #111; }
            .header-top { background: #1a472a; color: white; text-align: center; padding: 14px 10px 8px; }
            .header-top h1 { font-size: 15px; font-weight: 800; }
            .header-sub { font-size: 11px; background: #2d6a4f; color: white; text-align: center; padding: 5px; }
            .section { border-bottom: 1px solid #ccc; }
            .row { display: flex; justify-content: space-between; padding: 5px 16px; border-bottom: 1px solid #eee; font-size: 12px; }
            .row .label { color: #333; }
            .row .value { font-weight: 700; text-align: right; }
            .row-total { display: flex; justify-content: space-between; padding: 7px 16px; background: #f5f5f5; font-weight: 800; }
            .net-row { display: flex; justify-content: space-between; padding: 10px 16px; background: #1a472a; color: white; font-weight: 800; font-size: 14px; }
            .two-col { display: grid; grid-template-columns: 1fr 1fr; }
            .col-header { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 16px; color: #666; border-bottom: 1px solid #eee; }
          </style>
        </head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-end">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-primary/20"
        >
          <Printer className="w-4 h-4" /> Print / Export
        </button>
      </div>

      <div ref={printRef}>
        <div className="print-wrap bg-white text-gray-900 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-xl font-mono">
          <div className="header-top bg-primary text-white text-center px-6 py-5">
            <h1 className="text-lg font-extrabold tracking-wide uppercase">Super Green Plantation (Pvt) Ltd</h1>
            <p className="text-xs text-white/70 mt-1">No: 598/M, Hirimbura Rd, Karapitiya, Galle</p>
          </div>
          <div className="header-sub bg-primary/80 text-white text-center px-4 py-2 text-sm font-bold tracking-widest uppercase border-t border-white/20">
            Salary Slip — {monthLabel(payroll.year, payroll.month)}
          </div>

          {/* Employee info */}
          <div className="section grid grid-cols-2">
            <div>
              <div className="row"><span className="label">Employee Name</span></div>
              <div className="row"><span className="label">Designation</span></div>
              <div className="row"><span className="label">Employee ID</span></div>
            </div>
            <div>
              <div className="row"><span className="value">{member.nameWithInitials}</span></div>
              <div className="row"><span className="value">{member.position?.title ?? "Staff"}</span></div>
              <div className="row"><span className="value">{member.empNo}</span></div>
            </div>
          </div>

          {/* Earnings + Deductions two-col */}
          <div className="section">
            <div className="two-col">
              <div>
                <div className="col-header">Earnings</div>
                <div className="row"><span className="label">Basic Salary</span><span className="value">{LKR(payroll.basicSalaryPermanent)}</span></div>
                {fixedAllowance > 0 && <div className="row"><span className="label">Fixed Allowance</span><span className="value">{LKR(fixedAllowance)}</span></div>}
                {channelOp > 0 && <div className="row"><span className="label">Channel Operation</span><span className="value">{LKR(channelOp)}</span></div>}
                {fuelAllowance > 0 && <div className="row"><span className="label">Fuel Allowance</span><span className="value">{LKR(fuelAllowance)}</span></div>}
                {attendanceAllowance > 0 && <div className="row"><span className="label">Attendance Allowance</span><span className="value">{LKR(attendanceAllowance)}</span></div>}
                {orcEarned > 0 && <div className="row"><span className="label">ORC / Upline Commission</span><span className="value">{LKR(orcEarned)}</span></div>}
                {commissionEarned > 0 && <div className="row"><span className="label">Personal Commission</span><span className="value">{LKR(commissionEarned)}</span></div>}
                <div className="row-total"><span>Total Gross</span><span>{LKR(payroll.grossPay)}</span></div>
              </div>
              <div>
                <div className="col-header">Deductions</div>
                <div className="row"><span className="label">EPF 8%</span><span className="value">{LKR(epfDeduction)}</span></div>
                {loanInstalments > 0 && <div className="row"><span className="label">Loan Instalment</span><span className="value">{LKR(loanInstalments)}</span></div>}
                {festivalAdvance > 0 && <div className="row"><span className="label">Festival Advance</span><span className="value">{LKR(festivalAdvance)}</span></div>}
                {merchandiseDeduction > 0 && <div className="row"><span className="label">Merchandise</span><span className="value">{LKR(merchandiseDeduction)}</span></div>}
                {advanceDeducted > 0 && <div className="row"><span className="label">Salary Advance</span><span className="value">{LKR(advanceDeducted)}</span></div>}
                <div className="row-total"><span>Total Deductions</span><span>{LKR(totalDeductions)}</span></div>
              </div>
            </div>
          </div>

          {/* Net */}
          <div className="net-row bg-primary text-white px-6 py-4 flex justify-between font-extrabold text-base">
            <span className="uppercase tracking-widest text-sm">Net To Bank</span>
            <span className="text-lg">{LKR(payroll.netPay)}</span>
          </div>

          {/* Company contributions */}
          <div className="section grid grid-cols-3 text-center py-3 px-4 gap-2">
            <div className="row flex-col items-center">
              <p className="label text-xs">EPF Employer 12%</p>
              <p className="value text-xs">{LKR(payroll.epfEmployer)}</p>
            </div>
            <div className="row flex-col items-center">
              <p className="label text-xs">ETF Employer 3%</p>
              <p className="value text-xs">{LKR(payroll.etfEmployer)}</p>
            </div>
            <div className="row flex-col items-center">
              <p className="label text-xs">Cost to Company</p>
              <p className="value text-xs font-black">{LKR((payroll.grossPay ?? 0) + (payroll.epfEmployer ?? 0) + (payroll.etfEmployer ?? 0))}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  icon,
  color,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
  highlight?: boolean;
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
  label,
  value,
  hit,
}: {
  label: string;
  value: number;
  hit?: boolean;
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
      <span className="text-xs font-bold tabular-nums">{LKR(value)}</span>
    </div>
  );
}

// ─── Main PaySheet (dispatcher) ───────────────────────────────────────────────

export default function PaySheet({
  payrolls,
  member,
}: {
  payrolls: MonthlyPayrollRecord[];
  member: any;
}) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  useEffect(() => {
    if (payrolls && payrolls.length > 0 && !selectedPeriod) {
      setSelectedPeriod(`${payrolls[0].year}-${payrolls[0].month}`);
    }
  }, [payrolls, selectedPeriod]);

  const currentPayroll = useMemo(
    () => payrolls.find((p) => `${p.year}-${p.month}` === selectedPeriod),
    [payrolls, selectedPeriod]
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
      {/* Period Selector */}
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
                className="appearance-none bg-transparent text-foreground font-bold text-lg pr-8 cursor-pointer focus:outline-none focus:ring-0 px-8"
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
                    {p.payrollCategory === "MARKETING" ? ` (${member.position?.title ?? "Staff"})` : " (HO)"}
                  </option>
                ))}
              </select>
              <ChevronDown className="px-8 w-4 h-4 text-muted-foreground absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {currentPayroll && (
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
            isMarketing
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
          }`}>
            {isMarketing ? `${member.position?.title ?? "Staff"} — Incentive Track` : "Head Office Track"}
          </span>
        )}
      </div>

      {/* Sheet Content */}
      {currentPayroll && (
        isMarketing
          ? <FAPaySheet payroll={currentPayroll} member={member} />
          : <HOPaySheet payroll={currentPayroll} member={member} />
      )}
    </div>
  );
}