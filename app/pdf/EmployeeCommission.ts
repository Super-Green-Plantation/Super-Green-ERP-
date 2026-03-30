import jsPDF from "jspdf";
import { COLORS, drawFooter, drawHeader } from "../const/pdfStyles";
import autoTable from "jspdf-autotable";

export const generateEmployeeCommissionPDF = (data: any) => {
  const doc = new jsPDF();
  const { nameWithInitials, empNo, allCommission } = data;
  const pageWidth = doc.internal.pageSize.getWidth();

  const refNumber = allCommission?.[0]?.refNumber || `STAT-${new Date().getFullYear()}-${empNo}`;
  drawHeader(doc, "Commission Statement", `${nameWithInitials} (${empNo}) | Ref: ${refNumber}`);

  let currentY = 50;

  // Summary Stats
  const totalCommission = allCommission?.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0) || 0;
  const totalTransactions = allCommission?.length || 0;

  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(15, currentY, pageWidth - 30, 25, 3, 3, "FD");

  doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
  doc.setFontSize(8);
  doc.text("TOTAL EARNINGS", 25, currentY + 10);
  doc.text("TRANSACTIONS", pageWidth / 2 + 5, currentY + 10);

  doc.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`LKR ${totalCommission.toLocaleString()}`, 25, currentY + 18);

  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text(`${totalTransactions}`, pageWidth / 2 + 5, currentY + 18);

  currentY += 40;

  const tableData = allCommission?.map((comm: any) => [
    new Date(comm.createdAt).toLocaleDateString(),
    `#${comm.investmentId}`,
    comm.type,
    Number(comm.amount).toLocaleString("en-LK", { style: "currency", currency: "LKR" }),
  ]) || [];

  autoTable(doc, {
    head: [["Date", "Investment Ref", "Type", "Amount"]],
    body: tableData,
    startY: currentY,
    theme: "striped",
    headStyles: { fillColor: COLORS.primary, fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: { 3: { halign: 'right' } },
    margin: { left: 15, right: 15 },
  });

  drawFooter(doc);
  doc.save(`${nameWithInitials?.replace(/\s+/g, "_")}_commissions.pdf`);
};