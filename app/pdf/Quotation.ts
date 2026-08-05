import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Logo loader ──────────────────────────────────────────────────────────────

async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

type PlanType = "CHILD" | "MARGE" | "PENSION";
type PaymentFrequency = "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL";

export interface QuotationPDFData {
  id: string;
  clientName: string;
  clientNic?: string | null;
  clientAge?: number | null;
  planType: PlanType;
  frequency: PaymentFrequency;
  duration: number;
  premium: number;
  retirementAge?: number | null;
  pensionPayoutYears?: number | null;   // ← new
  totalInvested: number;
  interestRate: number;
  interestEarned: number;
  maturityAmount: number;
  notes?: string | null;
  documentCharge?: number;
  createdAt: Date;
  advisorName?: string;
  advisorEmpNo?: string;
  advisorBranch?: string;
}

// ─── Brand Colors ─────────────────────────────────────────────────────────────

const C = {
  green:      [22, 101, 52]   as [number, number, number],
  greenLight: [220, 252, 231] as [number, number, number],
  greenMid:   [74, 222, 128]  as [number, number, number],
  dark:       [17, 24, 39]    as [number, number, number],
  mid:        [75, 85, 99]    as [number, number, number],
  light:      [156, 163, 175] as [number, number, number],
  border:     [229, 231, 235] as [number, number, number],
  bg:         [249, 250, 251] as [number, number, number],
  white:      [255, 255, 255] as [number, number, number],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const lkr = (n: number) =>
  "Rs. " + n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: Date) =>
  new Date(d).toLocaleDateString("en-LK", { year: "numeric", month: "long", day: "numeric" });

const addOneMonth = (d: Date) => {
  const v = new Date(d);
  v.setMonth(v.getMonth() + 1);
  return fmtDate(v);
};

const FREQ_LABELS: Record<PaymentFrequency, string> = {
  MONTHLY:     "Monthly",
  QUARTERLY:   "Quarterly (Every 3 Months)",
  SEMI_ANNUAL: "Semi-Annual (Every 6 Months)",
  ANNUAL:      "Annual (Yearly)",
};

const FREQ_PERIODS: Record<PaymentFrequency, number> = {
  MONTHLY: 12, QUARTERLY: 4, SEMI_ANNUAL: 2, ANNUAL: 1,
};

const PLAN_LABELS: Record<PlanType, string> = {
  CHILD:   "Child Plan (Ran Aswanu)",
  MARGE:   "Marge Plan",
  PENSION: "Pension Plan",
};

function getPayingYears(planType: PlanType, duration: number) {
  if (planType === "CHILD") return 3;
  if (planType === "MARGE") return 5;
  return duration;
}



function generateYearlyBreakdown(data: QuotationPDFData) {
  const periodsPerYear = FREQ_PERIODS[data.frequency];
  const annualDeposit = data.premium * periodsPerYear;
  const payingYears = getPayingYears(data.planType, data.duration);
  const rate = data.interestRate / 100;

  const rows = [];
  let cumulativeInvested = 0;
  let runningBalance = 0;

  for (let year = 1; year <= data.duration; year++) {
    // Add annual contribution during paying years
    if (year <= payingYears) {
      cumulativeInvested += annualDeposit;
      runningBalance += annualDeposit;
    }

    // Calculate compound interest for the year
    const interestForYear = runningBalance * rate;
    runningBalance += interestForYear;

    rows.push([
      `Y${year}`,
      lkr(cumulativeInvested),
      lkr(interestForYear),
      lkr(runningBalance),
    ]);
  }

  return rows;
}

// ─── Plan Conditions (Page 2) ─────────────────────────────────────────────────

