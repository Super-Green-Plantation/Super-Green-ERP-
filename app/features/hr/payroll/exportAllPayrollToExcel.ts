/**
 * exportAllPayrollToExcel.ts
 *
 * Produces a styled, position-grouped payroll register Excel workbook:
 *  - Sheet 1 : All Payroll  (all branches, sorted by branch → position → empNo)
 *  - Sheet 2+: One sheet per branch
 *
 * Each sheet has:
 *  - Company header band (rows 1-4)
 *  - Branch / period info row
 *  - Section labels (EARNINGS / DEDUCTIONS / NET) over the column headers
 *  - Column headers (frozen at row 8, first 3 columns)
 *  - Position groups with alternating row tints, per-group subtotals
 *  - Grand total row (SUM of all subtotals)
 */

import * as XLSX from "xlsx";

const C = {
  DARK_GREEN:   "1A472A",
  MID_GREEN:    "2D6A4F",
  LIGHT_GREEN:  "D8EDDF",
  ACCENT_GREEN: "52B788",
  PALE_GREEN:   "F0F7F2",
  ALT_GREEN:    "1B5E35",
  RED_DARK:     "C0392B",
  WHITE:        "FFFFFF",
  OFF_WHITE:    "F8FAF8",
  GRAY_LINE:    "D5D8DC",
  DARK_TEXT:    "1C1C1E",
  MUTED_TEXT:   "6B7280",
  NET_TEXT:     "1A472A",
};

export type PayrollRow = {
  branch: string; empNo: string; name: string; position: string;
  status: string; payrollCategory: string; volumeAchieved: number;
  basic: number; incentive: number; targetBudget: number; vehicle: number;
  teamActive: number; fixedAllowance: number; fuelAllowance: number;
  attendanceAllowance: number; channelOperation: number; personalComm: number;
  orc: number; excess: number; grossPay: number; epfEmployee: number;
  epfEmployer: number; etf: number; loanInstalments: number;
  festivalAdvance: number; merchandiseDeduction: number; advance: number; netPay: number;
};

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

const POSITION_ORDER: Record<string,number> = {
  FA:1,TL:2,FM:3,BM:4,RM:5,ZM:6,AGM:7,COO:8,GM:9,
  ADMIN:10,HR:11,ACC:12,IT:13,OPM:14,PRO:15,SE:16,ABM:17,CLEANING:18,CHAIRMEN:19,
};
const POSITION_LABELS: Record<string,string> = {
  FA:"Field Advisors", TL:"Team Leaders", FM:"Field Managers",
  BM:"Branch Managers", RM:"Regional Managers", ZM:"Zonal Managers",
  AGM:"Assistant General Managers", COO:"Chief Operating Officers", GM:"General Managers",
};
const posSort = (p: string) => POSITION_ORDER[p] ?? 999;

type ColDef = { header: string; field: string; width: number; section: "info"|"earn"|"ded"|"net" };
const COLS: ColDef[] = [
  { header:"No.",             field:"__no__",              width:5,  section:"info" },
  { header:"Emp No",          field:"empNo",               width:11, section:"info" },
  { header:"Employee Name",   field:"name",                width:26, section:"info" },
  { header:"Status",          field:"status",              width:12, section:"info" },
  { header:"Volume Achieved", field:"volumeAchieved",      width:18, section:"earn" },
  { header:"Basic Salary",    field:"basic",               width:14, section:"earn" },
  { header:"Incentive",       field:"incentive",           width:13, section:"earn" },
  { header:"Target Budget",   field:"targetBudget",        width:14, section:"earn" },
  { header:"Vehicle",         field:"vehicle",             width:11, section:"earn" },
  { header:"Team Active",     field:"teamActive",          width:13, section:"earn" },
  { header:"Fixed Allow.",    field:"fixedAllowance",      width:13, section:"earn" },
  { header:"Fuel Allow.",     field:"fuelAllowance",       width:11, section:"earn" },
  { header:"Attend. Allow.",  field:"attendanceAllowance", width:13, section:"earn" },
  { header:"Ch. Operation",   field:"channelOperation",    width:13, section:"earn" },
  { header:"Personal Comm.",  field:"personalComm",        width:15, section:"earn" },
  { header:"ORC",             field:"orc",                 width:12, section:"earn" },
  { header:"Excess Comm.",    field:"excess",              width:13, section:"earn" },
  { header:"Gross Pay",       field:"grossPay",            width:15, section:"earn" },
  { header:"EPF (Emp 8%)",    field:"epfEmployee",         width:13, section:"ded"  },
  { header:"EPF (Emp'r 12%)", field:"epfEmployer",         width:15, section:"ded"  },
  { header:"ETF (3%)",        field:"etf",                 width:10, section:"ded"  },
  { header:"Loan Instal.",    field:"loanInstalments",     width:12, section:"ded"  },
  { header:"Festival Adv.",   field:"festivalAdvance",     width:12, section:"ded"  },
  { header:"Merch. Deduct.",  field:"merchandiseDeduction",width:13, section:"ded"  },
  { header:"Advance",         field:"advance",             width:10, section:"ded"  },
  { header:"Net Pay",         field:"netPay",              width:15, section:"net"  },
];

