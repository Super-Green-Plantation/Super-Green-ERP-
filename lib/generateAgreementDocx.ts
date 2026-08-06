import {
    AlignmentType,
    BorderStyle,
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    UnderlineType,
    WidthType,

} from "docx";
import { saveAs } from "file-saver";

import { ImageRun, VerticalAlign } from "docx";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AgreementInvestment {
    proposalFormNo: string | number;
    investmentDate: Date | string;
    amount: number | string;
    branch?: { name?: string; code?: string; address?: string };
    // For the beneficiary block
    beneficiary?: {
        fullName?: string;
        address?: string;
        nic?: string;
    } | null;
    nominee?: {
        fullName?: string;
        address?: string;
        nic?: string;
    }
}

export interface AgreementClient {
    applicant: {
        fullName: string;
        nic: string;
        address?: string;
    };
}

// ── Agreement number builder (same as AgreementTemplate.tsx) ──────────────────
const MONTHS = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

export function buildAgreementNumber(
    investmentDate: Date | string,
    branchCode: string,
    proposalFormNo: string | number
): string {
    // The proposal form number IS the agreement number.
    return String(proposalFormNo);
}

// ── Sinhala month names ───────────────────────────────────────────────────────
const SI_MONTHS = [
    "ජනවාරි", "පෙබරවාරි", "මාර්තු", "අප්‍රේල්", "මැයි", "ජූනි",
    "ජූලි", "අගෝස්තු", "සැප්තැම්බර්", "ඔක්තෝබර්", "නොවැම්බර්", "දෙසැම්බර්",
];

function fmtDate(d: Date | string) {
    const dt = new Date(d);
    return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")}`;
}

function fmtDateSi(d: Date | string) {
    const dt = new Date(d);
    return `වර්ෂ ${dt.getFullYear()} ක්වු ${SI_MONTHS[dt.getMonth()]} මස ${dt.getDate()} වන (${fmtDate(dt)})`;
}

function fmtDateSiFull(d: Date | string) {
    const dt = new Date(d);
    return `වර්ෂ දෙදහස් විසිහයක් වූ ${SI_MONTHS[dt.getMonth()]} මස ${dt.getDate()} වන (${fmtDate(dt)})`;
}

function endDate(d: Date | string) {
    const dt = new Date(d);
    const end = new Date(dt);
    end.setFullYear(end.getFullYear() + 1);
    end.setDate(end.getDate() - 1);
    return `${end.getFullYear()} ${SI_MONTHS[end.getMonth()]} මස ${end.getDate()} දක්වා`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const FONT = "Iskoola Pota";
const SZ = 22; // half-points = 11pt

type Run = { text: string; bold?: boolean; underline?: boolean };

const r = ({ text, bold, underline }: Run) =>
    new TextRun({
        text,
        font: FONT,
        size: SZ,
        bold: !!bold,
        underline: underline ? { type: UnderlineType.SINGLE } : undefined,
    });



const para = (runs: Run[], align: string = AlignmentType.JUSTIFIED) =>
    new Paragraph({
        alignment: align as any,
        spacing: { after: 120, line: 320 },
        children: runs.map(r),
    });

const centered = (runs: Run[]) => para(runs, AlignmentType.CENTER);
const right = (runs: Run[]) => para(runs, AlignmentType.RIGHT);


const heading = (text: string) =>
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text, font: FONT, size: 24, bold: true, underline: { type: UnderlineType.SINGLE } })],
    });

const clause = (num: number, runs: Run[]) =>
    new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 80, after: 120, line: 320 },
        indent: { left: 576, hanging: 360 },
        children: [
            new TextRun({ text: `${num}.\t`, font: FONT, size: SZ, bold: true }),
            ...runs.map(r),
        ],
    });

const bullet = (runs: Run[]) =>
    new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 60, after: 80, line: 320 },
        indent: { left: 900, hanging: 360 },
        children: [
            new TextRun({ text: "•\t", font: FONT, size: SZ }),
            ...runs.map(r),
        ],
    });

const dotField = (label: string, value?: string) =>
    new Paragraph({
        spacing: { after: 60, line: 300 },
        indent: { left: 460 },   // ← uniform left indent for all three rows
        children: [
            new TextRun({ text: `${label}  `, font: FONT, size: SZ }),
            new TextRun({ text: value ?? "", font: FONT, size: SZ, bold: !!value }),
        ],
    });

