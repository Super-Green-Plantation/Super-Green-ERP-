/**
 * exportPayrollToPDF.ts
 * Generates a compact, structured PDF pay sheet for the payroll page.
 *
 * Two modes:
 *  - downloadPayrollSummaryPDF  → one-page landscape batch table (all employees)
 *  - downloadPayrollReceiptsPDF → individual FA Incentive Pay Sheet receipt per employee
 *                                 (matching the screenshot format exactly)
 *
 * Usage in page.tsx:
 *   import { downloadPayrollSummaryPDF, downloadPayrollReceiptsPDF } from "./exportPayrollToPDF";
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Brand colours (aligned with pdfStyles.ts) ────────────────────────────────

const GREEN: [number, number, number] = [26, 71, 42];   // #1a472a  — header fill
const GREEN2: [number, number, number] = [45, 106, 79];  // #2d6a4f  — sub-header
const LIGHT: [number, number, number] = [245, 247, 245]; // off-white row
const WHITE: [number, number, number] = [255, 255, 255];
const TEXT: [number, number, number] = [30, 30, 30];
const MUTED: [number, number, number] = [100, 116, 139];
const NET_BG: [number, number, number] = [26, 71, 42];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtLKR = (n: number | null | undefined) =>
  `LKR ${(n ?? 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtNum = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const monthLabel = (month: number, year: number) => {
  const d = new Date(year, month - 1);
  return d.toLocaleString("en-US", { month: "short", year: "2-digit" }).replace(" ", "-");
};

const monthLongLabel = (month: number, year: number) =>
  new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" });

// ─── Shared: company header block ─────────────────────────────────────────────

function drawCompanyHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  x: number,
  startY: number,
  endX: number,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  // Green header band
  doc.setFillColor(...GREEN);
  doc.rect(x, startY, endX - x, 12, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SUPER GREEN PLANTATION (PVT) LTD", pageWidth / 2, startY + 8, { align: "center" });

  // Sub-header
  doc.setFillColor(...GREEN2);
  doc.rect(x, startY + 12, endX - x, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), pageWidth / 2, startY + 17, { align: "center" });

  // Subtitle (e.g. branch + month)
  doc.setFillColor(...LIGHT);
  doc.rect(x, startY + 19, endX - x, 6, "F");
  doc.setTextColor(...MUTED);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, pageWidth / 2, startY + 23, { align: "center" });

  return startY + 27; // return Y after header block
}

// ─── 1. BATCH SUMMARY PDF ─────────────────────────────────────────────────────

/**
 * One A4-landscape page with a compact table — one row per employee.
 * Matches the "batch view" of the payroll page.
 */
