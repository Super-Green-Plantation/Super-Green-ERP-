import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from "docx";
import * as fs from "fs";
import * as path from "path";

// Color Palette
const COLOR_PRIMARY = "1B4332"; // Deep Emerald Green
const COLOR_SECONDARY = "2D6A4F"; // Forest Green
const COLOR_ACCENT = "40916C"; // Medium Green
const COLOR_BG_LIGHT = "F0FDF4"; // Very soft mint/green tint
const COLOR_MUTED = "475569"; // Slate gray
const COLOR_TEXT = "1E293B"; // Dark slate
const COLOR_BORDER = "CBD5E1"; // Light border
const COLOR_HEADER_BG = "1B4332"; // Table header background

const FONT_PRIMARY = "Segoe UI";
const FONT_SINHALA = "Nirmala UI";

function createHeading1(englishText: string, sinhalaText: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    children: [
      new TextRun({
        text: englishText,
        bold: true,
        size: 32, // 16pt
        color: COLOR_PRIMARY,
        font: FONT_PRIMARY,
      }),
      new TextRun({
        text: ` | ${sinhalaText}`,
        bold: true,
        size: 28, // 14pt
        color: COLOR_SECONDARY,
        font: FONT_SINHALA,
      }),
    ],
  });
}

function createHeading2(englishText: string, sinhalaText: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
    children: [
      new TextRun({
        text: englishText,
        bold: true,
        size: 26, // 13pt
        color: COLOR_SECONDARY,
        font: FONT_PRIMARY,
      }),
      new TextRun({
        text: ` (${sinhalaText})`,
        bold: true,
        size: 24, // 12pt
        color: COLOR_ACCENT,
        font: FONT_SINHALA,
      }),
    ],
  });
}

function createHeading3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 60 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22,
        color: COLOR_PRIMARY,
        font: FONT_PRIMARY,
      }),
    ],
  });
}

function createParagraph(
  englishText: string,
  sinhalaText: string = "",
  options: { bold?: boolean; italic?: boolean } = {}
): Paragraph {
  const children: TextRun[] = [
    new TextRun({
      text: englishText,
      size: 21, // 10.5pt
      color: COLOR_TEXT,
      font: FONT_PRIMARY,
      bold: options.bold,
      italics: options.italic,
    }),
  ];

  if (sinhalaText) {
    children.push(
      new TextRun({
        text: `  [සිංහල: ${sinhalaText}]`,
        size: 20, // 10pt
        color: COLOR_MUTED,
        font: FONT_SINHALA,
      })
    );
  }

  return new Paragraph({
    spacing: { before: 60, after: 100, line: 276 },
    children,
  });
}

function createBullet(englishText: string, sinhalaText: string = ""): Paragraph {
  const children: TextRun[] = [
    new TextRun({
      text: englishText,
      size: 21,
      color: COLOR_TEXT,
      font: FONT_PRIMARY,
    }),
  ];

  if (sinhalaText) {
    children.push(
      new TextRun({
        text: ` — ${sinhalaText}`,
        size: 20,
        color: COLOR_MUTED,
        font: FONT_SINHALA,
      })
    );
  }

  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 60 },
    children,
  });
}

function createCallout(title: string, englishText: string, sinhalaText: string): Table {
  return new Table({
    width: { size: 9500, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9500, type: WidthType.DXA },
            shading: { fill: COLOR_BG_LIGHT },
            margins: { top: 140, bottom: 140, left: 200, right: 200 },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "auto" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
              right: { style: BorderStyle.NONE, size: 0, color: "auto" },
              left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_PRIMARY },
            },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 60 },
                children: [
                  new TextRun({
                    text: `📌 ${title}`,
                    bold: true,
                    size: 22,
                    color: COLOR_PRIMARY,
                    font: FONT_PRIMARY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: englishText,
                    size: 20,
                    color: COLOR_TEXT,
                    font: FONT_PRIMARY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: sinhalaText,
                    size: 20,
                    color: COLOR_MUTED,
                    font: FONT_SINHALA,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createSimpleTable(
  headers: { en: string; si: string; widthPct: number }[],
  rows: string[][]
): Table {
  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: headers.map(
        (h) =>
          new TableCell({
            width: { size: Math.round(9500 * (h.widthPct / 100)), type: WidthType.DXA },
            shading: { fill: COLOR_HEADER_BG },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: h.en,
                    bold: true,
                    size: 20,
                    color: "FFFFFF",
                    font: FONT_PRIMARY,
                  }),
                  new TextRun({
                    text: `\n${h.si}`,
                    bold: true,
                    size: 18,
                    color: "D8F3DC",
                    font: FONT_SINHALA,
                  }),
                ],
              }),
            ],
          })
      ),
    }),
  ];

  rows.forEach((row, rowIndex) => {
    const isEven = rowIndex % 2 === 0;
    tableRows.push(
      new TableRow({
        children: row.map(
          (cellText, colIndex) =>
            new TableCell({
              width: { size: Math.round(9500 * (headers[colIndex].widthPct / 100)), type: WidthType.DXA },
              shading: { fill: isEven ? "FFFFFF" : "F8FAFC" },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText,
                      size: 19,
                      color: COLOR_TEXT,
                      font: FONT_PRIMARY,
                    }),
                  ],
                }),
              ],
            })
        ),
      })
    );
  });

  return new Table({
    width: { size: 9500, type: WidthType.DXA },
    rows: tableRows,
  });
}

