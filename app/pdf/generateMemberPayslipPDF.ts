/**
 * generateMemberPayslipPDF.ts
 *
 * Bank-statement style single-page A5 payslip.
 * Tracks:
 *   MARKETING  → Incentive Pay Sheet (target / achievement / earnings breakdown)
 *   HEAD_OFFICE → Salary Slip (earnings / deductions two-section layout)
 *
 * Individual slips intentionally omit: branch, company name in header, join date.
 * Custom deductionAmount + deductionRemark are shown in the deductions section.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  dark:      [14, 42, 31]   as [number,number,number],   // #0e2a1f — hero
  accent:    [36, 180, 126] as [number,number,number],   // #24b47e — SGP green
  accentBg:  [230, 247, 240] as [number,number,number],
  ink:       [20, 25, 30]   as [number,number,number],
  mid:       [100, 116, 130] as [number,number,number],
  light:     [218, 225, 220] as [number,number,number],
  fog:       [246, 248, 247] as [number,number,number],
  white:     [255, 255, 255] as [number,number,number],
  red:       [210, 45, 45]  as [number,number,number],
  redBg:     [254, 242, 242] as [number,number,number],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const rs = (n: number | null | undefined) =>
  `LKR ${(n ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const pct = (n: number) => `${n.toFixed(0)}%`;

const periodShort = (year: number, month: number) =>
  new Date(year, month - 1).toLocaleString("en-US", { month: "short", year: "2-digit" }).replace(" ", "-");

const periodLong = (year: number, month: number) =>
  new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" });

// ── Main export ───────────────────────────────────────────────────────────────
export function generateMemberPayslipPDF(payroll: any, member: any) {
  const isMarketing = payroll.payrollCategory === "MARKETING";
  const positionTitle: string = member.position?.title ?? "Staff";
  const docTitle = isMarketing ? `${positionTitle} Incentive Pay Sheet` : "Salary Slip";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
  const PW = doc.internal.pageSize.getWidth();   // 148 mm
  const PH = doc.internal.pageSize.getHeight();  // 210 mm
  const M  = 11;
  const CW = PW - M * 2;

  // ── Header ─────────────────────────────────────────────────────────────────
  // Dark band
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, PW, 22, "F");
  // Accent top stripe
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, PW, 1.5, "F");

  // Doc title (left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.white);
  doc.text(docTitle, M, 11);

  // Period pill (right)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.accent);
  doc.text(periodLong(payroll.year, payroll.month), PW - M, 10, { align: "right" });

  // Ref line
  doc.setFontSize(6.5);
  doc.setTextColor(160, 210, 185);
  doc.text("Super Green Plantation — Confidential", M, 18);
  doc.setTextColor(...C.accent);
  const safeName = (member.nameWithInitials ?? member.name ?? "Employee").replace(/\s+/g, "_");
  doc.text(`Ref: ${safeName}_${periodShort(payroll.year, payroll.month)}`, PW - M, 18, { align: "right" });

  let y = 26;

  // ── Employee info strip ────────────────────────────────────────────────────
  doc.setFillColor(...C.fog);
  doc.setDrawColor(...C.light);
  doc.setLineWidth(0.2);
  doc.roundedRect(M, y, CW, 18, 1.5, 1.5, "FD");

  const infoItems = [
    { label: "NAME",        value: member.nameWithInitials ?? "—" },
    { label: "EMP NO",      value: member.empNo ?? "—" },
    { label: "DESIGNATION", value: positionTitle },
    { label: "PERIOD",      value: periodShort(payroll.year, payroll.month) },
  ];
  const iW = CW / infoItems.length;
  infoItems.forEach((item, i) => {
    const x = M + i * iW + 3;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...C.mid);
    doc.text(item.label, x, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.ink);
    doc.text(item.value, x, y + 13, { maxWidth: iW - 5 });
  });

  y += 23;

  // ── Track-specific content ─────────────────────────────────────────────────
  if (isMarketing) {
    y = drawMarketingBody(doc, payroll, y, M, PW, PH, CW);
  } else {
    y = drawHoBody(doc, payroll, y, M, PW, PH, CW);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setDrawColor(...C.light);
  doc.setLineWidth(0.2);
  doc.line(M, PH - 8, PW - M, PH - 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...C.mid);
  doc.text("This is a system-generated document — no signature required.", M, PH - 5);
  doc.text(`Page 1`, PW - M, PH - 5, { align: "right" });

  doc.save(`Payslip_${safeName}_${periodShort(payroll.year, payroll.month)}.pdf`);
}

// ── Row drawing ───────────────────────────────────────────────────────────────

function drawSection(doc: jsPDF, y: number, M: number, PW: number, label: string): number {
  doc.setFillColor(...C.accent);
  doc.rect(M, y, 2, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.mid);
  doc.text(label.toUpperCase(), M + 5, y + 4);
  doc.setDrawColor(...C.light);
  doc.setLineWidth(0.15);
  doc.line(M + 5 + doc.getTextWidth(label.toUpperCase()) + 2, y + 2.5, PW - M, y + 2.5);
  return y + 8;
}

function drawLine(
  doc: jsPDF, y: number, M: number, PW: number, CW: number,
  label: string, value: string,
  opts: { bold?: boolean; labelColor?: [number,number,number]; valueColor?: [number,number,number]; fillColor?: [number,number,number]; remark?: string; rowH?: number } = {}
): number {
  const rH = opts.rowH ?? 6.5;
  if (opts.fillColor) {
    doc.setFillColor(...opts.fillColor);
    doc.rect(M, y, CW, rH + (opts.remark ? 5 : 0), "F");
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...(opts.labelColor ?? C.mid));
  doc.text(label, M + 3, y + rH - 1.5);
  doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  doc.setTextColor(...(opts.valueColor ?? C.ink));
  doc.text(value, PW - M - 3, y + rH - 1.5, { align: "right" });

  if (opts.remark) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.mid);
    doc.text(`↳ ${opts.remark}`, M + 8, y + rH + 3);
    doc.setDrawColor(...C.light);
    doc.setLineWidth(0.12);
    doc.line(M, y + rH + 5.5, PW - M, y + rH + 5.5);
    return y + rH + 5.5;
  }

  doc.setDrawColor(...C.light);
  doc.setLineWidth(0.12);
  doc.line(M, y + rH, PW - M, y + rH);
  return y + rH;
}

// ── Marketing body ────────────────────────────────────────────────────────────
function drawMarketingBody(
  doc: jsPDF, payroll: any, startY: number, M: number, PW: number, PH: number, CW: number
): number {
  let y = startY;

  const target         = payroll.monthlyTarget ?? 0;
  const achieved       = payroll.volumeAchieved ?? 0;
  const achievePct     = target > 0 ? (achieved / target) * 100 : 0;
  const basicIncentive = payroll.incentiveEarned ?? 0;
  const targetBudget   = payroll.targetBudgetSalary ?? 0;
  const excessComm     = (payroll.excessCommission ?? 0) + (payroll.excessEarned ?? 0);
  const vehicleEarned  = payroll.vehicleEarned ?? 0;
  const teamActive     = payroll.activationAllowanceEarned ?? 0;
  const personalComm   = payroll.commissionEarned ?? 0;
  const orcEarned      = payroll.orcEarned ?? 0;
  const grossPay       = payroll.grossPay ?? 0;
  const advanceDed     = payroll.advanceDeducted ?? 0;
  const deductionAmt   = payroll.deductionAmount ?? 0;
  const deductionRmk   = payroll.deductionRemark ?? "";
  const netPay         = payroll.netPay ?? 0;

  // Performance box
  const boxW = (CW - 4) / 3;
  const perfData = [
    { label: "Target",      value: rs(target),          color: C.ink },
    { label: "Achievement", value: rs(achieved),        color: C.ink },
    { label: "Hit Rate",    value: pct(achievePct),     color: achievePct >= 25 ? C.accent : C.red as [number,number,number] },
  ];
  perfData.forEach((p, i) => {
    const bx = M + i * (boxW + 2);
    doc.setFillColor(...C.fog);
    doc.setDrawColor(...C.light);
    doc.setLineWidth(0.2);
    doc.roundedRect(bx, y, boxW, 14, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...C.mid);
    doc.text(p.label, bx + 3, y + 5.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...p.color);
    doc.text(p.value, bx + 3, y + 11.5);
  });
  y += 18;

  // Earnings
  y = drawSection(doc, y, M, PW, "Earnings");
  if (basicIncentive  > 0) y = drawLine(doc, y, M, PW, CW, "Basic Incentive",            rs(basicIncentive));
  if (targetBudget    > 0) y = drawLine(doc, y, M, PW, CW, "Target Budget Salary",        rs(targetBudget));
  if (excessComm      > 0) y = drawLine(doc, y, M, PW, CW, "Excess Commission",           rs(excessComm));
  if (vehicleEarned   > 0) y = drawLine(doc, y, M, PW, CW, "Vehicle Allowance",           rs(vehicleEarned));
  if (teamActive      > 0) y = drawLine(doc, y, M, PW, CW, "Team Activation Allowance",   rs(teamActive));
  if (personalComm    > 0) y = drawLine(doc, y, M, PW, CW, "Personal Commission",         rs(personalComm));
  if (orcEarned       > 0) y = drawLine(doc, y, M, PW, CW, "ORC / Upline Commission",     rs(orcEarned));
  y = drawLine(doc, y, M, PW, CW, "Gross Earnings", rs(grossPay), {
    fillColor: C.accentBg, bold: true, valueColor: C.accent, labelColor: C.dark, rowH: 8,
  });
  y += 3;

  // Deductions
  y = drawSection(doc, y, M, PW, "Deductions");
  if (advanceDed > 0)
    y = drawLine(doc, y, M, PW, CW, "Advance Deducted",   rs(advanceDed),  { valueColor: C.red });
  if (deductionAmt > 0)
    y = drawLine(doc, y, M, PW, CW, "Other Deduction",    rs(deductionAmt), {
      valueColor: C.red, remark: deductionRmk || undefined,
    });
  if (advanceDed === 0 && deductionAmt === 0)
    y = drawLine(doc, y, M, PW, CW, "Deductions", "—", { valueColor: C.mid });
  y += 3;

  // Net band
  y = drawNetBand(doc, y, M, PW, CW, netPay);
  return y;
}

// ── HO body ───────────────────────────────────────────────────────────────────
function drawHoBody(
  doc: jsPDF, payroll: any, startY: number, M: number, PW: number, PH: number, CW: number
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
  const merchandiseDed      = payroll.merchandiseDeduction ?? 0;
  const advanceDed          = payroll.advanceDeducted ?? 0;
  const deductionAmt        = payroll.deductionAmount ?? 0;
  const deductionRmk        = payroll.deductionRemark ?? "";
  const totalDeductions     = epfDeduction + loanInstalments + festivalAdvance + merchandiseDed + advanceDed + deductionAmt;
  const netPay              = payroll.netPay ?? 0;

  const epfEmployer         = payroll.epfEmployer ?? 0;
  const etfEmployer         = payroll.etfEmployer ?? 0;

  // Earnings
  y = drawSection(doc, y, M, PW, "Earnings");
  y = drawLine(doc, y, M, PW, CW, "Basic Salary",               rs(basicSalary));
  if (fixedAllowance      > 0) y = drawLine(doc, y, M, PW, CW, "Fixed Allowance",          rs(fixedAllowance));
  if (channelOp           > 0) y = drawLine(doc, y, M, PW, CW, "Channel Operation",        rs(channelOp));
  if (fuelAllowance       > 0) y = drawLine(doc, y, M, PW, CW, "Fuel Allowance",           rs(fuelAllowance));
  if (attendanceAllowance > 0) y = drawLine(doc, y, M, PW, CW, "Attendance Allowance",     rs(attendanceAllowance));
  if (orcEarned           > 0) y = drawLine(doc, y, M, PW, CW, "ORC / Upline Commission",  rs(orcEarned));
  if (commissionEarned    > 0) y = drawLine(doc, y, M, PW, CW, "Personal Commission",      rs(commissionEarned));
  y = drawLine(doc, y, M, PW, CW, "Total Gross", rs(grossPay), {
    fillColor: C.accentBg, bold: true, valueColor: C.accent, labelColor: C.dark, rowH: 8,
  });
  y += 3;

  // Deductions
  y = drawSection(doc, y, M, PW, "Deductions");
  if (epfDeduction    > 0) y = drawLine(doc, y, M, PW, CW, "EPF Employee 8%",      rs(epfDeduction),    { valueColor: C.red });
  if (loanInstalments > 0) y = drawLine(doc, y, M, PW, CW, "Loan Instalment",      rs(loanInstalments), { valueColor: C.red });
  if (festivalAdvance > 0) y = drawLine(doc, y, M, PW, CW, "Festival Advance",     rs(festivalAdvance), { valueColor: C.red });
  if (merchandiseDed  > 0) y = drawLine(doc, y, M, PW, CW, "Merchandise",          rs(merchandiseDed),  { valueColor: C.red });
  if (advanceDed      > 0) y = drawLine(doc, y, M, PW, CW, "Salary Advance",       rs(advanceDed),      { valueColor: C.red });
  if (deductionAmt    > 0) y = drawLine(doc, y, M, PW, CW, "Other Deduction",      rs(deductionAmt),    {
    valueColor: C.red, remark: deductionRmk || undefined,
  });
  y = drawLine(doc, y, M, PW, CW, "Total Deductions", rs(totalDeductions), {
    fillColor: C.redBg, bold: true, valueColor: C.red, labelColor: C.red, rowH: 8,
  });
  y += 3;

  // Net
  y = drawNetBand(doc, y, M, PW, CW, netPay);
  y += 4;

  // Company contributions (compact footer strip)
  doc.setFillColor(...C.fog);
  doc.setDrawColor(...C.light);
  doc.setLineWidth(0.15);
  doc.roundedRect(M, y, CW, 14, 1.5, 1.5, "FD");
  const contribs = [
    { label: "EPF Employer 12%", value: rs(epfEmployer) },
    { label: "ETF Employer 3%",  value: rs(etfEmployer) },
    { label: "Cost to Company",  value: rs(grossPay + epfEmployer + etfEmployer) },
  ];
  const cW = CW / 3;
  contribs.forEach((c, i) => {
    const cx = M + i * cW + 3;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...C.mid);
    doc.text(c.label, cx, y + 5.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...C.ink);
    doc.text(c.value, cx, y + 11);
  });
  y += 18;
  return y;
}

// ── Net band ──────────────────────────────────────────────────────────────────
function drawNetBand(
  doc: jsPDF, y: number, M: number, PW: number, CW: number, netPay: number
): number {
  const H = 14;
  doc.setFillColor(...C.dark);
  doc.roundedRect(M, y, CW, H, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(160, 210, 185);
  doc.text("NET TO BANK", M + 4, y + H / 2 + 1.2);
  doc.setFontSize(11);
  doc.setTextColor(...C.white);
  doc.text(rs(netPay), PW - M - 4, y + H / 2 + 1.2, { align: "right" });
  return y + H;
}