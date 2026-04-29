// lib/export-branch-report.ts
import { BranchReportRow } from "@/app/features/investments/actions";
import * as XLSX from "xlsx";

export function exportBranchReport(
  data: BranchReportRow[],
  from: string,
  to: string,
 
) {
  const wb = XLSX.utils.book_new();

  data.forEach((branch) => {
    // Header rows
    const rows: (string | number)[][] = [
      [`Branch: ${branch.branchName}`, "", ""],
      [`Period: ${from}  →  ${to}`, "", ""],
      [""],
      ["Employee Name", "Position", "Proposal Count", "Total Amount (LKR)"],
    ];

    // Data rows
    branch.employees.forEach((emp) => {
      rows.push([emp.name, emp.position, emp.proposalCount, emp.totalAmount]);
    });

    // Total row
    const totalProposals = branch.employees.reduce((sum, e) => sum + e.proposalCount, 0);
    const totalAmount = branch.employees.reduce((sum, e) => sum + e.totalAmount, 0);
    rows.push(["", "TOTAL", totalProposals, totalAmount]);
    
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Widen the 4th column
    ws["!cols"] = [{ wch: 36 }, { wch: 16 }, { wch: 18 }, { wch: 22 }];
    
    rows.push(["", "TOTAL", totalProposals]);


    // Column widths
    ws["!cols"] = [{ wch: 36 }, { wch: 16 }, { wch: 18 }];

    XLSX.utils.book_append_sheet(wb, ws, `Branch ${branch.branchId}`);
  });

  XLSX.writeFile(wb, `proposal-report-${from}-to-${to}.xlsx`);
}