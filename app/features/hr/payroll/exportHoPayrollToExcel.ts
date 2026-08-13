// app/features/hr/payroll/exportHoPayrollToExcel.ts
import * as XLSX from "xlsx";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export type HoExportRow = {
  branch: string;
  empNo: string;
  name: string;
  position: string;
  status: string;
  bank: string;
  bankBranch: string;
  accNo: string;
  // Track type
  isPermBm: boolean;
  // Fixed-salary fields
  basicSalary: number;
  fixedAllowance: number;
  vehicleAllowance: number;
  fuelAllowance: number;
  channelOperation: number;
  attendanceAllowance: number;
  // Perm BM fields
  incentive75Earned: number;
  incentive100Earned: number;
  vehicleFuelEarned: number;
  volumeAchieved: number;
  monthlyTarget: number;
  // Shared earnings
  orcEarned: number;
  personalCommission: number;
  personalIncentive: number;
  mgmtExcessCommission: number;
  // Deductions
  epfDeduction: number;
  epfEmployer: number;
  etfEmployer: number;
  loanInstalments: number;
  festivalAdvance: number;
  merchandiseDeduction: number;
  advanceDeducted: number;
  // Totals
  grossPay: number;
  netPay: number;
  // Status
  payrollStatus: string;
};

function toRow(r: HoExportRow) {
  return {
    "Branch":                r.branch,
    "Emp No":                r.empNo,
    "Employee":              r.name,
    "Position":              r.position,
    "Status":                r.status,
    "Bank":                  r.bank,
    "Bank Branch":           r.bankBranch,
    "Account No":            r.accNo,
    "Track":                 r.isPermBm ? "Perm BM" : "Fixed HO",
    // Earnings
    "Basic Salary":          r.basicSalary,
    "Fixed Allowance":       r.fixedAllowance,
    "Vehicle Allowance":     r.vehicleAllowance,
    "Fuel Allowance":        r.fuelAllowance,
    "Channel Op.":           r.channelOperation,
    "Attendance Allow.":     r.attendanceAllowance,
    "Incentive @75%":        r.incentive75Earned,
    "Incentive @100%":       r.incentive100Earned,
    "Vehicle & Fuel":        r.vehicleFuelEarned,
    "ORC":                   r.orcEarned,
    "Personal Comm.":        r.personalCommission,
    "Flat Incentive":        r.personalIncentive,
    "Excess Comm.":          r.mgmtExcessCommission,
    "Gross Pay":             r.grossPay,
    // Deductions
    "EPF (Emp 8%)":          r.epfDeduction,
    "EPF (Employer 12%)":    r.epfEmployer,
    "ETF (3%)":              r.etfEmployer,
    "Loan Instalments":      r.loanInstalments,
    "Festival Advance":      r.festivalAdvance,
    "Merchandise Deduction": r.merchandiseDeduction,
    "Advance Deducted":      r.advanceDeducted,
    // Net
    "Net Pay":               r.netPay,
    // Meta
    "Volume Achieved":       r.volumeAchieved,
    "Monthly Target":        r.monthlyTarget,
    "Payroll Status":        r.payrollStatus,
  };
}

const NUM_COLS = [
  "Basic Salary","Fixed Allowance","Vehicle Allowance","Fuel Allowance",
  "Channel Op.","Attendance Allow.",
  "Incentive @75%","Incentive @100%","Vehicle & Fuel",
  "ORC","Personal Comm.","Flat Incentive","Excess Comm.",
  "Gross Pay",
  "EPF (Emp 8%)","EPF (Employer 12%)","ETF (3%)",
  "Loan Instalments","Festival Advance","Merchandise Deduction","Advance Deducted",
  "Net Pay",
  "Volume Achieved","Monthly Target",
];

const HEADER_ORDER = [
  "Branch","Emp No","Employee","Position","Status","Bank","Bank Branch","Account No","Track",
  "Basic Salary","Fixed Allowance","Vehicle Allowance","Fuel Allowance","Channel Op.","Attendance Allow.",
  "Incentive @75%","Incentive @100%","Vehicle & Fuel",
  "ORC","Personal Comm.","Flat Incentive","Excess Comm.",
  "Gross Pay",
  "EPF (Emp 8%)","EPF (Employer 12%)","ETF (3%)",
  "Loan Instalments","Festival Advance","Merchandise Deduction","Advance Deducted",
  "Net Pay",
  "Volume Achieved","Monthly Target","Payroll Status",
];

function colLetter(idx: number): string {
  if (idx < 26) return String.fromCharCode(65 + idx);
  return String.fromCharCode(65 + Math.floor(idx / 26) - 1) + String.fromCharCode(65 + (idx % 26));
}

function buildSheet(rows: HoExportRow[]): XLSX.WorkSheet {
  const data = rows.map(toRow);
  const ws = XLSX.utils.json_to_sheet(data, { header: HEADER_ORDER });

  // ── Totals row ──────────────────────────────────────────────────────────
  const dataStart = 2;
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

  // ── Column widths ────────────────────────────────────────────────────────
  ws["!cols"] = [
    14, 10, 22, 12, 10,        // Branch … Status
    14, 16, 18, 10,             // Bank, Bank Branch, Account No, Track
    12, 14, 16, 13, 13, 16,    // Basic … Attendance
    13, 13, 13,                 // Incentives, V&F
    10, 14, 13, 12,             // ORC … Excess
    13,                         // Gross Pay
    13, 17, 10,                 // EPF … ETF
    14, 14, 20, 14,             // Loan … Advance
    12,                         // Net Pay
    16, 14, 14,                 // Volume, Target, Payroll Status
  ].map((w) => ({ wch: w }));

  // ── Freeze header ────────────────────────────────────────────────────────
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  return ws;
}

export function exportHoPayrollToExcel(
  rows: HoExportRow[],
  month: number,
  year: number,
) {
  if (rows.length === 0) return;

  const monthLabel = MONTHS[month - 1];
  const wb = XLSX.utils.book_new();

  const sorted = [...rows].sort((a, b) =>
    a.branch.localeCompare(b.branch) || a.empNo.localeCompare(b.empNo)
  );
  XLSX.utils.book_append_sheet(wb, buildSheet(sorted), "HO Payroll");

  // Per-branch sheets
  const byBranch = new Map<string, HoExportRow[]>();
  for (const r of sorted) {
    if (!byBranch.has(r.branch)) byBranch.set(r.branch, []);
    byBranch.get(r.branch)!.push(r);
  }
  for (const [branchName, branchRows] of byBranch) {
    const safeName = branchName.replace(/[:\\/?*[\]]/g, "").slice(0, 31);
    XLSX.utils.book_append_sheet(wb, buildSheet(branchRows), safeName);
  }

  XLSX.writeFile(wb, `HO_Payroll_${monthLabel}_${year}.xlsx`);
}