/**
 * exportHoPayslipToPDF.ts
 *
 * Minimal black-and-white individual pay slips for Head Office employees.
 * One A5-portrait page per employee, merged into a single PDF for bulk printing.
 *
 * Usage:
 *   import { downloadHoPayslips } from "./exportHoPayslipToPDF";
 *   downloadHoPayslips(rows, month, year);          // all employees
 *   downloadHoPayslips([row], month, year);         // single employee
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types (mirrors getHoPayrollExport return shape) ─────────────────────────
export type HoPayslipRow = {
  empNo:               string;
  name:                string;
  position:            string;
  branch:              string;
  bank:                string;
  bankBranch:          string;
  accNo:               string;
  isPermBm:            boolean;
  // Earnings
  basicSalary:         number;
  fixedAllowance:      number;
  vehicleAllowance:    number;
  fuelAllowance:       number;
  channelOperation:    number;
  attendanceAllowance: number;
  incentive75Earned:   number;
  incentive100Earned:  number;
  vehicleFuelEarned:   number;
  orcEarned:           number;
  personalCommission:  number;
  personalIncentive:   number;
  mgmtExcessCommission:number;
  grossPay:            number;
  // Deductions
  epfDeduction:        number;
  loanInstalments:     number;
  festivalAdvance:     number;
  merchandiseDeduction:number;
  advanceDeducted:     number;
  // Totals
  netPay:              number;
  payrollStatus:       string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

function fmtLKR(n: number | null | undefined): string {
  const val = n ?? 0;
  return val === 0
    ? "—"
    : `${val.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function periodLabel(month: number, year: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

// ─── Single pay slip ──────────────────────────────────────────────────────────
function drawPayslip(doc: jsPDF, row: HoPayslipRow, month: number, year: number) {
  const PW     = doc.internal.pageSize.getWidth();   // 148 mm (A5)
  const PH     = doc.internal.pageSize.getHeight();  // 210 mm (A5)
  const M      = 12;   // margin
  const W      = PW - M * 2;
  const BLACK  = [0, 0, 0] as [number, number, number];
  const GRAY   = [80, 80, 80] as [number, number, number];
  const LGRAY  = [200, 200, 200] as [number, number, number];
  const BGRAY  = [245, 245, 245] as [number, number, number];

  let y = M;

  // ── Header ─────────────────────────────────────────────────────────────
  // Top rule
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.8);
  doc.line(M, y, M + W, y);
  y += 4;

  // Company name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.text("SUPER GREEN PLANTATION (PVT) LTD", PW / 2, y, { align: "center" });
  y += 5;

  // Document title
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("SALARY SLIP / PAY ADVICE — HEAD OFFICE", PW / 2, y, { align: "center" });
  y += 4;

  // Thin rule
  doc.setLineWidth(0.3);
  doc.setDrawColor(...LGRAY);
  doc.line(M, y, M + W, y);
  y += 5;

  // ── Employee info block (2-column grid) ───────────────────────────────
  const infoLeft: [string, string][] = [
    ["Employee",    row.name],
    ["Emp No",      row.empNo],
    ["Designation", row.position],
    ["Branch",      row.branch],
  ];
  const infoRight: [string, string][] = [
    ["Pay Period",   periodLabel(month, year)],
    ["Bank",         row.bank],
    ["Bank Branch",  row.bankBranch],
    ["Account No",   row.accNo],
  ];

  const labelW = 24;
  const colW   = W / 2 - 4;
  const lineH  = 5;

  doc.setFontSize(7.5);
  infoLeft.forEach(([label, val], i) => {
    const iy = y + i * lineH;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GRAY);
    doc.text(label, M, iy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BLACK);
    doc.text(val, M + labelW, iy);
  });
  infoRight.forEach(([label, val], i) => {
    const iy = y + i * lineH;
    const rx = M + W / 2 + 4;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GRAY);
    doc.text(label, rx, iy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BLACK);
    doc.text(val, rx + labelW, iy);
  });

  y += Math.max(infoLeft.length, infoRight.length) * lineH + 4;

  // Section rule
  doc.setLineWidth(0.3);
  doc.setDrawColor(...LGRAY);
  doc.line(M, y, M + W, y);
  y += 4;

  // ── Earnings ──────────────────────────────────────────────────────────
  const earningRows: [string, string][] = [];

  if (row.isPermBm) {
    // Perm BM/RM/ZM/AGM: volume-gated components
    if (row.basicSalary       > 0) earningRows.push(["Basic Salary",           fmtLKR(row.basicSalary)]);
    if (row.incentive75Earned > 0) earningRows.push(["Incentive (75%)",         fmtLKR(row.incentive75Earned)]);
    if (row.incentive100Earned> 0) earningRows.push(["Incentive (100%)",        fmtLKR(row.incentive100Earned)]);
    if (row.vehicleFuelEarned > 0) earningRows.push(["Vehicle & Fuel",          fmtLKR(row.vehicleFuelEarned)]);
  } else {
    // Fixed-salary HO track
    if (row.basicSalary        > 0) earningRows.push(["Basic Salary",           fmtLKR(row.basicSalary)]);
    if (row.fixedAllowance     > 0) earningRows.push(["Fixed Allowance",        fmtLKR(row.fixedAllowance)]);
    if (row.vehicleAllowance   > 0) earningRows.push(["Vehicle Allowance",      fmtLKR(row.vehicleAllowance)]);
    if (row.fuelAllowance      > 0) earningRows.push(["Fuel Allowance",         fmtLKR(row.fuelAllowance)]);
    if (row.channelOperation   > 0) earningRows.push(["Channel Operation",      fmtLKR(row.channelOperation)]);
    if (row.attendanceAllowance> 0) earningRows.push(["Attendance Allowance",   fmtLKR(row.attendanceAllowance)]);
  }

  // Shared earnings
  if (row.orcEarned           > 0) earningRows.push(["ORC / Upline Commission", fmtLKR(row.orcEarned)]);
  if (row.personalCommission  > 0) earningRows.push(["Personal Commission",     fmtLKR(row.personalCommission)]);
  if (row.personalIncentive   > 0) earningRows.push(["Performance Incentive",   fmtLKR(row.personalIncentive)]);
  if (row.mgmtExcessCommission> 0) earningRows.push(["Excess Commission (0.5%)",fmtLKR(row.mgmtExcessCommission)]);

  // Section label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...BLACK);
  doc.text("EARNINGS", M, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    body: earningRows,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: [0, 0, 0],
      cellPadding: { top: 1.2, bottom: 1.2, left: 0, right: 0 },
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: "normal", textColor: [80, 80, 80] },
      1: { halign: "right", fontStyle: "normal" },
    },
    didDrawCell(data) {
      // Hairline bottom border per row
      if (data.section === "body") {
        doc.setDrawColor(...LGRAY);
        doc.setLineWidth(0.1);
        doc.line(M, data.cell.y + data.cell.height, M + W, data.cell.y + data.cell.height);
      }
    },
    margin: { left: M, right: M },
  });

  y = (doc as any).lastAutoTable.finalY + 1;

  // Gross total bar (light grey)
  const GROSS_H = 7;
  doc.setFillColor(...BGRAY);
  doc.rect(M, y, W, GROSS_H, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text("Gross Earnings", M + 2, y + GROSS_H / 2 + 1.5);
  doc.text(
    row.grossPay.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    M + W - 2, y + GROSS_H / 2 + 1.5, { align: "right" }
  );
  y += GROSS_H + 4;

  // ── Deductions ────────────────────────────────────────────────────────
  const dedRows: [string, string][] = [];
  if (row.epfDeduction       > 0) dedRows.push(["EPF (Employee 8%)",     fmtLKR(row.epfDeduction)]);
  if (row.loanInstalments    > 0) dedRows.push(["Loan Instalments",      fmtLKR(row.loanInstalments)]);
  if (row.festivalAdvance    > 0) dedRows.push(["Festival Advance",      fmtLKR(row.festivalAdvance)]);
  if (row.merchandiseDeduction>0) dedRows.push(["Merchandise Deduction", fmtLKR(row.merchandiseDeduction)]);
  if (row.advanceDeducted    > 0) dedRows.push(["Advance Deducted",      fmtLKR(row.advanceDeducted)]);

  if (dedRows.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...BLACK);
    doc.text("DEDUCTIONS", M, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      body: dedRows,
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: { top: 1.2, bottom: 1.2, left: 0, right: 0 },
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: "normal", textColor: [80, 80, 80] },
        1: { halign: "right", fontStyle: "normal" },
      },
      didDrawCell(data) {
        if (data.section === "body") {
          doc.setDrawColor(...LGRAY);
          doc.setLineWidth(0.1);
          doc.line(M, data.cell.y + data.cell.height, M + W, data.cell.y + data.cell.height);
        }
      },
      margin: { left: M, right: M },
    });

    y = (doc as any).lastAutoTable.finalY + 3;
  } else {
    y += 3;
  }

  // ── Net to bank ───────────────────────────────────────────────────────
  const NET_H = 10;
  doc.setFillColor(...BLACK);
  doc.rect(M, y, W, NET_H, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("NET TO BANK", M + 3, y + NET_H / 2 + 1.5);
  doc.setFontSize(10);
  doc.text(
    `LKR ${row.netPay.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    M + W - 3, y + NET_H / 2 + 1.5, { align: "right" }
  );
  y += NET_H + 5;

  // ── Employer contributions note ───────────────────────────────────────
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.text("EPF Employer & ETF contributions are not deducted from net pay.", M, y);
  y += 4;

  // ── Signature area ────────────────────────────────────────────────────
  // Only if space permits (at least 25mm left)
  if (PH - y > 25) {
    y = PH - 28;
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.2);
    // Employee signature
    doc.line(M, y + 14, M + 44, y + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text("Employee Signature", M, y + 18);
    // Authorised signature
    doc.line(M + W - 44, y + 14, M + W, y + 14);
    doc.text("Authorised Signature", M + W - 44, y + 18);
  }

  // ── Footer ────────────────────────────────────────────────────────────
  doc.setLineWidth(0.5);
  doc.setDrawColor(...BLACK);
  doc.line(M, PH - 8, M + W, PH - 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...GRAY);
  doc.text(
    "Super Green Plantation ERP — Confidential. This document is computer-generated.",
    PW / 2, PH - 5, { align: "center" }
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Download individual B&W pay slips for all provided HO employees.
 * Pass a single-element array to print one person's slip.
 */
export function downloadHoPayslips(
  rows: HoPayslipRow[],
  month: number,
  year: number,
) {
  if (!rows.length) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });

  rows.forEach((row, i) => {
    if (i > 0) doc.addPage();
    drawPayslip(doc, row, month, year);
  });

  const monthStr = MONTHS[month - 1];
  const count    = rows.length === 1 ? rows[0].empNo : "All";
  doc.save(`HO_Payslip_${count}_${monthStr}_${year}.pdf`);
}