const PLAN_CONDITIONS: Record<PlanType, { title: string; conditions: string[]; maturityRates: string[] }> = {
  CHILD: {
    title: "Child Plan (Super Green Ran Aswanu) - Terms & Conditions",
    conditions: [
      "Available durations: 6 Year, 9 Year, and 12 Year plans.",
      "Paying term is 3 years from the start of the plan.",
      "Minimum premiums: Monthly Rs. 15,000 | Quarterly Rs. 50,000 | Semi-Annual Rs. 100,000 | Annual Rs. 200,000.",
      "If payments stop before completing 1 year: 5% interest on invested amount paid after 3 years (monthly & quarterly plans).",
      "If payments stop after completing 1 year: 8% interest on invested amount paid after 3 years (monthly & quarterly plans).",
      "If payments stop after completing 2 years: 10% interest on invested amount paid after 3 years (monthly & quarterly plans).",
      "If investor withdraws after completing 3 years: 12% interest on invested amount.",
      "If investor withdraws after completing 4 years: 15% interest on invested amount.",
      "If investor withdraws after completing 5 years: 21% interest on invested amount.",
    ],
    maturityRates: [
      "After maturity with Monthly payments: 15% interest on invested amount.",
      "After maturity with Quarterly payments: 18% interest on invested amount.",
      "After maturity with Semi-Annual payments: 21% interest on invested amount.",
      "After maturity with Annual payments: 24% interest on invested amount.",
    ],
  },
  MARGE: {
    title: "Marge Plan - Terms & Conditions",
    conditions: [
      "Available durations: 5 Year, 10 Year, and 15 Year plans.",
      "Paying term is 5 years from the start of the plan.",
      "Minimum premiums: Monthly Rs. 15,000 | Quarterly Rs. 50,000 | Semi-Annual Rs. 100,000 | Annual Rs. 200,000.",
      "If payments stop before completing 1 year: 2.5% interest on invested amount paid after 5 years (monthly & quarterly plans).",
      "If payments stop after completing 1 year: 6% interest on invested amount paid after 5 years (monthly & quarterly plans).",
      "If payments stop after completing 2 years: 9% interest on invested amount paid after 5 years (monthly & quarterly plans).",
      "If investor withdraws after completing 4 years: 12% interest on the amount invested after 5 years.",
      "If investor withdraws after completing 5 years: 15% interest on the amount invested.",
      "If investor withdraws after completing 6 years: 21% interest on the amount invested.",
    ],
    maturityRates: [
      "After maturity with Monthly payments: 15% interest on invested amount.",
      "After maturity with Quarterly payments: 18% interest on invested amount.",
      "After maturity with Semi-Annual payments: 21% interest on invested amount.",
      "After maturity with Annual payments: 24% interest on invested amount.",
    ],
  },
  PENSION: {
    title: "Pension Plan - Terms & Conditions",
    conditions: [
      "Age limit: 18 to 50 years. Retirement ages available: 35, 40, 45, 50, and 55.",
      "Investment period: 1 year to 10 years.",
      "Minimum premiums: Monthly Rs. 15,000 | Quarterly Rs. 50,000 | Semi-Annual Rs. 100,000 | Annual Rs. 200,000.",
      "If payments stop before completing 1 year: 2.5% interest on invested amount paid after the required pension year (monthly & quarterly plans).",
      "Monthly & Quarterly interest rates by duration: 1Y=6% | 2Y=9% | 3Y=12% | 4Y=15% | 5Y=18% | 6-10Y=20%.",
      "Semi-Annual & Annual interest rates by duration: 1Y=10% | 2Y=12% | 3Y=15% | 4Y=18% | 5Y=18% | 6-10Y=20%.",
      "Upon maturity, the pension amount is paid monthly over the selected payout term until the full maturity amount is exhausted.",
    ],
    maturityRates: [
      "Pension payout: maturity amount divided equally across all payout months.",
      
    ],
  },
};

// ─── Page 1: Quotation ────────────────────────────────────────────────────────

