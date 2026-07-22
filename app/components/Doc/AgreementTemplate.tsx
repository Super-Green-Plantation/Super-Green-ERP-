/**
 * SGP Investment Agreement PDF
 * Usage: place beside ProposalTemplate.tsx in your Doc/ folder
 *
 * AgreementPDF receives an `investment` object (one investment at a time)
 * and the parent `client` data.  The agreement number is derived from
 * the investment's proposalFormNo and investmentDate, matching the format:
 *   YEAR/MONTH/BRANCHCODE/PROPOSALFORMNUMBER
 * e.g. 2026/JULY/MOR/418
 */

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

// ── Register fonts ──────────────────────────────────────────────────────────
// The Sinhala body text in the actual agreement is rendered client-side in the
// browser (not in the PDF), so we keep the PDF in English.  If you later need
// Sinhala, register a Noto Serif Sinhala .ttf here the same way you did for
// the ProposalPDF.
Font.register({
  family: "NotoSans",
  fonts: [
    { src: "/fonts/NotoSans-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/NotoSans-Bold.ttf", fontWeight: 700 },
  ],
});

// ── Helpers ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

/**
 * Derive the agreement number from investmentDate + branchCode + proposalFormNo.
 * branchCode comes from investment.branch?.code or falls back to a passed prop.
 */
export function buildAgreementNumber(
  investmentDate: Date | string,
  branchCode: string,
  proposalFormNo: string | number
): string {
  const d = new Date(investmentDate);
  const year = d.getFullYear();
  const month = MONTH_NAMES[d.getMonth()];
  return `${year}/${month}/${branchCode}/${proposalFormNo}`;
}

// ── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: "NotoSans",
    fontSize: 10,
    color: "#111",
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 50,
    lineHeight: 1.6,
  },

  // ── Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: "#166534",
    paddingBottom: 10,
  },
  companyBlock: { flexDirection: "column" },
  companyName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#166534",
    letterSpacing: 0.5,
  },
  companySubName: {
    fontSize: 8,
    color: "#555",
    marginTop: 1,
    letterSpacing: 0.3,
  },
  agreementNumberBlock: { alignItems: "flex-end" },
  agreementNumberLabel: { fontSize: 7.5, color: "#777", marginBottom: 2 },
  agreementNumber: {
    fontSize: 9,
    fontWeight: 700,
    color: "#166534",
    letterSpacing: 0.4,
  },

  // ── Title
  titleRow: { alignItems: "center", marginBottom: 16 },
  titleUnderline: {
    fontSize: 11,
    fontWeight: 700,
    textDecoration: "underline",
    textAlign: "center",
    marginBottom: 2,
  },
  titleSub: { fontSize: 9.5, textAlign: "center", color: "#333" },

  // ── Body paragraph
  bodyPara: { marginBottom: 10, textAlign: "justify", fontSize: 9.5 },

  // ── Numbered clause list
  clauseRow: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 4,
  },
  clauseNum: { width: 22, fontSize: 9.5, fontWeight: 700, flexShrink: 0 },
  clauseText: { flex: 1, fontSize: 9.5, textAlign: "justify" },

  // ── Highlight value (inline bold)
  bold: { fontWeight: 700 },
  primary: { color: "#166534", fontWeight: 700 },

  // ── Signature block
  sigSection: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sigBlock: { width: "45%" },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    marginTop: 40,
    marginBottom: 4,
  },
  sigLabel: { fontSize: 8, color: "#555" },

  // ── Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: "#aaa" },
});

// ── Types ────────────────────────────────────────────────────────────────────
interface AgreementProps {
  /** Single investment record */
  investment: {
    id: number;
    refNumber: string;
    proposalFormNo: string | number;
    investmentDate: Date | string;
    amount: number | string;
    totalHarvest: number | string;
    monthlyHarvest: number | string;
    plan?: { name?: string; durationMonths?: number; interestRate?: number };
    branch?: { name?: string; code?: string; address?: string };
  };
  /** Parent client / applicant */
  client: {
    applicant: {
      fullName: string;
      nic: string;
      address?: string;
      phoneMobile?: string;
    };
  };
  /** Override branch code if not available on investment.branch */
  branchCode?: string;
}