async function buildUserManualDocx(): Promise<Document> {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_PRIMARY,
            size: 21,
            color: COLOR_TEXT,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "SUPER GREEN PLANTATIONS ERP — USER MANUAL",
                    size: 16,
                    color: COLOR_MUTED,
                    font: FONT_PRIMARY,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Page ", size: 16, color: COLOR_MUTED }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: COLOR_MUTED,
                  }),
                  new TextRun({ text: " of ", size: 16, color: COLOR_MUTED }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: COLOR_MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ── TITLE COVER BLOCK ───────────────────────────────────────────────
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 100 },
            children: [
              new TextRun({
                text: "SUPER GREEN PLANTATIONS (PVT) LTD",
                bold: true,
                size: 38,
                color: COLOR_PRIMARY,
                font: FONT_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 80 },
            children: [
              new TextRun({
                text: "සුපර් ග්‍රීන් ප්ලාන්ටේෂන්ස් සමාගම",
                bold: true,
                size: 28,
                color: COLOR_SECONDARY,
                font: FONT_SINHALA,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 120 },
            children: [
              new TextRun({
                text: "ENTERPRISE RESOURCE PLANNING (ERP) SYSTEM",
                bold: true,
                size: 30,
                color: COLOR_ACCENT,
                font: FONT_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 300 },
            children: [
              new TextRun({
                text: "පූර්ණ මෙහෙයුම් සහ පරිශීලක මාර්ගෝපදේශය (Comprehensive Operations Manual)",
                size: 24,
                bold: true,
                color: COLOR_TEXT,
                font: FONT_SINHALA,
              }),
            ],
          }),

          createCallout(
            "About This Manual (මෙම අත්පොත පිළිබඳව)",
            "This document is a comprehensive guide designed for all administrative, managerial, and field staff. It is written in a bilingual English & Sinhala mix to ensure maximum clarity on business logic, commissions, targets, and operations.",
            "මෙම අත්පොත පරිපාලන නිලධාරීන්, ශාඛා කළමනාකරුවන්, මානව සම්පත් අංශය සහ ක්ෂේත්‍ර නිලධාරීන් සඳහා සකස් කරන ලද සම්පූර්ණ මගපෙන්වීමකි. ව්‍යාපාරික නීති, කොමිස් ක්‍රමවේද, ඉලක්ක සහ පද්ධති භාවිතය පැහැදිලිව තේරුම් ගැනීම සඳහා ඉංග්‍රීසි සහ සිංහල භාෂා ද්විත්වයම ඇතුලත් කර ඇත."
          ),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // ── SECTION 1: SYSTEM OVERVIEW & ROLES ──────────────────────────────
          createHeading1("1. System Overview & User Roles", "පද්ධතියේ හැඳින්වීම සහ නිලතල"),
          createParagraph(
            "Super Green ERP is an integrated plantation business management platform that automates investor onboarding, hierarchy-based commissions (ORC), monthly proposal collections, payroll processing, and multi-branch network management.",
            "සුපර් ග්‍රීන් ERP යනු ආයෝජන ලියාපදිංචිය, බහු-ස්ථර කොමිස් බෙදාහැරීම (ORC), මාසික යෝජනා කළමනාකරණය, වැටුප් සැකසීම සහ දිවයින පුරා ශාඛා ජාලය පාලනය කරන ඒකාබද්ධ මෘදුකාංග පද්ධතියකි."
          ),

          createHeading2("Role Hierarchy & Access Levels", "පද්ධති නිලතල සහ ප්‍රවේශ බලතල"),
          createSimpleTable(
            [
              { en: "Role Code", si: "නිලතල කේතය", widthPct: 20 },
              { en: "Designation", si: "තනතුර", widthPct: 35 },
              { en: "Key Responsibilities & Access Scope", si: "ප්‍රධාන වගකීම් සහ පද්ධති බලතල", widthPct: 45 },
            ],
            [
              [
                "ADMIN / DEV",
                "System Administrator / Developer\nපද්ධති පරිපාලක",
                "Full access to entire system: branch setup, user creation, settings, raw database records, logs.",
              ],
              [
                "HR",
                "Human Resources Manager\nමානව සම්පත් කළමනාකරු",
                "Full employee management, position salaries, targets configuration, monthly payroll generation & approval, evaluations.",
              ],
              [
                "AGM / ZM",
                "Asst. General Manager / Zonal Manager\nසහකාර සාමාන්‍යාධිකාරී / කලාප කළමනාකරු",
                "Regional & Zonal oversight, multi-branch performance analytics, regional investment review & approval.",
              ],
              [
                "RM",
                "Regional Manager\nප්‍රාදේශීය කළමනාකරු",
                "Supervises designated regional branches and all sub-branches, tracks regional volume targets and member performance.",
              ],
              [
                "BM",
                "Branch Manager\nශාඛා කළමනාකරු",
                "Single branch supervision, client review, investment proposal first-line approvals, branch employee evaluations.",
              ],
              [
                "FM / TL",
                "Field Manager / Team Leader\nක්ෂේත්‍ර කළමනාකරු / කණ්ඩායම් නායක",
                "Leads a group of Field Advisors (FAs), tracks team target volume, receives Upline ORC overriding commissions.",
              ],
              [
                "FA",
                "Field Advisor\nක්ෂේත්‍ර උපදේශක",
                "Direct investor acquisition, proposals entry, client KYC collection, personal commission earners.",
              ],
            ]
          ),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // ── SECTION 2: AUTHENTICATION & SECURITY ────────────────────────────
          createHeading1("2. Login, Security & Sessions", "පද්ධතියට පිවිසීම සහ ආරක්ෂාව"),
          createBullet(
            "Access Portal: Navigate to your ERP URL (e.g. erp.supergreenplantations.com) on Google Chrome or Microsoft Edge.",
            "ERP පිවිසුම් පිටුවට ගොස් ඔබගේ ලියාපදිංචි විද්‍යුත් තැපෑල (Email) සහ මුරපදය (Password) ඇතුලත් කරන්න."
          ),
          createBullet(
            "Session Management: For security, user sessions are managed with Supabase authentication cookies. If idle for a long period, you will be prompted to sign in again.",
            "ආරක්ෂක හේතූන් මත, දිගු වේලාවක් භාවිත නොකළහොත් ඔබගේ ගිණුමෙන් ස්වයංක්‍රීයව ඉවත් වේ (Session timeout)."
          ),
          createBullet(
            "Role Redirect: Upon login, the system automatically redirects you based on your permissions (e.g. Admin/HR -> Executive Dashboard; BM/RM -> Branch View).",
            "පිවිසීමෙන් පසු ඔබගේ තනතුරට අදාල ප්‍රධාන පිටුවට (Dashboard) ස්වයංක්‍රීයව යොමු කරනු ඇත."
          ),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // ── SECTION 3: DASHBOARD & TARGET TRACKING ──────────────────────────
          createHeading1("3. Executive Dashboard & Targets", "ප්‍රධාන පාලක පුවරුව සහ ඉලක්ක"),
          createParagraph(
            "The Dashboard provides an instant snapshot of company health, revenue, monthly targets, and sales trends.",
            "ප්‍රධාන පාලක පුවරුව මගින් ආයෝජන වටිනාකම, ශාඛා කාර්යසාධනය, සාක්ෂාත් කරගත් ඉලක්ක සහ කොමිස් වියදම් එකවර බලාගත හැක."
          ),
          createHeading2("Key Dashboard Metrics", "ප්‍රධාන දර්ශක"),
          createBullet(
            "Total Investments (මුළු ආයෝජන): Total revenue brought by approved investments this month and year-to-date.",
            "මෙම මාසයේ සහ වසරේ අනුමත වූ මුළු ආයෝජන එකතුව."
          ),
          createBullet(
            "Total Profit & Commission Payout: Net operational surplus and total commission payouts disbursed to field staff.",
            "සමාගම් ලාභය සහ ක්ෂේත්‍ර නිලධාරීන්ට ගෙවන ලද මුළු කොමිස් මුදල."
          ),
          createBullet(
            "Incentive Forecast Table (දිරිගැන්වීම් පුරෝකථන වගුව): Lists each advisor with their Monthly Target, Volume Achieved, Achievement %, and Incentive Status (Full Hit, Partial Hit, or Miss).",
            "සෑම උපදේශකයෙකුගේම මාසික ඉලක්කය, ලබාගත් පරිමාව (Volume), සාක්ෂාත් කළ ප්‍රතිශතය සහ ලැබෙන දිරිගැන්වීම් මුදල පෙන්වයි."
          ),
          createBullet(
            "Sales Heatmap & Daily Trends: 7-day visual activity bar showing daily investment volume across branches.",
            "පසුගිය දින 7 තුළ ශාඛා මට්ටමින් සිදු වූ දෛනික ආයෝජන ප්‍රවණතාව."
          ),

          createCallout(
            "Incentive Forecast Status Guide (දිරිගැන්වීම් තත්ව විග්‍රහය)",
            "• Full Hit (>=100%): Achieved complete target -> Eligible for full monthly bonus/incentive.\n• Partial Hit (>=25% for FA): Met the 25% probation hurdle -> Eligible for Rs. 20,000 partial incentive.\n• Miss (<75% / <25%): Below required threshold.\n• No Target: Member has no target configured for their role.",
            "• Full Hit (>=100%): සම්පූර්ණ ඉලක්කය සාක්ෂාත් කර ඇත -> සම්පූර්ණ මාසික දිරිගැන්වීම හිමිවේ.\n• Partial Hit (>=25% - FA පමණි): 25% සීමාව පසුකර ඇත -> රු. 20,000 ක අර්ධ දිරිගැන්වීම හිමිවේ.\n• Miss: අවම සීමාවට වඩා අඩුය.\n• No Target: තනතුරට අදාලව ඉලක්කයක් සකසා නැත."
          ),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // ── SECTION 4: CLIENT ONBOARDING & KYC ──────────────────────────────
          createHeading1("4. Client Registration & KYC Workflow", "නව ගනුදෙනුකරුවන් ලියාපදිංචිය (KYC)"),
          createParagraph(
            "All investors must be formally registered in the ERP before entering any investments or issuing certificates.",
            "ආයෝජන ඇතුලත් කිරීමට හෝ ගිවිසුම් සකස් කිරීමට පෙර සෑම ආයෝජකයෙකුම පද්ධතිය තුළ ලියාපදිංචි කළ යුතුය."
          ),
          createHeading2("Step-by-Step Registration Process", "ලියාපදිංචි කිරීමේ පියවර"),
          createBullet(
            "Step 1: Go to 'Clients' (ගනුදෙනුකරුවන්) -> Click 'New Client' (+ නව ගනුදෙනුකරු).",
            "මෙනුවේ Clients වෙත ගොස් 'New Client' බොත්තම ඔබන්න."
          ),
          createBullet(
            "Step 2: Fill Applicant Information: Full Name, Name with Initials, National Identity Card (NIC / Passport), Permanent Address, Contact Phone Numbers, and Email.",
            "අයදුම්කරුගේ සම්පූර්ණ නම, මුලකුරු සමග නම, ජාතික හැඳුනුම්පත් අංකය (NIC), ලිපිනය, දුරකථන අංක ඇතුලත් කරන්න."
          ),
          createBullet(
            "Step 3: Nominee / Beneficiary Details: Nominee Name, Relationship, NIC, and Contact details. (Crucial for legal plantation agreements).",
            "ප්‍රතිලාභියා / අනුප්‍රාප්තිකයාගේ (Nominee) සම්පූර්ණ නම, ඥාතිත්වය සහ හැඳුනුම්පත් අංකය නිවැරදිව සටහන් කරන්න."
          ),
          createBullet(
            "Step 4: Bank Details: Bank Name, Branch Name, Account Number, and Account Name (Required for future dividend or return transfers).",
            "ප්‍රතිලාභ හෝ ලාභාංශ බැර කිරීමට ගනුදෙනුකරුගේ බැංකු ගිණුම් විස්තර ඇතුලත් කරන්න."
          ),
          createBullet(
            "Step 5: KYC Verification & Document Upload: Upload scanned copy of NIC (Front & Back) and Application Form -> Click 'Submit'.",
            "හැඳුනුම්පතේ දෙපැත්ත ඡායා පිටපත් හෝ ලේඛන Upload කර 'Submit' කරන්න."
          ),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // ── SECTION 5: INVESTMENTS & AGREEMENTS ─────────────────────────────
          createHeading1("5. Investment Proposals & Agreements", "ආයෝජන සහ ගිවිසුම් කළමනාකරණය"),
          createParagraph(
            "Super Green ERP tracks all plantation contracts (Green Gold, Vanilla, Coconut, Timber, etc.) through a multi-tier approval lifecycle.",
            "සුපර් ග්‍රීන් ප්ලාන්ටේෂන්ස් හරහා සිදුකරන සියලුම ආයෝජන (Green Gold, වැනිලා, පොල් ආදී) පද්ධතිය හරහා අනුමත කිරීම සහ අධීක්ෂණය සිදුකෙරේ."
          ),
          createHeading2("Creating a New Investment", "නව ආයෝජනයක් ඇතුලත් කිරීම"),
          createBullet(
            "1. Select Registered Client: Search and choose the client from the database.",
            "ලියාපදිංචි කර ඇති ආයෝජකයා තෝරන්න."
          ),
          createBullet(
            "2. Select Plant Package & Units: Choose the investment package (e.g. Vanilla Vines, Green Gold units, or Custom Acreage).",
            "ආයෝජන පැකේජය සහ ඒකක ගණන (Units / Plants) තෝරන්න."
          ),
          createBullet(
            "3. Enter Investment Amount & Date: Enter the total capital invested (e.g. LKR 1,000,000) and payment receipt date.",
            "මුළු ආයෝජන වටිනාකම (රුපියල්) සහ මුදල් ගෙවූ දිනය ඇතුලත් කරන්න."
          ),
          createBullet(
            "4. Assign Advisor & Hierarchy Chain: Select the Field Advisor (FA) who brought the deal. The system will automatically populate or allow selection of their Upline FM, BM, RM, ZM, AGM, and CCO.",
            "මෙම ආයෝජනය සිදුකළ ක්ෂේත්‍ර උපදේශකවරයා (FA) තෝරන්න. ඒ අනුව ඔහුට ඉහළින් සිටින කණ්ඩායම් නායකයින් (FM, BM, RM) ස්වයංක්‍රීයව සම්බන්ධ වේ."
          ),
          createBullet(
            "5. Approval Workflow: Submitted investments enter PENDING status. The Branch Manager (BM) reviews the payment slip, marks it APPROVED. Upon approval, volume is credited to the advisor's monthly payroll volume.",
            "ඇතුලත් කළ පසු ආයෝජනය PENDING තත්වයේ පවතී. ශාඛා කළමනාකරු (BM) මුදල් රිසිට්පත පරීක්ෂා කර APPROVED කළ පසු එම පරිමාව උපදේශකයාගේ මාසික ප්‍රගතියට එක්වේ."
          ),
          createBullet(
            "6. Download Agreement (.docx / PDF): Click 'Download Agreement' to export the official Sinhala legal contract with auto-populated client, nominee, and plantation unit details.",
            "ආයෝජනය අනුමත වූ පසු 'Download Agreement' මගින් නිල සිංහල නීතිමය ආයෝජන ගිවිසුම Word (.docx) හෝ PDF ලෙස බාගත කර මුද්‍රණය කරගත හැක."
          ),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // ── SECTION 6: MONTHLY PROPOSALS (MP) ───────────────────────────────
          createHeading1("6. Monthly Proposals (MP System)", "මාසික යෝජනා පත්‍ර (Monthly Proposals)"),
          createParagraph(
            "For recurring or installment-based investment plans, the system tracks each monthly proposal installment separately.",
            "මාසික වාරික ක්‍රමයට මුදල් එකතු කරන ආයෝජන සැලසුම් සඳහා මෙම Monthly Proposals අංශය ක්‍රියාත්මක වේ."
          ),
          createBullet(
            "Proposal Form Numbering: Each proposal carries a distinct Proposal Form No. and tracking ID.",
            "සෑම යෝජනාවකටම අනන්‍ය යෝජනා පත්‍ර අංකයක් (Proposal Form No) පවතී."
          ),
          createBullet(
            "Monthly Premium Collections: Monthly installment premiums are entered as they are received. Upon approval, premium volume contributes to the advisor's current month volume.",
            "මාසිකව එකතු වන වාරික මුදල් ඇතුලත් කර අනුමත කළ විට, එම මාසයේ උපදේශකයාගේ ඉලක්ක ප්‍රගතියට (Volume) එම මුදල එකතු වේ."
          ),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // ── SECTION 7: COMMISSIONS & ORC ENGINE ─────────────────────────────
          createHeading1("7. Commissions & ORC Calculation", "කොමිස් සහ ORC බෙදාහැරීමේ ක්‍රමවේදය"),
          createParagraph(
            "Super Green ERP features an automated Month-End Commission Engine that runs idempotently to compute personal, upline, excess, and chairman commissions.",
            "සුපර් ග්‍රීන් පද්ධතිය තුළ සෑම මසකම අවසානයේදී පුද්ගලික කොමිස්, උඩුපෙළ කොමිස් (ORC), අතිරේක කොමිස් (Excess) සහ සභාපති අරමුදල් කොමිස් ස්වයංක්‍රීයව ගණනය කරනු ලැබේ."
          ),

          createHeading2("Commission Categories Breakdown", "කොමිස් වර්ග සහ අනුපාත"),
          createSimpleTable(
            [
              { en: "Commission Type", si: "කොමිස් වර්ගය", widthPct: 22 },
              { en: "Beneficiary Role", si: "හිමිවන නිලධාරියා", widthPct: 23 },
              { en: "Percentage / Rule", si: "ප්‍රතිශතය සහ නීතිය", widthPct: 55 },
            ],
            [
              [
                "Personal Commission\n(පුද්ගලික කොමිස්)",
                "Field Advisor (FA)\nක්ෂේත්‍ර උපදේශක",
                "Probation: High Rate = 10%, Low Rate = 7%.\nPermanent: High Rate = 8%, Low Rate = 5%.\n(Threshold: LKR 500,000 monthly volume).",
              ],
              [
                "Upline ORC\n(Overriding Commission)",
                "FM, BM, RM, ZM, AGM, CCO\nකණ්ඩායම් නායකයින්",
                "Calculated based on hierarchical ORC scale assigned in Position settings for each management tier.",
              ],
              [
                "Excess Commission\n(අතිරේක කොමිස්)",
                "Marketing Staff achieving > Target",
                "Fixed at 0.5% (0.005) or after-6-month excess rate on every rupee brought ABOVE the monthly target hurdle.",
              ],
              [
                "Chairman Fund\n(සභාපති අරමුදල)",
                "Company Pool / Key Executives",
                "Company-wide 0.2% (0.002) allocation on approved total investment volume.",
              ],
            ]
          ),

          createCallout(
            "Idempotent Month-End Runner Rule (මාසික කොමිස් සැකසීමේ නීතිය)",
            "Commissions are calculated once at month-end per branch. If commissions have already been processed for that branch and month, the runner will safely return existing records without duplicate double-counting.",
            "එක් එක් ශාඛාව සඳහා මාසික කොමිස් ගණනය කරන්නේ එක් වරක් පමණි. කිසියම් ශාඛාවක එම මාසය සඳහා කොමිස් සකසා ඇත්නම්, නැවත run කළද දෙවරක් ගණනය නොවී පවතින වාර්තා සුරක්ෂිතව පවත්වා ගනී (Idempotent)."
          ),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // ── SECTION 8: HR, PAYROLL & ALLOWANCES ─────────────────────────────
          createHeading1("8. HR Operations, Payroll & Allowances", "මානව සම්පත්, වැටුප් සහ දීමනා සැකසීම"),
          createParagraph(
            "The system supports two distinct payroll tracks: Marketing Track (Performance & Target-driven) and Head Office Track (Fixed Base Salary + Executive Allowances).",
            "පද්ධතිය තුළ වැටුප් ක්‍රමවේද දෙකක් පවතී: අලෙවි අංශය (Marketing Track - ඉලක්ක සහ දක්ෂතාව මත) සහ ප්‍රධාන කාර්යාල කාර්ය මණ්ඩලය (Head Office Track - මූලික වැටුප් සහ දීමනා මත)."
          ),

          createHeading2("Marketing Track Target Hierarchy", "අලෙවි අංශයේ ඉලක්ක තීරණය කිරීමේ අනුපිළිවෙල"),
          createBullet(
            "1. Probation Period (Months 1–6): Uses configured PositionTarget tiers based on join date. Month 1–3 = Period 1 targets; Month 4–6 = Period 2 targets.",
            "පළමු මාස 6 (Probation): බැඳුණු දිනය අනුව 1 සහ 2 කාලසීමාවන්ගේ මාසික ඉලක්ක ක්‍රියාත්මක වේ."
          ),
          createBullet(
            "2. Permanent Track (Past 6 Months): Once past probation, uses PositionSalary monthlyTarget (e.g. Field Advisor = LKR 2,500,000; Team Leader = LKR 3,000,000; Branch Manager = LKR 8,000,000).",
            "ස්ථීර සේවකයින් (මාස 6 පසු වූ පසු): තනතුරට අදාල ස්ථීර මාසික ඉලක්කය (Position Salary Target) ක්‍රියාත්මක වේ (උදා: FA = රු. 25 ලක්ෂය, BM = රු. 80 ලක්ෂය)."
          ),

          createHeading2("Marketing Allowances & Conditions", "දීමනා සහ සුදුසුකම් සපුරාලීමේ නීති"),
          createSimpleTable(
            [
              { en: "Allowance Name", si: "දීමනාවේ නම", widthPct: 25 },
              { en: "Typical Amount", si: "මුදල", widthPct: 20 },
              { en: "Qualification Criteria", si: "සුදුසුකම් ලැබීමේ කොන්දේසිය", widthPct: 55 },
            ],
            [
              [
                "Basic/Full Incentive\n(මූලික දිරිගැන්වීම)",
                "Varies (Rs. 20K - 100K+)",
                "Full Incentive: Requires 100% target volume hit.\nPartial Incentive (FA): Requires >= 25% target hurdle.",
              ],
              [
                "Vehicle Allowance\n(වාහන දීමනාව)",
                "LKR 15,000 - 35,000",
                "Volume must reach vehicleThresholdPct (e.g. 75% or 100% of target) as configured in position settings.",
              ],
              [
                "Team Activation\n(කණ්ඩායම් සක්‍රීය දීමනාව)",
                "LKR 15,000 - 25,000",
                "Manager must maintain minimum required active bringing advisors (minActiveAdvisors) with investment deals in that month.",
              ],
              [
                "Salary Advance Deduction\n(අත්තිකාරම් කැපීම්)",
                "Auto-calculated",
                "System automatically checks pending advance balances and deducts approved amounts from net salary.",
              ],
            ]
          ),

          createHeading2("Payroll Processing Steps for HR", "HR අංශය වැටුප් සකස් කරන පියවර"),
          createBullet(
            "Step 1: Go to 'HR' -> 'Payroll' (වැටුප් පිටුවට පිවිසෙන්න).",
            "මෙනුවේ HR -> Payroll වෙත යන්න."
          ),
          createBullet(
            "Step 2: Select the Branch, Year, and Month to evaluate.",
            "අදාල ශාඛාව, වර්ෂය සහ මාසය තෝරන්න."
          ),
          createBullet(
            "Step 3: Click 'Generate Preview' to inspect all member target progress, commissions earned, and allowances.",
            "'Generate Preview' ඔබා සියලුම සේවකයින්ගේ කොමිස්, දීමනා සහ ඉලක්ක පෙරදසුන පරීක්ෂා කරන්න."
          ),
          createBullet(
            "Step 4: Click 'Run Monthly Payroll' to finalize and commit the payroll records into the database.",
            "'Run Monthly Payroll' ඔබා වැටුප් වාර්තා ස්ථීර කර පද්ධතියට ඇතුලත් කරන්න."
          ),
          createBullet(
            "Step 5: Export to Excel/CSV or print individual Pay Sheets for employees.",
            "සියලුම වැටුප් ලේඛන Excel ගොනුවක් ලෙස බාගත කරගන්න හෝ තනි තනි වැටුප් පත්‍රිකා මුද්‍රණය කරන්න."
          ),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // ── SECTION 9: PERFORMANCE EVALUATIONS ──────────────────────────────
          createHeading1("9. Employee Evaluations & Promotions", "සේවක ඇගයීම් සහ උසස්වීම්"),
          createParagraph(
            "Super Green ERP incorporates a structured evaluation engine for employees completing their initial 6-month probation.",
            "මූලික මාස 6 ක පරිවාස කාලය (Probation) අවසන් කරන සේවකයින්ගේ කාර්යසාධනය පරීක්ෂා කර ස්ථීර කිරීම හෝ උසස්වීම් ලබාදීම මෙම අංශයෙන් සිදුකෙරේ."
          ),
          createBullet(
            "Automatic Milestone Alerts: When an employee completes months 3 and 6, the system flags them for evaluation.",
            "සේවකයෙකු මාස 3 හෝ මාස 6 සම්පූර්ණ කළ විට ඇගයීමක් සඳහා පද්ධතිය මගින් දැනුම්දීම් ලබාදේ."
          ),
          createBullet(
            "Batch Evaluation Runner: HR can execute batch evaluation for an entire branch. The system verifies cumulative volume achieved against aggregate target hurdles.",
            "HR නිලධාරීන්ට සම්පූර්ණ ශාඛාවක සේවකයින් එකවර Batch Evaluation මගින් පරීක්ෂා කළ හැක."
          ),
          createBullet(
            "Outcome Statuses: PASSED (Eligible for permanent status & salary band upgrade), EXTENDED (Probation extended for further observation), or TERMINATED.",
            "ප්‍රතිඵලය: PASSED (ස්ථීර කිරීම සහ උසස්වීම), EXTENDED (කාලය දීර්ඝ කිරීම) හෝ TERMINATED."
          ),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // ── SECTION 10: SALARY ADVANCES ─────────────────────────────────────
          createHeading1("10. Salary Advances Management", "වැටුප් අත්තිකාරම් කළමනාකරණය"),
          createParagraph(
            "Employees can request salary advances against their earned commissions or salary.",
            "සේවකයින්ට ඔවුන් උපයා ඇති කොමිස් හෝ වැටුපට එරෙහිව වැටුප් අත්තිකාරම් (Salary Advances) ඉල්ලුම් කළ හැක."
          ),
          createBullet(
            "Advance Request Submission: Staff submits an advance request specifying amount, reason, and repayment terms.",
            "සේවකයා මුදල සහ හේතුව සඳහන් කර අත්තිකාරම් ඉල්ලීමක් ඉදිරිපත් කරයි."
          ),
          createBullet(
            "Managerial Approval: HR and Finance review available earned commission balances before approving.",
            "HR සහ මූල්‍ය අංශය උපයා ඇති කොමිස් ශේෂයන් පරීක්ෂා කර අනුමත කරයි."
          ),
          createBullet(
            "Auto-Deduction at Payroll: When running monthly payroll, the system automatically checks pending advances and deducts the balance from Net Pay, preventing manual tracking errors.",
            "මාසික වැටුප් සැකසීමේදී පද්ධතිය ස්වයංක්‍රීයව අත්තිකාරම් මුදල ශුද්ධ වැටුපෙන් කපා හරිනු ලබයි (Auto-Deduction)."
          ),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // ── SECTION 11: BRANCHES & NETWORK HIERARCHY ────────────────────────
          createHeading1("11. Branch Network & Hierarchy Walk", "ශාඛා ජාලය සහ කලාපීය ව්‍යුහය"),
          createParagraph(
            "Super Green ERP organizes branches hierarchically: Head Office -> Zones -> Regions -> Primary Branches -> Sub-branches.",
            "සුපර් ග්‍රීන් ශාඛා ජාලය ප්‍රධාන කාර්යාලය -> කලාප (Zones) -> ප්‍රදේශ (Regions) -> ශාඛා (Branches) ලෙස පෙළගස්වා ඇත."
          ),
          createBullet(
            "Branch Scoping: Regional Managers automatically see data from their primary branch and all subordinate child branches.",
            "ප්‍රාදේශීය කළමනාකරුවන්ට (RM) තම කලාපයේ සියලුම උප ශාඛාවල දත්ත ස්වයංක්‍රීයව පෙනේ."
          ),
          createBullet(
            "Employee Branch Transfers: Employees can be reassigned between branches while preserving their historical performance and client relationships.",
            "සේවකයින් වෙනත් ශාඛාවකට මාරු කළද ඔවුන්ගේ පෙර ඉතිහාසය සහ ගනුදෙනුකරුවන් නොවෙනස්ව පවතී."
          ),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // ── SECTION 12: AUTOMATED CRONS & NOTIFICATIONS ─────────────────────
          createHeading1("12. Automated System Tasks (Crons)", "ස්වයංක්‍රීය පද්ධති දැනුම්දීම් සහ කාර්යයන්"),
          createBullet(
            "Investment Maturity Alerts: System automatically scans for investments reaching completion dates and sends in-app notifications to HR and advisors.",
            "කල්පිරෙන ආයෝජන පිළිබඳව HR සහ උපදේශකයින්ට ස්වයංක්‍රීයව දැනුම්දීම් (Notifications) ලැබේ."
          ),
          createBullet(
            "Inactive Advisor Auto-Deactivation: Non-management field advisors with no activity or investment sales for 2 consecutive months are automatically flagged and deactivated by the monthly cron to keep records clean.",
            "මාස 2 ක් පුරා කිසිදු අලෙවියක් සිදුනොකළ ක්ෂේත්‍ර උපදේශකයින් (FAs) ස්වයංක්‍රීයව අක්‍රීය (Deactivate) කරනු ලැබේ."
          ),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // ── SECTION 13: FAQS & TROUBLESHOOTING ──────────────────────────────
          createHeading1("13. Frequently Asked Questions (FAQs)", "පොදු ගැටළු සහ විසඳුම් (FAQs)"),
          createHeading2("Q1: Why did Dashboard targets show Rs. 0 previously?", "ප්‍රශ්නය 1: පෙරදී ඩෑෂ්බෝඩ් ඉලක්ක රු. 0 ලෙස පෙන්වූයේ ඇයි?"),
          createParagraph(
            "Answer: Previously, field advisors who completed their 6-month probation did not have an after6MonthTarget specified on their probation row, and uncalculated payroll rows had target initialized to 0. This has now been completely resolved: the system dynamically falls back to the Position Salary target (LKR 2,500,000 for FA) and all database records have been backfilled.",
            "පිළිතුර: මාස 6 අවසන් කළ උපදේශකයින්ගේ ස්ථීර ඉලක්කය (රු. 2,500,000) ස්වයංක්‍රීයව සම්බන්ධ නොවීමේ දෝෂයක් පැවති අතර, එය මේ වන විට සම්පූර්ණයෙන්ම නිවැරදි කර සියලුම වාර්තා යාවත්කාලීන කර ඇත."
          ),

          createHeading2("Q2: Why do I see 'Unauthorized' error?", "ප්‍රශ්නය 2: 'Unauthorized' දෝෂයක් පෙන්වන්නේ ඇයි?"),
          createParagraph(
            "Answer: If your browser tab was left open overnight or your login session expired, please log out and sign in again. The system now gracefully detects expired sessions without crashing.",
            "පිළිතුර: ඔබගේ ගිණුමේ කාලය (Session) අවසන් වී ඇති විට මෙය සිදුවේ. පද්ධතියෙන් ඉවත් වී (Sign Out) නැවත ඇතුල් වන්න (Sign In)."
          ),

          createHeading2("Q3: Can a deleted client or investment be recovered?", "ප්‍රශ්නය 3: මකා දැමූ දත්ත නැවත ලබාගත හැකිද?"),
          createParagraph(
            "Answer: For financial audit safety, approved investments and active clients cannot be permanently deleted by branch managers. Only System Administrators (ADMIN) have permission to alter approved records.",
            "පිළිතුර: මූල්‍ය විගණන ආරක්ෂාව සඳහා අනුමත කළ ආයෝජන සාමාන්‍ය පරිශීලකයින්ට මකා දැමිය නොහැක. ඒ සඳහා ප්‍රධාන පරිපාලක (ADMIN) අනුමැතිය අවශ්‍ය වේ."
          ),

          new Paragraph({ spacing: { before: 400, after: 100 }, children: [] }),

          // ── SIGN OFF BLOCK ──────────────────────────────────────────────────
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "— End of Operations Manual —",
                bold: true,
                size: 22,
                color: COLOR_MUTED,
                font: FONT_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Super Green Plantations (Pvt) Ltd — IT & Systems Engineering Team",
                size: 18,
                color: COLOR_MUTED,
                font: FONT_PRIMARY,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return doc;
}

async function main() {
  console.log("Generating Super Green ERP User Manual (.docx)...");
  const doc = await buildUserManualDocx();
  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.resolve(process.cwd(), "Super_Green_ERP_User_Manual.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Successfully generated user manual at: ${outputPath}`);
}

main().catch((err) => {
  console.error("Error generating manual:", err);
  process.exit(1);
});
