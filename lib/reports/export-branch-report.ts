// lib/export-branch-report.ts
import { BranchReportRow } from "@/app/features/investments/actions";
import * as XLSX from "xlsx";

export function exportBranchReport(
  data: BranchReportRow[],
  from: string,
  to: string
) {
  const wb = XLSX.utils.book_new();

  data.forEach((branch) => {
    // Header rows
    const rows: (string | number)[][] = [
      [`Branch: ${branch.branchName}`, "", ""],
      [`Period: ${from}  →  ${to}`, "", ""],
      [""],
      ["Employee Name", "Position", "Proposal Count"],
    ];

    // Data rows
    branch.employees.forEach((emp) => {
      rows.push([emp.name, emp.position, emp.proposalCount]);
    });

    // Total row
    const total = branch.employees.reduce(
      (sum, e) => sum + e.proposalCount,
      0
    );
    rows.push(["", "TOTAL", total]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Column widths
    ws["!cols"] = [{ wch: 36 }, { wch: 16 }, { wch: 18 }];

    XLSX.utils.book_append_sheet(wb, ws, `Branch ${branch.branchId}`);
  });

  XLSX.writeFile(wb, `proposal-report-${from}-to-${to}.xlsx`);
}