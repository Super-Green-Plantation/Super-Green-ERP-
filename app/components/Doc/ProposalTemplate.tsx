import React from "react";

// ─── Primitives ─────────────────────────────────────────────────────────────

const DotLine = ({ value, flex = 1 }: { value?: string; flex?: number }) => (
  <div style={{
    flex,
    borderBottom: '1px dotted #555',
    fontSize: '10px',
    color: '#000',
    paddingBottom: '1px',
    minHeight: '13px',
    lineHeight: '1.3',
  }}>
    {value || ''}
  </div>
);

const Row = ({
  en, si, value, labelWidth = '130px',
}: { en: string; si: string; value?: string; labelWidth?: string }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '9px' }}>
    <div style={{ width: labelWidth, flexShrink: 0 }}>
      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#000', lineHeight: '1.3' }}>{en}</div>
      <div style={{ fontSize: '14px', color: '#222', lineHeight: '1.2' }}>{si}</div>
    </div>
    <span style={{ fontSize: '10px', marginBottom: '1px', flexShrink: 0 }}>:</span>
    <DotLine value={value} />
  </div>
);

const HR = () => <div style={{ borderTop: '1px solid #000' }} />;

const SectionTitle = ({ en, si }: { en: string; si: string }) => (
  <div style={{ textAlign: 'center', padding: '4px 0 10px', fontSize: '11px', fontWeight: 'bold', color: '#000' }}>
    {en} - <span style={{ fontWeight: 'normal' }}>{si}</span>
  </div>
);

// Sub-label column used inside inline multi-field rows (Phone, DOB, Returns…)
const SubField = ({
  en, si, value, flex = 1, ml = '0px',
}: { en: string; si: string; value?: string; flex?: number; ml?: string }) => (
  <div style={{ flex, display: 'flex', flexDirection: 'column', marginLeft: ml }}>
    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#000', lineHeight: '1.3' }}>{en}</div>
    <div style={{ fontSize: '14px', color: '#222', lineHeight: '1.2', marginBottom: '2px' }}>{si}</div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
      <span style={{ fontSize: '10px', flexShrink: 0 }}>:</span>
      <DotLine value={value} />
    </div>
  </div>
);

// ─── Shared company header (re-used on both pages) ───────────────────────────

