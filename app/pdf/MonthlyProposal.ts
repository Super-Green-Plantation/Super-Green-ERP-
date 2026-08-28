import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface MonthlyProposalPDFData {
  id?: number; proposalFormNo: string; planType: "CHILD" | "MARGE" | "PENSION";
  applicantName: string; applicantNic?: string | null; applicantDob?: string | null; applicantAge?: number | null; applicantAddress?: string | null; applicantPhone?: string | null; applicantEmail?: string | null; gender?: string | null; maritalStatus?: string | null; applicantBankAccNo?: string | null; applicantBankName?: string | null;
  childName?: string | null; childDob?: string | null; childBirthCertNo?: string | null; childSchool?: string | null; childGrade?: string | null;
  duration: number; retirementAge?: number | null; frequency: "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL"; premium: number;
  totalInvested: number; interestRate: number; interestEarned: number; maturityAmount: number; documentCharge: number;
  nomineeName?: string | null; nomineeNic?: string | null; nomineeRelationship?: string | null; nomineePhone?: string | null;
  agentBankAccNo?: string | null; agentBankName?: string | null; agentBankBranch?: string | null;
  fa?: { name: string; empNo: string } | null; fm?: { name: string; empNo: string } | null; bm?: { name: string; empNo: string } | null; rm?: { name: string; empNo: string } | null; zm?: { name: string; empNo: string } | null;
  createdAt: Date | string;
}
const rs = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-LK", { maximumFractionDigits: 2 })}`;
const text = (v: unknown) => v == null || v === "" ? "—" : String(v);
export const generateMonthlyProposalPDF = async (data: MonthlyProposalPDFData): Promise<void> => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const title = data.planType === "CHILD" ? "SUPER GREEN — CHILD PLAN" : data.planType === "MARGE" ? "SUPER GREEN — MARRIAGE PLAN" : "SUPER GREEN — RETIREMENT PLAN";
  const drawHeader = (page: number) => { doc.setFillColor(25, 92, 74); doc.rect(0, 0, 210, 22, "F"); doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text(title, 105, 10, { align: "center" }); doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.text("Proposal form • PV 00326975", 105, 16, { align: "center" }); doc.setTextColor(30, 35, 45); doc.setFontSize(9); doc.text(`Proposal No: ${text(data.proposalFormNo)}`, 14, 31); doc.text(`Page ${page} of 2`, 196, 31, { align: "right" }); };
  const section = (y: number, label: string) => { doc.setFillColor(235, 244, 240); doc.setTextColor(25, 92, 74); doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text(label, 14, y); doc.setTextColor(30, 35, 45); return y + 5; };
  drawHeader(1); let y = 40;
  y = section(y, "1. Applicant / Parent / Guardian details");
  autoTable(doc, { startY: y, theme: "grid", styles: { fontSize: 8, cellPadding: 2.5 }, columnStyles: { 0: { fontStyle: "bold", cellWidth: 43 }, 1: { cellWidth: 55 }, 2: { fontStyle: "bold", cellWidth: 43 }, 3: { cellWidth: 55 } }, body: [["Full name", text(data.applicantName), "NIC", text(data.applicantNic)], ["Date of birth", text(data.applicantDob), "Age", text(data.applicantAge)], ["Phone", text(data.applicantPhone), "Email", text(data.applicantEmail)], ["Address", text(data.applicantAddress), "Gender / status", `${text(data.gender)} / ${text(data.maritalStatus)}`], ["Applicant bank", text(data.applicantBankName), "Account no.", text(data.applicantBankAccNo)]] });
  y = (doc as any).lastAutoTable.finalY + 9;
  if (data.planType === "CHILD") { y = section(y, "2. Child details"); autoTable(doc, { startY: y, theme: "grid", styles: { fontSize: 8, cellPadding: 2.5 }, body: [["Child name", text(data.childName), "Date of birth", text(data.childDob)], ["Birth certificate", text(data.childBirthCertNo), "School / grade", `${text(data.childSchool)} / ${text(data.childGrade)}`]] }); y = (doc as any).lastAutoTable.finalY + 9; }
  y = section(y, `${data.planType === "CHILD" ? "3" : "2"}. Plan and payment`);
  autoTable(doc, { startY: y, theme: "grid", styles: { fontSize: 8, cellPadding: 2.5 }, body: [["Plan type", title, "Duration", `${data.duration} years`], ["Payment frequency", text(data.frequency).replace("_", " "), "Premium", rs(data.premium)], ["Retirement age", text(data.retirementAge), "Document charge", rs(data.documentCharge)]] });
  y = (doc as any).lastAutoTable.finalY + 9; y = section(y, "Nominee / beneficiary");
  autoTable(doc, { startY: y, theme: "grid", styles: { fontSize: 8, cellPadding: 2.5 }, body: [["Name", text(data.nomineeName), "NIC", text(data.nomineeNic)], ["Relationship", text(data.nomineeRelationship), "Phone", text(data.nomineePhone)]] });
  y = (doc as any).lastAutoTable.finalY + 9; doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.text("Declaration: I declare that the information provided is true and correct and agree to the terms and conditions of the selected Super Green plan.", 14, y, { maxWidth: 182 }); y += 14; doc.text("Applicant signature: ______________________________", 14, y); doc.text(`Date: ${new Date(data.createdAt).toLocaleDateString()}`, 150, y); y += 12; doc.text("Branch: ______________________________", 14, y); doc.text("Date: __________________", 150, y);
  y += 12; autoTable(doc, { startY: y, theme: "grid", styles: { fontSize: 7, cellPadding: 2 }, head: [["Position", "Name", "Code", "Signature"]], body: [["Financial Advisor", text(data.fa?.name), text(data.fa?.empNo), ""], ["FM", text(data.fm?.name), text(data.fm?.empNo), ""], ["BM", text(data.bm?.name), text(data.bm?.empNo), ""], ["RM", text(data.rm?.name), text(data.rm?.empNo), ""], ["ZM", text(data.zm?.name), text(data.zm?.empNo), ""]] });
  doc.addPage(); drawHeader(2); y = 43; y = section(y, "Financial summary");
  autoTable(doc, { startY: y, theme: "grid", styles: { fontSize: 8, cellPadding: 3 }, head: [["Metric", "Value"]], body: [["Total invested", rs(data.totalInvested)], ["Interest rate", `${data.interestRate}%`], ["Interest earned", rs(data.interestEarned)], ["Document charge", rs(data.documentCharge)], ["Maturity amount", rs(data.maturityAmount)]] });
  y = (doc as any).lastAutoTable.finalY + 12; y = section(y, "Year-by-year growth illustration"); const years = Math.max(1, data.duration); const rows = Array.from({ length: years }, (_, i) => { const invested = data.totalInvested * ((i + 1) / years); const growth = data.interestEarned * ((i + 1) / years); return [`Year ${i + 1}`, rs(invested), rs(growth), rs(invested + growth - (i === years - 1 ? data.documentCharge : 0))]; }); autoTable(doc, { startY: y, theme: "striped", styles: { fontSize: 8, cellPadding: 2.5 }, head: [["Period", "Invested", "Interest", "Projected value"]], body: rows });
  y = (doc as any).lastAutoTable.finalY + 12; y = section(y, "Terms and conditions"); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text(["This page is an ERP financial summary and illustration.", "The printed application form and the company’s approved terms govern the proposal.", "Projected values are based on the saved rate, duration, frequency, and premium."], 14, y, { lineHeightFactor: 1.7 }); y += 22; doc.text("Prepared by: ______________________________", 14, y); doc.text("Authorized signature: ______________________________", 110, y);
  doc.save(`${data.proposalFormNo || "monthly-proposal"}.pdf`);
};