export function downloadPayrollSummaryPDF(
  preview: any[],
  branchName: string,
  month: number,
  year: number,
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const MARGIN = 10;

  let y = MARGIN;
  y = drawCompanyHeader(
    doc,
    "Marketing Payroll — Incentive Pay Sheet",
    `Branch: ${branchName}  |  Period: ${monthLongLabel(month, year)}  |  Generated: ${new Date().toLocaleDateString()}`,
    MARGIN,
    y,
    PW - MARGIN,
  );

  // Table columns
  const head = [[
    "Employee", "Emp No", "Position", "Volume\nAchieved",
    "Basic\nIncentive", "Target\nBudget", "Excess\nComm.",
    "Vehicle", "Team\nActiv.", "ORC", "Personal\nComm.",
    "Gross Pay", "Deductions", "Net To Bank",
  ]];

  const body = preview.map((r) => {
    const bd = r.breakdown ?? {};
    const deductions =
      (bd.epfDeduction ?? 0) +
      (bd.loanInstalments ?? 0) +
      (bd.festivalAdvance ?? 0) +
      (bd.merchandiseDeduction ?? 0) +
      (r.advanceDeducted ?? 0);

    return [
      r.name ?? "—",
      r.empNo ?? "—",
      r.position ?? "—",
      fmtNum(r.volumeAchieved ?? 0),
      fmtNum(bd.incentiveEarned ?? 0),
      fmtNum(bd.targetBudgetSalary ?? 0),
      fmtNum((bd.excessCommission ?? 0) + (r.excessEarned ?? 0)),
      fmtNum(bd.vehicleEarned ?? 0),
      fmtNum(bd.teamActiveEarned ?? 0),
      fmtNum(r.orcEarned ?? 0),
      fmtNum(r.personalCommissionEarned ?? 0),
      fmtNum(bd.grossPay ?? 0),
      fmtNum(deductions),
      fmtNum(bd.netPay ?? 0),
    ];
  });

  // Totals row
  const totals = preview.reduce(
    (acc, r) => {
      const bd = r.breakdown ?? {};
      acc.vol += r.volumeAchieved ?? 0;
      acc.inc += bd.incentiveEarned ?? 0;
      acc.tbs += bd.targetBudgetSalary ?? 0;
      acc.exc += (bd.excessCommission ?? 0) + (r.excessEarned ?? 0);
      acc.veh += bd.vehicleEarned ?? 0;
      acc.tea += bd.teamActiveEarned ?? 0;
      acc.orc += r.orcEarned ?? 0;
      acc.com += r.personalCommissionEarned ?? 0;
      acc.gross += bd.grossPay ?? 0;
      acc.ded +=
        (bd.epfDeduction ?? 0) +
        (bd.loanInstalments ?? 0) +
        (bd.festivalAdvance ?? 0) +
        (bd.merchandiseDeduction ?? 0) +
        (r.advanceDeducted ?? 0);
      acc.net += bd.netPay ?? 0;
      return acc;
    },
    { vol: 0, inc: 0, tbs: 0, exc: 0, veh: 0, tea: 0, orc: 0, com: 0, gross: 0, ded: 0, net: 0 }
  );

  body.push([
    "TOTAL", "", "", fmtNum(totals.vol),
    fmtNum(totals.inc), fmtNum(totals.tbs), fmtNum(totals.exc),
    fmtNum(totals.veh), fmtNum(totals.tea), fmtNum(totals.orc),
    fmtNum(totals.com), fmtNum(totals.gross), fmtNum(totals.ded),
    fmtNum(totals.net),
  ]);

  autoTable(doc, {
    startY: y + 2,
    head,
    body,
    theme: "grid",
    headStyles: {
      fillColor: GREEN,
      textColor: WHITE,
      fontSize: 6.5,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: TEXT,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: LIGHT },
    // Last row = totals — bold + green tint
    didParseCell(data) {
      if (data.row.index === body.length - 1) {
        data.cell.styles.fillColor = [220, 240, 228];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 7;
      }
      // Right-align numeric columns (index >= 3)
      if (data.section === "body" && data.column.index >= 3) {
        data.cell.styles.halign = "right";
      }
      if (data.section === "head") {
        data.cell.styles.halign = "center";
      }
    },
    columnStyles: {
      0: { cellWidth: 32 },  // Name
      1: { cellWidth: 14 },  // Emp No
      2: { cellWidth: 16 },  // Position
      3: { cellWidth: 20, halign: "right" },  // Volume
      4: { cellWidth: 18, halign: "right" },
      5: { cellWidth: 18, halign: "right" },
      6: { cellWidth: 16, halign: "right" },
      7: { cellWidth: 14, halign: "right" },
      8: { cellWidth: 14, halign: "right" },
      9: { cellWidth: 18, halign: "right" },
      10: { cellWidth: 18, halign: "right" },
      11: { cellWidth: 20, halign: "right" },
      12: { cellWidth: 18, halign: "right" },
      13: { cellWidth: 20, halign: "right" },
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 5;
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(
    "Super Green Plantation ERP — Confidential. Not for distribution.",
    PW / 2,
    Math.min(finalY, PH - 8),
    { align: "center" }
  );

  doc.save(`Payroll_Summary_${branchName}_${monthLabel(month, year)}_${year}.pdf`);
}

// ─── 2. INDIVIDUAL FA RECEIPT PDFs ────────────────────────────────────────────

/**
 * One page per employee — styled exactly like the screenshot:
 * header block, employee info table, performance section,
 * earnings breakdown, deductions, net-to-bank footer.
 *
 * All receipts are merged into a single multi-page PDF for easy printing.
 */
export function downloadPayrollReceiptsPDF(
  preview: any[],
  branchName: string,
  month: number,
  year: number,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const MARGIN = 12;
  const COL_W = PW - MARGIN * 2;

  preview.forEach((r, idx) => {
    if (idx > 0) doc.addPage();

    const bd = r.breakdown ?? {};
    const target = r.monthlyTarget ?? bd.targetAmount ?? 0;
    const achieved = r.volumeAchieved ?? 0;
    const achievementPct = target > 0 ? (achieved / target) * 100 : 0;

    const basicIncentive = bd.incentiveEarned ?? 0;
    const targetBudget = bd.targetBudgetSalary ?? 0;
    const excessComm = (bd.excessCommission ?? 0) + (r.excessEarned ?? 0);
    const vehicleEarned = bd.vehicleEarned ?? 0;
    const teamActive = bd.teamActiveEarned ?? 0;
    const personalComm = r.personalCommissionEarned ?? 0;
    const orcEarned = r.orcEarned ?? 0;
    const grossEarnings = bd.grossPay ?? 0;

    const epfDeduction = bd.epfDeduction ?? 0;
    const advanceDeducted = r.advanceDeducted ?? 0;
    const totalDeductions = epfDeduction + advanceDeducted;
    const netToBankAmount = bd.netPay ?? 0;

    // ── Header — title driven by the employee's actual position title ──
    const positionTitle = (r.position ?? "Marketing Staff").toUpperCase();
    let y = MARGIN;
    y = drawCompanyHeader(
      doc,
      `${positionTitle} INCENTIVE PAY SHEET`,
      `Branch: ${branchName}  |  Period: ${monthLongLabel(month, year)}`,
      MARGIN,
      y,
      PW - MARGIN,
    );
    y += 3;

    // ── Employee Info ──
    const infoRows: [string, string][] = [
      ["Employee Name", r.name ?? "—"],
      ["Designation", r.position ?? "Staff"],
      ["Branch", branchName],
      [
        "Joining Date",
        r.joiningDate
          ? new Date(r.joiningDate).toLocaleDateString("en-LK").replace(/\//g, ".")
          : "—",
      ],
      ["Month", monthLabel(month, year)],
    ];

    autoTable(doc, {
      startY: y,
      body: infoRows,
      theme: "plain",
      styles: { fontSize: 8, cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 } },
      columnStyles: {
        0: { fontStyle: "bold", textColor: MUTED, cellWidth: 40 },
        1: { fontStyle: "bold", textColor: TEXT },
      },
      tableLineColor: [220, 220, 220],
      tableLineWidth: 0.2,
      didDrawCell(data) {
        // draw bottom border on each row
        if (data.section === "body") {
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.1);
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height,
          );
        }
      },
      margin: { left: MARGIN, right: MARGIN },
    });

    y = (doc as any).lastAutoTable.finalY + 4;

    // ── Performance ──
    const perfRows: [string, string][] = [
      ["Target", fmtLKR(target)],
      ["Achievement", fmtLKR(achieved)],
      ["Achievement %", `${achievementPct.toFixed(0)}%`],
    ];

    autoTable(doc, {
      startY: y,
      body: perfRows,
      theme: "plain",
      styles: { fontSize: 8, cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 } },
      columnStyles: {
        0: { fontStyle: "normal", textColor: MUTED, cellWidth: 40 },
        1: { fontStyle: "bold", textColor: TEXT, halign: "right" },
      },
      didDrawCell(data) {
        if (data.section === "body") {
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.1);
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height,
          );
        }
      },
      margin: { left: MARGIN, right: MARGIN },
    });

    y = (doc as any).lastAutoTable.finalY + 4;

    // ── Earnings ──
    const earningRows: [string, string][] = [];
    if (basicIncentive > 0) earningRows.push(["Basic Incentive", fmtLKR(basicIncentive)]);
    if (targetBudget > 0)   earningRows.push(["Target Budget", fmtLKR(targetBudget)]);
    if (excessComm > 0)     earningRows.push(["Excess Commission", fmtLKR(excessComm)]);
    if (vehicleEarned > 0)  earningRows.push(["Vehicle Allowance", fmtLKR(vehicleEarned)]);
    if (teamActive > 0)     earningRows.push(["Team Activation", fmtLKR(teamActive)]);
    if (personalComm > 0)   earningRows.push(["Personal Commission", fmtLKR(personalComm)]);
    if (orcEarned > 0)      earningRows.push(["ORC / Upline Commission", fmtLKR(orcEarned)]);

    // Gross earnings total row
    earningRows.push(["Gross Earnings", fmtLKR(grossEarnings)]);

    autoTable(doc, {
      startY: y,
      body: earningRows,
      theme: "plain",
      styles: { fontSize: 8, cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 } },
      columnStyles: {
        0: { textColor: MUTED, cellWidth: 60 },
        1: { fontStyle: "bold", textColor: TEXT, halign: "right" },
      },
      didParseCell(data) {
        // Gross row: bold + light green background
        if (data.row.index === earningRows.length - 1) {
          data.cell.styles.fillColor = [235, 245, 238];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fontSize = 8.5;
          data.cell.styles.textColor = GREEN;
        }
      },
      didDrawCell(data) {
        if (data.section === "body") {
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.1);
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height,
          );
        }
      },
      margin: { left: MARGIN, right: MARGIN },
    });

    y = (doc as any).lastAutoTable.finalY + 2;

    // ── Deductions ──
    const dedLabel = epfDeduction > 0 && advanceDeducted > 0
      ? `EPF 8% + Advance`
      : epfDeduction > 0
        ? "EPF 8%"
        : advanceDeducted > 0
          ? "Advance Deducted"
          : "Deductions";

    autoTable(doc, {
      startY: y,
      body: [[dedLabel, totalDeductions > 0 ? fmtLKR(totalDeductions) : "LKR  -"]],
      theme: "plain",
      styles: { fontSize: 8, cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 } },
      columnStyles: {
        0: { textColor: MUTED, cellWidth: 60 },
        1: { fontStyle: "bold", textColor: [185, 28, 28], halign: "right" },
      },
      didDrawCell(data) {
        if (data.section === "body") {
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.1);
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height,
          );
        }
      },
      margin: { left: MARGIN, right: MARGIN },
    });

    y = (doc as any).lastAutoTable.finalY + 3;

    // ── Net To Bank — solid green footer band ──
    const NET_ROW_H = 12;
    doc.setFillColor(...NET_BG);
    doc.rect(MARGIN, y, COL_W, NET_ROW_H, "F");

    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("NET TO BANK", MARGIN + 3, y + NET_ROW_H / 2 + 1.5);

    doc.setFontSize(10);
    doc.text(fmtLKR(netToBankAmount), PW - MARGIN - 3, y + NET_ROW_H / 2 + 1.5, {
      align: "right",
    });

    // Page footer
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(
      "Super Green Plantation ERP — Confidential",
      PW / 2,
      PH - 6,
      { align: "center" }
    );
  });

  doc.save(`Payroll_Receipts_${branchName}_${monthLabel(month, year)}_${year}.pdf`);
}