// ── Component ────────────────────────────────────────────────────────────────
export function AgreementPDF({ investment, client, branchCode }: AgreementProps) {
  const code = investment.branch?.code ?? branchCode ?? "SGP";
  const agreementNo = buildAgreementNumber(
    investment.investmentDate,
    code,
    investment.proposalFormNo
  );

  const investDate = new Date(investment.investmentDate);
  const formattedDate = investDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const principal = Number(investment.amount).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
  });
  const monthly = Number(investment.monthlyHarvest).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
  });
  const totalHarvest = Number(investment.totalHarvest).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
  });
  const totalReturn = (
    Number(investment.totalHarvest) + Number(investment.amount)
  ).toLocaleString("en-LK", { minimumFractionDigits: 2 });

  const duration = investment.plan?.durationMonths ?? 12;
  const rate = investment.plan?.interestRate ?? "—";
  const planName = investment.plan?.name ?? "Fixed Deposit Plan";

  const branchName = investment.branch?.name ?? "Head Office";
  const branchAddress = investment.branch?.address ?? "Galle, Sri Lanka";

  const { fullName, nic, address, phoneMobile } = client.applicant;

  // Maturity date = investmentDate + duration months
  const maturityDate = new Date(investDate);
  maturityDate.setMonth(maturityDate.getMonth() + duration);
  const formattedMaturity = maturityDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const clauses = [
    `This agreement is valid for a period of ${duration} months from ${formattedDate} to ${formattedMaturity}.`,
    `Super Green Plantation (Pvt) Ltd shall pay the investor a monthly harvest of LKR ${monthly} throughout the duration of this agreement.`,
    `The investor shall be entitled to the total harvest amount of LKR ${totalHarvest} at the conclusion of the agreement period, in addition to the return of principal.`,
    `The total amount payable at maturity (principal + total harvest) is LKR ${totalReturn}.`,
    `The investor is required to attend in person or through an authorised representative at the branch office during business hours to receive payments.`,
    `The principal amount of LKR ${principal} must be deposited to the company account at Bank of Ceylon, Account No. 94438011, on or before the investment date.`,
    `In the event the investor wishes to withdraw the investment before maturity, the company shall deduct applicable early-withdrawal charges before settling the balance, and the agreed harvest amounts shall not apply.`,
    `Any disputes arising from this agreement shall be resolved through the company's grievance process, and legal proceedings shall be conducted under the jurisdiction of the Galle District Court.`,
    `Upon maturity, the first party shall settle the full amount to the investor. If the investor wishes to renew the investment, a new agreement shall be executed.`,
  ];

  return (
    <Document title={`Agreement_${agreementNo}`} author="Super Green Plantation (Pvt) Ltd">
      <Page size="A4" style={S.page}>

        {/* ── Header ── */}
        <View style={S.headerRow}>
          <View style={S.companyBlock}>
            <Text style={S.companyName}>SUPER GREEN PLANTATION (PVT) LTD</Text>
            <Text style={S.companySubName}>
              No. 598/M, Karapitiya, Galle · Reg. No. PV 00326975
            </Text>
          </View>
          <View style={S.agreementNumberBlock}>
            <Text style={S.agreementNumberLabel}>Agreement No.</Text>
            <Text style={S.agreementNumber}>{agreementNo}</Text>
          </View>
        </View>

        {/* ── Title ── */}
        <View style={S.titleRow}>
          <Text style={S.titleUnderline}>INVESTMENT AGREEMENT</Text>
          <Text style={S.titleSub}>Between all parties — to be acknowledged</Text>
        </View>

        {/* ── Intro paragraph ── */}
        <Text style={S.bodyPara}>
          This Investment Agreement is entered into on{" "}
          <Text style={S.bold}>{formattedDate}</Text> at the{" "}
          <Text style={S.bold}>{branchName}</Text> branch of Super Green Plantation
          (Pvt) Limited (the "Company"), registered under No.{" "}
          <Text style={S.bold}>PV 00326975</Text>, having its registered office at
          No. 598/M, Karapitiya, Galle, by and between:
        </Text>

        {/* ── First party ── */}
        <View style={{ marginBottom: 10, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: "#166534" }}>
          <Text style={[S.bodyPara, { marginBottom: 2 }]}>
            <Text style={S.bold}>First Party (Company):</Text> Super Green Plantation (Pvt) Ltd,
            represented by its duly authorised officers.
          </Text>
          <Text style={[S.bodyPara, { marginBottom: 0 }]}>
            Branch: <Text style={S.bold}>{branchName}</Text> · {branchAddress}
          </Text>
        </View>

        {/* ── Second party ── */}
        <View style={{ marginBottom: 14, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: "#1e40af" }}>
          <Text style={[S.bodyPara, { marginBottom: 2 }]}>
            <Text style={S.bold}>Second Party (Investor):</Text>
          </Text>
          <Text style={[S.bodyPara, { marginBottom: 2 }]}>
            Name: <Text style={S.bold}>{fullName}</Text>
          </Text>
          <Text style={[S.bodyPara, { marginBottom: 2 }]}>
            NIC: <Text style={S.bold}>{nic}</Text>
            {phoneMobile ? `   ·   Mobile: +94 ${phoneMobile}` : ""}
          </Text>
          {address ? (
            <Text style={[S.bodyPara, { marginBottom: 0 }]}>
              Address: <Text style={S.bold}>{address}</Text>
            </Text>
          ) : null}
        </View>

        {/* ── Investment summary box ── */}
        <View style={{
          backgroundColor: "#f0fdf4",
          borderWidth: 1,
          borderColor: "#166534",
          borderRadius: 4,
          padding: 10,
          marginBottom: 14,
        }}>
          <Text style={{ fontSize: 9, fontWeight: 700, color: "#166534", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>
            Investment Summary · {planName}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {[
              ["Ref. Number", investment.refNumber],
              ["Proposal Form No.", String(investment.proposalFormNo)],
              ["Principal (LKR)", principal],
              ["Monthly Harvest (LKR)", monthly],
              ["Total Harvest (LKR)", totalHarvest],
              ["Total at Maturity (LKR)", totalReturn],
              ["Duration", `${duration} months`],
              ["Rate", `${rate}% p.a.`],
              ["Investment Date", formattedDate],
              ["Maturity Date", formattedMaturity],
            ].map(([label, value]) => (
              <View key={label} style={{ width: "48%", marginBottom: 4 }}>
                <Text style={{ fontSize: 7.5, color: "#555" }}>{label}</Text>
                <Text style={{ fontSize: 9, fontWeight: 700 }}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Clauses ── */}
        <Text style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, color: "#166534" }}>
          Terms and Conditions
        </Text>
        {clauses.map((clause, i) => (
          <View key={i} style={S.clauseRow}>
            <Text style={S.clauseNum}>{i + 1}.</Text>
            <Text style={S.clauseText}>{clause}</Text>
          </View>
        ))}

        {/* ── Signature block ── */}
        <View style={S.sigSection}>
          <View style={S.sigBlock}>
            <View style={S.sigLine} />
            <Text style={{ fontSize: 9, fontWeight: 700 }}>{fullName}</Text>
            <Text style={S.sigLabel}>Second Party — Investor</Text>
            <Text style={[S.sigLabel, { marginTop: 4 }]}>NIC: {nic}</Text>
            <Text style={[S.sigLabel, { marginTop: 2 }]}>Date: ___________________</Text>
          </View>
          <View style={S.sigBlock}>
            <View style={S.sigLine} />
            <Text style={{ fontSize: 9, fontWeight: 700 }}>Authorised Signatory</Text>
            <Text style={S.sigLabel}>Super Green Plantation (Pvt) Ltd</Text>
            <Text style={[S.sigLabel, { marginTop: 4 }]}>Branch: {branchName}</Text>
            <Text style={[S.sigLabel, { marginTop: 2 }]}>Date: ___________________</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>Super Green Plantation (Pvt) Ltd · Reg. PV 00326975</Text>
          <Text style={S.footerText}>Agreement: {agreementNo}</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
}