const CompanyHeader = ({ refNumber }: { refNumber?: string }) => (
  <>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
      <div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#000', marginBottom: '4px', letterSpacing: '0.01em' }}>
          SUPER GREEN PLANTATION (PVT) LTD.
        </div>
        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.75' }}>
          Address : 598/M, Hirimbura Road, Karapitiya, Galle.<br />
          Hotline &nbsp;: 076 80 59 312<br />
          E-mail &nbsp;&nbsp;: supergreenplantationsgp@gmail.com<br />
          Reg. No: PV 00326975
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
        <img src="/logo.jpeg" alt="Logo" style={{ width: '75px', height: '82px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
          <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>P/No :</span>
          <span style={{ color: '#cc0000', fontWeight: 'bold', fontSize: '14px' }}>
            {refNumber || '0152'}
          </span>
        </div>
      </div>
    </div>

    <div style={{
      backgroundColor: '#1a1a1a',
      color: '#fff',
      textAlign: 'center',
      padding: '6px 0 20px',
      fontWeight: 'bold',
      fontSize: '13px',
    }}>
      PROPOSAL FORM - යෝජනා පත්‍රය
    </div>
  </>
);

// ─── Page shell ──────────────────────────────────────────────────────────────

const Page = ({ children }: { children: React.ReactNode }) => (
  <div
    data-pdf-page="true"
    style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '10mm 12mm',
      backgroundColor: '#ffffff',
      color: '#000',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box',
      fontSize: '10px',
      pageBreakAfter: 'always',
      display: 'block',
      overflow: 'visible',
    }}
  >
    {children}
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════════

export const ProposalTemplate = React.forwardRef(({ data, plan }: any, ref: any) => {
  const a = data?.applicant ?? {};
  const b = data?.beneficiary ?? {};
  const n = data?.nominee ?? {};

  const investmentDate = a.investmentDate ?? '';
  const investmentRate = a.investmentRate ?? plan?.rate ?? '';
  const monthlyReturn  = a.monthlyReturn  ?? plan?.monthlyReturn  ?? '';
  const halfYearReturn = a.halfYearReturn ?? plan?.halfYearReturn ?? '';
  const yearlyReturn   = a.yearlyReturn   ?? plan?.yearlyReturn   ?? '';

  return (
    <div ref={ref} style={{ backgroundColor: '#fff', fontFamily: 'sans-serif' }}>

      {/* ╔═══════════════════════════════════════════╗
          ║  PAGE 1 — Applicant + Beneficiary        ║
          ╚═══════════════════════════════════════════╝ */}
      <Page>
        <CompanyHeader refNumber={data?.investment?.refNumber} />

        {/* ── APPLICANT BOX ── */}
        <div style={{ border: '1px solid #000', paddingBottom: '10px', marginTop: '6px' }}>
          <SectionTitle en="Name of Applicant" si="අයදුම්කරුගේ විස්තර" />
          <HR />
          <div style={{ padding: '8px 10px 4px' }}>

            {/* Full Name */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '9px' }}>
              <div style={{ width: '130px', flexShrink: 0 }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Full Name</div>
                <div style={{ fontSize: '14px' }}>සම්පූර්ණ නම</div>
              </div>
              <span style={{ fontSize: '10px', marginBottom: '1px' }}>:</span>
              <DotLine value={a.fullName?.toUpperCase()} />
            </div>

            {/* Name with initials */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '9px' }}>
              <div style={{ width: '130px', flexShrink: 0 }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Name with initials</div>
                <div style={{ fontSize: '14px' }}>මුලකුරු සමග නම</div>
              </div>
              <span style={{ fontSize: '10px', marginBottom: '1px' }}>:</span>
              <DotLine value={a.nameWithInitials} />
            </div>

            <Row en="NIC Number"      si="ජා.හැ.අංකය"              value={a.nic} />
            <Row en="Driving Lsc No." si="රියදුරු බලපත්‍ර අංකය"   value={a.drivingLicense} />
            <Row en="Passport No"     si="පාස්පෝ&#x200D;ට් අංකය"  value={a.passportNo} />
            <Row en="Postal address"  si="ලිපිනය"                   value={a.address} />

            {/* Phone: Land + Mobile — stacked labels */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '9px' }}>
              <div style={{ width: '130px', flexShrink: 0, paddingTop: '2px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Phone number</div>
                <div style={{ fontSize: '14px' }}>දුරකථන අංකය</div>
              </div>
              <SubField en="Land"   si="ස්ථාවර" value={a.phoneLand} />
              <SubField en="Mobile" si="ජංගම"   value={a.phoneMobile} ml="12px" />
            </div>

            <Row en="E-mail address" si="ඊ මේල් ලිපිනය" value={a.email} />

            {/* Date of birth + Race + Country — stacked labels */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '9px' }}>
              <div style={{ width: '130px', flexShrink: 0, paddingTop: '2px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Date of birth</div>
                <div style={{ fontSize: '14px' }}>උපන් දිනය</div>
              </div>
              <SubField en="Date"    si="දිනය"   value={a.dateOfBirth} flex={2} />
              <SubField en="Race"    si="ජාතිය"  value={a.race}        flex={1} ml="12px" />
              <SubField en="Country" si="රට"     value={a.country}     flex={1} ml="12px" />
            </div>

            <Row en="Occupation" si="රැකියාව" value={a.occupation} />

            {/* Date of investment + Investment amount — stacked labels */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '9px' }}>
              <div style={{ width: '130px', flexShrink: 0, paddingTop: '2px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Date of investment</div>
                <div style={{ fontSize: '14px' }}>ආයෝජනය කළ දිනය</div>
              </div>
              <SubField en="Date"              si="දිනය"         value={investmentDate}   flex={2} />
              <SubField en="Investment amount" si="ආයෝජන මුදල"  value={a.investmentAmount} flex={2} ml="12px" />
            </div>

            <Row en="Investment rate" si="ආයෝජන අනුපාතය" value={investmentRate} />

            {/* Return benefits — stacked labels */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '4px' }}>
              <div style={{ width: '130px', flexShrink: 0, paddingTop: '2px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Return benefits</div>
                <div style={{ fontSize: '14px' }}>ආදායම් ප්‍රතිලාභ</div>
              </div>
              <SubField en="Monthly"     si="මාසිකව"         value={monthlyReturn}  />
              <SubField en="Half yearly" si="අර්ධ වාර්ෂික"  value={halfYearReturn} ml="8px" />
              <SubField en="Yearly"      si="වාර්ෂික"        value={yearlyReturn}   ml="8px" />
            </div>

          </div>
        </div>

        {/* ── BENEFICIARY BOX ── */}
        <div style={{ border: '1px solid #000', borderTop: 'none', paddingBottom: '10px' }}>
          <SectionTitle en="Beneficiary Details" si="ප්‍රතිලාභියාගේ විස්තර" />
          <HR />
          <div style={{ padding: '8px 10px 4px' }}>

            <Row en="Name" si="නම" value={b.fullName} />

            {/* ID Number + Phone Number — stacked labels */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '9px' }}>
              <div style={{ width: '130px', flexShrink: 0, paddingTop: '2px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>ID Number</div>
                <div style={{ fontSize: '14px' }}>ජා.හැ.අංකය</div>
              </div>
              <SubField en="ID" si="අංකය" value={b.nic} />
              <SubField en="Phone Number" si="දුරකථන අංකය" value={b.phone} ml="12px" />
            </div>

            {/* Bank A/C + Bank Name — stacked labels */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '9px' }}>
              <div style={{ width: '130px', flexShrink: 0, paddingTop: '2px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Bank A/C Number</div>
                <div style={{ fontSize: '14px' }}>බැංකු ගිණුම් අංකය</div>
              </div>
              <SubField en="Account No." si="ගිණුම් අංකය" value={b.accountNo} />
              <SubField en="Bank Name"   si="බැංකුවේ නම"   value={b.bankName}  ml="12px" />
            </div>

            <Row en="Branch"       si="ශාඛාව"     value={b.branch} />
            <Row en="Relationship" si="දෙගොත්‍රය" value={b.relationship} />

          </div>
        </div>

        {/* Page 1 footer */}
        <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '7.5px', color: '#aaa', borderTop: '0.5px solid #ddd', paddingTop: '5px' }}>
          Super Green Plantation (Pvt) Ltd. &nbsp;|&nbsp; Page 1 of 2
        </div>
      </Page>


      {/* ╔═══════════════════════════════════════════╗
          ║  PAGE 2 — Nominee Details                ║
          ╚═══════════════════════════════════════════╝ */}
      <Page>
        <CompanyHeader refNumber={data?.investment?.refNumber} />

        {/* ── NOMINEE BOX — 2 columns ── */}
        <div style={{ border: '1px solid #000', marginTop: '6px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', padding: '5px 10px  10px', borderBottom: '1px solid #000', marginBottom: '10px' }}>
            Nominee Details - නාමිකයාගේ විස්තර
          </div>

          <div style={{ display: 'flex' }}>

            {/* Left: nominee fields */}
            <div style={{ flex: 1, borderRight: '1px solid #000', padding: '10px 10px 8px' }}>
              <Row en="Full Name"          si="සම්පූර්ණ නම"    value={n.fullName} />
              <Row en="Name with initials" si="මුලකුරු සමග නම" value={n.nameWithInitials} />
              <Row en="NIC Number"         si="ජා.හැ.අංකය"      value={n.nic} />
              <Row en="Postal address"     si="ලිපිනය"          value={n.permanentAddress} />
              <Row en="Relationship"       si="සම්බන්දය"       value={n.relationship} />
              <Row en="Phone"              si="දුරකථනය"         value={n.phone} />
            </div>

            {/* Right: declaration + signature */}
            <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Sinhala declaration */}
              <div style={{ fontSize: '12px', color: '#111', lineHeight: '2', marginBottom: '14px' }}>
                <div style={{ marginBottom: '6px' }}>
                  වන මා විසින් මෙම යෝජනා පත්‍රය උපදේශක වන
                </div>
                <div style={{ borderBottom: '1px dotted #555', minHeight: '16px', marginBottom: '8px' }} />
                <div style={{ marginBottom: '6px' }}>
                  හදලාවදුනි විකුණුමි ලබා දුන් සියලුම සැලසුම් ගැන මමෙ
                  යෝජනා පත්‍රය නිවැරදි සහ සම්පූර්ණ බව සහතික කරමි.
                </div>
                <div style={{ borderBottom: '1px dotted #555', minHeight: '16px', marginBottom: '8px' }} />
                <div>
                  මෙම යෝජනා පත්‍රය සම්පූර්ණ කිරීමට ඔබ සහාය කිරීම.
                </div>
              </div>

              {/* NIC reference */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', flexShrink: 0 }}>(ජා.හැ.අ.)</span>
                <DotLine value={a.nic} />
              </div>

              {/* Customer Signature */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Customer Signature</div>
                    <div style={{ fontSize: '14px' }}>අයදුම්කරුගේ අත්සන</div>
                  </div>
                  <div style={{
                    flex: 1,
                    height: '60px',
                    borderBottom: '1px dotted #555',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {a.signature && (
                      <img
                        src={a.signature}
                        alt="Customer Signature"
                        crossOrigin="anonymous"
                        style={{ maxHeight: '56px', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    )}
                  </div>
                </div>

                {/* NIC below signature */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px' }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>NIC Number</div>
                    <div style={{ fontSize: '14px' }}>ජා.හැ.අංකය</div>
                  </div>
                  <span style={{ fontSize: '10px', marginBottom: '1px' }}>:</span>
                  <DotLine value={a.nic} />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Other box */}
        <div style={{ border: '1px solid #000', borderTop: 'none', padding: '8px 10px', minHeight: '70px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px' }}>Other</div>
          <DotLine />
          <div style={{ marginTop: '12px' }}><DotLine /></div>
          <div style={{ marginTop: '12px' }}><DotLine /></div>
        </div>

        {/* Page 2 footer */}
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '7.5px', color: '#aaa', borderTop: '0.5px solid #ddd', paddingTop: '6px' }}>
          This is a computer-generated proposal form issued by Super Green Plantation (Pvt) Ltd. &nbsp;|&nbsp; All investments are subject to official terms &amp; conditions. &nbsp;|&nbsp; Page 2 of 2
        </div>
      </Page>

    </div>
  );
});

ProposalTemplate.displayName = "ProposalTemplate";