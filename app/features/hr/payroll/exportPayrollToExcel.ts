import * as XLSX from "xlsx";

export function exportPayrollToExcel(preview: any[], branchName: string, month: string, year: number) {
  const rows = preview.map((r) => ({
    Employee: r.name,
    "Emp No": r.empNo,
    Position: r.position,
    Status: r.status,
    "Volume Achieved": r.volumeAchieved,
    Basic: r.breakdown?.basicSalaryPermanent ?? 0,
    Incentive: r.breakdown?.incentiveEarned ?? 0,
    Vehicle: r.breakdown?.vehicleEarned ?? 0,
    "Team Active": r.breakdown?.teamActiveEarned ?? 0,
    "Target Budget": r.breakdown?.targetBudgetSalary ?? 0,
    "Personal Comm.": r.personalCommissionEarned,
    ORC: r.orcEarned,
    Excess: r.excessEarned,
    "EPF (Emp)": r.breakdown?.epfDeduction ?? 0,
    Advance: r.advanceDeducted,
    "Net Pay": r.breakdown?.netPay ?? 0,
    Status_: r.alreadyProcessed ? "Done" : "Wait",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");

  XLSX.writeFile(workbook, `Payroll_${branchName}_${month}_${year}.xlsx`);
}

