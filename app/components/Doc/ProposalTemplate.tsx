import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB"); // DD/MM/YYYY
}

function fmtAmount(v?: number | string) {
  if (v === undefined || v === null || v === "") return "";
  return Number(v).toLocaleString("en-LK");
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DotLine — value sits on top of the dotted underline, never crossed by it.
 * The dotted border is on the container; text floats inside above it.
 */
const DotLine = ({
  value,
  flex = 1,
  minW,
}: {
  value?: string;
  flex?: number;
  minW?: string;
}) => (
  <div
    style={{
      flex,
      minWidth: minW,
      borderBottom: "1px dotted #666",
      paddingBottom: "1px",
      minHeight: "14px",
      fontSize: "12px",
      fontFamily: "Arial, Helvetica, sans-serif",
      color: "#000",
      lineHeight: "1.3",
      alignSelf: "flex-end",
    }}
  >
    {value ?? ""}
  </div>
);

/** Standard label + colon + DotLine row */
const Row = ({
  en,
  si,
  value,
  labelWidth = "140px",
}: {
  en: string;
  si: string;
  value?: string;
  labelWidth?: string;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-end",
      gap: "4px",
      marginBottom: "7px",
    }}
  >
    <div style={{ width: labelWidth, flexShrink: 0 }}>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "bold",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#000",
          lineHeight: "1.3",
        }}
      >
        {en}
      </div>
      <div
        style={{
          fontSize: "15px",
          color: "#222",
          lineHeight: "1.2",
          fontFamily: "sans-serif",
        }}
      >
        {si}
      </div>
    </div>
    <span
      style={{
        fontSize: "12px",
        marginBottom: "1px",
        flexShrink: 0,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      :
    </span>
    <DotLine value={value} />
  </div>
);

/** Inline sub-column (for Phone Land/Mobile, DOB/Race/Country, etc.) */
const SubField = ({
  en,
  si,
  value,
  flex = 1,
  ml = "0px",
}: {
  en: string;
  si: string;
  value?: string;
  flex?: number;
  ml?: string;
}) => (
  <div
    style={{
      flex,
      display: "flex",
      flexDirection: "column",
      marginLeft: ml,
      minWidth: 0,
    }}
  >
    <div
      style={{
        fontSize: "12px",
        fontWeight: "bold",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#000",
        lineHeight: "1.3",
      }}
    >
      {en}
    </div>
    <div
      style={{
        fontSize: "15px",
        color: "#222",
        lineHeight: "1.2",
        fontFamily: "sans-serif",
        marginBottom: "2px",
      }}
    >
      {si}
    </div>
    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px" }}>
      <span
        style={{
          fontSize: "12px",
          flexShrink: 0,
          marginBottom: "1px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        :
      </span>
      <DotLine value={value} />
    </div>
  </div>
);

const HR = () => <div style={{ borderTop: "1px solid #000" }} />;

const SectionTitle = ({ en, si }: { en: string; si: string }) => (
  <div
    style={{
      textAlign: "center",
      padding: "4px 0 6px",
      fontSize: "12px",
      fontWeight: "bold",
      fontFamily: "Arial, Helvetica, sans-serif",
      color: "#000",
    }}
  >
    {en} -{" "}
    <span style={{ fontWeight: "normal", fontFamily: "sans-serif" }}>{si}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY HEADER
// ─────────────────────────────────────────────────────────────────────────────

const CompanyHeader = ({
  proposalFormNo,
  refNumber,
}: {
  proposalFormNo?: string;
  refNumber?: string;
}) => (
  <>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "5px",
      }}
    >
      {/* Left: company info */}
      <div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: "bold",
            fontFamily: "Arial, Helvetica, sans-serif",
            color: "#000",
            marginBottom: "4px",
            letterSpacing: "0.01em",
          }}
        >
          SUPER GREEN PLANTATION (PVT) LTD.
        </div>
        <div
          style={{
            fontSize: "12px",
            fontFamily: "Arial, Helvetica, sans-serif",
            color: "#111",
            lineHeight: "1.75",
          }}
        >
          Address : 598/M, Hirimbura Road, Karapitiya, Galle.
          <br />
          Hotline &nbsp;: 076 80 59 312
          <br />
          E-mail &nbsp;&nbsp;: supergreenplantationsgp@gmail.com
          <br />
          Reg. No: PV 00326975
        </div>
      </div>

      {/* Right: logo + P/No */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "6px",
        }}
      >
        <img
          src="/logo.png"
          alt="SGP Logo"
          style={{ width: "72px", height: "78px", objectFit: "contain" }}
        />
        {/* P/No prominent — matches scanned form style */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              color: "#cc0000",
              fontWeight: "bold",
              fontSize: "20px",
              fontFamily: "Arial, Helvetica, sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            {proposalFormNo ?? ""}
          </div>
          <div
            style={{
              fontSize: "9px",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#555",
            }}
          >
            P/No. :{" "}
            <span style={{ borderBottom: "1px dotted #888", paddingBottom: "1px" }}>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
          {refNumber && (
            <div
              style={{
                fontSize: "9px",
                fontFamily: "Arial, Helvetica, sans-serif",
                color: "#555",
                marginTop: "2px",
              }}
            >
              Ref: {refNumber}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Black banner */}
    <div
      style={{
        backgroundColor: "#1a1a1a",
        color: "#fff",
        textAlign: "center",
        padding: "7px 0",
        fontWeight: "bold",
        fontSize: "15px",
        fontFamily: "Arial, Helvetica, sans-serif",
        letterSpacing: "0.04em",
      }}
    >
      PROPOSAL FORM -{" "}
      <span style={{ fontFamily: "sans-serif", fontWeight: "normal" }}>
        යෝජනා පත්‍රය
      </span>
    </div>
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE SHELL
// ─────────────────────────────────────────────────────────────────────────────

const Page = ({ children }: { children: React.ReactNode }) => (
  <div
    data-pdf-page="true"
    style={{
      width: "210mm",
      minHeight: "297mm",
      padding: "6mm 8mm",
      backgroundColor: "#ffffff",
      color: "#000",
      fontFamily: "Arial, Helvetica, sans-serif",
      boxSizing: "border-box",
      fontSize: "12px",
      pageBreakAfter: "always",
      display: "block",
      overflow: "visible",
    }}
  >
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PER-INVESTMENT PAGE 1  (Applicant + Investment details + Beneficiary)
// ─────────────────────────────────────────────────────────────────────────────

const InvestmentPage1 = ({
  applicant,
  investment,
  beneficiary,
  pageLabel,
}: {
  applicant: any;
  investment: any;
  beneficiary: any;
  pageLabel: string;
}) => {
  const a = applicant ?? {};
  const inv = investment ?? {};
  const b = beneficiary ?? {};
  const plan = inv.plan ?? {};

  const investmentDate = fmtDate(inv.investmentDate);
  const investmentRate = inv.investmentRate ?? plan.rate ?? "";
  const monthlyReturn = inv.monthlyHarvest ? fmtAmount(inv.monthlyHarvest) : "";
  const halfYearReturn = inv.monthlyHarvest
    ? fmtAmount(inv.monthlyHarvest * 6)
    : "";
  const yearlyReturn = inv.totalHarvest ? fmtAmount(inv.totalHarvest) : "";

  return (
    <Page>
      <CompanyHeader
        proposalFormNo={a.proposalFormNo}
        refNumber={inv.refNumber}
      />

      {/* ── APPLICANT BOX ── */}
      <div
        style={{
          border: "1px solid #000",
          marginTop: "6px",
        }}
      >
        <SectionTitle
          en="Name of Applicant"
          si="අයදුම්කරුගේ විස්තර"
        />
        <HR />
        <div style={{ padding: "6px 8px 3px" }}>

          {/* Full Name */}
          <Row
            en="Full Name"
            si="සම්පූර්ණ නම"
            value={a.fullName?.toUpperCase()}
          />

          {/* Name with Initials */}
          <Row
            en="Name with initials"
            si="මුලකුරු සමග නම"
            value={a.nameWithInitials}
          />

          <Row en="NIC Number" si="ජා.හැ.අංකය" value={a.nic} />
          <Row
            en="Driving Lsc No."
            si="රියදුරු බලපත්‍ර අංකය"
            value={a.drivingLicense || ""}
          />
          <Row
            en="Passport No"
            si="පාස්පෝ&#x200D;ට් අංකය"
            value={a.passportNo || ""}
          />
          <Row en="Postal address" si="ලිපිනය" value={a.address} />

          {/* Phone: Land + Mobile */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "4px",
              marginBottom: "7px",
            }}
          >
            <div style={{ width: "140px", flexShrink: 0, paddingTop: "2px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  fontFamily: "Arial, Helvetica, sans-serif",
                }}
              >
                Phone number
              </div>
              <div style={{ fontSize: "15px", fontFamily: "sans-serif" }}>
                දුරකථන අංකය
              </div>
            </div>
            <SubField en="Land" si="ස්ථාවර" value={a.phoneLand || ""} />
            <SubField
              en="Mobile"
              si="ජංගම"
              value={a.phoneMobile || ""}
              ml="12px"
            />
          </div>

          <Row
            en="E-mail address"
            si="ඊ මේල් ලිපිනය"
            value={a.email || ""}
          />

          {/* DOB + Race + Country */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "4px",
              marginBottom: "7px",
            }}
          >
            <div style={{ width: "140px", flexShrink: 0, paddingTop: "2px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  fontFamily: "Arial, Helvetica, sans-serif",
                }}
              >
                Date of birth
              </div>
              <div style={{ fontSize: "15px", fontFamily: "sans-serif" }}>
                උපන් දිනය
              </div>
            </div>
            <SubField
              en="Date"
              si="දිනය"
              value={fmtDate(a.dateOfBirth)}
              flex={2}
            />
            <SubField
              en="Race"
              si="ජාතිය"
              value={a.race || ""}
              flex={1}
              ml="12px"
            />
            <SubField
              en="Country"
              si="රට"
              value={a.country || ""}
              flex={1}
              ml="12px"
            />
          </div>

          <Row en="Occupation" si="රැකියාව" value={a.occupation || ""} />

          {/* Date of investment + Investment amount */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "4px",
              marginBottom: "7px",
            }}
          >
            <div style={{ width: "140px", flexShrink: 0, paddingTop: "2px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  fontFamily: "Arial, Helvetica, sans-serif",
                }}
              >
                Date of investment
              </div>
              <div style={{ fontSize: "15px", fontFamily: "sans-serif" }}>
                ආයෝජනය කළ දිනය
              </div>
            </div>
            <SubField en="Date" si="දිනය" value={investmentDate} flex={2} />
            <SubField
              en="Investment amount"
              si="ආයෝජන මුදල"
              value={fmtAmount(inv.amount ?? a.investmentAmount)}
              flex={2}
              ml="12px"
            />
          </div>

          {/* Investment rate */}
          <Row
            en="Investment rate"
            si="ආයෝජන අනුපාතය"
            value={investmentRate ? `${investmentRate}%` : ""}
          />

          {/* Return benefits */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "4px",
              marginBottom: "5px",
            }}
          >
            <div style={{ width: "140px", flexShrink: 0, paddingTop: "2px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  fontFamily: "Arial, Helvetica, sans-serif",
                }}
              >
                Return benefits
              </div>
              <div style={{ fontSize: "15px", fontFamily: "sans-serif" }}>
                ආදායම් ප්‍රතිලාභ
              </div>
            </div>
            <SubField en="Monthly" si="මාසිකව" value={monthlyReturn} />
            <SubField
              en="Half yearly"
              si="අර්ධ වාර්ෂික"
              value={halfYearReturn}
              ml="8px"
            />
            <SubField
              en="Yearly"
              si="වාර්ෂික"
              value={yearlyReturn}
              ml="8px"
            />
          </div>
        </div>
      </div>

      {/* ── BENEFICIARY BOX ── */}
      <div
        style={{ border: "1px solid #000", borderTop: "none" }}
      >
        <SectionTitle
          en="Beneficiary Details"
          si="ප්‍රතිලාභියාගේ විස්තර"
        />
        <HR />
        <div style={{ padding: "6px 8px 4px" }}>
          <Row en="Name" si="නම" value={b.fullName} />

          {/* ID + Phone */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "4px",
              marginBottom: "7px",
            }}
          >
            <div style={{ width: "140px", flexShrink: 0, paddingTop: "2px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  fontFamily: "Arial, Helvetica, sans-serif",
                }}
              >
                ID Number
              </div>
              <div style={{ fontSize: "15px", fontFamily: "sans-serif" }}>
                ජා.හැ.අංකය
              </div>
            </div>
            <SubField en="ID" si="අංකය" value={b.nic} />
            <SubField
              en="Phone Number"
              si="දුරකථන අංකය"
              value={b.phone}
              ml="12px"
            />
          </div>

          {/* Bank A/C + Bank Name */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "4px",
              marginBottom: "7px",
            }}
          >
            <div style={{ width: "140px", flexShrink: 0, paddingTop: "2px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  fontFamily: "Arial, Helvetica, sans-serif",
                }}
              >
                Bank A/C Number
              </div>
              <div style={{ fontSize: "15px", fontFamily: "sans-serif" }}>
                බැංකු ගිණුම් අංකය
              </div>
            </div>
            <SubField
              en="Account No."
              si="ගිණුම් අංකය"
              value={b.accountNo}
            />
            <SubField
              en="Bank Name"
              si="බැංකුවේ නම"
              value={b.bankName}
              ml="12px"
            />
          </div>

          <Row en="Branch" si="ශාඛාව" value={b.bankBranch ?? b.branch} />
          <Row en="Relationship" si="දෙගොත්‍රය" value={b.relationship} />
        </div>
      </div>

      {/* Bottom signature strip — matches scan page 1 bottom */}
      <div
        style={{
          border: "1px solid #000",
          borderTop: "none",
          padding: "6px 8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "20px",
        }}
      >
        {/* Customer signature */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              fontFamily: "Arial, Helvetica, sans-serif",
              marginBottom: "2px",
            }}
          >
            Customer Signature
          </div>
          <div
            style={{ fontSize: "15px", fontFamily: "sans-serif", marginBottom: "4px" }}
          >
            අයදුම්කරුගේ අත්සන
          </div>
          <div
            style={{
              borderBottom: "1px dotted #666",
              minHeight: "40px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {a.signature && (
              <img
                src={a.signature}
                alt="Signature"
                crossOrigin="anonymous"
                style={{
                  maxHeight: "36px",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
            )}
          </div>
        </div>

        {/* Advisor signature */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              fontFamily: "Arial, Helvetica, sans-serif",
              marginBottom: "2px",
            }}
          >
            Signature
          </div>
          <div
            style={{ fontSize: "15px", fontFamily: "sans-serif", marginBottom: "4px" }}
          >
            විකුණුම් උපදේශකගේ අත්සන
          </div>
          <div
            style={{
              borderBottom: "1px dotted #666",
              minHeight: "40px",
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "10px",
          textAlign: "center",
          fontSize: "7.5px",
          color: "#aaa",
          borderTop: "0.5px solid #ddd",
          paddingTop: "5px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        Super Green Plantation (Pvt) Ltd. &nbsp;|&nbsp; {pageLabel} — Page 1 of
        2
      </div>
    </Page>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PER-INVESTMENT PAGE 2  (Nominee + Declaration + Office Use Only)
// ─────────────────────────────────────────────────────────────────────────────

// Shared style tokens for Page 2
const P2 = {
  enLabel: { fontSize: "12px", fontWeight: "bold" as const, fontFamily: "Arial, Helvetica, sans-serif", color: "#000", lineHeight: "1.3" },
  siLabel: { fontSize: "15px", fontFamily: "sans-serif", color: "#222", lineHeight: "1.2" },
  colon:   { fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif", marginBottom: "1px", flexShrink: 0 as const },
};

const InvestmentPage2 = ({
  applicant,
  investment,
  nominee,
  pageLabel,
}: {
  applicant: any;
  investment: any;
  nominee: any;
  pageLabel: string;
}) => {
  const a   = applicant  ?? {};
  const inv = investment ?? {};
  const n   = nominee    ?? {};
  const plan = inv.plan  ?? {};

  // Reusable field row for Page 2 (slightly larger than Page 1)
  const P2Row = ({ en, si, value }: { en: string; si: string; value?: string }) => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", marginBottom: "8px" }}>
      <div style={{ width: "150px", flexShrink: 0 }}>
        <div style={P2.enLabel}>{en}</div>
        <div style={P2.siLabel}>{si}</div>
      </div>
      <span style={P2.colon}>:</span>
      <DotLine value={value} />
    </div>
  );

  const CheckRow = ({ label }: { label: string }) => (
    <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #000" }}>
      <div style={{ flex: 1, padding: "5px 8px", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif" }}>
        {label}
      </div>
      <div style={{ width: "36px", borderLeft: "1px solid #000", alignSelf: "stretch" }} />
    </div>
  );

  return (
    <Page>
      <CompanyHeader proposalFormNo={a.proposalFormNo} refNumber={inv.refNumber} />

      {/* ── NOMINEE BOX ── */}
      <div style={{ border: "1px solid #000", marginTop: "5px" }}>
        <SectionTitle en="Nominee Details" si="නාමිකයාගේ විස්තර" />
        <HR />
        <div style={{ padding: "7px 10px 5px" }}>
          <P2Row en="Full Name"          si="සම්පූර්ණ නම"    value={n.fullName} />
          <P2Row en="Name with initials" si="මුලකුරු සමග නම" value={n.nameWithInitials} />
          <P2Row en="NIC Number"         si="ජා.හැ.අංකය"     value={n.nic} />
          <P2Row en="Postal address"     si="ලිපිනය"          value={n.postalAddress ?? n.permanentAddress} />
          <P2Row en="Relationship"       si="සම්බන්දය"        value={n.relationship} />
          <P2Row en="Phone"              si="දුරකථනය"          value={n.phone} />
        </div>
      </div>

      {/* ── DECLARATION BOX ── */}
      <div style={{ border: "1px solid #000", borderTop: "none", padding: "10px 12px" }}>
        {/* NIC line */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", marginBottom: "6px" }}>
          <span style={{ fontSize: "13px", fontFamily: "sans-serif", whiteSpace: "nowrap" }}>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(ජා.හැ.අ.)
          </span>
          <DotLine value={a.nic} />
        </div>

        {/* Paragraph 1 */}
        <div style={{ fontSize: "13px", fontFamily: "sans-serif", lineHeight: "1.9", color: "#111", marginBottom: "4px" }}>
          වන මා විසින් මෙම යෝජනා පත්‍රය සදා ඔබ ලබා දුන් සියලුම තොරතුරු සත්‍ය වන අතර මා හට මෙහි සැලසුම
        </div>

        {/* Advisor name line */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", marginBottom: "4px" }}>
          <span style={{ fontSize: "13px", fontFamily: "sans-serif", whiteSpace: "nowrap" }}>
            හදන්නාදෙනු විකුණුම් උපදේශක වන
          </span>
          <DotLine />
          <span style={{ fontSize: "13px", fontFamily: "sans-serif", whiteSpace: "nowrap" }}>
            යන ආයු
          </span>
        </div>

        {/* Paragraph 2 */}
        <div style={{ fontSize: "13px", fontFamily: "sans-serif", lineHeight: "1.9", color: "#111", marginBottom: "12px" }}>
          මෙම යෝජනා පත්‍රය සම්පූර්ණ කිරීමට අවසර ලබා දුන් බව සහතික කරමි.
        </div>

        {/* Customer Signature + NIC side by side */}
        <div style={{ display: "flex", gap: "24px" }}>
          {/* Signature */}
          <div style={{ flex: 1 }}>
            <div style={P2.enLabel}>Customer Signature</div>
            <div style={{ ...P2.siLabel, marginBottom: "4px" }}>අයදුම්කරුගේ අත්සන</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
              <span style={P2.colon}>:</span>
              <div style={{
                flex: 1,
                borderBottom: "1px dotted #666",
                minHeight: "46px",
                display: "flex",
                alignItems: "center",
              }}>
                {a.signature && (
                  <img src={a.signature} alt="Signature" crossOrigin="anonymous"
                    style={{ maxHeight: "42px", maxWidth: "100%", objectFit: "contain" }} />
                )}
              </div>
            </div>
          </div>

          {/* NIC Number */}
          <div style={{ flex: 1 }}>
            <div style={P2.enLabel}>NIC Number</div>
            <div style={{ ...P2.siLabel, marginBottom: "4px" }}>ජා.හැ.අංකය</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
              <span style={P2.colon}>:</span>
              <DotLine value={a.nic} />
            </div>
          </div>
        </div>
      </div>

      {/* ── OTHER BOX ── */}
      <div style={{ border: "1px solid #000", borderTop: "none", padding: "7px 10px", minHeight: "56px" }}>
        <div style={{ ...P2.enLabel, fontSize: "13px", marginBottom: "8px" }}>Other</div>
        <DotLine />
        <div style={{ marginTop: "10px" }}><DotLine /></div>
      </div>

  

      {/* Footer */}
      <div style={{
        marginTop: "8px", textAlign: "center", fontSize: "8px", color: "#aaa",
        borderTop: "0.5px solid #ddd", paddingTop: "4px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}>
        This is a computer-generated proposal form issued by Super Green Plantation (Pvt) Ltd.
        &nbsp;|&nbsp; All investments are subject to official terms &amp; conditions.
        &nbsp;|&nbsp; {pageLabel} — Page 2 of 2
      </div>
    </Page>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ProposalTemplate
 *
 * Renders a 2-page pair for EACH investment in data.investments[].
 * Each page pair uses the investment's linked beneficiary and nominee.
 *
 * Props:
 *   data  — the full client object (applicant, investments[], beneficiaries[], nominees[])
 */
export const ProposalTemplate = React.forwardRef(
  ({ data }: { data: any }, ref: any) => {
    const a = data?.applicant ?? {};
    const investments: any[] = data?.investments ?? [];
    const beneficiaries: any[] = data?.beneficiaries ?? [];
    const nominees: any[] = data?.nominees ?? [];

    // Build a lookup map: id → beneficiary / nominee
    const beneficiaryById = Object.fromEntries(
      beneficiaries.map((b: any) => [b.id, b])
    );
    const nomineeById = Object.fromEntries(
      nominees.map((n: any) => [n.id, n])
    );

    return (
      <div ref={ref} style={{ backgroundColor: "#fff", fontFamily: "Arial, Helvetica, sans-serif" }}>
        {investments.map((inv: any, idx: number) => {
          const beneficiary = beneficiaryById[inv.beneficiaryId] ?? {};
          const nominee = nomineeById[inv.nomineeId] ?? {};
          const label =
            investments.length > 1
              ? `Investment ${idx + 1} of ${investments.length} (${inv.refNumber})`
              : inv.refNumber ?? "";

          return (
            <React.Fragment key={inv.id ?? idx}>
              <InvestmentPage1
                applicant={a}
                investment={inv}
                beneficiary={beneficiary}
                pageLabel={label}
              />
              <InvestmentPage2
                applicant={a}
                investment={inv}
                nominee={nominee}
                pageLabel={label}
              />
            </React.Fragment>
          );
        })}
      </div>
    );
  }
);

ProposalTemplate.displayName = "ProposalTemplate";