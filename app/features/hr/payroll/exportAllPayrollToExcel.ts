// app/features/hr/payroll/exportAllPayrollToExcel.ts
import * as XLSX from "xlsx";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

type PayrollRow = {
  branch: string;
  empNo: string;
  name: string;
  position: string;
  status: string;
  payrollCategory: string;
  volumeAchieved: number;
  basic: number;
  incentive: number;
  targetBudget: number;
  vehicle: number;
  teamActive: number;
  fixedAllowance: number;
  fuelAllowance: number;
  attendanceAllowance: number;
  channelOperation: number;
  personalComm: number;
  orc: number;
  excess: number;
  grossPay: number;
  epfEmployee: number;
  epfEmployer: number;
  etf: number;
  loanInstalments: number;
  festivalAdvance: number;
  merchandiseDeduction: number;
  advance: number;
  netPay: number;
};

function toRow(r: PayrollRow) {
  return {
    "Branch":               r.branch,
    "Emp No":               r.empNo,
    "Employee":             r.name,
    "Position":             r.position,
    "Status":               r.status,
    "Category":             r.payrollCategory,
    "Volume Achieved":      r.volumeAchieved,
    // ── Earnings ──────────────────────────────────
    "Basic Salary":         r.basic,
    "Incentive":            r.incentive,
    "Target Budget":        r.targetBudget,
    "Vehicle":              r.vehicle,
    "Team Active":          r.teamActive,
    "Fixed Allowance":      r.fixedAllowance,
    "Fuel Allowance":       r.fuelAllowance,
    "Attendance Allowance": r.attendanceAllowance,
    "Channel Operation":    r.channelOperation,
    "Personal Comm.":       r.personalComm,
    "ORC":                  r.orc,
    "Excess Comm.":         r.excess,
    "Gross Pay":            r.grossPay,
    // ── Deductions ────────────────────────────────
    "EPF (Emp 8%)":         r.epfEmployee,
    "EPF (Employer 12%)":   r.epfEmployer,
    "ETF (3%)":             r.etf,
    "Loan Instalments":     r.loanInstalments,
    "Festival Advance":     r.festivalAdvance,
    "Merchandise Deduction":r.merchandiseDeduction,
    "Advance Deducted":     r.advance,
    // ── Net ───────────────────────────────────────
    "Net Pay":              r.netPay,
  };
}

const NUM_COLS = [
  "Volume Achieved","Basic Salary","Incentive","Target Budget","Vehicle",
  "Team Active","Fixed Allowance","Fuel Allowance","Attendance Allowance",
  "Channel Operation","Personal Comm.","ORC","Excess Comm.","Gross Pay",
  "EPF (Emp 8%)","EPF (Employer 12%)","ETF (3%)","Loan Instalments",
  "Festival Advance","Merchandise Deduction","Advance Deducted","Net Pay",
];

// Column index lookup (0-based header order from toRow keys)
const HEADER_ORDER = [
  "Branch","Emp No","Employee","Position","Status","Category",
  "Volume Achieved","Basic Salary","Incentive","Target Budget","Vehicle",
  "Team Active","Fixed Allowance","Fuel Allowance","Attendance Allowance",
  "Channel Operation","Personal Comm.","ORC","Excess Comm.","Gross Pay",
  "EPF (Emp 8%)","EPF (Employer 12%)","ETF (3%)","Loan Instalments",
  "Festival Advance","Merchandise Deduction","Advance Deducted","Net Pay",
];

function colLetter(idx: number): string {
  // Supports A-Z only (28 cols max — we have 28 exactly)
  return String.fromCharCode(65 + idx);
}

function buildSheet(rows: PayrollRow[]): XLSX.WorkSheet {
  const data = rows.map(toRow);

  const ws = XLSX.utils.json_to_sheet(data, { header: HEADER_ORDER });

  // ── Totals row ────────────────────────────────────────────────────────────
  const dataStart = 2;                    // row 1 = header, row 2 = first data row
  const dataEnd   = dataStart + rows.length - 1;
  const totalsRow: Record<string, any> = {
    Branch:   "TOTAL",
    Employee: `${rows.length} employees`,
  };
  NUM_COLS.forEach((col) => {
    const idx = HEADER_ORDER.indexOf(col);
    if (idx < 0) return;
    const letter = colLetter(idx);
    totalsRow[col] = rows.length > 0
      ? { f: `SUM(${letter}${dataStart}:${letter}${dataEnd})` }
      : 0;
  });
  XLSX.utils.sheet_add_json(ws, [totalsRow], {
    header: HEADER_ORDER,
    skipHeader: true,
    origin: -1,
  });

  // ── Column widths ─────────────────────────────────────────────────────────
  ws["!cols"] = [
    14, 10, 22, 12, 10, 10,   // Branch … Category
    16, 12, 12, 14, 10, 12,   // Volume … Team Active
    14, 13, 20, 16,            // Fixed … Channel Op
    14, 10, 12,                // Personal Comm … Excess
    13,                        // Gross Pay
    13, 17, 10,                // EPF Emp … ETF
    14, 14, 20, 16,            // Loan … Advance
    12,                        // Net Pay
  ].map((w) => ({ wch: w }));

  // ── Freeze header row ─────────────────────────────────────────────────────
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  return ws;
}

export function exportAllPayrollToExcel(
  rows: PayrollRow[],
  month: number,
  year: number,
) {
  if (rows.length === 0) return;

  const monthLabel = MONTHS[month - 1];
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: All employees sorted by branch → empNo ──────────────────────
  const sorted = [...rows].sort((a, b) =>
    a.branch.localeCompare(b.branch) || a.empNo.localeCompare(b.empNo)
  );
  XLSX.utils.book_append_sheet(wb, buildSheet(sorted), "All Payroll");

  // ── Per-branch sheets ─────────────────────────────────────────────────────
  const byBranch = new Map<string, PayrollRow[]>();
  for (const r of sorted) {
    if (!byBranch.has(r.branch)) byBranch.set(r.branch, []);
    byBranch.get(r.branch)!.push(r);
  }
  for (const [branchName, branchRows] of byBranch) {
    const safeName = branchName.replace(/[:\\/?*[\]]/g, "").slice(0, 31);
    XLSX.utils.book_append_sheet(wb, buildSheet(branchRows), safeName);
  }

  XLSX.writeFile(wb, `Payroll_All_${monthLabel}_${year}.xlsx`);
}