const NUM_FMT  = "#,##0.00";
const VOL_FMT  = "#,##0";
const INFO_SET = new Set(["__no__","empNo","name","status"]);

function mkFont(bold=false, sz=9, color=C.DARK_TEXT, italic=false) {
  return { bold, sz, color:{ rgb:color }, italic, name:"Arial" };
}
function mkFill(hex: string) { return { patternType:"solid", fgColor:{ rgb:hex } }; }
function mkAlign(h="left", v="center", wrap=false) { return { horizontal:h, vertical:v, wrapText:wrap }; }
function mkBorder(b="hair") {
  const s = { style:b, color:{ rgb:C.GRAY_LINE } };
  return { bottom:s, right:s };
}

function setCell(ws: XLSX.WorkSheet, r:number, c:number, v:any, s:any={}) {
  const addr = XLSX.utils.encode_cell({ r:r-1, c:c-1 });
  ws[addr] = { v, t: typeof v==="number" ? "n" : "s", s } as any;
}
function setFormula(ws: XLSX.WorkSheet, r:number, c:number, f:string, s:any={}) {
  const addr = XLSX.utils.encode_cell({ r:r-1, c:c-1 });
  ws[addr] = { f, t:"n", s } as any;
}
function merge(ws: XLSX.WorkSheet, r1:number,c1:number,r2:number,c2:number) {
  if (!ws["!merges"]) ws["!merges"]=[];
  ws["!merges"].push({ s:{r:r1-1,c:c1-1}, e:{r:r2-1,c:c2-1} });
}
function colLetter(i1: number) { // 1-based
  const i = i1-1;
  if (i < 26) return String.fromCharCode(65+i);
  return String.fromCharCode(64+Math.floor(i/26)) + String.fromCharCode(65+(i%26));
}