function drawPage1(doc: jsPDF, data: QuotationPDFData, logo: string | null) {
  const pw = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const refNo = data.id.slice(-6).toUpperCase();
  const payingYears = getPayingYears(data.planType, data.duration);
  const totalPayments = payingYears * FREQ_PERIODS[data.frequency];

  // Pension payout calculations
  const payoutYears = data.pensionPayoutYears ?? 10;
  const payoutMonths = payoutYears * 12;
  const monthlyPension = data.planType === "PENSION" ? data.maturityAmount / payoutMonths : null;

  // Header bar
  doc.setFillColor(...C.green);
  doc.rect(0, 0, pw, 28, "F");

  // Logo
  const logoW = 22, logoH = 22, logoX = 8, logoY = 3;
  if (logo) {
    doc.setFillColor(...C.white);
    doc.roundedRect(logoX - 1, logoY - 1, logoW + 2, logoH + 2, 2, 2, "F");
    doc.addImage(logo, "PNG", logoX, logoY, logoW, logoH);
  }

  // Title
  const textStartX = logo ? logoX + logoW + 6 : 14;
  doc.setTextColor(...C.white);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("INVESTMENT QUOTATION", textStartX, 13);

  // Company
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("Super Green Plantation (Pvt) Ltd.", pw - 8, 11, { align: "right" });
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("supergreenplantation.lk", pw - 8, 18, { align: "right" });

  // Meta strip
  doc.setFillColor(...C.bg);
  doc.rect(0, 28, pw, 13, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text("QUOTATION NO.", 14, 34);
  doc.text("DATE ISSUED", 68, 34);
  doc.text("VALID UNTIL", 130, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.dark);
  doc.text(`#QT-${refNo}`, 14, 40);
  doc.text(fmtDate(data.createdAt), 68, 40);
  doc.text(addOneMonth(data.createdAt), 130, 40);

  // Info boxes
  const boxTop = 46, boxH = 36, colW = (pw - 30) / 2;

  const drawInfoBox = (x: number, headerLabel: string, name: string, lines: string[]) => {
    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.border);
    doc.roundedRect(x, boxTop, colW, boxH, 2, 2, "FD");
    doc.setFillColor(...C.green);
    doc.roundedRect(x, boxTop, colW, 7, 2, 2, "F");
    doc.rect(x, boxTop + 3, colW, 4, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text(headerLabel, x + 5, boxTop + 5.2);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text(name, x + 5, boxTop + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.mid);
    lines.forEach((line, i) => doc.text(line, x + 5, boxTop + 21 + i * 6.5));
  };

  drawInfoBox(14, "QUOTATION FOR", data.clientName, [
    `NIC : ${data.clientNic || "N/A"}`,
    `Age : ${data.clientAge ? `${data.clientAge} yrs` : "N/A"}${
      data.planType === "PENSION" && data.retirementAge ? `  |  Retire @ ${data.retirementAge}` : ""
    }`,
  ]);

  drawInfoBox(14 + colW + 2, "PREPARED BY", data.advisorName || "N/A", [
    `Emp No : ${data.advisorEmpNo || "N/A"}`,
    `Branch : ${data.advisorBranch || "N/A"}`,
  ]);

  let y = boxTop + boxH + 7;

  // Plan details table
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("PLAN DETAILS", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    body: [
      ["Plan Type",           PLAN_LABELS[data.planType]],
      ["Plan Duration",       `${data.duration} Years`],
      ["Paying Term",         `${payingYears} Year${payingYears > 1 ? "s" : ""}`],
      ["Payment Frequency",   FREQ_LABELS[data.frequency]],
      ["Premium per Payment", lkr(data.premium)],
      ["Total Payments",      `${totalPayments} payments over ${payingYears} year${payingYears > 1 ? "s" : ""}`],
      ...(data.planType === "PENSION"
        ? [["Pension Payout Term", `${payoutYears} Year${payoutYears > 1 ? "s" : ""} (${payoutMonths} months)`]]
        : []),
    ],
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 5, right: 5 } },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 52, fillColor: C.bg, textColor: C.mid },
      1: { textColor: C.dark },
    },
    tableLineColor: C.border,
    tableLineWidth: 0.2,
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  // Financial summary
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("FINANCIAL SUMMARY", 14, y);
  y += 3;

  const docCharge = data.documentCharge ?? 500;
  const grossInterest = data.interestEarned + docCharge;

  const finBody: [string, string][] = [
    ["Total Amount Invested", lkr(data.totalInvested)],
    ["Annual Interest Rate",  `${data.interestRate.toFixed(1)}%`],
    ["Gross Interest Earned", lkr(grossInterest)],
    ["Document Charge",       `- ${lkr(docCharge)}`],
    ["Net Interest Earned",   lkr(data.interestEarned)],
  ];

  if (data.planType === "PENSION" && monthlyPension != null) {
    finBody.push([
      `Monthly Pension Payout (${payoutYears}Y / ${payoutMonths} months)`,
      lkr(monthlyPension),
    ]);
  }

  autoTable(doc, {
    startY: y,
    body: finBody,
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 5, right: 5 } },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 52, fillColor: C.bg, textColor: C.mid },
      1: { textColor: C.dark },
    },
    didParseCell: (hook) => {
      if (hook.row.index === 3 && hook.column.index === 1) {
        hook.cell.styles.textColor = [185, 28, 28];
      }
      // Highlight monthly pension row in green
      if (data.planType === "PENSION" && hook.row.index === 5) {
        hook.cell.styles.textColor = C.green;
        hook.cell.styles.fontStyle = "bold";
      }
    },
    tableLineColor: C.border,
    tableLineWidth: 0.2,
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY;

  // Net Maturity highlight bar
  doc.setFillColor(...C.greenLight);
  doc.rect(14, y, pw - 28, 9, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Net Maturity Amount", 19, y + 6);
  doc.text(lkr(data.maturityAmount), pw - 15, y + 6, { align: "right" });
  y += 8; // tight gap after maturity bar

  // Notes
  if (data.notes?.trim()) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text("NOTES", 14, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    const noteLines = doc.splitTextToSize(data.notes.trim(), pw - 28);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 4.2 + 3;
  }

  // Disclaimer — font set before split, tight padding
  doc.setFontSize(7.2);
  doc.setFont("helvetica", "italic");
  const disclaimerText =
    `This quotation is valid for 1 month from the date of issue - from ${fmtDate(data.createdAt)} to ` +
    `${addOneMonth(data.createdAt)}. All figures are estimates based on current plan rates and may be subject ` +
    `to change. This document does not constitute a binding contract. Plan terms and conditions are detailed on Page 2.`;
  const dLines = doc.splitTextToSize(disclaimerText, pw - 36);
  const dH = dLines.length * 4.0 + 5; // 2.5 top + lines + 2.5 bottom
  doc.setFillColor(...C.greenLight);
  doc.setDrawColor(...C.greenMid);
  doc.roundedRect(14, y, pw - 28, dH, 2, 2, "FD");
  doc.setTextColor(...C.green);
  doc.text(dLines, 19, y + 3.5, { lineHeightFactor: 1.05 });
  y += dH + 3;

  // Separator line
  const lX = 14, rX = pw / 2 + 4, lw = 75;
  doc.setDrawColor(...C.border);
  doc.line(14, y, pw - 14, y);
  y += 5;

  // Signature headings
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("CLIENT ACKNOWLEDGEMENT", lX, y);
  doc.text("ADVISOR CONFIRMATION", rX, y);
  y += 6;

  // Name + Date lines
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.mid);
  doc.text("Name : .............................................", lX, y);
  doc.text(`Name : ${data.advisorName || "..........................................."}`, rX, y);
  y += 5.5;
  doc.text("Date : ......... / ......... / ................", lX, y);
  doc.text("Date : ......... / ......... / ................", rX, y);
  y += 9;

  // Signature lines
  doc.setDrawColor(160, 160, 160);
  doc.line(lX, y, lX + lw, y);
  doc.line(rX, y, rX + lw, y);
  y += 4;

  doc.setFontSize(7);
  doc.setTextColor(...C.light);
  doc.text("Signature of Client", lX, y);
  doc.text("Signature of Advisor", rX, y);

  // Footer pinned to bottom
  doc.setFontSize(7);
  doc.setTextColor(...C.light);
  doc.text("Super Green Plantation (Pvt) Ltd.  |  Page 1 of 2", pw / 2, pageH - 3, { align: "center" });
}

