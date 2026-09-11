/**
 * exportPayrollToExcel.ts
 *
 * Branch-level payroll Excel export — reads directly from the live preview
 * array (same data shown on screen). Produces a formatted register with:
 *  - Header metadata block
 *  - Employees grouped by position, with per-group subtotal rows
 *  - All earnings + deductions columns (matching the screen UI exactly)
 *  - Grand-total row at the bottom
 *  - Column widths, frozen header, number format on numeric cells
 */
import * as XLSX from "xlsx";

// ── Column definition ─────────────────────────────────────────────────────────
// "key" is the Excel column header; "field" is a function that extracts the
// value from a preview row. Pure data — no display logic here.
type ColDef = {
  key: string;
  field: (r: any, i?: number) => string | number;
  width: number;
  isNum?: boolean;
};

const COLS: ColDef[] = [
  // Identity
  { key: "No.",           field: (_r, i) => (i ?? 0) + 1,                                    width: 5  },
  { key: "Emp No",        field: r => r.empNo ?? "—",                                       width: 11 },
  { key: "Employee Name", field: r => r.name ?? "—",                                        width: 26 },
  { key: "Status",        field: r => r.status ?? "—",                                      width: 11 },

  // ── EARNINGS ────────────────────────────────────────────────────────────────
  { key: "Volume Achieved",      field: r => r.volumeAchieved ?? 0,                         width: 16, isNum: true },
  { key: "Basic Salary",         field: r => r.breakdown?.basicSalaryPermanent ?? 0,         width: 13, isNum: true },
  { key: "Incentive",            field: r => r.breakdown?.incentiveEarned ?? 0,              width: 12, isNum: true },
  { key: "Target Budget",        field: r => r.breakdown?.targetBudgetSalary ?? 0,           width: 14, isNum: true },
  { key: "Vehicle",              field: r => r.breakdown?.vehicleEarned ?? 0,                width: 10, isNum: true },
  { key: "Team Active",          field: r => r.breakdown?.teamActiveEarned ?? 0,             width: 12, isNum: true },
  { key: "Excess Comm.",         field: r => r.breakdown?.excessCommission ?? 0,             width: 13, isNum: true },
  { key: "Fixed Allow.",         field: r => r.breakdown?.fixedAllowance ?? 0,               width: 13, isNum: true },
  { key: "Fuel Allow.",          field: r => r.breakdown?.fuelAllowance ?? 0,                width: 12, isNum: true },
  { key: "Attend. Allow.",       field: r => r.breakdown?.attendanceAllowance ?? 0,          width: 14, isNum: true },
  { key: "Ch. Operation",        field: r => r.breakdown?.channelOperation ?? 0,             width: 13, isNum: true },
  { key: "Personal Comm.",       field: r => r.personalCommissionEarned ?? 0,                width: 14, isNum: true },
  { key: "ORC",                  field: r => r.orcEarned ?? 0,                              width: 12, isNum: true },
  { key: "Gross Pay",            field: r => r.breakdown?.grossPay ?? 0,                     width: 13, isNum: true },

  // ── DEDUCTIONS ──────────────────────────────────────────────────────────────
  { key: "EPF (Emp 8%)",         field: r => r.breakdown?.epfDeduction ?? 0,                width: 13, isNum: true },
  { key: "EPF (Employer 12%)",   field: r => r.breakdown?.epfEmployer ?? 0,                 width: 16, isNum: true },
  { key: "ETF (3%)",             field: r => r.breakdown?.etfEmployer ?? 0,                 width: 10, isNum: true },
  { key: "Loan Instalments",     field: r => r.breakdown?.loanInstalments ?? 0,             width: 15, isNum: true },
  { key: "Festival Advance",     field: r => r.breakdown?.festivalAdvance ?? 0,             width: 15, isNum: true },
  { key: "Merch. Deduction",     field: r => r.breakdown?.merchandiseDeduction ?? 0,        width: 16, isNum: true },
  { key: "Advance Deducted",     field: r => r.advanceDeducted ?? 0,                        width: 16, isNum: true },
  { key: "Other Deduction",      field: r => r.deductionAmount ?? 0,                        width: 15, isNum: true },
  { key: "Deduction Remark",     field: r => r.deductionRemark ?? "",                       width: 22 },

  // ── NET ─────────────────────────────────────────────────────────────────────
  { key: "Net To Bank",          field: r => r.breakdown?.netPay ?? 0,                      width: 13, isNum: true },

  // ── Meta ────────────────────────────────────────────────────────────────────
  { key: "Payslip",              field: r => r.alreadyProcessed ? "DONE" : "PENDING",       width: 10 },
];

// Satisfy the (r, i) signature for the No. column — call col.field directly.

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const NUM_FMT = "#,##0.00";