function buildSheet(rows: PayrollRow[], branchName: string, month: number, year: number): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const TC = COLS.length;

  // ── Rows 1-3: company header ──────────────────────────────────────────
  merge(ws,1,1,1,TC);
  setCell(ws,1,1,"SUPER GREEN PLANTATION (PVT) LTD",{
    font:mkFont(true,13,C.WHITE), fill:mkFill(C.DARK_GREEN), alignment:mkAlign("center","center"),
  });
  merge(ws,2,1,2,TC);
  setCell(ws,2,1,"PAYROLL REGISTER — INCENTIVE & SALARY STATEMENT",{
    font:mkFont(true,10,C.WHITE), fill:mkFill(C.MID_GREEN), alignment:mkAlign("center","center"),
  });
  merge(ws,3,1,3,TC);
  setCell(ws,3,1,
    `Period: ${MONTHS[month-1]} ${year}  |  Branch: ${branchName}  |  Employees: ${rows.length}  |  Confidential`,{
    font:mkFont(false,8,C.MUTED_TEXT,true), fill:mkFill(C.PALE_GREEN), alignment:mkAlign("center","center"),
  });

  // Rows 4-5: spacers
  merge(ws,4,1,4,TC); setCell(ws,4,1,"",{fill:mkFill(C.WHITE)});
  merge(ws,5,1,5,TC); setCell(ws,5,1,"",{fill:mkFill(C.WHITE)});

  // ── Row 6: Section bands ──────────────────────────────────────────────
  const earnCols = COLS.map((c,i)=>({...c,i:i+1})).filter(c=>c.section==="earn");
  const dedCols  = COLS.map((c,i)=>({...c,i:i+1})).filter(c=>c.section==="ded");
  const netCols  = COLS.map((c,i)=>({...c,i:i+1})).filter(c=>c.section==="net");

  for (let c=1; c<earnCols[0].i; c++) setCell(ws,6,c,"",{fill:mkFill(C.WHITE)});

  merge(ws,6,earnCols[0].i,6,earnCols[earnCols.length-1].i);
  setCell(ws,6,earnCols[0].i,"EARNINGS",{
    font:mkFont(true,8,C.WHITE), fill:mkFill(C.MID_GREEN), alignment:mkAlign("center","center"),
  });
  merge(ws,6,dedCols[0].i,6,dedCols[dedCols.length-1].i);
  setCell(ws,6,dedCols[0].i,"DEDUCTIONS",{
    font:mkFont(true,8,C.WHITE), fill:mkFill(C.RED_DARK), alignment:mkAlign("center","center"),
  });
  setCell(ws,6,netCols[0].i,"NET",{
    font:mkFont(true,8,C.WHITE), fill:mkFill(C.DARK_GREEN), alignment:mkAlign("center","center"),
  });

  // ── Row 7: Column headers ─────────────────────────────────────────────
  COLS.forEach((col,i) => {
    setCell(ws,7,i+1,col.header,{
      font:mkFont(true,8,C.WHITE), fill:mkFill(C.DARK_GREEN),
      alignment:mkAlign("center","center",true),
      border:{ bottom:{style:"medium",color:{rgb:C.ACCENT_GREEN}}, right:{style:"thin",color:{rgb:C.MID_GREEN}} },
    });
  });

  // ── Data: position groups ─────────────────────────────────────────────
  const byPos = new Map<string, PayrollRow[]>();
  for (const r of rows) { const p = r.position||"OTHER"; if(!byPos.has(p))byPos.set(p,[]); byPos.get(p)!.push(r); }
  const sortedPos = [...byPos.keys()].sort((a,b)=>posSort(a)-posSort(b));

  let row = 8;
  const subtotalRows: number[] = [];

  sortedPos.forEach((pos, gi) => {
    const grp   = byPos.get(pos)!;
    const label = POSITION_LABELS[pos] ?? pos;
    const gfill = gi%2===0 ? C.MID_GREEN : C.ALT_GREEN;

    // Group header
    merge(ws,row,1,row,TC);
    setCell(ws,row,1,`  ${label.toUpperCase()}  (${grp.length} employees)`,{
      font:mkFont(true,9,C.WHITE), fill:mkFill(gfill), alignment:mkAlign("left","center"),
    });
    row++;

    const dataStart = row;

    grp.forEach((emp, ri) => {
      const bg = ri%2===0 ? C.WHITE : C.OFF_WHITE;
      COLS.forEach((col,ci) => {
        const c = ci+1;
        if (col.field==="__no__") {
          setCell(ws,row,c,ri+1,{ font:mkFont(false,8,C.MUTED_TEXT), fill:mkFill(bg), alignment:mkAlign("center","center"), border:mkBorder() });
        } else if (col.field==="name") {
          setCell(ws,row,c,emp.name,{ font:mkFont(true,8.5,C.DARK_TEXT), fill:mkFill(bg), alignment:mkAlign("left","center"), border:mkBorder() });
        } else if (col.field==="empNo") {
          setCell(ws,row,c,emp.empNo,{ font:mkFont(false,8,C.MUTED_TEXT), fill:mkFill(bg), alignment:mkAlign("center","center"), border:mkBorder() });
        } else if (col.field==="status") {
          const isPerm = String(emp.status).toUpperCase()==="PERMANENT";
          setCell(ws,row,c,emp.status,{ font:mkFont(true,8,isPerm?"1A7A3C":"B45309"), fill:mkFill(bg), alignment:mkAlign("center","center"), border:mkBorder() });
        } else if (col.field==="netPay") {
          setCell(ws,row,c,emp.netPay,{ font:mkFont(true,9,C.NET_TEXT), fill:mkFill(C.LIGHT_GREEN), alignment:mkAlign("right","center"), numFmt:NUM_FMT, border:mkBorder() });
        } else if (col.field==="volumeAchieved") {
          setCell(ws,row,c,(emp as any)[col.field]??0,{ font:mkFont(false,8.5,C.DARK_TEXT), fill:mkFill(bg), alignment:mkAlign("right","center"), numFmt:VOL_FMT, border:mkBorder() });
        } else {
          setCell(ws,row,c,(emp as any)[col.field]??0,{ font:mkFont(false,8.5,C.DARK_TEXT), fill:mkFill(bg), alignment:mkAlign("right","center"), numFmt:NUM_FMT, border:mkBorder() });
        }
      });
      row++;
    });

    const dataEnd = row-1;

    // Subtotal row
    const stStyle = { font:mkFont(true,8.5,C.DARK_GREEN), fill:mkFill(C.LIGHT_GREEN),
      border:{ top:{style:"medium",color:{rgb:C.ACCENT_GREEN}}, bottom:{style:"medium",color:{rgb:C.ACCENT_GREEN}} } };
    COLS.forEach((col,ci) => {
      const c=ci+1, letter=colLetter(c);
      if (col.field==="__no__") {
        setCell(ws,row,c,`Subtotal (${grp.length})`,{...stStyle, alignment:mkAlign("left","center")});
      } else if (INFO_SET.has(col.field)) {
        setCell(ws,row,c,"",stStyle);
      } else {
        setFormula(ws,row,c,`SUM(${letter}${dataStart}:${letter}${dataEnd})`,{
          ...stStyle, alignment:mkAlign("right","center"),
          numFmt: col.field==="volumeAchieved" ? VOL_FMT : NUM_FMT,
        });
      }
    });
    subtotalRows.push(row);
    row++;

    // Spacer
    merge(ws,row,1,row,TC); setCell(ws,row,1,"",{fill:mkFill(C.WHITE)}); row++;
  });

  // ── Grand total ───────────────────────────────────────────────────────
  const gtStyle = { font:mkFont(true,10,C.WHITE), fill:mkFill(C.DARK_GREEN),
    border:{ top:{style:"medium",color:{rgb:C.ACCENT_GREEN}} } };
  COLS.forEach((col,ci) => {
    const c=ci+1, letter=colLetter(c);
    if (col.field==="__no__") {
      setCell(ws,row,c,"GRAND TOTAL",{...gtStyle, alignment:mkAlign("left","center")});
    } else if (INFO_SET.has(col.field)) {
      setCell(ws,row,c,"",gtStyle);
    } else {
      const refs = subtotalRows.map(r=>`${letter}${r}`).join("+");
      setFormula(ws,row,c,`=${refs}`,{
        ...gtStyle, alignment:mkAlign("right","center"),
        numFmt: col.field==="volumeAchieved" ? VOL_FMT : NUM_FMT,
      });
    }
  });

  // ── Metadata ──────────────────────────────────────────────────────────
  ws["!ref"]  = XLSX.utils.encode_range({ s:{r:0,c:0}, e:{r:row-1,c:TC-1} });
  ws["!cols"] = COLS.map(c=>({ wch:c.width }));
  ws["!rows"] = [
    {hpt:28},{hpt:18},{hpt:14},{hpt:6},{hpt:6},{hpt:14},{hpt:28},
  ];
  ws["!freeze"] = { xSplit:3, ySplit:7 };

  return ws;
}

export function exportAllPayrollToExcel(rows: PayrollRow[], month: number, year: number) {
  if (!rows.length) return;
  const wb = XLSX.utils.book_new();

  const allSorted = [...rows].sort((a,b)=>
    a.branch.localeCompare(b.branch) || posSort(a.position)-posSort(b.position) || a.empNo.localeCompare(b.empNo)
  );
  XLSX.utils.book_append_sheet(wb, buildSheet(allSorted,"All Branches",month,year), "All Payroll");

  const byBranch = new Map<string,PayrollRow[]>();
  for (const r of allSorted) { if(!byBranch.has(r.branch))byBranch.set(r.branch,[]); byBranch.get(r.branch)!.push(r); }
  for (const [name, branchRows] of byBranch) {
    const safe = name.replace(/[:\\/?\*\[\]]/g,"").slice(0,31);
    XLSX.utils.book_append_sheet(wb, buildSheet(branchRows,name,month,year), safe);
  }

  XLSX.writeFile(wb, `Payroll_${MONTHS[month-1]}_${year}.xlsx`);
}