// ─── Page 2: Plan Conditions ──────────────────────────────────────────────────

function drawPage2(doc: jsPDF, data: QuotationPDFData, logo: string | null) {
  const pw = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cond = PLAN_CONDITIONS[data.planType];

  // Header bar
  doc.setFillColor(...C.green);
  doc.rect(0, 0, pw, 24, "F");

  const p2LogoW = 18, p2LogoH = 18, p2LogoX = 8, p2LogoY = 3;
  if (logo) {
    doc.setFillColor(...C.white);
    doc.roundedRect(p2LogoX - 1, p2LogoY - 1, p2LogoW + 2, p2LogoH + 2, 2, 2, "F");
    doc.addImage(logo, "PNG", p2LogoX, p2LogoY, p2LogoW, p2LogoH);
  }

  const p2TextX = logo ? p2LogoX + p2LogoW + 6 : 14;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text("PLAN TERMS & CONDITIONS", p2TextX, 15);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(`Ref: #QT-${data.id.slice(-6).toUpperCase()}  |  ${fmtDate(data.createdAt)}`, pw - 8, 15, { align: "right" });

  let y = 32;

  // Plan title
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.green);
  doc.text(cond.title, 14, y);
  y += 9;

  // General conditions
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("General Conditions", 14, y);
  doc.setDrawColor(...C.green);
  doc.line(14, y + 1.5, 60, y + 1.5);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.mid);
  cond.conditions.forEach((line, i) => {
    const text = `${i + 1}.  ${line}`;
    const wrapped = doc.splitTextToSize(text, pw - 32);
    doc.text(wrapped, 18, y);
    y += wrapped.length * 5 + 1.5;
  });

  y += 5;

  // Maturity rates
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Maturity & Payout Rates", 14, y);
  doc.setDrawColor(...C.green);
  doc.line(14, y + 1.5, 66, y + 1.5);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.mid);
  cond.maturityRates.forEach((line) => {
    const wrapped = doc.splitTextToSize(`- ${line}`, pw - 32);
    doc.text(wrapped, 18, y);
    y += wrapped.length * 5 + 1.5;
  });

  y += 8;

  // ── Pension payout breakdown table ──
  if (data.planType === "PENSION") {
    const payoutYears = data.pensionPayoutYears ?? 10;
    const payoutMonths = payoutYears * 12;
    const monthlyPension = data.maturityAmount / payoutMonths;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text("Your Pension Payout Breakdown", 14, y);
    doc.setDrawColor(...C.green);
    doc.line(14, y + 1.5, 80, y + 1.5);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [["Payout Term", "Total Months", "Monthly Pension Amount", "Total Received"]],
      body: [
        [
          `${payoutYears} Year${payoutYears > 1 ? "s" : ""}`,
          `${payoutMonths} months`,
          lkr(monthlyPension),
          lkr(data.maturityAmount),
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: C.green,
        textColor: C.white,
        fontStyle: "bold",
        fontSize: 8,
      },
      styles: { fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 5, right: 5 } },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { fontStyle: "bold", textColor: C.green },
        3: { fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }


  // ─── Year-by-Year Breakdown Table ──────────────────────────────────────────────

doc.setFontSize(8.5);
doc.setFont("helvetica", "bold");
doc.setTextColor(...C.dark);
doc.text("Year-by-Year Growth Schedule", 14, y);
doc.setDrawColor(...C.green);
doc.line(14, y + 1.5, 70, y + 1.5);
y += 5;

const yearlyRows = generateYearlyBreakdown(data);

autoTable(doc, {
  startY: y,
  head: [
    [
      { content: "Year", styles: { halign: "left" } },
      { content: "Cumulative Invested", styles: { halign: "right" } },
      { content: "Interest Earned", styles: { halign: "right" } },
      { content: "Total Balance", styles: { halign: "right" } },
    ],
  ],
  body: yearlyRows,
  theme: "striped",
  headStyles: {
    fillColor: C.green,
    textColor: C.white,
    fontStyle: "bold",
    fontSize: 8,
  },
  styles: {
    fontSize: 8,
    cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
  },
  columnStyles: {
    0: { fontStyle: "bold", halign: "left", cellWidth: 20 },
    1: { halign: "right", cellWidth: 50 },
    2: { halign: "right", cellWidth: 50, textColor: C.green },
    3: { halign: "right", fontStyle: "bold" },
  },
  margin: { left: 14, right: 14 },
});

y = (doc as any).lastAutoTable.finalY + 8;
  // Acceptance
  y += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("I hereby agree to the terms and conditions mentioned above.", 18, y);

  y += 15;
  doc.setLineWidth(0.5);
  doc.line(19, y, 80, y);
  doc.line(pw - 80, y, pw - 19, y);

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Authorized Client Signature", 19, y);
  doc.text("Date", pw - 80, y);

  // Footer
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text("Super Green Plantation (Pvt) Ltd.  |  Page 2 of 2", pw / 2, pageH - 5, { align: "center" });
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export const generateQuotationPDF = async (data: QuotationPDFData) => {
  const logo = await loadLogoBase64();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  drawPage1(doc, data, logo);
  doc.addPage();
  drawPage2(doc, data, logo);
  const fileName = `Quotation_${data.clientName.replace(/\s+/g, "_")}_${data.id.slice(-6).toUpperCase()}.pdf`;
  doc.save(fileName);
};