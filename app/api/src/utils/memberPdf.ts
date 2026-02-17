import jsPDF from "jspdf";

type RGB = [number, number, number];

export function generateEmployeeCommissionPDF(
  member: any,
  commissionResponse: any,
) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 25;
  const commissions = Array.isArray(commissionResponse)
    ? commissionResponse
    : commissionResponse?.res || [];

  const colors: Record<string, RGB> = {
    primary: [41, 128, 185], // Finance Blue
    secondary: [44, 62, 80], // Navy
    accent: [39, 174, 96], // Success Green
    lightGrey: [245, 245, 245],
    border: [210, 210, 210],
  };

  // --- 1. HEADER & PROFILE ---
  doc.setFillColor(...colors.secondary);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(member.name.toUpperCase(), margin, 15);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${member.position.title} | ${member.empNo}`, margin, 22);
  doc.text(`${member.branch.name} Branch`, margin, 27);

  // Total Earnings Badge
  doc.setFillColor(255, 255, 255, 0.1);
  doc.roundedRect(pageWidth - margin - 50, 10, 50, 20, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL COMMISSION", pageWidth - margin - 45, 17);
  doc.setFontSize(14);
  doc.text(
    `LKR ${member.totalCommission?.toLocaleString()}`,
    pageWidth - margin - 45,
    25,
  );

  y = 50;

  // --- 2. SALARY & STRUCTURE ---
  doc.setTextColor(...colors.secondary);
  doc.setFontSize(12);
  doc.text("Compensation Structure", margin, y);
  y += 8;

  const structureY = y;
  doc.setDrawColor(...colors.border);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Base Salary:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    `LKR ${member.position.baseSalary.toLocaleString()}`,
    margin + 25,
    y,
  );

  doc.setFont("helvetica", "bold");
  doc.text("ORC Rate:", margin + 70, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${(parseFloat(member.position.orc.rate) * 100).toFixed(1)}%`,
    margin + 90,
    y,
  );

  y += 15;

  // --- 3. COMMISSION LOG TABLE ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Commission Log", margin, y);
  y += 8;

  // Table Header
  doc.setFillColor(...colors.lightGrey);
  doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
  doc.setFontSize(8);
  doc.text("DATE", margin + 2, y + 5.5);
  doc.text("INV ID", margin + 30, y + 5.5);
  doc.text("INV AMOUNT", margin + 60, y + 5.5);
  doc.text("TYPE", margin + 100, y + 5.5);
  doc.text("EARNED", margin + 140, y + 5.5);
  y += 12;

  if (commissions.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.text("No commission records found for this period.", margin, y + 10);
  } else {
    commissions.forEach((comm: any, index: number) => {
      doc.setFont("helvetica", "normal");

      // Accessing nested data safely
      const date = comm.createdAt
        ? new Date(comm.createdAt).toLocaleDateString()
        : "N/A";
      const invId = comm.investmentId || "N/A";
      const invAmount = comm.investment?.amount?.toLocaleString() || "0";
      const type = comm.type || "N/A";
      const earned = comm.amount?.toLocaleString() || "0";

      doc.text(date, margin + 2, y);
      doc.text(`#${invId}`, margin + 30, y);
      doc.text(`LKR ${invAmount}`, margin + 60, y);
      doc.text(type, margin + 100, y);
      doc.text(`LKR ${earned}`, margin + 140, y);

      y += 8;
      // ... (Page break logic)
    });
  }

  // --- 4. FOOTER ---
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const footerText = `Statement for ${member.name} generated on ${new Date().toLocaleString()}`;
  doc.text(footerText, pageWidth / 2, 285, { align: "center" });

  doc.save(`Commission_Statement_${member.empNo}.pdf`);
}