const boldPara = (text: string) =>
    new Paragraph({
        spacing: { after: 60 },
        indent: { left: 360 },
        children: [new TextRun({ text, font: FONT, size: SZ, bold: true })],
    });

const empty = () => new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "" })] });

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };


// At the top of generateAgreementDocx, before building the doc:



// ── Main generator ────────────────────────────────────────────────────────────
export async function generateAgreementDocx(
    investment: AgreementInvestment,
    client: AgreementClient,
    branchCode?: string
) {

    const logoRes = await fetch("/logo.png");
    const logoBuffer = await logoRes.arrayBuffer();

    console.log("branch:", investment.branch);
    const code = investment.branch?.code ?? "SGP";

    const agreementNo = buildAgreementNumber(investment.investmentDate, code, investment.proposalFormNo);
    const branchCity = investment.branch?.name?.trim() ?? "ගාල්ල";
    const branchAddress = investment.branch?.address ?? "ගාල්ල මිණුවන්ගොඩ, වක්වැල්ල පාර, 124/C/2";

    const { fullName, nic, address } = client.applicant;
    const investorAddress = address ?? "";
    const dateStr = fmtDate(investment.investmentDate);
    const dateSi = fmtDateSi(investment.investmentDate);
    const dateSiFull = fmtDateSiFull(investment.investmentDate);
    const endDateStr = endDate(investment.investmentDate);

    const amount = Number(investment.amount).toLocaleString("en-LK");

    const ben = investment.nominee;
    const benName = ben?.fullName ?? "";
    const benAddress = ben?.address ?? "";
    const benNic = ben?.nic ?? "";

    const fileName = `Agreement_${agreementNo.replace(/\//g, "-")}_${fullName.replace(/\s+/g, "_")}.docx`;

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: FONT, size: SZ },
                    paragraph: { spacing: { line: 320 } },
                },
            },
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: { top: 720, bottom: 720, left: 1080, right: 900 },
                    },
                },
                children: [
                    // ── Header ──────────────────────────────────────────────────────
                    new Table({
                        width: { size: 9360, type: WidthType.DXA },
                        columnWidths: [6500, 2860],
                        rows: [
                            new TableRow({
                                children: [
                                    // Left cell — company name
                                    new TableCell({
                                        width: { size: 6500, type: WidthType.DXA },
                                        verticalAlign: VerticalAlign.CENTER,
                                        borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                                        children: [
                                            new Paragraph({
                                                spacing: { after: 0 },
                                                children: [new TextRun({ text: "SUPER GREEN", font: "Arial Black", size: 36, bold: true })],
                                            }),
                                            new Paragraph({
                                                spacing: { after: 0 },
                                                children: [new TextRun({ text: "PLANTATION (PVT) LTD", font: "Arial Black", size: 36, bold: true })],
                                            }),
                                            new Paragraph({
                                                spacing: { after: 0 },
                                                children: [new TextRun({ text: "PV 00326975", font: FONT, size: 18, color: "666666" })],
                                            }),
                                        ],
                                    }),
                                    // Right cell — logo
                                    new TableCell({
                                        width: { size: 2860, type: WidthType.DXA },
                                        verticalAlign: VerticalAlign.CENTER,
                                        borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                                        children: [
                                            new Paragraph({
                                                alignment: "right" as any,
                                                spacing: { after: 0 },
                                                children: [
                                                    new ImageRun({
                                                        data: logoBuffer,
                                                        type: "png",
                                                        transformation: { width: 80, height: 80 },
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                    right([{ text: `ගිවිසුම් අංකය ${agreementNo}`, bold: true }]),
                    empty(),

                    // ── Title ────────────────────────────────────────────────────────
                    heading("වගා ආයෝජන ගිවිසුමයි"),
                    centered([{ text: "සියලු දෙනාම මෙයින් දැනගත යුතුයි" }]),
                    empty(),

                    // ── Intro ────────────────────────────────────────────────────────
                    para([
                        { text: "මෙහි පහත ඇතැම් තැනක පළමුවන පක්ෂය යැයි හඳුන්වන ලබන " },
                        { text: "ගාල්ල, කරාපිටිය, හිරිඹුර පාර, 598/M සහ අක්මීමණ, කපුහෙන්පල, අම්බලම කන්ද,", bold: true },
                        { text: " දරණ ස්ථානයේ හි ලියාපදිංචි කාර්යාලය පවත්වාගෙන යනු ලබන වර්ෂ 2007 අංක 07 දරන සමාගම් පනතේ විධිවිධාන වලට අනුකූලව නිසිපරිදි ස්ථාපනය කරණ ලද ලියා පදිංචි අංක " },
                        { text: "PV 00326975", bold: true },
                        { text: " දරන " },
                        { text: "සුපර් ග්‍රීන් ප්ලාන්ටේෂන් (ප්‍රයිවට්) ලිමිටඩ්", bold: true },
                        { text: " (ඔහුගේ උරුමක්කාර, පොල්මඃකාර, අද්මිනිස්ත්‍රාසිකාර, පරිපාලකයින් සහ අවසරලත් පැවැරුම්කරුවන් ද ඇතුළත් වේ) පළමු පාර්ශවය ලෙසද, " },
                        { text: `${investorAddress} `, bold: true },
                        { text: "හි පදිංචි " },
                        { text: `${fullName}(ජා.හැ.අ. ${nic})`, bold: true, underline: true },
                        { text: " යන අය මෙතැන් පටන් වගා අයෝජකයා වශයෙන් හදුන්වනු ලබන (ඔහුගේ උරුමක්කාර, පොල්මඃකාර, අද්මිනිස්ත්‍රාසිකාර, පරිපාලකයින් සහ අවසරලත් පැවැරුම්කරුවන් ද ඇතුළත් වේ) දෙවන පාර්ශවය ලෙස ද, බැදී එකී දෙපක්ෂය අතරේ " },
                        { text: dateSi, bold: true, underline: true },
                        { text: ` දින ${branchAddress} දී ඇතිකර ගත් වගා ආයෝජන ගිවිසුමයි.` },
                    ]),

                    empty(),

                    new Paragraph({
                        spacing: { after: 120 },
                        children: [new TextRun({ text: "එකී පොරොන්දු ගිවිසිලි කවරේද යත්", font: FONT, size: SZ, bold: true })],
                    }),

                    // ── Clauses 1–11 ─────────────────────────────────────────────────
                    clause(1, [
                        { text: `  වර්ෂ ${dateStr.slice(0, 4)} ක්වු ${SI_MONTHS[new Date(investment.investmentDate).getMonth()]} මස ${new Date(investment.investmentDate).getDate()} වන සිට ${endDateStr} වසරක`, bold: true, underline: true },
                        { text: " කාලයක් සඳහා මෙම ගිවිසුම බල පැවැත්වෙන බව දෙපාර්ශවයම මෙයින් එකඟ වේ." },
                    ]),
                    clause(2, [{ text: "  මෙම ගිවිසුම වලංගු ගිවිසුමක් ලෙස පිළිගනු ලැබෙන්නේ සුපර් ග්‍රීන් ප්ලාන්ටේෂන් (ප්‍රයිවට්) ලිමිටඩ් පුද්ගලික සමාගමේ සභාපති / අධ්‍යක්ෂක වරයාගේ වලංගු අත්සන ද මෙම ගිවිසුමෙහි අයෝජනකරුගේ ද අත්සන යෙදිය යුතු ස්ථානයේ යොදා ඇත්නම් පමණක් බවටද දෙපාර්ශවයම මෙයින් එකඟ වේ." }]),
                    clause(3, [{ text: "  මෙම ගිවිසුම සම්බන්ධව සෑම කටයුත්තකදීම අනෙකුත් පාර්ශවයන්ගේ යහපත උදෙසා සද්භාවිකව ක්‍රියා කල යුතු බව දෙපාර්ශවයම මෙයින් එකඟ වේ." }]),
                    clause(4, [{ text: "  මෙම ගිවිසුම මුල් පිටපත් දෙකකින් අත්සන් කර ක්‍රියාත්මක කරන බවට ද, සෑම පාර්ශවයකටම ඉන් එක් මුල් පිටපතක් ලබා දෙන බවට ද මෙයින් එකඟ වේ." }]),
                    clause(5, [
                        { text: "  බෝග වගා ආයෝජන මුදල් වශයෙන් පළමු පාර්ශවයට අයත් ලංකා බැංකුවේ 94438011 අංක දරන ගිණුමට දෙවන පාර්ශවය විසින් ශ්‍රී ලංකා මුදලින් රුපියල් " },
                        { text: `(රු ${amount}/=) වර්ෂ ${dateStr}`, bold: true, underline: true },
                        { text: " වන දින බැර කර ඇති බව දෙපාර්ශවයම මෙයින් පිළිගනී." },
                    ]),
                    clause(6, [{ text: "  මෙම ගිවිසුම ප්‍රකාරව පළමු පාර්ශවය විසින් පළමු පාර්ශවයට අයත් ඉඩම්වල වගා කරනු ලබන අතර එසේ වගා කරනු ලබන බෝග නඩත්තු කිරීමත්, ඵලදාව දේශීය හා විදේශීය වෙළඳපොල වෙත අලෙවි කරමින් පළමු පාර්ශවය විසින් බෝග වගා ආයෝජකට හිමි ප්‍රතිලාභ ලබා දීම සිදු කරන බවට දෙපාර්ශවය පිළිගනී." }]),
                    clause(7, [{ text: "  වගා නඩත්තු කාල සීමාව තුළ අවශ්‍ය අවස්ථාවල දී වගාවට පොහොර යෙදීම, වල්නාශක යෙදීම ජල සම්පාදනය සහ ආරක්ෂාව සැලසීම ඇතුළු මූලික නඩත්තු කාර්යයන් ඉටු කිරීමට පළමු පාර්ශවය එකඟ වේ." }]),
                    clause(8, [{ text: "  බෝග නිසි ආකාරයට වර්ධනය වූ පසු පළමු පාර්ශවය විසින් අස්වනු නෙලීම සුදුසු කාලයේ දී සිදු කරනු ලබන අතර, අස්වැන්න අලෙවි කිරීමෙන් / අපනයනය කිරීමෙන් පසු පළමු පාර්ශවය විසින් දෙවන පාර්ශවයට ප්‍රතිලාභ ගෙවන බව දෙපාර්ශවය මෙයින් පිළිගනී." }]),
                    clause(9, [{ text: "  ගිවිසුම් කාලය අවසානයේ ආයෝජනය කරන ලද මූලික මුදල නැවත ලබා දෙන බවට පළමු පාර්ශවය එකඟ වේ." }]),
                    clause(10, [{ text: "  පළමු පාර්ශවය විසින් කෘෂි ව්‍යාපාර කරන කාලය තුළ යම් කිසි අලාභයක් සිදු වුවහොත් එම අලාභය පළමු පාර්ශවය විසින් දරන බවට පළමු පාර්ශවය මෙයින් එකඟ වේ." }]),
                    clause(11, [{ text: "  පූර්ව ලිඛිත දැනුම් දීමකින් පසුව දෙවන පාර්ශවයට හෝ ඔහුගේ නියෝජිතයෙකුට සමාගමේ නියෝජිතයෙකුගේ සහයෝගය ඇතිව සමාගමේ ව්‍යාපෘති පරීක්ෂා කිරීමට හැකියාව ඇති අතර, එකී ලිඛිත ඉල්ලීම වැඩ කරන දින හතකට පෙර සිදු කල යුතු බවට දෙපාර්ශවය මෙයින් එකඟ වේ." }]),

                    clause(12, [{ text: "  දෙවන පාර්ශවය විසින් ගිවිසුම අත්සන් තැබීමෙන් අනතුරුව ගිවිසුමේ කාලය අවසන් වීමට ප්‍රථම ආයෝජන මුදල ඉල්ලා සිටින්නේ නම්," }]),
                    bullet([{ text: "  ආයෝජන මුදලින් 70% මුදලක් ලබා ගත හැකි අතර පළමු පාර්ශවය වෙත අදාල ඉල්ලීම මසකට පෙර ලිඛිතව සිදුකල යුතු බවත්" }]),
                    bullet([{ text: "  එසේ වුවද ආයෝජන මුදලට අදාළව ලාභාංශ ලෙස යම් මුදලක් ලබා ගෙන ඇත්නම් එම මුදල ලද 70% ක මුදලින් අඩු කරනු ලබයි. එසේ 70% මුදල ලබා ගැනීමෙන් අනතුරුව වගා ආයෝජන ගිවිසුම අවලංගු වන බවත්" }]),
                    bullet([{ text: "  එසේ නමුත් මාස හයක් සඳහා ලබා ගන්නා වගා ආයෝජන ගිවිසුම් සඳහා කාලය අවසානයේ දී ආයෝජන මුදල සහ ආයෝජිත මුදලට අදාළ ලාභාංශ ගෙවනු ලබන බවත් දෙපාර්ශවය පිළිගනී." }]),

                    clause(13, [{ text: "  ලාභාංශ ලබා දෙන අවස්ථාව වන විට දී දෙවන පාර්ශවය ජීවතුන් අතර නොසිටියහොත් ඔහුට/ඇයට ලැබිය යුතු ලාභාංශ දෙවන පාර්ශවය විසින් නම් කරන ලද අනුප්‍රාප්තිකයකු වෙත ලබා දීමට දෙපාර්ශවයම එකඟ වේ." }]),

                    new Paragraph({
                        spacing: { before: 80, after: 60 },
                        indent: { left: 360 },   // ← same indent as the fields below
                        children: [new TextRun({ text: "I.  නම් කරන ලද ප්‍රතිලාභියාගේ විස්තර", font: FONT, size: SZ, bold: true })],
                    }),

                    dotField("නම                :-", benName),
                    dotField("ලිපිනය            :-", benAddress),
                    dotField("හැදුනුම්පත් අංකය :-", benNic),
                    empty(),

                    clause(14, [{ text: "  යම් පාර්ශවයක් ගිවිසුමේ සඳහන් කොන්දේසි එකක් හෝ කිහිපයක් කඩ කලහොත් වාචිකව ද, දෙවනුව ලිඛිතව ද දැන්වීමෙන් අනතුරුව දෙවන පාර්ශව වෙත ගිවිසුම අවසන් කිරීමේ හැකියාව පවතින බවට දෙපාර්ශවය එකඟ වේ." }]),
                    clause(15, [{ text: "  ආයෝජකයාගේ වගා ආයෝජන ගිවිසුම සම්බන්ධව තොරතුරු දෙවන පාර්ශවයේ අවසරය නොමැතිව තෙවන පාර්ශවයක් වෙත ඉදිරිපත් නොකරන බවට දෙපාර්ශවයම පිළිගනී." }]),
                    clause(16, [{ text: " ඉහත ක්‍රියාවලිය මගින් නිරාකරනය කරගත නොහැකි ඕනෑම ආරවුලක් සම්බන්ධයෙන් ස්වාධීන බේරුම්කරුවෙකු වෙත යොමු කරනු ලැබිය යුතු බවට දෙපාර්ශවය එකඟ වේ." }]),
                    clause(17, [{ text: "  යම්කිසි ආරවුලක් ඇති වුවහොත් අගතියට පත් පාර්ශවය විසින් ගිවිසුම උල්ලංඝනය කරන ලද පාර්ශවය වෙත ආරවුල පිළිබඳ දැනුම් දීම ලැබී දින තිහක් ඇතුළත කාලයේ දී අදාළ ආරවුල විසදිය යුතු බවට ලිඛිත දැනුම් දීමක් යොමු කළ යුතු බවට දෙපාර්ශවය එකඟ වේ." }]),
                    clause(18, [{ text: "  ඉහත දැක්වූ පරිදි සාකච්ජා මාර්ගයෙන් විසඳගත නොහැකි වූ අවස්ථාවක දී නෛතික ක්‍රියාමාර්ගයකට යොමුවිය හැකි බවට දෙපාර්ශවය පිළිගනී." }]),
                    clause(19, [{ text: "  ඉහත දැක්වූ පරිදි සාකච්ජා මාර්ගයෙන් විසඳගත නොහැකි බවක් ඇතිවූ අවස්ථාවල දී නෛතික ක්‍රියාමාර්ගයකට යොමු විය හැකි බව දෙපාර්ශවය පිළිගනී." }]),

                    empty(),
                    empty(),

                    // ── Closing paragraph ─────────────────────────────────────────────
                    para([
                        { text: "මීට සාක්ෂි පිණිස ඉහත කී කොන්දේසි වලට එකඟව පළමු පාර්ශවය වන සුපර් ග්‍රීන් ප්ලාන්ටේෂන් (ප්‍රයිවට්) ලිමිටඩ් යන අය ද දෙවන පාර්ශවය වන " },
                        { text: fullName, bold: true },
                        { text: " යන අය ද ඔවුනොවුන්ගේ උරුමක්කාර, ලැබුම්කාර, අද්මිනිස්ත්‍රාසිකාර, හා පොල්මඃකරුවන් සමඟ බැඳි මෙයටත් මේ හා සමාන තවත් ලියවිල්ලකටත් " },
                        { text: dateSiFull, bold: true, underline: true },
                        { text: ` වන දින ${branchCity}ේ දී අත්සන් තබන ලදි.` },
                    ]),

                    empty(),

                    // ── Witness heading ───────────────────────────────────────────────
                    new Paragraph({
                        spacing: { after: 100 },
                        children: [new TextRun({ text: "සාක්ෂි:", font: FONT, size: SZ, bold: true })],
                    }),

                    // ── Two-column signature table ─────────────────────────────────────
                    new Table({
                        width: { size: 9360, type: WidthType.DXA },
                        columnWidths: [4500, 4860],
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 4500, type: WidthType.DXA },
                                        borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                                        children: [
                                            new Paragraph({
                                                spacing: { after: 60, line: 300 },
                                                children: [new TextRun({ text: "මීට සාක්ෂිකරයන් වන අප මෙහි අත්සන් කළ අය හොඳාකාරව අදුනනා බවද ඔවුන්ගේ සම්පූර්ණ නියම නම රක්ෂාවල් සහ පදිංවි ස්ථානත් නිෂ්ය්‍ාකාර දන්නා බවද මෙයින් සහනික ගකොට ප්‍රකාශ කරමු.", font: FONT, size: 20 })],
                                            }),
                                        ],
                                    }),
                                    new TableCell({
                                        width: { size: 4860, type: WidthType.DXA },
                                        borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                                        children: [
                                            new Paragraph({
                                                spacing: { after: 80 },
                                                children: [new TextRun({ text: "පළමු පාර්ශවය:- ...........................................", font: FONT, size: SZ })],
                                            }),
                                            empty(),
                                            empty(),
                                            new Paragraph({
                                                spacing: { after: 80 },
                                                children: [new TextRun({ text: "දෙවන පාර්ශවය:- ...........................................", font: FONT, size: SZ })],
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),

                    empty(),
                    empty(),

                    // ── Witness signatures ────────────────────────────────────────────
                    new Paragraph({
                        spacing: { after: 100 },
                        children: [new TextRun({ text: "අත්සන:-", font: FONT, size: SZ, bold: true })],
                    }),

                    ...[
                        "01)  නම:-.....................................................................................",
                        "       ලිපිනය:-................................................................................",
                        "       හැදුනුම්පත් අංකය:-...............................................................",
                        "       අත්සන:-..................................................................................",
                    ].map((line, i) =>
                        new Paragraph({
                            spacing: { after: i === 3 ? 140 : 60 },
                            children: [new TextRun({ text: line, font: FONT, size: SZ })],
                        })
                    ),

                    ...[
                        "02)  නම:-.....................................................................................",
                        "       ලිපිනය:-................................................................................",
                        "       හැදුනුම්පත් අංකය:-...............................................................",
                        "       අත්සන:-..................................................................................",
                    ].map((line, i) =>
                        new Paragraph({
                            spacing: { after: i === 3 ? 220 : 60 },
                            children: [new TextRun({ text: line, font: FONT, size: SZ })],
                        })
                    ),

                    new Paragraph({
                        spacing: { after: 40 },
                        children: [new TextRun({ text: "මා ඉදිරිපිට දී අත්සන් තබන ලදි", font: FONT, size: SZ })],
                    }),
                    empty(),
                    empty(),
                    right([{ text: "නීතිඥ සහ ප්‍රසිද්ධ නොතාරිස්", bold: true }]),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, fileName);
    saveAs(blob, fileName);
}