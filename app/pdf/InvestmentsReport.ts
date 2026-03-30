import autoTable from "jspdf-autotable";
import { COLORS, drawFooter, drawHeader } from "../const/pdfStyles";
import jsPDF from "jspdf";

export const generateInvestmentsReportPDF = (investments: any[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, "Investment Portfolio Report", `Total Records: ${investments.length}`);

  let currentY = 50;

  // Portfolio Summary
  const totalInvested = investments.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
  const activeCount = investments.length; // Assuming list is already filtered if needed

  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(15, currentY, pageWidth - 30, 25, 3, 3, "FD");

  doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
  doc.setFontSize(8);
  doc.text("TOTAL PORTFOLIO VALUE", 25, currentY + 10);
  doc.text("ACTIVE INVESTMENTS", pageWidth / 2 + 5, currentY + 10);

  doc.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`LKR ${totalInvested.toLocaleString()}`, 25, currentY + 18);

  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text(`${activeCount}`, pageWidth / 2 + 5, currentY + 18);

  currentY += 40;

  const tableData = investments.map((inv) => [
    inv.refNumber || inv.id,
    new Date(inv.investmentDate).toLocaleDateString(),
    inv.client?.fullName || "N/A",
    inv.plan?.name || "Standard",
    inv.advisor?.name || "N/A",
    Number(inv.amount).toLocaleString("en-LK", { style: "currency", currency: "LKR" })
  ]);

  autoTable(doc, {
    head: [["Ref No", "Date", "Client", "Plan", "Advisor", "Amount"]],
    body: tableData,
    startY: currentY,
    theme: "striped",
    headStyles: { fillColor: COLORS.primary, fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: { 5: { halign: 'right' } },
    margin: { left: 15, right: 15 },
  });

  drawFooter(doc);
  doc.save(`Investment_Portfolio_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};