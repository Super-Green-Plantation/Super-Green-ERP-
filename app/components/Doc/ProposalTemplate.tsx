/**
 * ProposalTemplate.pdf.tsx
 * @react-pdf/renderer — SGP Proposal Form
 *
 * Exports:
 *   ProposalPDF          — all investments for a client (multi-page)
 *   SingleInvestmentPDF  — one investment only (2-page, for per-row download)
 *
 * Font files required in /public/fonts/:
 *   NotoSansSinhala-Regular.ttf
 *   NotoSansSinhala-Bold.ttf
 *   PlayfairDisplay-Bold.ttf
 */

import React from "react";
import {
  Document, Page, View, Text, Image, Font, StyleSheet,
} from "@react-pdf/renderer";

// ─────────────────────────────────────────────────────────────────────────────
// FONTS
// ─────────────────────────────────────────────────────────────────────────────

Font.register({
  family: "Noto",
  fonts: [
    { src: "/fonts/NotoSansSinhala-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/NotoSansSinhala-Bold.ttf", fontWeight: 700 },
  ],
});

Font.register({
  family: "Playfair",
  fonts: [{ src: "/fonts/PlayfairDisplay-Bold.ttf", fontWeight: 700 }],
});

Font.registerHyphenationCallback((word) => [word]);

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  green900: "#0d2b0d",
  green800: "#1a4a1a",
  green700: "#1e6b1e",
  green600: "#2d7d2d",
  green50: "#f3faf3",
  gold: "#b8860b",
  goldLight: "#fdf6dc",
  ink: "#0a0a0a",
  inkMuted: "#3a3a3a",
  rule: "#b8ccb8",
  white: "#ffffff",
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB");
}

function fmtAmount(v?: number | string) {
  if (v === undefined || v === null || v === "") return "";
  return Number(v).toLocaleString("en-LK");
}

// ─────────────────────────────────────────────────────────────────────────────
// A4 page geometry (in pt: 595.28 × 841.89)
// ─────────────────────────────────────────────────────────────────────────────

