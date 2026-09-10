import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface MonthlyProposalPDFData {
  id?: number;
  proposalFormNo: string;
  planType: "CHILD" | "MARGE" | "PENSION";
  applicantName: string;
  applicantNic?: string | null;
  applicantDob?: string | null;
  applicantAge?: number | null;
  applicantAddress?: string | null;
  applicantPhone?: string | null;
  applicantEmail?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  applicantBankAccNo?: string | null;
  applicantBankName?: string | null;
  childName?: string | null;
  childDob?: string | null;
  childBirthCertNo?: string | null;
  childSchool?: string | null;
  childGrade?: string | null;
  duration: number;
  retirementAge?: number | null;
  frequency: "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL";
  premium: number;
  totalInvested: number;
  interestRate: number;
  interestEarned: number;
  maturityAmount: number;
  documentCharge: number;
  nomineeName?: string | null;
  nomineeNic?: string | null;
  nomineeRelationship?: string | null;
  nomineePhone?: string | null;
  agentBankAccNo?: string | null;
  agentBankName?: string | null;
  agentBankBranch?: string | null;
  fa?: { name: string; empNo: string } | null;
  fm?: { name: string; empNo: string } | null;
  bm?: { name: string; empNo: string } | null;
  rm?: { name: string; empNo: string } | null;
  zm?: { name: string; empNo: string } | null;
  createdAt: Date | string;
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  green:      [22, 101, 72]  as [number, number, number],
  greenLight: [236, 247, 242] as [number, number, number],
  greenMid:   [52, 138, 103] as [number, number, number],
  ink:        [18, 24, 32]   as [number, number, number],
  dim:        [90, 100, 115] as [number, number, number],
  rule:       [210, 218, 225] as [number, number, number],
  white:      [255, 255, 255] as [number, number, number],
  offwhite:   [249, 251, 250] as [number, number, number],
  gold:       [200, 155, 60] as [number, number, number],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rs   = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const txt  = (v: unknown) => (v == null || v === "") ? "—" : String(v);
const freq = (f: string) => ({ MONTHLY: "Monthly", QUARTERLY: "Quarterly", SEMI_ANNUAL: "Semi-Annual", ANNUAL: "Annual" }[f] ?? f);
const planLabel = (t: string) => ({ CHILD: "Child Plan", MARGE: "Marriage Plan", PENSION: "Retirement Plan" }[t] ?? t);
const fmtDate = (d: unknown) => {
  if (!d) return "—";
  try { return new Date(d as string).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
};

// ─── Page dimensions ──────────────────────────────────────────────────────────
const PW = 210; // A4 width mm
const PH = 297; // A4 height mm
const ML = 14;  // margin left
const MR = 14;  // margin right
const CW = PW - ML - MR; // content width

export const generateMonthlyProposalPDF = async (data: MonthlyProposalPDFData): Promise<void> => {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const TOTAL_PAGES = data.planType === "CHILD" ? 2 : 2;

  // ─── HEADER (shared across pages) ─────────────────────────────────────────
  const drawHeader = (pageNum: number) => {
    // Dark green bar
    doc.setFillColor(...C.green);
    doc.rect(0, 0, PW, 26, "F");

    // Company name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...C.white);
    doc.text("SUPER GREEN PLANTATION (PVT) LTD", ML, 11);

    // Plan type badge (right side)
    const badge = planLabel(data.planType).toUpperCase();
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.gold);
    doc.text(badge, PW - MR, 11, { align: "right" });

    // Sub-line
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(190, 220, 205);
    doc.text("INVESTMENT PROPOSAL — OFFICIAL DOCUMENT", ML, 17.5);
    doc.text("PV 00326975", PW - MR, 17.5, { align: "right" });

    // Thin accent line below header
    doc.setFillColor(...C.greenMid);
    doc.rect(0, 26, PW, 0.6, "F");

    // Reference row (just below header)
    doc.setFillColor(...C.offwhite);
    doc.rect(0, 26.6, PW, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.dim);
    doc.text("PROPOSAL REF", ML, 32.5);
    doc.setTextColor(...C.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(txt(data.proposalFormNo), ML + 24, 32.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.dim);
    doc.text("ISSUE DATE", 85, 32.5);
    doc.setTextColor(...C.ink);
    doc.setFontSize(8.5);
    doc.text(fmtDate(data.createdAt), 85 + 18, 32.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.dim);
    doc.text("DURATION", 140, 32.5);
    doc.setTextColor(...C.ink);
    doc.setFontSize(8.5);
    doc.text(`${txt(data.duration)} Years`, 140 + 17, 32.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.dim);
    doc.text(`PAGE`, PW - MR - 16, 32.5);
    doc.setTextColor(...C.ink);
    doc.setFontSize(8.5);
    doc.text(`${pageNum} / ${TOTAL_PAGES}`, PW - MR, 32.5, { align: "right" });

    // Bottom separator
    doc.setFillColor(...C.rule);
    doc.rect(0, 36.6, PW, 0.3, "F");
  };

  // ─── FOOTER (shared across pages) ─────────────────────────────────────────
  const drawFooter = (pageNum: number) => {
    doc.setFillColor(...C.rule);
    doc.rect(ML, PH - 14, CW, 0.25, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.dim);
    doc.text(
      "This document is computer-generated. The application form and company-approved terms govern the proposal. Projected values are illustrative.",
      ML, PH - 10, { maxWidth: CW - 20 }
    );
    doc.text(`Page ${pageNum}`, PW - MR, PH - 10, { align: "right" });
  };

  // ─── SECTION HEADER ────────────────────────────────────────────────────────
  const sectionHead = (y: number, label: string, number?: string): number => {
    doc.setFillColor(...C.greenLight);
    doc.rect(ML, y, CW, 6, "F");
    doc.setFillColor(...C.green);
    doc.rect(ML, y, 1.2, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.green);
    doc.text((number ? `${number}.  ` : "") + label.toUpperCase(), ML + 3.5, y + 4.1);

    doc.setTextColor(...C.ink);
    return y + 9;
  };

  // ─── TWO-COLUMN KEY/VALUE TABLE ────────────────────────────────────────────
  const kvTable = (startY: number, rows: [string, string, string, string][], opts?: { colWidths?: [number, number, number, number] }) => {
    const [kw1, vw1, kw2, vw2] = opts?.colWidths ?? [36, 50, 36, 60];
    autoTable(doc, {
      startY,
      margin: { left: ML, right: MR },
      tableWidth: CW,
      theme: "plain",
      styles: { fontSize: 7.5, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, textColor: C.ink, lineColor: C.rule, lineWidth: 0.2 },
      columnStyles: {
        0: { fontStyle: "bold", textColor: C.dim, cellWidth: kw1, fillColor: C.offwhite },
        1: { cellWidth: vw1 },
        2: { fontStyle: "bold", textColor: C.dim, cellWidth: kw2, fillColor: C.offwhite },
        3: { cellWidth: vw2 },
      },
      body: rows,
      didParseCell: (data: any) => {
        // Alternating row tint on value columns
        if (data.row.index % 2 === 1 && (data.column.index === 1 || data.column.index === 3)) {
          data.cell.styles.fillColor = [244, 248, 246];
        }
      },
    });
    return (doc as any).lastAutoTable.finalY as number;
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 1
  // ══════════════════════════════════════════════════════════════════════════════
  drawHeader(1);
  let y = 42;

  // ── 1. Applicant ──────────────────────────────────────────────────────────
  y = sectionHead(y, "Applicant / Parent / Guardian Details", "1");
  y = kvTable(y, [
    ["Full Name",    txt(data.applicantName),    "NIC Number",   txt(data.applicantNic)],
    ["Date of Birth", fmtDate(data.applicantDob), "Age",          txt(data.applicantAge)],
    ["Mobile Phone", txt(data.applicantPhone),   "Email",        txt(data.applicantEmail)],
    ["Address",      txt(data.applicantAddress), "Gender / Status", `${txt(data.gender)} / ${txt(data.maritalStatus)}`],
    ["Bank",         txt(data.applicantBankName), "Account No.",  txt(data.applicantBankAccNo)],
  ]);
  y += 6;

  // ── 2. Child Details (conditional) ────────────────────────────────────────
  if (data.planType === "CHILD") {
    y = sectionHead(y, "Child Details", "2");
    y = kvTable(y, [
      ["Child Name",        txt(data.childName),        "Date of Birth", fmtDate(data.childDob)],
      ["Birth Certificate", txt(data.childBirthCertNo), "School / Grade", `${txt(data.childSchool)} / ${txt(data.childGrade)}`],
    ]);
    y += 6;
  }

  const sec3 = data.planType === "CHILD" ? "3" : "2";

  // ── Plan & Payment ─────────────────────────────────────────────────────────
  y = sectionHead(y, "Plan & Payment Details", sec3);
  y = kvTable(y, [
    ["Plan Type",      planLabel(data.planType),   "Duration",        `${data.duration} Years`],
    ["Frequency",      freq(data.frequency),        "Monthly Premium", rs(data.premium)],
    ["Retirement Age", txt(data.retirementAge),     "Document Charge", rs(data.documentCharge)],
  ]);
  y += 6;

  // ── Nominee ────────────────────────────────────────────────────────────────
  const sec4 = data.planType === "CHILD" ? "4" : "3";
  y = sectionHead(y, "Nominee / Beneficiary", sec4);
  y = kvTable(y, [
    ["Full Name",     txt(data.nomineeName),        "NIC Number",   txt(data.nomineeNic)],
    ["Relationship",  txt(data.nomineeRelationship), "Phone",        txt(data.nomineePhone)],
  ]);
  y += 6;

  // ── Agent hierarchy ───────────────────────────────────────────────────────
  const sec5 = data.planType === "CHILD" ? "5" : "4";
  y = sectionHead(y, "Agent Hierarchy & Authorization", sec5);
  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    tableWidth: CW,
    theme: "plain",
    styles: { fontSize: 7.5, cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 }, textColor: C.ink, lineColor: C.rule, lineWidth: 0.2 },
    headStyles: { fillColor: C.green, textColor: C.white, fontStyle: "bold", fontSize: 7, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 } },
    columnStyles: {
      0: { fontStyle: "bold", textColor: C.dim, fillColor: C.offwhite, cellWidth: 40 },
      1: { cellWidth: 60 },
      2: { cellWidth: 28 },
      3: { cellWidth: CW - 128 },
    },
    head: [["Position", "Name", "Code", "Signature"]],
    body: [
      ["Financial Advisor", txt(data.fa?.name), txt(data.fa?.empNo), ""],
      ["Field Manager (FM)", txt(data.fm?.name), txt(data.fm?.empNo), ""],
      ["Branch Manager (BM)", txt(data.bm?.name), txt(data.bm?.empNo), ""],
      ["Regional Manager (RM)", txt(data.rm?.name), txt(data.rm?.empNo), ""],
      ["Zonal Manager (ZM)", txt(data.zm?.name), txt(data.zm?.empNo), ""],
    ],
    didParseCell: (d: any) => {
      if (d.section === "body" && d.row.index % 2 === 0 && d.column.index > 0) {
        d.cell.styles.fillColor = C.white;
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 7;

  // ── Declaration ───────────────────────────────────────────────────────────
  doc.setFillColor(...C.offwhite);
  doc.setDrawColor(...C.rule);
  doc.roundedRect(ML, y, CW, 18, 1, 1, "FD");

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(7);
  doc.setTextColor(...C.dim);
  doc.text("Declaration", ML + 3, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.ink);
  doc.text(
    "I declare that the information provided herein is true and correct to the best of my knowledge and agree to be bound by the\nterms and conditions of the selected Super Green investment plan.",
    ML + 3, y + 8.5
  );

  const sigY = y + 14.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.dim);
  doc.text("Applicant Signature", ML + 3, sigY);
  doc.setDrawColor(...C.dim);
  doc.line(ML + 28, sigY, ML + 75, sigY);
  doc.text("Date", ML + 80, sigY);
  doc.line(ML + 88, sigY, ML + 120, sigY);
  doc.text("Branch", ML + 125, sigY);
  doc.line(ML + 137, sigY, ML + 176, sigY);

  drawFooter(1);

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 2  —  Financial Summary
  // ══════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawHeader(2);
  y = 42;

  // ── Financial Summary ──────────────────────────────────────────────────────
  y = sectionHead(y, "Financial Summary", "I");

  // Summary highlight box
  const boxH = 40;
  doc.setFillColor(...C.green);
  doc.roundedRect(ML, y, CW, boxH, 2, 2, "F");

  const col = CW / 4;
  const items: [string, string][] = [
    ["TOTAL INVESTED",  rs(data.totalInvested)],
    ["INTEREST EARNED", rs(data.interestEarned)],
    ["DOC. CHARGE",     rs(data.documentCharge)],
    ["MATURITY AMOUNT", rs(data.maturityAmount)],
  ];
  items.forEach(([label, val], i) => {
    const cx = ML + col * i + col / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(160, 210, 185);
    doc.text(label, cx, y + 9, { align: "center" });

    // Divider
    if (i > 0) {
      doc.setDrawColor(80, 140, 110);
      doc.setLineWidth(0.3);
      doc.line(ML + col * i, y + 5, ML + col * i, y + boxH - 5);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.white);
    doc.text(val, cx, y + 21, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(160, 210, 185);
    if (i === 1) doc.text(`@ ${data.interestRate}% per annum`, cx, y + 28, { align: "center" });
    if (i === 3) {
      const net = data.maturityAmount - data.documentCharge;
      doc.text(`Net payout: ${rs(net)}`, cx, y + 28, { align: "center" });
    }
  });
  y += boxH + 8;

  // ── Year-by-Year Growth ────────────────────────────────────────────────────
  y = sectionHead(y, "Year-by-Year Growth Illustration", "II");

  const years = Math.max(1, data.duration);
  const growthRows = Array.from({ length: years }, (_, i) => {
    const pct        = (i + 1) / years;
    const invested   = data.totalInvested * pct;
    const interest   = data.interestEarned * pct;
    const isLast     = i === years - 1;
    const projected  = invested + interest - (isLast ? data.documentCharge : 0);
    const gain       = projected - invested;
    return [
      `Year ${i + 1}`,
      rs(invested),
      rs(interest),
      gain >= 0 ? `+${rs(gain)}` : rs(gain),
      rs(projected),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    tableWidth: CW,
    theme: "plain",
    styles: { fontSize: 7.5, cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 }, textColor: C.ink, lineColor: C.rule, lineWidth: 0.2 },
    headStyles: {
      fillColor: C.green,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 7,
      cellPadding: { top: 2.8, bottom: 2.8, left: 3, right: 3 },
    },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: C.offwhite, cellWidth: 22 },
      1: { halign: "right", cellWidth: 36 },
      2: { halign: "right", cellWidth: 36 },
      3: { halign: "right", cellWidth: 36, textColor: C.greenMid, fontStyle: "bold" },
      4: { halign: "right", cellWidth: 42, fontStyle: "bold" },
    },
    head: [["Period", "Invested (Rs.)", "Interest (Rs.)", "Net Gain (Rs.)", "Projected Value (Rs.)"]],
    body: growthRows,
    didParseCell: (d: any) => {
      if (d.section === "body") {
        // Last row = maturity — highlight
        if (d.row.index === growthRows.length - 1) {
          if (d.column.index === 4) {
            d.cell.styles.fillColor = C.greenLight;
            d.cell.styles.textColor = C.green;
          }
          if (d.column.index === 0) {
            d.cell.styles.fillColor = C.greenLight;
            d.cell.styles.textColor = C.green;
          }
        }
        // Alternate rows
        if (d.row.index % 2 === 1 && d.row.index !== growthRows.length - 1) {
          if (d.column.index !== 0) d.cell.styles.fillColor = [244, 248, 246];
        }
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Terms ──────────────────────────────────────────────────────────────────
  y = sectionHead(y, "Important Notes", "III");
  doc.setFillColor(...C.offwhite);
  doc.setDrawColor(...C.rule);
  doc.roundedRect(ML, y, CW, 18, 1, 1, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.dim);
  const notes = [
    "1.  This document is a financial illustration only. The signed application form and company-approved terms govern the proposal.",
    "2.  Projected values are based on the saved rate, duration, payment frequency, and premium at the time of issue.",
    "3.  Actual returns may vary. Early withdrawal may be subject to penalties as per the plan terms.",
  ];
  notes.forEach((note, i) => {
    doc.text(note, ML + 3, y + 5 + i * 4.5);
  });
  y += 24;

  // ── Authorization ──────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.dim);
  doc.text("Prepared by", ML, y);
  doc.setDrawColor(...C.dim);
  doc.line(ML + 20, y, ML + 80, y);
  doc.text("Authorized Signature", ML + 100, y);
  doc.line(ML + 130, y, ML + 182, y);

  drawFooter(2);

  // ── Save ──────────────────────────────────────────────────────────────────
  doc.save(`${data.proposalFormNo || "monthly-proposal"}.pdf`);
};