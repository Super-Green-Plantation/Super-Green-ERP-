import autoTable from "jspdf-autotable";
import { COLORS, drawFooter, drawHeader } from "../const/pdfStyles";
import jsPDF from "jspdf";

export const generateInvestmentPDF = (data: any) => {
  const doc = new jsPDF();
  // Support both 'member' (from some contexts) and 'advisor' (from DB)
  const { client, member, advisor, plan, refNumber, id } = data;
  const agent = member || advisor || {};
  const activeInvestment = data; // The data itself IS the investment
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, "Investment Receipt", `Ref: #${refNumber || id || "N/A"}`);

  let currentY = 55;

  // Two Column Layout
  const leftColX = 15;
  const rightColX = pageWidth / 2 + 10;

  // Investor Details
  doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("INVESTOR DETAILS", leftColX, currentY);

  currentY += 10;
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const investorDetails = [
    `Name: ${client.fullName}`,
    `NIC/Passport: ${client.nic || client.passportNo || "N/A"}`,
    `Address: ${client.address}`,
    `Email: ${client.email || "N/A"}`,
    `Phone: ${client.phoneMobile || "N/A"}`,
  ];

  investorDetails.forEach((line) => {
    doc.text(line, leftColX, currentY);
    currentY += 7;
  });

  // Advisor Details (Right Column)
  currentY = 55; // Reset Y for right column
  doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ADVISOR DETAILS", rightColX, currentY);

  currentY += 10;
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const advisorDetails = [
    `Name: ${agent.name}`,
    `Emp No: ${agent.empNo}`,
    `Branch: ${agent.branch?.name || "N/A"}`,
  ];

  advisorDetails.forEach((line) => {
    doc.text(line, rightColX, currentY);
    currentY += 7;
  });

  // Plan Details Section
  currentY = 110;
  doc.setDrawColor(230, 230, 230);
  doc.line(15, currentY, pageWidth - 15, currentY);
  currentY += 15;

  doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("INVESTMENT PLAN DETAILS", 15, currentY);
  currentY += 10;

  const amount = Number(client.investmentAmount);
  const rate = Number(plan?.rate || 0);
  const duration = Number(plan?.duration || 0);
  const monthlyRate = rate / 12 / 100;
  const monthlyInterest = amount * monthlyRate;

  const planData = [
    ["Plan Name", plan?.name || "Standard"],
    ["Principal Amount", amount.toLocaleString("en-LK", { style: "currency", currency: "LKR" })],
    ["Annual Rate", `${rate}%`],
    ["Duration", `${duration} Months`],
    ["Est. Monthly Return", monthlyInterest.toLocaleString("en-LK", { style: "currency", currency: "LKR" })]
  ];

  autoTable(doc, {
    startY: currentY,
    body: planData,
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60, fillColor: COLORS.light },
      1: { fontStyle: 'normal' }
    },
    margin: { left: 15, right: 15 },
  });

  drawFooter(doc);
  doc.save(`Investment_${client.fullName.replace(/\s+/g, "_")}.pdf`);
};