/**
 * generateMemberPayslipPDF.ts
 *
 * Generates a single-page A5 PDF payslip for one employee / one payroll period.
 * Handles both tracks:
 *   MARKETING  → position title + "Incentive Pay Sheet"
 *                shows Target / Achievement / Achievement % block
 *                no EPF deduction section
 *   HEAD_OFFICE → "Salary Slip"
 *                 two-column Earnings / Deductions layout
 *                 EPF + company contributions footer
 *
 * Usage (inside PaySheet.tsx):
 *   import { generateMemberPayslipPDF } from "@/app/pdf/generateMemberPayslipPDF";
 *   generateMemberPayslipPDF(currentPayroll, member);
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Colours (kept in sync with pdfStyles.ts) ─────────────────────────────────
const GREEN: [number, number, number]  = [26, 71, 42];
const GREEN2: [number, number, number] = [45, 106, 79];
const LIGHT: [number, number, number]  = [245, 247, 245];
const WHITE: [number, number, number]  = [255, 255, 255];
const TEXT: [number, number, number]   = [30, 30, 30];
const MUTED: [number, number, number]  = [100, 116, 139];
const RED: [number, number, number]    = [185, 28, 28];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtLKR = (n: number | null | undefined) =>
  `LKR ${(n ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtPct = (n: number) => `${n.toFixed(0)}%`;

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1)
    .toLocaleString("en-US", { month: "short", year: "2-digit" })
    .replace(" ", "-");
}

function monthLongLabel(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

// ─── Shared drawing helpers ────────────────────────────────────────────────────

/** Draws the green company header band. Returns the Y coordinate below it. */
function drawHeader(doc: jsPDF, docTitle: string, periodLabel: string, margin: number): number {
  const PW = doc.internal.pageSize.getWidth();

  // Dark green company name band
  doc.setFillColor(...GREEN);
  doc.rect(margin, margin, PW - margin * 2, 13, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SUPER GREEN PLANTATION (PVT) LTD", PW / 2, margin + 9, { align: "center" });

  // Lighter sub-header band — document title
  doc.setFillColor(...GREEN2);
  doc.rect(margin, margin + 13, PW - margin * 2, 8, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(docTitle.toUpperCase(), PW / 2, margin + 18.5, { align: "center" });

  // Off-white period line
  doc.setFillColor(...LIGHT);
  doc.rect(margin, margin + 21, PW - margin * 2, 6, "F");
  doc.setTextColor(...MUTED);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(periodLabel, PW / 2, margin + 25.5, { align: "center" });

  return margin + 29; // Y below header
}

/** Draws a thin horizontal rule. */
function hRule(doc: jsPDF, y: number, margin: number) {
  const PW = doc.internal.pageSize.getWidth();
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.15);
  doc.line(margin, y, PW - margin, y);
}

/** Draws a two-cell label/value row directly (no autoTable overhead for simple rows). */
function drawRow(
  doc: jsPDF,
  y: number,
  margin: number,
  label: string,
  value: string,
  opts: {
    labelColor?: [number, number, number];
    valueColor?: [number, number, number];
    valueBold?: boolean;
    fontSize?: number;
    fillColor?: [number, number, number];
    rowH?: number;
  } = {},
): number {
  const PW = doc.internal.pageSize.getWidth();
  const W = PW - margin * 2;
  const rH = opts.rowH ?? 6.5;
  const fs = opts.fontSize ?? 8;

  if (opts.fillColor) {
    doc.setFillColor(...opts.fillColor);
    doc.rect(margin, y, W, rH, "F");
  }

  doc.setFontSize(fs);
  doc.setTextColor(...(opts.labelColor ?? MUTED));
  doc.setFont("helvetica", "normal");
  doc.text(label, margin + 2, y + rH - 1.8);

  doc.setTextColor(...(opts.valueColor ?? TEXT));
  doc.setFont("helvetica", opts.valueBold ? "bold" : "normal");
  doc.text(value, PW - margin - 2, y + rH - 1.8, { align: "right" });

  hRule(doc, y + rH, margin);
  return y + rH;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateMemberPayslipPDF(payroll: any, member: any) {
  const isMarketing = payroll.payrollCategory === "MARKETING";

  const positionTitle: string = member.position?.title ?? "Staff";
  const branchName: string   = member.branches?.[0]?.branch?.name ?? "—";
  const period               = monthLabel(payroll.year, payroll.month);
  const periodLong           = monthLongLabel(payroll.year, payroll.month);

  const dateOfJoin = member.dateOfJoin
    ? new Date(member.dateOfJoin).toLocaleDateString("en-LK").replace(/\//g, ".")
    : "—";

  const docTitle = isMarketing
    ? `${positionTitle} Incentive Pay Sheet`
    : "Salary Slip";

  const doc  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
  const PW   = doc.internal.pageSize.getWidth();
  const PH   = doc.internal.pageSize.getHeight();
  const M    = 12;  // margin
  const CW   = PW - M * 2; // content width

  // ── Header ──────────────────────────────────────────────────────────────────
  let y = drawHeader(
    doc,
    docTitle,
    `Branch: ${branchName}  |  Period: ${periodLong}`,
    M,
  );
  y += 2;

  // ── Employee info block ──────────────────────────────────────────────────────
  const infoRows: [string, string][] = [
    ["Employee Name", member.nameWithInitials ?? "—"],
    ["Designation",   positionTitle],
    ["Emp No",        member.empNo ?? "—"],
    ["Branch",        branchName],
    ["Date of Join",  dateOfJoin],
    ["Month",         period],
  ];

  for (const [label, value] of infoRows) {
    y = drawRow(doc, y, M, label, value, { valueBold: true });
  }
  y += 3;

  // ────────────────────────────────────────────────────────────────────────────
  if (isMarketing) {
    y = drawMarketingSection(doc, payroll, y, M, PW, PH, CW);
  } else {
    y = drawHoSection(doc, payroll, y, M, PW, PH, CW);
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text("Super Green Plantation ERP — Confidential", PW / 2, PH - 6, { align: "center" });

  // ── Save ────────────────────────────────────────────────────────────────────
  const safeName = (member.nameWithInitials ?? "Employee").replace(/\s+/g, "_");
  doc.save(`Payslip_${safeName}_${period}_${payroll.year}.pdf`);
}

// ─── MARKETING track section ──────────────────────────────────────────────────

function drawMarketingSection(
  doc: jsPDF,
  payroll: any,
  startY: number,
  M: number,
  PW: number,
  PH: number,
  CW: number,
): number {
  let y = startY;

  const target         = payroll.monthlyTarget ?? 0;
  const achieved       = payroll.volumeAchieved ?? 0;
  const achievementPct = target > 0 ? (achieved / target) * 100 : 0;

  const basicIncentive = payroll.incentiveEarned ?? 0;
  const targetBudget   = payroll.targetBudgetSalary ?? 0;
  const excessComm     = (payroll.excessCommission ?? 0) + (payroll.excessEarned ?? 0);
  const vehicleEarned  = payroll.vehicleEarned ?? 0;
  const teamActive     = payroll.activationAllowanceEarned ?? 0;
  const personalComm   = payroll.commissionEarned ?? 0;
  const orcEarned      = payroll.orcEarned ?? 0;
  const grossPay       = payroll.grossPay ?? 0;
  const advanceDed     = payroll.advanceDeducted ?? 0;
  const netPay         = payroll.netPay ?? 0;

  // ── Performance block ──
  y = drawRow(doc, y, M, "Target",         fmtLKR(target));
  y = drawRow(doc, y, M, "Achievement",    fmtLKR(achieved));
  y = drawRow(doc, y, M, "Achievement %",  fmtPct(achievementPct), {
    valueColor: achievementPct >= 25 ? [22, 163, 74] : RED,
    valueBold: true,
  });
  y += 3;

  // ── Earnings ──
  const earningLines: [string, number][] = [
    ["Basic Incentive",       basicIncentive],
    ["Target Budget Salary",  targetBudget],
    ["Excess Commission",     excessComm],
    ["Vehicle Allowance",     vehicleEarned],
    ["Team Activation",       teamActive],
    ["Personal Commission",   personalComm],
    ["ORC / Upline Commission", orcEarned],
  ].filter(([, v]) => (v as number) > 0) as [string, number][];

  for (const [label, value] of earningLines) {
    y = drawRow(doc, y, M, label, fmtLKR(value));
  }

  // Gross row — highlighted
  y = drawRow(doc, y, M, "Gross Earnings", fmtLKR(grossPay), {
    fillColor: [228, 244, 234],
    labelColor: GREEN,
    valueColor: GREEN,
    valueBold: true,
    fontSize: 8.5,
    rowH: 7.5,
  });
  y += 2;

  // ── Deductions ──
  y = drawRow(doc, y, M, "Advance Deducted", advanceDed > 0 ? fmtLKR(advanceDed) : "LKR  —", {
    valueColor: advanceDed > 0 ? RED : MUTED,
  });
  y += 3;

  // ── Net To Bank ──
  y = drawNetBand(doc, y, M, CW, PW, netPay);

  return y;
}

// ─── HEAD OFFICE track section ────────────────────────────────────────────────

function drawHoSection(
  doc: jsPDF,
  payroll: any,
  startY: number,
  M: number,
  PW: number,
  PH: number,
  CW: number,
): number {
  let y = startY;

  const basicSalary         = payroll.basicSalaryPermanent ?? 0;
  const fixedAllowance      = payroll.fixedAllowance ?? 0;
  const channelOp           = payroll.channelOperation ?? 0;
  const fuelAllowance       = payroll.fuelAllowance ?? 0;
  const attendanceAllowance = payroll.attendanceAllowance ?? 0;
  const orcEarned           = payroll.orcEarned ?? 0;
  const commissionEarned    = payroll.commissionEarned ?? 0;
  const grossPay            = payroll.grossPay ?? 0;

  const epfDeduction        = payroll.epfDeduction ?? 0;
  const loanInstalments     = payroll.loanInstalments ?? 0;
  const festivalAdvance     = payroll.festivalAdvance ?? 0;
  const merchandiseDeduction = payroll.merchandiseDeduction ?? 0;
  const advanceDed          = payroll.advanceDeducted ?? 0;
  const totalDeductions     = epfDeduction + loanInstalments + festivalAdvance + merchandiseDeduction + advanceDed;
  const netPay              = payroll.netPay ?? 0;

  const epfEmployer         = payroll.epfEmployer ?? 0;
  const etfEmployer         = payroll.etfEmployer ?? 0;

  // ── Earnings ──
  const earningLines: [string, number][] = [
    ["Basic Salary",           basicSalary],
    ["Fixed Allowance",        fixedAllowance],
    ["Channel Operation",      channelOp],
    ["Fuel Allowance",         fuelAllowance],
    ["Attendance Allowance",   attendanceAllowance],
    ["ORC / Upline Commission", orcEarned],
    ["Personal Commission",    commissionEarned],
  ].filter(([, v]) => (v as number) > 0) as [string, number][];

  for (const [label, value] of earningLines) {
    y = drawRow(doc, y, M, label, fmtLKR(value));
  }

  // Gross
  y = drawRow(doc, y, M, "Total Gross", fmtLKR(grossPay), {
    fillColor: [228, 244, 234],
    labelColor: GREEN,
    valueColor: GREEN,
    valueBold: true,
    fontSize: 8.5,
    rowH: 7.5,
  });
  y += 2;

  // ── Deductions ──
  const dedLines: [string, number][] = [
    ["EPF Contribution 8%",  epfDeduction],
    ["Loan Instalment",      loanInstalments],
    ["Festival Advance",     festivalAdvance],
    ["Merchandise Deduction", merchandiseDeduction],
    ["Salary Advance",       advanceDed],
  ].filter(([, v]) => (v as number) > 0) as [string, number][];

  for (const [label, value] of dedLines) {
    y = drawRow(doc, y, M, label, fmtLKR(value), { valueColor: RED });
  }

  // Total deductions
  y = drawRow(doc, y, M, "Total Deductions", fmtLKR(totalDeductions), {
    fillColor: [254, 242, 242],
    labelColor: RED,
    valueColor: RED,
    valueBold: true,
    rowH: 7.5,
  });
  y += 3;

  // ── Net To Bank ──
  y = drawNetBand(doc, y, M, CW, PW, netPay);
  y += 4;

  // ── Company contributions footer ──
  const contribLines: [string, number][] = [
    ["EPF Employer Contribution 12%", epfEmployer],
    ["ETF Employer Contribution 3%",  etfEmployer],
    ["Cost to Company",               grossPay + epfEmployer + etfEmployer],
  ];

  for (const [label, value] of contribLines) {
    y = drawRow(doc, y, M, label, fmtLKR(value), {
      labelColor: MUTED,
      fontSize: 7,
      rowH: 6,
    });
  }

  return y;
}

// ─── Net To Bank green band ────────────────────────────────────────────────────

function drawNetBand(
  doc: jsPDF,
  y: number,
  M: number,
  CW: number,
  PW: number,
  netPay: number,
): number {
  const H = 13;
  doc.setFillColor(...GREEN);
  doc.rect(M, y, CW, H, "F");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("NET TO BANK", M + 3, y + H / 2 + 1.5);

  doc.setFontSize(10);
  doc.text(fmtLKR(netPay), PW - M - 3, y + H / 2 + 1.5, { align: "right" });

  return y + H;
}