// ── Helpers ───────────────────────────────────────────────────────────────────
function cellAddr(col: number, row: number) {
  // col is 0-based; row is 1-based
  let c = "";
  let n = col;
  do { c = String.fromCharCode(65 + (n % 26)) + c; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return `${c}${row}`;
}

function setCellValue(ws: XLSX.WorkSheet, col: number, row: number, value: any, isNum = false) {
  const addr = cellAddr(col, row);
  if (isNum && typeof value === "number") {
    ws[addr] = { t: "n", v: value, z: NUM_FMT };
  } else {
    ws[addr] = { t: typeof value === "number" ? "n" : "s", v: value };
  }
}

function setStyle(ws: XLSX.WorkSheet, col: number, row: number, s: any) {
  const addr = cellAddr(col, row);
  if (ws[addr]) ws[addr].s = s;
  else ws[addr] = { t: "s", v: "", s };
}

// ── Main export ───────────────────────────────────────────────────────────────
export function exportPayrollToExcel(
  preview: any[],
  branchName: string,
  month: string,
  year: number,
) {
  const monthNum = MONTHS.indexOf(month) + 1;
  const ws: XLSX.WorkSheet = {};
  const range = { s: { c: 0, r: 0 }, e: { c: COLS.length - 1, r: 0 } };

  // ── META HEADER (rows 1-4) ────────────────────────────────────────────────
  const metaRows = [
    ["SUPER GREEN PLANTATION (PVT) LTD"],
    ["PAYROLL REGISTER — INCENTIVE & SALARY STATEMENT"],
    [`Period: ${month} ${year}  |  Branch: ${branchName}  |  Employees: ${preview.length}  |  Confidential`],
    [],
  ];
  metaRows.forEach((metaRow, ri) => {
    metaRow.forEach((val, ci) => {
      ws[cellAddr(ci, ri + 1)] = { t: "s", v: val };
    });
  });
  let currentRow = 5; // 1-indexed; rows 1-4 used by meta

  // ── EARNINGS / DEDUCTIONS section headers ─────────────────────────────────
  // (Optional visual marker above columns — Excel row 5)
  const EARNINGS_START  = 4;  // col index of "Volume Achieved"
  const EARNINGS_END    = 17; // col index of "Gross Pay"
  const DEDUCTIONS_START= 18; // col index of "EPF (Emp 8%)"
  const DEDUCTIONS_END  = 27; // col index of "Other Deduction"
  const NET_COL         = 29; // col index of "Net To Bank"

  ws[cellAddr(EARNINGS_START, currentRow)] = { t: "s", v: "EARNINGS" };
  ws[cellAddr(DEDUCTIONS_START, currentRow)] = { t: "s", v: "DEDUCTIONS" };
  currentRow++;

  // ── COLUMN HEADERS (row 6) ────────────────────────────────────────────────
  const headerRow = currentRow;
  COLS.forEach((col, ci) => {
    ws[cellAddr(ci, currentRow)] = { t: "s", v: col.key };
  });
  currentRow++;

  // ── GROUP BY POSITION ─────────────────────────────────────────────────────
  // Build groups preserving original order (first occurrence of position wins)
  const groups = new Map<string, any[]>();
  for (const r of preview) {
    const pos = r.position ?? "OTHER";
    if (!groups.has(pos)) groups.set(pos, []);
    groups.get(pos)!.push(r);
  }

  const numericColIndices = COLS.map((c, i) => c.isNum ? i : -1).filter(i => i >= 0);

  for (const [posTitle, members] of groups) {
    // ── Position group header ──
    ws[cellAddr(0, currentRow)] = { t: "s", v: `${posTitle.toUpperCase()} (${members.length} employees)` };
    currentRow++;

    const groupStartRow = currentRow;

    // ── Employee rows ──
    members.forEach((r, rowIdx) => {
      COLS.forEach((col, ci) => {
        const val = col.field(r, rowIdx);
        setCellValue(ws, ci, currentRow, val, col.isNum);
      });
      currentRow++;
    });

    // ── Subtotal row ──
    const groupEndRow = currentRow - 1;
    ws[cellAddr(0, currentRow)] = { t: "s", v: `Subtotal (${members.length})` };
    numericColIndices.forEach(ci => {
      // Sum all numeric cols except "No." (col 0)
      if (ci === 0) return;
      const startAddr = cellAddr(ci, groupStartRow);
      const endAddr   = cellAddr(ci, groupEndRow);
      ws[cellAddr(ci, currentRow)] = { t: "n", v: 0, f: `SUM(${startAddr}:${endAddr})`, z: NUM_FMT };
    });
    currentRow++;
    currentRow++; // blank separator
  }

  // ── GRAND TOTAL ───────────────────────────────────────────────────────────
  ws[cellAddr(0, currentRow)] = { t: "s", v: "GRAND TOTAL" };
  ws[cellAddr(2, currentRow)] = { t: "s", v: `${preview.length} employees` };
  numericColIndices.forEach(ci => {
    if (ci === 0) return;
    const total = preview.reduce((sum, r) => {
      const v = COLS[ci].field(r, 0);
      return sum + (typeof v === "number" ? v : 0);
    }, 0);
    ws[cellAddr(ci, currentRow)] = { t: "n", v: total, z: NUM_FMT };
  });
  currentRow++;

  // ── SHEET RANGE ───────────────────────────────────────────────────────────
  range.e.r = currentRow;
  range.e.c = COLS.length - 1;
  ws["!ref"] = XLSX.utils.encode_range(range);

  // ── COLUMN WIDTHS ─────────────────────────────────────────────────────────
  ws["!cols"] = COLS.map(c => ({ wch: c.width }));

  // ── FREEZE HEADER ─────────────────────────────────────────────────────────
  ws["!freeze"] = { xSplit: 4, ySplit: headerRow };  // freeze first 4 cols + header row

  // ── WORKBOOK ──────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Payroll");
  XLSX.writeFile(wb, `Payroll_${branchName}_${month}_${year}.xlsx`);
}