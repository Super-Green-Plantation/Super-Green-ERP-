import jsPDF from "jspdf";

type RGB = [number, number, number];

export function generateBranchEmployeePDF(branchData: any) {
  if (!branchData || !branchData.members) return;

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 25;

  const colors: Record<string, RGB> = {
    primary: [41, 128, 185],
    text: [44, 62, 80],
    lightGrey: [245, 245, 245],
    headerRow: [52, 73, 94]
  };

  // --- 1. BRANCH HEADER ---
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 18, "F");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text(`${branchData.name.toUpperCase()} - PERFORMANCE REPORT`, margin, y);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Location: ${branchData.location} | Status: ${branchData.status}`, margin, y + 6);
  y += 15;

  // --- 2. EMPLOYEE TABLE ---
  doc.setFillColor(...colors.headerRow);
  doc.rect(margin, y, pageWidth - (margin * 2), 10, "F");
  
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  
  // Table Headers
  doc.text("ID", margin + 2, y + 6.5);
  doc.text("NAME / ROLE", margin + 20, y + 6.5);
  doc.text("BASE SALARY", margin + 80, y + 6.5);
  doc.text("COMMISSION", margin + 120, y + 6.5);
  doc.text("ORC RATE", margin + 155, y + 6.5);

  y += 10;
  doc.setTextColor(...colors.text);
  doc.setFont("helvetica", "normal");

  branchData.members.forEach((member: any, index: number) => {
    // Zebra Striping
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, pageWidth - (margin * 2), 12, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.text(member.empNo, margin + 2, y + 7);
    
    doc.setFont("helvetica", "normal");
    doc.text(member.name, margin + 20, y + 5);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(member.position?.title || "Staff", margin + 20, y + 9);
    
    doc.setFontSize(9);
    doc.setTextColor(...colors.text);
    doc.text(`${member.position?.baseSalary?.toLocaleString()}`, margin + 80, y + 7);
    doc.text(`${member.totalCommission?.toLocaleString()}`, margin + 120, y + 7);
    doc.text(`${(parseFloat(member.position?.orc?.rate) * 100).toFixed(1)}%`, margin + 155, y + 7);

    y += 12;

    // Page Break Logic
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  // --- 3. COMMISSION TIER LOGIC EXPLANATION ---
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Active Commission Tiers:", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  
  const uniqueTiers = branchData.members[0]?.position?.personalCommissionTiers || [];
  uniqueTiers.forEach((tier: any) => {
    doc.text(`• ${tier.minAmount.toLocaleString()} - ${tier.maxAmount ? tier.maxAmount.toLocaleString() : '∞'} LKR : ${tier.rate}%`, margin + 5, y);
    y += 5;
  });

  doc.save(`${branchData.name}_Staff_Report.pdf`);
}