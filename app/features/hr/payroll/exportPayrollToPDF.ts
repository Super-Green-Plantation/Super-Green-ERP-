/**
 * exportPayrollToPDF.ts
 *
 * Two exports:
 *   downloadPayrollSummaryPDF  — landscape batch table (all employees, one row each)
 *   downloadPayrollReceiptsPDF — per-employee A5 receipts merged into one PDF
 *
 * Both now show deductionAmount + deductionRemark alongside existing deductions.
 * Branch-wise summary table: "Deductions" column = all deductions summed;
 *   a "Remark" sub-column shows the remark when present.
 * Individual receipts: deductionAmount shown as its own labelled row with remark below.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  dark:     [14, 42, 31]   as [number,number,number],
  accent:   [36, 180, 126] as [number,number,number],
  accentBg: [230, 247, 240] as [number,number,number],
  fog:      [246, 248, 247] as [number,number,number],
  ink:      [20, 25, 30]   as [number,number,number],
  mid:      [100, 116, 130] as [number,number,number],
  light:    [215, 222, 218] as [number,number,number],
  white:    [255, 255, 255] as [number,number,number],
  red:      [210, 45, 45]  as [number,number,number],
  redBg:    [254, 242, 242] as [number,number,number],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const rs = (n: number | null | undefined) =>
  `LKR ${(n ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const num = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const periodShort = (month: number, year: number) =>
  new Date(year, month - 1).toLocaleString("en-US", { month: "short", year: "2-digit" }).replace(" ", "-");

const periodLong = (month: number, year: number) =>
  new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" });

// ── Shared header ─────────────────────────────────────────────────────────────
function drawHeader(
  doc: jsPDF, title: string, subtitle: string,
  x: number, y: number, endX: number, landscape = false
): number {
  const PW = doc.internal.pageSize.getWidth();
  // Dark band
  doc.setFillColor(...C.dark);
  doc.rect(x, y, endX - x, 14, "F");
  // Accent stripe
  doc.setFillColor(...C.accent);
  doc.rect(x, y, endX - x, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(landscape ? 11 : 9.5);
  doc.setTextColor(...C.white);
  doc.text("SUPER GREEN PLANTATION", PW / 2, y + 9, { align: "center" });

  // Sub-band
  doc.setFillColor(25, 60, 40);
  doc.rect(x, y + 14, endX - x, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(landscape ? 8.5 : 7.5);
  doc.setTextColor(...C.accent);
  doc.text(title.toUpperCase(), PW / 2, y + 19.5, { align: "center" });

  // Info strip
  doc.setFillColor(...C.fog);
  doc.rect(x, y + 22, endX - x, 7, "F");
  doc.setDrawColor(...C.light);
  doc.setLineWidth(0.2);
  doc.line(x, y + 22, endX, y + 22);
  doc.line(x, y + 29, endX, y + 29);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.mid);
  doc.text(subtitle, PW / 2, y + 26.5, { align: "center" });

  return y + 32;
}

// ── 1. BATCH SUMMARY TABLE ────────────────────────────────────────────────────
export function downloadPayrollSummaryPDF(
  preview: any[], branchName: string, month: number, year: number
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const PW = doc.internal.pageSize.getWidth();  // 297 mm
  const PH = doc.internal.pageSize.getHeight(); // 210 mm
  const MG = 8;

  let y = MG;
  y = drawHeader(
    doc,
    "Marketing Payroll — Incentive Pay Sheet",
    `Branch: ${branchName}  ·  Period: ${periodLong(month, year)}  ·  Generated: ${new Date().toLocaleDateString("en-GB")}`,
    MG, y, PW - MG, true
  );

  const head = [[
    "Employee", "Emp No", "Position",
    "Volume\nAchieved",
    "Basic\nIncentive", "Target\nBudget", "Excess\nComm.",
    "Vehicle", "Team\nActiv.", "ORC", "Personal\nComm.",
    "Gross Pay", "Deductions", "Other\nDeduction", "Remark", "Net To Bank",
  ]];

  const body = preview.map((r) => {
    const bd = r.breakdown ?? {};
    const stdDeductions =
      (bd.epfDeduction ?? 0) +
      (bd.loanInstalments ?? 0) +
      (bd.festivalAdvance ?? 0) +
      (bd.merchandiseDeduction ?? 0) +
      (r.advanceDeducted ?? 0);
    const otherDed = r.deductionAmount ?? 0;

    return [
      r.name ?? "—",
      r.empNo ?? "—",
      r.position ?? "—",
      num(r.volumeAchieved ?? 0),
      num(bd.incentiveEarned ?? 0),
      num(bd.targetBudgetSalary ?? 0),
      num((bd.excessCommission ?? 0) + (r.excessEarned ?? 0)),
      num(bd.vehicleEarned ?? 0),
      num(bd.teamActiveEarned ?? 0),
      num(r.orcEarned ?? 0),
      num(r.personalCommissionEarned ?? 0),
      num(bd.grossPay ?? 0),
      num(stdDeductions),
      otherDed > 0 ? num(otherDed) : "—",
      r.deductionRemark ?? "—",
      num(bd.netPay ?? 0),
    ];
  });

  // Totals row
  const T = preview.reduce((acc, r) => {
    const bd = r.breakdown ?? {};
    const stdDed = (bd.epfDeduction ?? 0) + (bd.loanInstalments ?? 0) + (bd.festivalAdvance ?? 0) + (bd.merchandiseDeduction ?? 0) + (r.advanceDeducted ?? 0);
    acc.vol   += r.volumeAchieved ?? 0;
    acc.inc   += bd.incentiveEarned ?? 0;
    acc.tbs   += bd.targetBudgetSalary ?? 0;
    acc.exc   += (bd.excessCommission ?? 0) + (r.excessEarned ?? 0);
    acc.veh   += bd.vehicleEarned ?? 0;
    acc.tea   += bd.teamActiveEarned ?? 0;
    acc.orc   += r.orcEarned ?? 0;
    acc.com   += r.personalCommissionEarned ?? 0;
    acc.gross += bd.grossPay ?? 0;
    acc.ded   += stdDed;
    acc.other += r.deductionAmount ?? 0;
    acc.net   += bd.netPay ?? 0;
    return acc;
  }, { vol: 0, inc: 0, tbs: 0, exc: 0, veh: 0, tea: 0, orc: 0, com: 0, gross: 0, ded: 0, other: 0, net: 0 });

  body.push([
    "TOTAL", "", "",
    num(T.vol), num(T.inc), num(T.tbs), num(T.exc),
    num(T.veh), num(T.tea), num(T.orc), num(T.com),
    num(T.gross), num(T.ded),
    T.other > 0 ? num(T.other) : "—", "",
    num(T.net),
  ]);

  autoTable(doc, {
    startY: y + 2,
    head,
    body,
    theme: "plain",
    styles: {
      fontSize: 6.2,
      cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
      textColor: C.ink,
      lineColor: C.light,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: C.dark,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 6.2,
      halign: "center",
      cellPadding: 2.5,
    },
    alternateRowStyles: { fillColor: C.fog },
    didParseCell(data) {
      // Totals row — bold, green tint
      if (data.row.index === body.length - 1) {
        data.cell.styles.fillColor = C.accentBg;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 6.5;
      }
      // Right-align numeric cols (index >= 3, exclude Remark col index 14)
      if (data.section === "body" && data.column.index >= 3 && data.column.index !== 14) {
        data.cell.styles.halign = "right";
      }
      // Remark col — muted, italic
      if (data.section === "body" && data.column.index === 14) {
        data.cell.styles.textColor = C.mid;
        data.cell.styles.fontStyle = "italic";
        data.cell.styles.fontSize = 5.8;
      }
      // Other deduction — red when present
      if (data.section === "body" && data.column.index === 13 && data.cell.text[0] !== "—") {
        data.cell.styles.textColor = C.red;
        data.cell.styles.fontStyle = "bold";
      }
      // Net column — bold
      if (data.section === "body" && data.column.index === 15) {
        data.cell.styles.fontStyle = "bold";
      }
    },
    columnStyles: {
      0:  { cellWidth: 30 },   // Name
      1:  { cellWidth: 13 },   // Emp No
      2:  { cellWidth: 15 },   // Position
      3:  { cellWidth: 18, halign: "right" },  // Volume
      4:  { cellWidth: 16, halign: "right" },
      5:  { cellWidth: 16, halign: "right" },
      6:  { cellWidth: 15, halign: "right" },
      7:  { cellWidth: 13, halign: "right" },
      8:  { cellWidth: 13, halign: "right" },
      9:  { cellWidth: 16, halign: "right" },
      10: { cellWidth: 16, halign: "right" },
      11: { cellWidth: 19, halign: "right" },
      12: { cellWidth: 17, halign: "right" },
      13: { cellWidth: 17, halign: "right" },  // Other ded
      14: { cellWidth: 26 },                    // Remark
      15: { cellWidth: 19, halign: "right" },  // Net
    },
    margin: { left: MG, right: MG },
  });

  const finalY = (doc as any).lastAutoTable.finalY;
  drawPageFooter(doc, PW, PH, finalY + 4);

  doc.save(`Payroll_${branchName}_${periodShort(month, year)}.pdf`);
}

// ── 2. INDIVIDUAL RECEIPTS ────────────────────────────────────────────────────
export function downloadPayrollReceiptsPDF(
  preview: any[], branchName: string, month: number, year: number
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
  const PW  = doc.internal.pageSize.getWidth();   // 148 mm
  const PH  = doc.internal.pageSize.getHeight();  // 210 mm
  const M   = 11;
  const CW  = PW - M * 2;

  preview.forEach((r, idx) => {
    if (idx > 0) doc.addPage();

    const bd = r.breakdown ?? {};
    const posTitle = (r.position ?? "Marketing Staff");

    // Performance
    const target      = r.monthlyTarget ?? bd.targetAmount ?? 0;
    const achieved    = r.volumeAchieved ?? 0;
    const achievePct  = target > 0 ? (achieved / target) * 100 : 0;

    // Earnings
    const basicInc    = bd.incentiveEarned ?? 0;
    const targetBudg  = bd.targetBudgetSalary ?? 0;
    const excessComm  = (bd.excessCommission ?? 0) + (r.excessEarned ?? 0);
    const vehicleE    = bd.vehicleEarned ?? 0;
    const teamActive  = bd.teamActiveEarned ?? 0;
    const personalC   = r.personalCommissionEarned ?? 0;
    const orcE        = r.orcEarned ?? 0;
    const grossPay    = bd.grossPay ?? 0;

    // Deductions
    const epfDed      = bd.epfDeduction ?? 0;
    const advDed      = r.advanceDeducted ?? 0;
    const otherDed    = r.deductionAmount ?? 0;
    const otherRmk    = r.deductionRemark ?? "";
    const totalDed    = epfDed + advDed + otherDed;
    const netPay      = bd.netPay ?? 0;

    // ── Header ──
    let y = M;
    y = drawHeader(
      doc,
      `${posTitle} Incentive Pay Sheet`,
      `Branch: ${branchName}  ·  Period: ${periodLong(month, year)}`,
      M, y, PW - M
    );
    y += 2;

    // ── Employee info strip ──
    doc.setFillColor(...C.fog);
    doc.setDrawColor(...C.light);
    doc.setLineWidth(0.2);
    doc.roundedRect(M, y, CW, 15, 1.5, 1.5, "FD");
    const infoItems = [
      { label: "NAME",     value: r.name ?? "—" },
      { label: "EMP NO",   value: r.empNo ?? "—" },
      { label: "POSITION", value: posTitle },
      { label: "MONTH",    value: periodShort(month, year) },
    ];
    const iW = CW / infoItems.length;
    infoItems.forEach((item, i) => {
      const ix = M + i * iW + 3;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(...C.mid);
      doc.text(item.label, ix, y + 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...C.ink);
      doc.text(item.value, ix, y + 11.5, { maxWidth: iW - 4 });
    });
    y += 19;

    // ── Performance boxes ──
    const perfItems = [
      { label: "Target",      value: rs(target),    color: C.ink },
      { label: "Achievement", value: rs(achieved),  color: C.ink },
      { label: "Hit Rate",    value: `${achievePct.toFixed(0)}%`, color: achievePct >= 25 ? C.accent : C.red as [number,number,number] },
    ];
    const bW = (CW - 4) / 3;
    perfItems.forEach((p, i) => {
      const bx = M + i * (bW + 2);
      doc.setFillColor(...C.fog);
      doc.setDrawColor(...C.light);
      doc.setLineWidth(0.2);
      doc.roundedRect(bx, y, bW, 12, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(...C.mid);
      doc.text(p.label, bx + 2.5, y + 4.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...p.color);
      doc.text(p.value, bx + 2.5, y + 9.5);
    });
    y += 16;

    // ── Earnings ──
    y = drawRecSection(doc, y, M, PW, "Earnings");
    if (basicInc    > 0) y = drawRecRow(doc, y, M, PW, CW, "Basic Incentive",            rs(basicInc));
    if (targetBudg  > 0) y = drawRecRow(doc, y, M, PW, CW, "Target Budget Salary",        rs(targetBudg));
    if (excessComm  > 0) y = drawRecRow(doc, y, M, PW, CW, "Excess Commission",           rs(excessComm));
    if (vehicleE    > 0) y = drawRecRow(doc, y, M, PW, CW, "Vehicle Allowance",           rs(vehicleE));
    if (teamActive  > 0) y = drawRecRow(doc, y, M, PW, CW, "Team Activation",             rs(teamActive));
    if (personalC   > 0) y = drawRecRow(doc, y, M, PW, CW, "Personal Commission",         rs(personalC));
    if (orcE        > 0) y = drawRecRow(doc, y, M, PW, CW, "ORC / Upline Commission",     rs(orcE));
    y = drawRecRow(doc, y, M, PW, CW, "Gross Earnings", rs(grossPay), {
      fillColor: C.accentBg, bold: true, valueColor: C.accent, rowH: 8,
    });
    y += 2;

    // ── Deductions ──
    y = drawRecSection(doc, y, M, PW, "Deductions");
    if (epfDed   > 0) y = drawRecRow(doc, y, M, PW, CW, "EPF 8%",          rs(epfDed),  { valueColor: C.red });
    if (advDed   > 0) y = drawRecRow(doc, y, M, PW, CW, "Advance Deducted", rs(advDed), { valueColor: C.red });
    if (otherDed > 0) y = drawRecRow(doc, y, M, PW, CW, "Other Deduction",  rs(otherDed), {
      valueColor: C.red, remark: otherRmk || undefined,
    });
    if (totalDed === 0) y = drawRecRow(doc, y, M, PW, CW, "Deductions", "—", { valueColor: C.mid });
    y += 2;

    // ── Net ──
    const netH = 13;
    doc.setFillColor(...C.dark);
    doc.roundedRect(M, y, CW, netH, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(160, 210, 185);
    doc.text("NET TO BANK", M + 4, y + netH / 2 + 1.2);
    doc.setFontSize(10);
    doc.setTextColor(...C.white);
    doc.text(rs(netPay), PW - M - 4, y + netH / 2 + 1.2, { align: "right" });

    // Page footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...C.mid);
    doc.text("Super Green Plantation — Confidential", PW / 2, PH - 5, { align: "center" });
  });

  doc.save(`Payroll_Receipts_${branchName}_${periodShort(month, year)}.pdf`);
}

// ── Drawing helpers ───────────────────────────────────────────────────────────

function drawRecSection(doc: jsPDF, y: number, M: number, PW: number, label: string): number {
  doc.setFillColor(...C.accent);
  doc.rect(M, y, 1.8, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...C.mid);
  doc.text(label.toUpperCase(), M + 4.5, y + 4);
  doc.setDrawColor(...C.light);
  doc.setLineWidth(0.12);
  doc.line(M + 4.5 + doc.getTextWidth(label.toUpperCase()) + 2, y + 2.5, PW - M, y + 2.5);
  return y + 8;
}

function drawRecRow(
  doc: jsPDF, y: number, M: number, PW: number, CW: number,
  label: string, value: string,
  opts: { bold?: boolean; valueColor?: [number,number,number]; fillColor?: [number,number,number]; remark?: string; rowH?: number } = {}
): number {
  const rH = opts.rowH ?? 6;
  if (opts.fillColor) {
    doc.setFillColor(...opts.fillColor);
    doc.rect(M, y, CW, rH + (opts.remark ? 5 : 0), "F");
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.mid);
  doc.text(label, M + 3, y + rH - 1.5);
  doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  doc.setTextColor(...(opts.valueColor ?? C.ink));
  doc.text(value, PW - M - 3, y + rH - 1.5, { align: "right" });

  if (opts.remark) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6);
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

function drawPageFooter(doc: jsPDF, PW: number, PH: number, y: number) {
  const safeY = Math.min(y, PH - 8);
  doc.setDrawColor(...C.light);
  doc.setLineWidth(0.2);
  doc.line(8, safeY, PW - 8, safeY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...C.mid);
  doc.text("Super Green Plantation (Pvt) Ltd  ·  Karapitiya, Galle, Sri Lanka  ·  Confidential — Not for distribution.", PW / 2, safeY + 4, { align: "center" });
}