// lib/export-branch-report.ts
import { BranchReportRow } from "@/app/features/investments/actions";
import * as XLSX from "xlsx";

// Match the order in your Title enum — lower index = higher rank
const TITLE_ORDER: Record<string, number> = {
  GM: 0, DGM: 1, COO: 2, PER_AGM: 3, PRO_AGM: 4,
  SZM: 5, JZM: 6, SRM: 7, JRM: 8, SBM: 9, JBM: 10,
  P_TL: 11, P_FA: 12, TRAINEE_FA: 13,
  ZM: 14, RM: 15, BM: 16, TL: 17, FA: 18,
  OPM: 19, ABM: 20, HR: 21, ACC: 22, IT: 23, PRO: 24,
  CLEANING: 25, ADMIN: 26, CHAIRMEN: 27, SE: 28,
};

export function exportBranchReport(
  data: BranchReportRow[],
  from: string,
  to: string
) {
  const wb = XLSX.utils.book_new();

  // ── Per-branch sheets ─────────────────────────────────────────────────────
  data.forEach((branch) => {
    const rows: (string | number)[][] = [
      [`Branch: ${branch.branchName}`, "", "", ""],
      [`Period: ${from}  →  ${to}`, "", "", ""],
      [""],
      ["Employee Name", "Position", "Proposal Count", "Total Amount (LKR)"],
    ];

    branch.employees.forEach((emp) => {
      rows.push([emp.name, emp.position, emp.proposalCount, emp.totalAmount]);
    });

    const totalProposals = branch.employees.reduce((sum, e) => sum + e.proposalCount, 0);
    const totalAmount = branch.employees.reduce((sum, e) => sum + e.totalAmount, 0);
    rows.push(["", "TOTAL", totalProposals, totalAmount]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 36 }, { wch: 16 }, { wch: 18 }, { wch: 22 }];

    XLSX.utils.book_append_sheet(wb, ws, `Branch ${branch.branchId}`);
  });

  // ── Overall ranking sheet ─────────────────────────────────────────────────
  const allEmployees = data.flatMap((branch) =>
    branch.employees.map((emp) => ({
      ...emp,
      branchName: branch.branchName,
    }))
  );

  // Sort: 1) proposal count desc  2) position title rank asc
  allEmployees.sort((a, b) => {
    if (b.proposalCount !== a.proposalCount) {
      return b.proposalCount - a.proposalCount;
    }
    const rankA = TITLE_ORDER[a.position] ?? 999;
    const rankB = TITLE_ORDER[b.position] ?? 999;
    return rankA - rankB;
  });

  const rankRows: (string | number)[][] = [
    [`Period: ${from}  →  ${to}`, "", "", "", ""],
    [""],
    ["Rank", "Employee Name", "Branch", "Position", "Proposal Count", "Total Amount (LKR)"],
  ];

  allEmployees.forEach((emp, i) => {
    rankRows.push([
      i + 1,
      emp.name,
      emp.branchName,
      emp.position,
      emp.proposalCount,
      emp.totalAmount,
    ]);
  });

  const rankWs = XLSX.utils.aoa_to_sheet(rankRows);
  rankWs["!cols"] = [
    { wch: 6 }, { wch: 36 }, { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 22 },
  ];

  XLSX.utils.book_append_sheet(wb, rankWs, "Overall Ranking");

  XLSX.writeFile(wb, `proposal-report-${from}-to-${to}.xlsx`);
}