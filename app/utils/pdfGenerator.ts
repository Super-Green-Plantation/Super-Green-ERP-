import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- Shared Constants & Helpers ---
const COLORS: Record<string, [number, number, number]> = {
  primary: [15, 23, 42],   // Slate 900
  accent: [37, 99, 235],    // Blue 600
  success: [22, 163, 74],   // Green 600
  light: [248, 250, 252],   // Slate 50
  text: [51, 65, 85],       // Slate 700
  textLight: [100, 116, 139] // Slate 500
};

const drawHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), 15, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${new Date().toLocaleDateString()} ${subtitle ? `| ${subtitle}` : ""}`, 15, 28);
};

const drawFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setFontSize(8);
  doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
  doc.text("Super Green Plantation ERP - Confidential Report", pageWidth / 2, pageHeight - 10, { align: "center" });
};

// --- 1. Branch Network Summary ---
export function generateBranchNetworkPDF(branches: any[]) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, "Branch Network Summary", `Total Branches: ${branches.length}`);

  let currentY = 50;

  // Stats Overview
  const totalStaff = branches.reduce((acc, b) => acc + (b.members?.length || 0), 0);
  const totalNetworkComm = branches.reduce((acc, b) => {
    return acc + (b.members?.reduce((mAcc: number, m: any) => mAcc + (m.totalCommission || 0), 0) || 0);
  }, 0);

  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(15, currentY, pageWidth - 30, 25, 3, 3, "FD");

  doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
  doc.setFontSize(8);
  doc.text("TOTAL NETWORK STAFF", 25, currentY + 10);
  doc.text("TOTAL DISBURSED COMMISSIONS", pageWidth / 2 + 5, currentY + 10);

  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${totalStaff} Employees`, 25, currentY + 18);
  doc.text(`LKR ${totalNetworkComm.toLocaleString()}`, pageWidth / 2 + 5, currentY + 18);

  currentY += 40;

  // Branch Breakdown
  branches.forEach((branch, index) => {
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${branch.name.toUpperCase()}`, 15, currentY);
    
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
    doc.text(`${branch.location} | Status: ${branch.status}`, 15, currentY + 5);

    const tableRows = (branch.members || []).map((m: any) => [
      m.empNo,
      m.name,
      m.position?.title || "N/A",
      `LKR ${m.totalCommission?.toLocaleString() || 0}`
    ]);

    autoTable(doc, {
      startY: currentY + 8,
      head: [["EMP NO", "NAME", "POSITION", "TOTAL COMM."]],
      body: tableRows.length > 0 ? tableRows : [["-", "No employees registered", "-", "-"]],
      theme: "striped",
      headStyles: { fillColor: COLORS.primary, fontSize: 8, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 15, right: 15 },
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 15;
  });

  drawFooter(doc);
  doc.save("Branch_Network_Report.pdf");
}

// --- 2. Branch Employee Report ---
export const generateBranchEmployeePDF = (data: any) => {
  const doc = new jsPDF();
  const { name, location, members } = data;
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, `${name} Branch Employees`, `Location: ${location}`);

  let currentY = 50;

  // Stats
  const totalEmployees = members?.length || 0;
  const activeEmployees = members?.filter((m: any) => m.status === 'Active')?.length || 0;

  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(15, currentY, pageWidth - 30, 25, 3, 3, "FD");

  doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
  doc.setFontSize(8);
  doc.text("TOTAL EMPLOYEES", 25, currentY + 10);
  doc.text("ACTIVE STATUS", pageWidth / 2 + 5, currentY + 10);

  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${totalEmployees}`, 25, currentY + 18);
  doc.text(`${activeEmployees}`, pageWidth / 2 + 5, currentY + 18);

  currentY += 40;

  const tableData = members?.map((emp: any) => [
    emp.empNo,
    emp.name,
    emp.position?.title || "N/A",
    emp.email || "N/A",
    emp.phone || "N/A",
    emp.status || "Active",
  ]) || [];

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

// --- 3. Employee Commission Statement ---
export const generateEmployeeCommissionPDF = (data: any) => {
  const doc = new jsPDF();
  const { name, empNo, allCommission } = data;
  const pageWidth = doc.internal.pageSize.getWidth();

  const refNumber = allCommission?.[0]?.refNumber || `STAT-${new Date().getFullYear()}-${empNo}`;
  drawHeader(doc, "Commission Statement", `${name} (${empNo}) | Ref: ${refNumber}`);

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
  doc.save(`${name.replace(/\s+/g, "_")}_commissions.pdf`);
};

// --- 4. Investment Receipt ---
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

// --- 5. Client Application Report ---
export const generateClientApplicationPDF = (data: any, plan: any) => {
  const doc = new jsPDF();
  const { applicant, beneficiary, nominee, investment } = data;
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, "Client Application", `Ref: ${investment?.refNumber || investment?.id || "N/A"}`);

  let currentY = 55;

  const renderSection = (title: string, details: [string, string][]) => {
      doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
      doc.rect(15, currentY, pageWidth - 30, 8, "F");
      
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), 18, currentY + 5.5);
      
      currentY += 12;

      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      details.forEach(([label, value]) => {
          doc.setFont("helvetica", "bold");
          doc.text(`${label}:`, 18, currentY);
          
          doc.setFont("helvetica", "normal");
          doc.text(value || "N/A", 60, currentY);
          
          currentY += 6;
      });
      currentY += 8;
  };

  renderSection("Applicant Information", [
      ["Full Name", applicant.fullName],
      ["NIC/Passport", applicant.nic || applicant.passportNo],
      ["Address", applicant.address],
      ["Email", applicant.email],
      ["Phone", applicant.phoneMobile],
      ["Occupation", applicant.occupation]
  ]);

  if (beneficiary) {
    renderSection("Beneficiary Information", [
        ["Name", beneficiary.fullName],
        ["Relationship", beneficiary.relationship],
        ["NIC", beneficiary.nic],
        ["Bank", `${beneficiary.bankName} (${beneficiary.bankBranch})`],
        ["Account No", beneficiary.accountNo]
    ]);
  }

  if (nominee) {
    renderSection("Nominee Information", [
        ["Name", nominee.fullName],
        ["Address", nominee.permanentAddress]
    ]);
  }

  if (plan) {
    renderSection("Investment Plan", [
        ["Plan Name", plan.name],
        ["Duration", `${plan.duration} Months`],
        ["Annual Rate", `${plan.rate}%`],
        ["Amount", Number(applicant.investmentAmount).toLocaleString("en-LK", { style: "currency", currency: "LKR" })]
    ]);
  }

  drawFooter(doc);
  doc.save(`Application_${applicant.fullName.replace(/\s+/g, "_")}.pdf`);
};
// --- 6. Investment List Report ---
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
