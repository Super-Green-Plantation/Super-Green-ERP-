import autoTable from "jspdf-autotable";
import { COLORS, drawFooter, drawHeader } from "../const/pdfStyles";
import jsPDF from "jspdf";


export function generateBranchNetworkPDF(branches: any[]) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, "Branch Network Summary", `Total Branches: ${branches.length}`);

  let currentY = 50;

  // Stats Overview
  const totalStaff = branches.reduce((acc, b) => acc + (b.members?.length || 0), 0);
  const totalNetworkComm = branches.reduce((acc, b) => {
    return acc + (b.members?.reduce((mAcc: number, m: any) => mAcc + (m.totalCommission || 0), 0) || 0);
  }, 0);

  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(15, currentY, pageWidth - 30, 25, 3, 3, "FD");

  doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
  doc.setFontSize(8);
  doc.text("TOTAL NETWORK STAFF", 25, currentY + 10);
  doc.text("TOTAL DISBURSED COMMISSIONS", pageWidth / 2 + 5, currentY + 10);

  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${totalStaff} Employees`, 25, currentY + 18);
  doc.text(`LKR ${totalNetworkComm.toLocaleString()}`, pageWidth / 2 + 5, currentY + 18);

  currentY += 40;

  // Branch Breakdown
  branches.forEach((branch, index) => {
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${branch.name.toUpperCase()}`, 15, currentY);

    doc.setFontSize(8);
    doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
    doc.text(`${branch.location} | Status: ${branch.status}`, 15, currentY + 5);

    const tableRows = (branch.members || []).map((m: any) => [
      m.member.empNo,
      m.member.nameWithInitials,
      m.member.position?.title || "N/A",
      `LKR ${m.member.totalCommission?.toLocaleString() || 0}`
    ]);

    autoTable(doc, {
      startY: currentY + 8,
      head: [["EMP NO", "NAME", "POSITION", "TOTAL COMM."]],
      body: tableRows.length > 0 ? tableRows : [["-", "No employees registered", "-", "-"]],
      theme: "striped",
      headStyles: { fillColor: COLORS.primary, fontSize: 8, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 15, right: 15 },
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 15;
  });

  drawFooter(doc);
  doc.save("Branch_Network_Report.pdf");
}