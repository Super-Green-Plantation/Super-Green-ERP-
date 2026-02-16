import jsPDF from "jspdf";

// Define a Tuple type to satisfy TypeScript's rest parameter requirements
type RGB = [number, number, number];

export function generateAgreementPDF(client: any, plan: any) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 25;

  // --- Theme Colors (Strictly Typed) ---
  const colors: Record<string, RGB> = {
    primary: [41, 128, 185], 
    text: [44, 62, 80],
    lightGrey: [245, 245, 245],
    border: [200, 200, 200]
  };

  // --- Helper Functions ---
  const checkPageBreak = (neededSpace: number): boolean => {
    if (y + neededSpace > pageHeight - 20) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  const drawSectionHeader = (title: string) => {
    checkPageBreak(15);
    // Use spread safely now that types are Tuples
    doc.setFillColor(...colors.lightGrey);
    doc.rect(margin, y, pageWidth - (margin * 2), 8, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.text(title.toUpperCase(), margin + 2, y + 6);
    y += 12;
  };

  const addRow = (label: string, value?: string | number) => {
    checkPageBreak(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${label}:`, margin + 2, y);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    doc.text(value?.toString() || "-", margin + 55, y);
    y += 7;
  };

  const addParagraph = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    checkPageBreak(lines.length * 5 + 5);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 5;
  };

  // ===== 1. HEADER & BRANDING =====
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 15, "F"); // Top accent bar

  y = 25;
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("INVESTMENT AGREEMENT", margin, y);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text(`Ref: INV-${Date.now().toString().slice(-6)}`, pageWidth - margin, y, { align: "right" });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, y + 5, { align: "right" });
  
  y += 15;

  // ===== 2. DATA SECTIONS =====
  drawSectionHeader("1. Applicant Information");
  addRow("Full Name", client.applicant.fullName);
  addRow("NIC / Passport", client.applicant.nic || client.applicant.passportNo);
  addRow("Contact", client.applicant.phoneMobile);
  addRow("Email", client.applicant.email);
  addRow("Address", client.applicant.address);
  y += 5;

  drawSectionHeader("2. Investment Details");
  addRow("Plan Name", plan.name);
  addRow("Term", `${plan.duration} Months`);
  addRow("Rate", `${plan.rate}% p.a.`);
  addRow("Amount", `LKR ${Number(client.applicant.investmentAmount).toLocaleString()}`);
  y += 5;

  drawSectionHeader("3. Beneficiary & Settlement");
  addRow("Name", client.beneficiary.fullName);
  addRow("Bank", client.beneficiary.bankName);
  addRow("Account No", client.beneficiary.accountNo);
  
  if (client.nominee?.fullName) {
    y += 5;
    addRow("Nominee", client.nominee.fullName);
  }
  y += 10;

  drawSectionHeader("4. Declarations");
  addParagraph(
    `The Applicant confirms that the funds invested are from legitimate sources. The Company reserves the right to verify all information provided. Early termination of this agreement is subject to the terms outlined in the company's general investment policy.`
  );

  // ===== 3. SIGNATURE SECTION =====
  checkPageBreak(50);
  y += 10;
  const sigLineLength = 60;
  
  // Applicant Signature
  doc.setDrawColor(...colors.border);
  doc.line(margin, y + 20, margin + sigLineLength, y + 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Applicant Signature", margin, y + 25);

  if (client.applicant.signature) {
    try {
        doc.addImage(client.applicant.signature, "PNG", margin, y - 5, 50, 20);
    } catch (e) {
        console.error("Signature image failed to load", e);
    }
  }

  // Company Signature
  const rightStart = pageWidth - margin - sigLineLength;
  doc.line(rightStart, y + 20, pageWidth - margin, y + 20);
  doc.text("Authorized Signatory", rightStart, y + 25);

  // ===== 4. FOOTER (Page Numbers) =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, 282, pageWidth - margin, 282);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Investment Agreement | Generated via System`, margin, 287);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 287, { align: "right" });
  }

  doc.save(`Agreement_${client.applicant.fullName.replace(/\s+/g, '_')}.pdf`);
}