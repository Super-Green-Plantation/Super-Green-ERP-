import jsPDF from "jspdf";

type RGB = [number, number, number];

export function generateInvestmentPDF(data: any) {
  // Check against the structure you actually have in your state
  if (!data || !data.client) {
    console.error("No investment data found in the provided state");
    return;
  }

  const { client, plan, member } = data;
  const activeInvestment = client.investments?.[0]; // Accessing the nested investment

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 25;

  const colors: Record<string, RGB> = {
    primary: [41, 128, 185],
    text: [44, 62, 80],
    lightGrey: [245, 245, 245]
  };

  // Helper for rows
  const addRow = (label: string, value: any) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value?.toString() || "N/A", margin + 60, y);
    y += 8;
  };

  // Header
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 15, "F");
  
  doc.setFontSize(22);
  doc.setTextColor(...colors.primary);
  doc.setFont("helvetica", "bold");
  doc.text("INVESTMENT RECEIPT", margin, y);
  y += 15;

  // Section 1: Client
  doc.setFontSize(12);
  doc.text("CLIENT INFORMATION", margin, y);
  y += 10;
  doc.setFontSize(10);
  addRow("Full Name", client.fullName);
  addRow("NIC Number", client.nic);
  addRow("Address", client.address);
  y += 10;

  // Section 2: Investment
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("INVESTMENT DETAILS", margin, y);
  y += 10;
  doc.setFontSize(10);
  addRow("Plan Name", plan?.name);
  addRow("Principal Amount", `Rs. ${client.investmentAmount?.toLocaleString()}`);
  addRow("Annual Rate", `${plan?.rate}%`);
  addRow("Duration", `${plan?.duration} Months`);
  
  if (activeInvestment) {
    addRow("Frequency", activeInvestment.returnFrequency || "Monthly");
  }

  // Section 3: Advisor
  y += 10;
  doc.setFontSize(12);
  doc.text("ASSIGNED ADVISOR", margin, y);
  y += 10;
  doc.setFontSize(10);
  addRow("Advisor Name", member?.name);
  addRow("Branch", member?.branch?.name);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, 285);

  doc.save(`Receipt_${client.fullName.replace(/\s+/g, '_')}.pdf`);
}