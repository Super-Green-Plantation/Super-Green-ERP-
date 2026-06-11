// lib/export-branch-report.ts
import { BranchReportRow } from "@/app/features/investments/actions";
import * as XLSX from "xlsx";

const TITLE_ORDER: Record<string, number> = {
  GM: 0, DGM: 1, COO: 2, PER_AGM: 3, PRO_AGM: 4,
  SZM: 5, JZM: 6, SRM: 7, JRM: 8, SBM: 9, JBM: 10,
  P_TL: 11, P_FA: 12, TRAINEE_FA: 13,
  ZM: 14, RM: 15, BM: 16, TL: 17, FA: 18,
  OPM: 19, ABM: 20, 
};

// Each entry becomes one sheet tab.
// "positions" must exactly match the Title enum values in TITLE_ORDER.
const POSITION_TABS: { label: string; positions: string[] }[] = [
  { label: "FA",         positions: ["FA", "P_FA", "TRAINEE_FA"] },
  { label: "TL",         positions: ["TL", "P_TL"] },
  { label: "BM",         positions: ["BM", "JBM", "SBM", "ABM"] },
  { label: "RM",         positions: ["RM", "JRM", "SRM"] },
  { label: "ZM",         positions: ["ZM", "JZM", "SZM"] },
  // { label: "GM",         positions: ["PRO_AGM", "PER_AGM", "GM", "DGM", ] },
  // { label: "Management", positions: ["COO"] },
];

export function exportBranchReport(
  data: BranchReportRow[],
  from: string,
  to: string
) {
  const wb = XLSX.utils.book_new();

  // ── Per-branch sheets ────────────────────────────────────────────────────
  data.forEach((branch) => {
    const rows: (string | number)[][] = [
      [`Branch: ${branch.branchName}`, "", "", ""],
      [`Period: ${from}  →  ${to}`, "", "", ""],
      [""],
      ["Employee Name", "Position", "Proposal Count", "Volume Achieved (LKR)"],
    ];

    branch.employees.forEach((emp) => {
      rows.push([emp.name, emp.position, emp.proposalCount, emp.totalAmount]);
    });

    const totalProposals = branch.employees.reduce((sum, e) => sum + e.proposalCount, 0);
    const totalAmount    = branch.employees.reduce((sum, e) => sum + e.totalAmount, 0);
    rows.push(["", "TOTAL", totalProposals, totalAmount]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 36 }, { wch: 16 }, { wch: 18 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws, `Branch ${branch.branchId}`);
  });

  // ── Position sheets ──────────────────────────────────────────────────────
  const allEmployees = data.flatMap((branch) =>
    branch.employees.map((emp) => ({ ...emp, branchName: branch.branchName }))
  );

  POSITION_TABS.forEach(({ label, positions }) => {
    const posSet = new Set(positions);
    const filtered = allEmployees
      .filter((emp) => posSet.has(emp.position))
      .sort((a, b) => {
        if (b.proposalCount !== a.proposalCount) return b.proposalCount - a.proposalCount;
        return (TITLE_ORDER[a.position] ?? 999) - (TITLE_ORDER[b.position] ?? 999);
      });

    if (filtered.length === 0) return; // skip empty tabs

    const rows: (string | number)[][] = [
      [`Position Group: ${label}`, "", "", "", "", ""],
      [`Period: ${from}  →  ${to}`, "", "", "", "", ""],
      [""],
      ["Rank", "Employee Name", "Branch", "Position", "Proposal Count", "Volume Achieved (LKR)"],
    ];

    filtered.forEach((emp, i) => {
      rows.push([i + 1, emp.name, emp.branchName, emp.position, emp.proposalCount, emp.totalAmount]);
    });

    const totalProposals = filtered.reduce((sum, e) => sum + e.proposalCount, 0);
    const totalAmount    = filtered.reduce((sum, e) => sum + e.totalAmount, 0);
    rows.push(["", "", "", "TOTAL", totalProposals, totalAmount]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 6 }, { wch: 36 }, { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws, label);
  });

  // ── Overall ranking sheet ────────────────────────────────────────────────
  allEmployees.sort((a, b) => {
    if (b.proposalCount !== a.proposalCount) return b.proposalCount - a.proposalCount;
    return (TITLE_ORDER[a.position] ?? 999) - (TITLE_ORDER[b.position] ?? 999);
  });

  const rankRows: (string | number)[][] = [
    [`Period: ${from}  →  ${to}`, "", "", "", "", ""],
    [""],
    ["Rank", "Employee Name", "Branch", "Position", "Proposal Count", "Total Amount (LKR)"],
  ];

  allEmployees.forEach((emp, i) => {
    rankRows.push([i + 1, emp.name, emp.branchName, emp.position, emp.proposalCount, emp.totalAmount]);
  });

  const rankWs = XLSX.utils.aoa_to_sheet(rankRows);
  rankWs["!cols"] = [{ wch: 6 }, { wch: 36 }, { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, rankWs, "Overall Ranking");

  XLSX.writeFile(wb, `proposal-report-${from}-to-${to}.xlsx`);
}