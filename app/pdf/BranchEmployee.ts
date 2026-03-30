import autoTable from "jspdf-autotable";
import { COLORS, drawFooter, drawHeader } from "../const/pdfStyles";
import jsPDF from "jspdf";

export const generateBranchEmployeePDF = (data: any) => {
  const doc = new jsPDF();
  const { name, location, members } = data;
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, `${name} Branch Employees`, `Location: ${location}`);

  let currentY = 50;

  // members is MemberBranch[] — unwrap the nested member object
  const employees = members?.map((m: any) =>
    m.member ?? m // fallback: if already a flat Member, use as-is
  ) || [];

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e: any) => e.status === "Active").length;

  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(15, currentY, pageWidth - 30, 25, 3, 3, "FD");

  doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
  doc.setFontSize(8);
  doc.text("TOTAL EMPLOYEES", 25, currentY + 10);

  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${totalEmployees}`, 25, currentY + 18);

  currentY += 40;

  const tableData = employees.map((emp: any) => [
    emp.empNo || "N/A",
    emp.nameWithInitials || "N/A",
    emp.position?.title || "N/A",
    emp.email || "N/A",
    emp.phone || "N/A",
    emp.status || "Active",
  ]);

  autoTable(doc, {
    head: [["Emp No", "Name", "Position", "Email", "Phone", "Status"]],
    body: tableData,
    startY: currentY,
    theme: "striped",
    headStyles: { fillColor: COLORS.primary, fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { left: 15, right: 15 },
  });

  drawFooter(doc);
  doc.save(`${name.replace(/\s+/g, "_")}_employees.pdf`);
};