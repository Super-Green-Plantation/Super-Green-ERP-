import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { COLORS, drawFooter, drawHeader } from "../const/pdfStyles";


export const generateEmployeeFullProfilePDF = async (
  employee: any,
  reportingPeople: any[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 50;

  // --- Header ---
  drawHeader(doc, "Employee Profile", `${employee.nameWithInitials} (${employee.empNo})`);



  // --- Helper to draw section with colored background ---
  const drawSection = (title: string, data: [string, string | number | null][]) => {
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
    doc.roundedRect(15, currentY, pageWidth - 30, data.length * 7 + 12, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setFontSize(11);
    doc.text(title, 17, currentY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

    data.forEach(([label, value], i) => {
      doc.text(`${label}:`, 20, currentY + 15 + i * 7);
      doc.text(`${value ?? "-"}`, 70, currentY + 15 + i * 7);
    });

    currentY += data.length * 7 + 20;
  };

  // --- Personal Info ---
  drawSection("Personal Info", [
    ["Full Name", employee.nameWithInitials],
    ["DOB", employee.dob ? new Date(employee.dob).toLocaleDateString() : null],
    ["NIC", employee.nic],
    ["Gender", employee.gender],
    ["Civil Status", employee.civilStatus],
    ["Address", employee.address],
    ["Email", employee.email],
    ["Phone", employee.phone || employee.phone2],
  ]);

  // --- Employment Info ---
  drawSection("Employment Info", [
    ["Position", employee.position?.title],
    ["Branch", employee.branches?.map((b: any) => b.branch?.name).join(", ")],
    ["Employee No", employee.empNo],
    ["Status", employee.status],
    ["Date of Join", employee.dateOfJoin ? new Date(employee.dateOfJoin).toLocaleDateString() : null],
    ["Probation Start", employee.probationStartDate ? new Date(employee.probationStartDate).toLocaleDateString() : null],
    ["Total Commission", `LKR ${employee.totalCommission?.toLocaleString() || 0}`],
  ]);

  // --- Bank Info ---
  drawSection("Bank Info", [
    ["Account No", employee.accNo],
    ["Bank", employee.bank],
    ["Bank Branch", employee.bankBranch],
    ["EPF No", employee.epfNo],
  ]);

  // --- Reporting Persons Table ---
  if (reportingPeople?.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text("Reporting Persons", 15, currentY);
    currentY += 5;

    const tableData = reportingPeople.map((rp: any) => [
      rp.nameWithInitials,
      rp.position?.title || "-",
      rp.branches?.map((b: any) => b.branch?.name).join(", ") || "-",
      `LKR ${rp.totalCommission?.toLocaleString() || 0}`,
    ]);

    autoTable(doc, {
      head: [["Name", "Position", "Branch", "Commission"]],
      body: tableData,
      startY: currentY,
      theme: "striped",
      headStyles: { fillColor: COLORS.primary, fontSize: 10, fontStyle: "bold", textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3, textColor: [51, 65, 85] },
      columnStyles: { 3: { halign: "right" } },
      margin: { left: 15, right: 15 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // --- Footer ---
  drawFooter(doc);

  // --- Save PDF ---
  doc.save(`${employee.nameWithInitials?.replace(/\s+/g, "_")}_full_profile.pdf`);
};