const FOOTER_H = 20;   // pt — height reserved for the fixed footer
const H_PAD = 14;      // pt — horizontal page padding

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({

  // ── Page shell ──
  page: {
    size: "A4",
    backgroundColor: C.white,
    fontFamily: "Noto",
    fontSize: 9,
    color: C.ink,
    paddingBottom: FOOTER_H + 8, // Guard against running down under the absolute absolute line
  },

  // ── Fixed page footer ──
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: FOOTER_H,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    borderTop: `0.5 solid ${C.rule}`,
    backgroundColor: C.white,
  },
  footerLeft: { fontSize: 6.5, color: "rgba(0,0,0,0.30)", fontFamily: "Noto" },
  footerRight: { fontSize: 7.5, fontWeight: 700, color: C.green700, fontFamily: "Noto" },

  // ── Header bar ──
  headerBar: {
    backgroundColor: C.green900,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: H_PAD,
  },
  companyName: {
    fontFamily: "Playfair",
    fontWeight: 700,
    fontSize: 14,
    color: C.white,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  companyMeta: {
    fontSize: 10,
    color: "rgba(255,255,255,0.62)",
    lineHeight: 1.5,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  logoImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.white,
    padding: 2,
    objectFit: "contain",
  },
  badgeStack: {
    alignItems: "flex-end",
    marginTop: 3,
  },
  proposalBadge: {
    backgroundColor: C.gold,
    paddingVertical: 1,
    paddingHorizontal: 8,
  },
  proposalBadgeText: {
    fontFamily: "Playfair",
    fontWeight: 700,
    fontSize: 11,
    color: C.green900,
    letterSpacing: 0.8,
  },
  invRefText: {
    fontSize: 6.5,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
    letterSpacing: 0.3,
  },

  // ── Title banner ──
  titleBanner: {
    backgroundColor: C.green700,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 20,
  },
  titleRule: { flex: 1, height: 0.5, backgroundColor: C.gold, opacity: 0.6 },
  titleCenter: { alignItems: "center", paddingHorizontal: 12 },
  titleEn: {
    fontFamily: "Playfair",
    fontWeight: 700,
    fontSize: 14,
    color: C.white,
    letterSpacing: 1.2,
    textAlign: "center",
  },
  titleSi: {
    fontFamily: "Noto",
    fontSize: 8.5,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    marginTop: 1,
  },

  // ── Body ──
  body: {
    paddingHorizontal: H_PAD,
    paddingTop: 6,
    paddingBottom: 4,
  },

  // ── Section box ──
  sectionBox: { border: `0.5 solid ${C.rule}`, marginTop: 6 },
  sectionBoxGold: { border: `0.5 solid ${C.gold}`, marginTop: 6 },

  // ── Section header ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.green50,
    borderBottom: `1.5 solid ${C.green600}`,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  sectionHeaderGold: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.goldLight,
    borderBottom: `1.5 solid ${C.gold}`,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  sectionAccentBar: { width: 3, height: 14, backgroundColor: C.green600, borderRadius: 1, marginRight: 6 },
  sectionAccentBarGold: { width: 3, height: 14, backgroundColor: C.gold, borderRadius: 1, marginRight: 6 },
  sectionTitleEn: { fontFamily: "Playfair", fontWeight: 700, fontSize: 9, color: C.green800, letterSpacing: 0.3 },
  sectionTitleEnGold: { fontFamily: "Playfair", fontWeight: 700, fontSize: 9, color: C.gold, letterSpacing: 0.3 },
  sectionTitleSi: { fontFamily: "Noto", fontSize: 8.5, color: C.inkMuted },

  // ── Field row / cell ──
  fieldRow: { flexDirection: "row" },
  field: {
    flex: 1,
    paddingTop: 3,
    paddingHorizontal: 6,
    paddingBottom: 3,
    minHeight: 36, // Compact spacing down from 42 to prevent page overflow drops
    flexDirection: "column",
    justifyContent: "space-between",
  },
  fieldBorderRight: { borderRight: `0.5 solid ${C.rule}` },
  fieldBorderBottom: { borderBottom: `0.5 solid ${C.rule}` },
  fieldBgGold: { backgroundColor: C.goldLight },

  // ── Field text ──
  labelEn: {
    fontSize: 6.5,
    fontWeight: 700,
    color: C.green700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 0,
    fontFamily: "Noto",
  },
  labelSi: { fontSize: 8.5, color: C.inkMuted, fontFamily: "Noto", marginBottom: 1 },
  valueText: { fontSize: 9, fontWeight: 700, color: C.ink, fontFamily: "Noto", marginBottom: 1, minHeight: 11 },
  valueLine: { height: 0.5, backgroundColor: C.green600, width: "100%" },
  valueLineGold: { height: 0.5, backgroundColor: C.gold, width: "100%" },

  // ── Return benefits ──
  returnRow: {
    flexDirection: "row",
    border: `0.5 solid ${C.rule}`,
    borderTop: "none",
    backgroundColor: C.green50,
  },
  returnItem: { flex: 1, alignItems: "center", paddingVertical: 4, paddingHorizontal: 6, borderRight: `0.5 solid ${C.rule}` },
  returnItemLast: { flex: 1, alignItems: "center", paddingVertical: 4, paddingHorizontal: 6 },
  returnLabelEn: { fontSize: 6.5, fontWeight: 700, color: C.green700, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "Noto", marginBottom: 0 },
  returnLabelSi: { fontSize: 8.5, color: C.inkMuted, fontFamily: "Noto", marginBottom: 1 },
  returnValue: { fontFamily: "Playfair", fontWeight: 700, fontSize: 10, color: C.green800, marginBottom: 1, minHeight: 12 },
  returnLine: { height: 0.5, backgroundColor: C.green600, width: "80%" },

  // ── Signature strip ──
  sigStrip: { flexDirection: "row", backgroundColor: C.green50, border: `0.5 solid ${C.rule}`, borderTop: "none" },
  sigBlock: { flex: 1, padding: "4 8 6 8", borderRight: `0.5 solid ${C.rule}` },
  sigBlockLast: { flex: 1, padding: "4 8 6 8" },
  sigLabelEn: { fontSize: 6.5, fontWeight: 700, color: C.green700, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "Noto" },
  sigLabelSi: { fontSize: 8.5, color: C.inkMuted, fontFamily: "Noto", marginBottom: 3 },
  sigLineArea: { minHeight: 26 },
  sigLine: { height: 0.5, backgroundColor: C.green600, marginTop: 2 },

  // ── Declaration ──
  declarationBox: {
    marginTop: 6,
    border: `0.5 solid ${C.rule}`,
    borderLeft: `2.5 solid ${C.green600}`,
    backgroundColor: C.green50,
    padding: "6 10 8 10",
  },
  declTitleEn: { fontSize: 6.5, fontWeight: 700, color: C.green700, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "Noto" },
  declTitleSi: { fontSize: 8.5, color: C.inkMuted, fontFamily: "Noto", marginBottom: 4 },
  declRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 3 },
  declText: { fontSize: 8.5, color: C.inkMuted, fontFamily: "Noto", lineHeight: 1.6 },
  declUWrap: { flex: 1, minWidth: 80, marginHorizontal: 4 },
  declUValue: { fontSize: 8.5, fontWeight: 700, color: C.ink, fontFamily: "Noto", minHeight: 11, marginBottom: 1 },
  declULine: { height: 0.5, backgroundColor: C.green600 },

  // ── Remarks ──
  remarksBox: { marginTop: 6, border: `0.5 solid ${C.rule}`, padding: "4 8 6 8", minHeight: 40 },
  remarksLabelEn: { fontSize: 6.5, fontWeight: 700, color: C.green700, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "Noto" },
  remarksLabelSi: { fontSize: 8.5, color: C.inkMuted, fontFamily: "Noto", marginBottom: 4 },
  remarksLine: { height: 0.5, backgroundColor: C.rule, marginBottom: 8 },

  // ── Legal text ──
  legalText: {
    fontSize: 6, color: "rgba(0,0,0,0.28)", fontFamily: "Noto",
    textAlign: "center", marginTop: 6,
    paddingTop: 3, borderTop: `0.5 solid ${C.rule}`, lineHeight: 1.4,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const Field = ({
  en, si, value,
  borderRight = true, borderBottom = true,
  flex = 1, gold = false, minHeight,
}: {
  en: string; si: string; value?: string;
  borderRight?: boolean; borderBottom?: boolean;
  flex?: number; gold?: boolean; minHeight?: number;
}) => (
  <View style={[
    S.field,
    borderRight ? S.fieldBorderRight : {},
    borderBottom ? S.fieldBorderBottom : {},
    gold ? S.fieldBgGold : {},
    { flex, ...(minHeight ? { minHeight } : {}) },
  ]}>
    <View>
      <Text style={S.labelEn}>{en}</Text>
      <Text style={S.labelSi}>{si}</Text>
    </View>
    <View>
      <Text style={S.valueText}>{value ?? " "}</Text>
      <View style={gold ? S.valueLineGold : S.valueLine} />
    </View>
  </View>
);

const FieldRow = ({ children }: { children: React.ReactNode }) => (
  <View style={S.fieldRow}>{children}</View>
);

const SectionHeader = ({ en, si, gold = false }: { en: string; si: string; gold?: boolean }) => (
  <View style={gold ? S.sectionHeaderGold : S.sectionHeader}>
    <View style={gold ? S.sectionAccentBarGold : S.sectionAccentBar} />
    <View>
      <Text style={gold ? S.sectionTitleEnGold : S.sectionTitleEn}>{en}</Text>
      <Text style={S.sectionTitleSi}>{si}</Text>
    </View>
  </View>
);

const SectionBox = ({
  en, si, gold = false, children, mt = 6,
}: {
  en: string; si: string; gold?: boolean; children: React.ReactNode; mt?: number;
}) => (
  <View style={[gold ? S.sectionBoxGold : S.sectionBox, { marginTop: mt }]}>
    <SectionHeader en={en} si={si} gold={gold} />
    {children}
  </View>
);

const ReturnBenefits = ({ monthly, halfYearly, yearly }: {
  monthly: string; halfYearly: string; yearly: string;
}) => {
  const Item = ({ labelEn, labelSi, value, last = false }: {
    labelEn: string; labelSi: string; value: string; last?: boolean;
  }) => (
    <View style={last ? S.returnItemLast : S.returnItem}>
      <Text style={S.returnLabelEn}>{labelEn}</Text>
      <Text style={S.returnLabelSi}>{labelSi}</Text>
      <Text style={S.returnValue}>{value || " "}</Text>
      <View style={S.returnLine} />
    </View>
  );
  return (
    <View style={S.returnRow}>
      <Item labelEn="Monthly Return" labelSi="මාසිකව" value={monthly} />
      <Item labelEn="Half Yearly" labelSi="අර්ධ වාර්ෂික" value={halfYearly} />
      <Item labelEn="Yearly Return" labelSi="වාර්ෂිකව" value={yearly} last />
    </View>
  );
};

const SignatureStrip = ({ signature }: { signature?: string }) => (
  <View style={S.sigStrip}>
    <View style={S.sigBlock}>
      <Text style={S.sigLabelEn}>Customer Signature</Text>
      <Text style={S.sigLabelSi}>අයදුම්කරුගේ අත්සන</Text>
      <View style={S.sigLineArea}>
        {signature
          ? <Image src={signature} style={{ maxHeight: 24, objectFit: "contain" }} />
          : null}
      </View>
      <View style={S.sigLine} />
    </View>
    <View style={S.sigBlockLast}>
      <Text style={S.sigLabelEn}>Sales Advisor Signature</Text>
      <Text style={S.sigLabelSi}>විකුණුම් උපදේශකගේ අත්සන</Text>
      <View style={S.sigLineArea} />
      <View style={S.sigLine} />
    </View>
  </View>
);

const DeclUnderline = ({ value, width = 80 }: { value?: string; width?: number }) => (
  <View style={[S.declUWrap, { minWidth: width }]}>
    <Text style={S.declUValue}>{value ?? " "}</Text>
    <View style={S.declULine} />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY HEADER
// ─────────────────────────────────────────────────────────────────────────────

const CompanyHeader = ({
  proposalFormNo, refNumber, pageTitle, pageTitleSi,
}: {
  proposalFormNo?: string; refNumber?: string;
  pageTitle: string; pageTitleSi: string;
}) => (
  <>
    <View style={S.headerBar}>
      <View style={{ flex: 1 }}>
        <Text style={S.companyName}>Super Green Plantation (Pvt) Ltd.</Text>
        <Text style={S.companyMeta}>
          {"598/M, Hirimbura Road, Karapitiya, Galle  ·  Hotline: 076 805 9312 / 0912240814"}
        </Text>
        <Text style={S.companyMeta}>
          {"supergreenplantationsgp@gmail.com  ·  Reg. No: PV 00326975"}
        </Text>
      </View>

      <View style={S.headerRight}>
        <Image src="/logo.png" style={S.logoImg} />
        <View style={S.badgeStack}>
          {proposalFormNo ? (
            <View style={S.proposalBadge}>
              <Text style={S.proposalBadgeText}>{proposalFormNo}</Text>
            </View>
          ) : null}
          {refNumber ? (
            <Text style={S.invRefText}>Ref: {refNumber}</Text>
          ) : null}
        </View>
      </View>
    </View>

    <View style={S.titleBanner}>
      <View style={S.titleRule} />
      <View style={S.titleCenter}>
        <Text style={S.titleEn}>{pageTitle}</Text>
        <Text style={S.titleSi}>{pageTitleSi}</Text>
      </View>
      <View style={S.titleRule} />
    </View>
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// FIXED PAGE FOOTER
// ─────────────────────────────────────────────────────────────────────────────

const PageFooter = ({ label, page }: { label: string; page: string }) => (
  <View style={S.footer} fixed>
    <Text style={S.footerLeft}>
      {`Super Green Plantation (Pvt) Ltd.  |  Investment Proposal  |  ${label}`}
    </Text>
    <Text style={S.footerRight}>{page}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1 — Applicant + Investment + Beneficiary
// ─────────────────────────────────────────────────────────────────────────────

const InvestmentPage1 = ({
  applicant, investment, beneficiary, pageLabel,
}: {
  applicant: any; investment: any; beneficiary: any; pageLabel: string;
}) => {
  const a = applicant ?? {};
  const inv = investment ?? {};
  const b = beneficiary ?? {};
  const plan = inv.plan ?? {};

  const proposalFormNo = inv.proposalFormNo ?? a.proposalFormNo ?? "";
  const refNumber = inv.refNumber ?? "";

  const investmentDate = fmtDate(inv.investmentDate);
  const investmentRate = inv.investmentRate ?? plan.rate ?? "";
  const monthlyReturn = inv.monthlyHarvest ? fmtAmount(inv.monthlyHarvest) : "";
  const halfYearReturn = inv.monthlyHarvest ? fmtAmount(inv.monthlyHarvest * 6) : "";
  const yearlyReturn = inv.totalHarvest ? fmtAmount(inv.totalHarvest) : "";

  return (
    <Page size="A4" style={S.page}>
      <CompanyHeader
        proposalFormNo={proposalFormNo}
        refNumber={refNumber}
        pageTitle="Proposal Form"
        pageTitleSi="යෝජනා පත්‍රය"
      />

      <View style={S.body}>
        {/* ── APPLICANT ── */}
        <SectionBox en="Applicant Details" si="අයදුම්කරුගේ විස්තර" mt={0}>
          <FieldRow>
            <Field en="Full Name" si="සම්පූර්ණ නම"
              value={a.fullName?.toUpperCase()} borderRight={false} />
          </FieldRow>
          <FieldRow>
            <Field en="Name with Initials" si="මුලකුරු සමග නම" value={a.nameWithInitials} flex={1.3} />
            <Field en="NIC Number" si="ජා.හැ.අංකය" value={a.nic} borderRight={false} />
          </FieldRow>
          <FieldRow>
            <Field en="Driving Licence No." si="රියදුරු බලපත්‍ර අංකය" value={a.drivingLicense || ""} />
            <Field en="Passport No." si="පාස්පෝර්ට් අංකය" value={a.passportNo || ""} borderRight={false} />
          </FieldRow>
          <FieldRow>
            <Field en="Postal Address" si="ලිපිනය" value={a.address}
              borderRight={false} minHeight={40} />
          </FieldRow>
          <FieldRow>
            <Field en="Land Phone" si="ස්ථාවර දුරකථනය" value={a.phoneLand || ""} />
            <Field en="Mobile" si="ජංගම දුරකථනය" value={a.phoneMobile || ""} />
            <Field en="E-mail Address" si="ඊ-මේල් ලිපිනය" value={a.email || ""} borderRight={false} />
          </FieldRow>
          <FieldRow>
            <Field en="Date of Birth" si="උපන් දිනය" value={fmtDate(a.dateOfBirth)} flex={1.1} />
            <Field en="Race" si="ජාතිය" value={a.race || ""} />
            <Field en="Country" si="රට" value={a.country || ""} />
            <Field en="Occupation" si="රැකියාව" value={a.occupation || ""}
              borderRight={false} borderBottom={false} />
          </FieldRow>
        </SectionBox>

        {/* ── INVESTMENT ── */}
        <SectionBox en="Investment Details" si="ආයෝජන විස්තර">
          <FieldRow>
            <Field en="Date of Investment" si="ආයෝජනය කළ දිනය" value={investmentDate} />
            <Field en="Investment Amount (Rs.)" si="ආයෝජන මුදල"
              value={fmtAmount(inv.amount ?? a.investmentAmount)} />
            <Field en="Investment Plan" si="ආයෝජන සැලැස්ම" value={plan.name || ""} />
            <Field en="Investment Rate" si="ආයෝජන අනුපාතය"
              value={investmentRate ? `${investmentRate}%` : ""}
              borderRight={false} borderBottom={false} />
          </FieldRow>
        </SectionBox>

        <ReturnBenefits monthly={monthlyReturn} halfYearly={halfYearReturn} yearly={yearlyReturn} />

        {/* ── BENEFICIARY ── */}
        <SectionBox en="Beneficiary Details" si="ප්‍රතිලාභියාගේ විස්තර">
          <FieldRow>
            <Field en="Full Name" si="සම්පූර්ණ නම" value={b.fullName} flex={1.3} />
            <Field en="NIC Number" si="ජා.හැ.අංකය" value={b.nic} borderRight={false} />
          </FieldRow>
          <FieldRow>
            <Field en="Phone Number" si="දුරකථන අංකය" value={b.phone} />
            <Field en="Relationship" si="ඥාතීත්වය" value={b.relationship} />
            <Field en="Bank Branch" si="ශාඛාව" value={b.bankBranch ?? b.branch} borderRight={false} />
          </FieldRow>
          <FieldRow>
            <Field en="Bank A/C Number" si="බැංකු ගිණුම් අංකය" value={b.accountNo} />
            <Field en="Bank Name" si="බැංකුවේ නම" value={b.bankName}
              borderRight={false} borderBottom={false} />
          </FieldRow>
        </SectionBox>

        <SignatureStrip signature={a.signature} />
      </View>

      <PageFooter label={pageLabel} page="Page 1 of 2" />
    </Page>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2 — Nominee + Declaration + Office Use Only
// ─────────────────────────────────────────────────────────────────────────────

const InvestmentPage2 = ({
  applicant, investment, nominee, pageLabel,
}: {
  applicant: any; investment: any; nominee: any; pageLabel: string;
}) => {
  const a = applicant ?? {};
  const inv = investment ?? {};
  const n = nominee ?? {};

  const proposalFormNo = inv.proposalFormNo ?? a.proposalFormNo ?? "";
  const refNumber = inv.refNumber ?? "";

  return (
    <Page size="A4" style={S.page}>
      <CompanyHeader
        proposalFormNo={proposalFormNo}
        refNumber={refNumber}
        pageTitle="Proposal Form — Continued"
        pageTitleSi="යෝජනා පත්‍රය — 2 වන පිටුව"
      />

      <View style={S.body}>
        {/* ── NOMINEE ── */}
        <SectionBox en="Nominee Details" si="නාමිකයාගේ විස්තර" mt={0}>
          <FieldRow>
            <Field en="Full Name" si="සම්පූර්ණ නම" value={n.fullName} borderRight={false} />
          </FieldRow>
          <FieldRow>
            <Field en="Name with Initials" si="මුලකුරු සමග නම" value={n.nameWithInitials} flex={1.3} />
            <Field en="NIC Number" si="ජා.හැ.අංකය" value={n.nic} borderRight={false} />
          </FieldRow>
          <FieldRow>
            <Field en="Postal Address" si="ලිපිනය"
              value={n.postalAddress ?? n.permanentAddress}
              borderRight={false} minHeight={40} />
          </FieldRow>
          <FieldRow>
            <Field en="Relationship" si="ඥාතීත්වය" value={n.relationship} />
            <Field en="Phone Number" si="දුරකථන අංකය" value={n.phone}
              borderRight={false} borderBottom={false} />
          </FieldRow>
        </SectionBox>

        {/* ── DECLARATION ── */}
        <View style={S.declarationBox}>
          <Text style={S.declTitleEn}>Declaration</Text>
          <Text style={S.declTitleSi}>ප්‍රකාශය</Text>

          <View style={S.declRow}>
            <Text style={S.declText}>{"      (ජා.හැ.අ.) "}</Text>
            <DeclUnderline value={a.nic} width={120} />
          </View>

          <Text style={[S.declText, { marginBottom: 2 }]}>
            වන මා විසින් මෙම යෝජනා පත්‍රය සදා ඔබ ලබා දුන් සියලුම තොරතුරු සත්‍ය වන අතර මා හට මෙහි සැලසුම
          </Text>

          <View style={[S.declRow, { marginBottom: 2 }]}>
            <Text style={S.declText}>හදන්නාදෙනු විකුණුම් උපදේශක වන </Text>
            <DeclUnderline width={110} />
            <Text style={S.declText}> යන ආය</Text>
          </View>

          <Text style={[S.declText, { marginBottom: 8 }]}>
            මෙම යෝජනා පත්‍රය සම්පූර්ණ කිරීමට අවසර ලබා දුන් බව සහතික කරමි.
          </Text>

          {/* Sig + NIC */}
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={S.sigLabelEn}>Customer Signature</Text>
              <Text style={S.sigLabelSi}>අයදුම්කරුගේ අත්සන</Text>
              <View style={{ minHeight: 26 }}>
                {a.signature
                  ? <Image src={a.signature} style={{ maxHeight: 24, objectFit: "contain" }} />
                  : null}
              </View>
              <View style={S.sigLine} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.sigLabelEn}>NIC Number</Text>
              <Text style={S.sigLabelSi}>ජා.හැ.අංකය</Text>
              <View style={{ minHeight: 26, justifyContent: "flex-end" }}>
                <Text style={S.valueText}>{a.nic ?? " "}</Text>
              </View>
              <View style={S.sigLine} />
            </View>
          </View>
        </View>

        {/* ── OFFICE USE ONLY ── */}
        <SectionBox en="For Office Use Only" si="කාර්යාල පරිහරණය සඳහා පමණි" gold>
          <FieldRow>
            <Field en="Received By" si="ලැබූ නිලධාරියා" value="" gold />
            <Field en="Date Received" si="ලැබූ දිනය" value="" borderRight={false} gold />
          </FieldRow>
          <FieldRow>
            <Field en="Verified By" si="තහවුරු කළ නිලධාරි" value="" gold />
            <Field en="Approved By" si="අනුමත කළ නිලධාරි" value="" gold />
            <Field en="Branch" si="ශාඛාව" value="" borderRight={false} borderBottom={false} gold />
          </FieldRow>
        </SectionBox>

        {/* ── REMARKS ── */}
        <View style={S.remarksBox}>
          <Text style={S.remarksLabelEn}>Remarks / Other</Text>
          <Text style={S.remarksLabelSi}>වෙනත් සටහන්</Text>
          <View style={S.remarksLine} />
          <View style={S.remarksLine} />
        </View>

        <Text style={S.legalText}>
          {"This is a computer-generated proposal form issued by Super Green Plantation (Pvt) Ltd.  ·  All investments are subject to official terms & conditions."}
        </Text>
      </View>

      <PageFooter label={pageLabel} page="Page 2 of 2" />
    </Page>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED DATA RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

function resolveInvestmentData(data: any) {
  const applicant: any = data?.applicant ?? {};
  const investments: any[] = data?.investments ?? [];
  const beneficiaries: any[] = data?.beneficiaries ?? [];
  const nominees: any[] = data?.nominees ?? [];

  const beneficiaryById = Object.fromEntries(beneficiaries.map((b: any) => [b.id, b]));
  const nomineeById = Object.fromEntries(nominees.map((n: any) => [n.id, n]));

  return { applicant, investments, beneficiaryById, nomineeById };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT 1 — ProposalPDF
// ─────────────────────────────────────────────────────────────────────────────

export const ProposalPDF = ({ data }: { data: any }) => {
  const { applicant, investments, beneficiaryById, nomineeById } =
    resolveInvestmentData(data);

  return (
    <Document
      title={`Proposal - ${applicant.fullName ?? ""}`}
      author="Super Green Plantation (Pvt) Ltd."
      subject="Investment Proposal Form"
      creator="SGP ERP"
    >
      {investments.map((inv: any, idx: number) => {
        const beneficiary = beneficiaryById[inv.beneficiaryId] ?? {};
        const nominee = nomineeById[inv.nomineeId] ?? {};
        const label = investments.length > 1
          ? `${inv.refNumber ?? `Investment ${idx + 1}`}`
          : inv.refNumber ?? "";

        return (
          <React.Fragment key={inv.id ?? idx}>
            <InvestmentPage1 applicant={applicant} investment={inv} beneficiary={beneficiary} pageLabel={label} />
            <InvestmentPage2 applicant={applicant} investment={inv} nominee={nominee} pageLabel={label} />
          </React.Fragment>
        );
      })}
    </Document>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT 2 — SingleInvestmentPDF
// ─────────────────────────────────────────────────────────────────────────────

export const SingleInvestmentPDF = ({
  data,
  investmentId,
}: {
  data: any;
  investmentId: string;
}) => {
  const { applicant, investments, beneficiaryById, nomineeById } =
    resolveInvestmentData(data);

  const inv = investments.find(
    (i: any) => String(i.id) === String(investmentId)
  ) ?? investments[0] ?? {};
  const beneficiary = beneficiaryById[inv.beneficiaryId] ?? {};
  const nominee = nomineeById[inv.nomineeId] ?? {};
  const label = inv.refNumber ?? "";

  return (
    <Document
      title={`Proposal - ${applicant.fullName ?? ""} - ${label}`}
      author="Super Green Plantation (Pvt) Ltd."
      subject="Investment Proposal Form"
      creator="SGP ERP"
    >
      <InvestmentPage1 applicant={applicant} investment={inv} beneficiary={beneficiary} pageLabel={label} />
      <InvestmentPage2 applicant={applicant} investment={inv} nominee={nominee} pageLabel={label} />
    </Document>
  );
};