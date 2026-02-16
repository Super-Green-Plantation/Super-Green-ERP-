import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateBranchNetworkPDF(branches: any[]) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  // Define Brand Colors
  const colors = {
    primary: [15, 23, 42], // Slate 900
    accent: [37, 99, 235], // Blue 600
    success: [22, 163, 74], // Green 600
    light: [248, 250, 252], // Slate 50
  };

  // --- Header Section ---
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("BRANCH NETWORK SUMMARY", 15, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated on: ${new Date().toLocaleDateString()} | Total Branches: ${branches.length}`,
    15,
    28,
  );

  let currentY = 50;

  // --- Network Stats Overview ---
  const totalStaff = branches.reduce(
    (acc, b) => acc + (b.members?.length || 0),
    0,
  );
  const totalNetworkComm = branches.reduce((acc, b) => {
    return (
      acc +
      (b.members?.reduce(
        (mAcc: number, m: any) => mAcc + (m.totalCommission || 0),
        0,
      ) || 0)
    );
  }, 0);

  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(15, currentY, pageWidth - 30, 25, 3, 3, "FD");

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text("TOTAL NETWORK STAFF", 25, currentY + 10);
  doc.text("TOTAL DISBURSED COMMISSIONS", pageWidth / 2 + 5, currentY + 10);

  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${totalStaff} Employees`, 25, currentY + 18);
  doc.text(
    `LKR ${totalNetworkComm.toLocaleString()}`,
    pageWidth / 2 + 5,
    currentY + 18,
  );

  currentY += 40;

  // --- Branch Breakdown ---
  branches.forEach((branch, index) => {
    // Check for page overflow
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${branch.name.toUpperCase()}`, 15, currentY);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${branch.location} | Status: ${branch.status}`, 15, currentY + 5);

    // Member Table for this branch
    const tableRows = (branch.members || []).map((m: any) => [
      m.empNo,
      m.name,
      m.position?.title || "N/A",
      `LKR ${m.totalCommission?.toLocaleString() || 0}`,
    ]);

    autoTable(doc, {
      startY: currentY + 8,
      head: [["EMP NO", "NAME", "POSITION", "TOTAL COMM."]],
      body:
        tableRows.length > 0
          ? tableRows
          : [["-", "No employees registered", "-", "-"]],
      theme: "striped",
      headStyles: {
        // Force TypeScript to recognize this as the correct Tuple type
        fillColor: colors.primary as [number, number, number],
        fontSize: 8,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        // If you use other colors in styles, do the same:
        // textColor: colors.secondary as [number, number, number]
      },
      margin: { left: 15, right: 15 },
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 15;
  });

  doc.save("Branch_Network_Report.pdf");
}
