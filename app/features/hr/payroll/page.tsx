"use client";

import Heading from "@/app/components/Heading";
import { getBranches } from "@/app/features/branches/actions";
import { generateMemberPayslipPDF } from "@/app/pdf/generateMemberPayslipPDF";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2, Play, RefreshCw,
  TicketSlash,
  Users,
  Info,
  Calendar,
  Clock,
  Sparkles,
  Target,
  Filter,
  Search,
  TrendingUp,
  UserX,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getAllPayrollExport, getPayrollPreview, runMonthlyPayroll } from "../payroll-action";
import { exportAllPayrollToExcel } from "./exportAllPayrollToExcel";
import { exportPayrollToExcel } from "./exportPayrollToExcel";
import SalaryCriteriaPanel from "./SalaryCriteriaPanel";
import SalaryCriteriaModal from "./SalaryCriteriaModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const today = new Date();

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [preview, setPreview] = useState<any[]>([]);
  const [volumes, setVolumes] = useState<Record<number, number>>({});
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [running, setRunning] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [auditModalRow, setAuditModalRow] = useState<any | null>(null);
  const [businessFilter, setBusinessFilter] = useState<"all" | "with_business" | "no_business">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleExpandRow = (memberId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const collapseAllRows = () => {
    setExpandedRows(new Set());
  };



  // Load branches once
  useEffect(() => {
    getBranches().then((data: any[]) => {
      setBranches(data);
      if (data.length > 0) setSelectedBranchId(data[0].id);
    });
  }, []);

  // Load preview whenever branch / month / year changes
  const loadPreview = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoadingPreview(true);
    try {
      const rows = await getPayrollPreview(selectedBranchId, year, month, volumes);
      setPreview(rows);

      // Seed volumes from DB — only for members not yet in local state
      setVolumes((prev) => {
        const next = { ...prev };
        for (const r of rows) {
          if (!(r.memberId in next) && r.volumeAchieved > 0) {
            next[r.memberId] = r.volumeAchieved;
          }
        }
        return next;
      });
    } catch {
      toast.error("Failed to load preview");
    } finally {
      setLoadingPreview(false);
    }
  }, [selectedBranchId, year, month]); // keep volumes excluded to avoid loop

  // Refresh preview when volume changes (debounced via button)
  const handleVolumeChange = (memberId: number, value: number) => {
    setVolumes((prev) => ({ ...prev, [memberId]: value }));
  };

  const handleRefreshPreview = async () => {
    if (!selectedBranchId) return;
    setLoadingPreview(true);
    try {
      const rows = await getPayrollPreview(selectedBranchId, year, month, volumes);
      setPreview(rows);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleRunPayroll = async (force = false) => {
    if (!selectedBranchId) return;
    setRunning(true);
    try {
      const result = await runMonthlyPayroll(selectedBranchId, year, month, volumes, force);
      if (result.success) {
        toast.success(`Payroll processed: ${result.processed} employees`);
        if (result.skipped > 0) toast.warning(`${result.skipped} already processed — skipped`);
        if (result.errors.length > 0) toast.error(`Errors: ${result.errors.join(", ")}`);
        await loadPreview();
      }
    } catch {
      toast.error("Failed to run payroll");
    } finally {
      setRunning(false);
    }
  };



  // Derived stats
  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      const rows = await getAllPayrollExport(year, month);
      if (!rows || rows.length === 0) {
        toast.error("No payroll data found for this month.");
        return;
      }
      await exportAllPayrollToExcel(rows as any[], month, year);
      toast.success(`Exported ${rows.length} employees across all branches.`);
    } catch (err) {
      console.error(err);
      toast.error("Export failed. Please try again.");
    } finally {
      setExportingAll(false);
    }
  };

  const hasDoneBusiness = useCallback((r: any) => {
    const vol = Number(volumes[r.memberId] ?? r.volumeAchieved ?? 0);
    const comm = Number(r.actualCommissionEarned ?? 0);
    return vol > 0 || comm > 0;
  }, [volumes]);

  const withBusinessRows = useMemo(() => {
    return preview.filter(hasDoneBusiness);
  }, [preview, hasDoneBusiness]);

  const noBusinessRows = useMemo(() => {
    return preview.filter((r) => !hasDoneBusiness(r));
  }, [preview, hasDoneBusiness]);

  const displayedPreview = useMemo(() => {
    let list = preview;
    if (businessFilter === "with_business") {
      list = withBusinessRows;
    } else if (businessFilter === "no_business") {
      list = noBusinessRows;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.empNo?.toLowerCase().includes(q) ||
          r.position?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [preview, businessFilter, searchQuery, withBusinessRows, noBusinessRows]);

  const expandAllRows = () => {
    setExpandedRows(new Set(displayedPreview.map((r) => r.memberId)));
  };

  const totalGross = preview.reduce((s, r) => s + (r.breakdown?.grossPay ?? 0), 0);
  const totalNet = preview.reduce((s, r) => s + (r.breakdown?.netPay ?? 0), 0);
  const totalEpfEmployee = preview.reduce((s, r) => s + (r.breakdown?.epfDeduction ?? 0), 0);
  const totalEpfEmployer = preview.reduce((s, r) => s + (r.breakdown?.epfEmployer ?? 0), 0);
  const totalEtf = preview.reduce((s, r) => s + (r.breakdown?.etfEmployer ?? 0), 0);
  const alreadyProcessedCount = preview.filter((r) => r.alreadyProcessed).length;
  const unconfiguredCount = preview.filter((r) => !r.salaryConfigured).length;




  return (
    <div className="w-full min-h-screen px-3 pb-8 pt-4 sm:px-5 lg:px-7 flex flex-col gap-4 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">

      {/* Header */}
      <div>
        <Heading>
          Monthly Payroll
        </Heading>
        <p className="text-xs text-muted-foreground mt-1 font-medium max-w-2xl">
          Enter volume achieved per employee and run payroll for the selected month.
        </p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-border/70 bg-card/70 p-2.5 shadow-sm">
        <div className="relative">
          <select
            className="appearance-none pl-3 pr-9 py-2 bg-card border border-border rounded-lg text-xs font-bold text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 cursor-pointer shadow-sm transition-all"
            value={selectedBranchId ?? ""}
            onChange={(e) => setSelectedBranchId(Number(e.target.value))}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        <div className="relative">
          <select
            className="appearance-none pl-3 pr-9 py-2 bg-card border border-border rounded-lg text-xs font-bold text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 cursor-pointer shadow-sm transition-all"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        <div className="relative">
          <select
            className="appearance-none pl-3 pr-9 py-2 bg-card border border-border rounded-lg text-xs font-bold text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 cursor-pointer shadow-sm transition-all"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        <button
          onClick={loadPreview}
          disabled={loadingPreview}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          Search
        </button>

        <button
          onClick={handleRefreshPreview}
          disabled={loadingPreview}
          className="flex items-center gap-2 px-6 py-3 bg-card border border-border hover:bg-muted text-foreground text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>

        <Link
          href="/features/hr/advances"
          className="flex items-center gap-2 px-6 py-3 bg-card border border-border hover:bg-muted text-foreground text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <TicketSlash className="w-4 h-4" />
          Advance
        </Link>

        <button
          onClick={() => exportPayrollToExcel(displayedPreview, branches.find(b => b.id === selectedBranchId)?.name ?? "Branch", months[month - 1], year)}
          className="flex items-center gap-2 px-6 py-3 bg-card border border-border hover:bg-muted text-foreground text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95"
          title={`Export ${businessFilter === "all" ? "all branch members" : businessFilter === "with_business" ? "members who did business" : "members with no business"} to Excel`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Branch
        </button>

        <button
          onClick={handleExportAll}
          disabled={exportingAll}
          className="flex items-center gap-2 px-6 py-3 bg-[#0f5132] hover:bg-[#146c43] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {exportingAll
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Download className="w-4 h-4" />
          }
          {exportingAll ? "Exporting…" : "Export All Branches"}
        </button>

      </div>


      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <div className="rounded-lg border border-border/70 bg-card px-3 py-2.5 shadow-sm">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Branch employees</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-black tabular-nums">{preview.length}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {withBusinessRows.length} with business
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-border/70 bg-card px-3 py-2.5 shadow-sm"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Gross payroll</p><p className="mt-1 text-sm font-black tabular-nums">{fmt(totalGross)}</p></div>
        <div className="rounded-lg border border-border/70 bg-card px-3 py-2.5 shadow-sm"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Net payroll</p><p className="mt-1 text-sm font-black text-primary tabular-nums">{fmt(totalNet)}</p></div>
        <div className="col-span-2 rounded-lg border border-border/70 bg-card px-3 py-2.5 shadow-sm lg:col-span-1"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Payroll checks</p><p className="mt-1 text-xs font-bold"><span className="text-emerald-600">{alreadyProcessedCount} processed</span><span className="mx-2 text-border">•</span><span className="text-amber-600">{unconfiguredCount} unconfigured</span></p></div>
      </div>

      {/* Warnings */}
      {alreadyProcessedCount > 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm font-bold text-amber-600 uppercase tracking-tight">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{alreadyProcessedCount} employee{alreadyProcessedCount > 1 ? "s" : ""} already processed — use "Force Re-run" to overwrite.</span>
        </div>
      )}
      {unconfiguredCount > 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm font-bold text-destructive uppercase tracking-tight">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{unconfiguredCount} employee{unconfiguredCount > 1 ? "s" : ""} missing salary configuration.</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        {/* Table Filter & Search Controls */}
        {preview.length > 0 && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 border-b border-border bg-muted/20">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/60">
              <button
                onClick={() => setBusinessFilter("all")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  businessFilter === "all"
                    ? "bg-card text-foreground shadow-sm border border-border font-black"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-primary" />
                All Branch Members
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  businessFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {preview.length}
                </span>
              </button>

              <button
                onClick={() => setBusinessFilter("with_business")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  businessFilter === "with_business"
                    ? "bg-card text-emerald-700 dark:text-emerald-300 shadow-sm border border-border font-black"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Did Business
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  businessFilter === "with_business"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-500/10 text-emerald-600"
                }`}>
                  {withBusinessRows.length}
                </span>
              </button>

              <button
                onClick={() => setBusinessFilter("no_business")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  businessFilter === "no_business"
                    ? "bg-card text-amber-700 dark:text-amber-300 shadow-sm border border-border font-black"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <UserX className="w-3.5 h-3.5 text-amber-600" />
                No Business
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  businessFilter === "no_business"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-500/10 text-amber-600"
                }`}>
                  {noBusinessRows.length}
                </span>
              </button>
            </div>

            {/* Search Input & Expand/Collapse */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search name, emp no, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 bg-background border border-border rounded-lg text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={expandAllRows}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-background hover:bg-muted text-foreground text-xs font-bold rounded-lg border border-border transition-all shadow-sm active:scale-95"
                title="Expand salary calculation criteria for all displayed employees"
              >
                <ChevronDown className="w-3.5 h-3.5 text-primary" />
                Expand All ({displayedPreview.length})
              </button>

              <button
                onClick={collapseAllRows}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold rounded-lg border border-border transition-all shadow-sm active:scale-95"
                title="Collapse all criteria panels"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Collapse All
              </button>
            </div>
          </div>
        )}

        {loadingPreview ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : preview.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-sm text-muted-foreground gap-4">
            <Users size={48} strokeWidth={1} className="opacity-20" />
            <p className="font-bold uppercase tracking-[0.2em] text-xs">No employees found for this branch</p>
          </div>
        ) : displayedPreview.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-sm text-muted-foreground gap-3 p-6 text-center">
            <Filter className="w-10 h-10 text-muted-foreground/30" />
            <p className="font-bold uppercase tracking-[0.15em] text-xs text-foreground">
              No employees match the current filter
            </p>
            <p className="text-xs text-muted-foreground max-w-md">
              {businessFilter === "with_business"
                ? "No employees in this branch achieved business volume or commissions for this month."
                : businessFilter === "no_business"
                ? "All employees in this branch have achieved business volume or commissions."
                : `No employees matching "${searchQuery}".`}
            </p>
            <button
              onClick={() => { setBusinessFilter("all"); setSearchQuery(""); }}
              className="mt-1 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold transition-all"
            >
              Show all {preview.length} branch members
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1560px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-8 px-2 py-3 text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground">#</th>
                  <th className="text-left px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Employee & Tenure</th>
                  <th className="text-right px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Target</th>
                  <th className="text-right px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Volume Achieved</th>
                  <th className="text-right px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Achieved %</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Active Team
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Partial (20K)</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Incentive</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target Budget</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vehicle</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Team Activation</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ORC</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Personal Comm.</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Additional Comm</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">EPF (emp)</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Deduction</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Net Pay</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayedPreview.map((row) => {
                  const isExpanded = expandedRows.has(row.memberId);
                  const targetAmt = row.monthlyTarget ?? row.breakdown?.monthlyTarget ?? 0;
                  const currentVol = volumes[row.memberId] ?? row.volumeAchieved ?? 0;
                  const achPct = targetAmt > 0 ? (currentVol / targetAmt) * 100 : 0;

                  const hasBusiness = currentVol > 0 || (row.actualCommissionEarned ?? 0) > 0;

                  return (
                    <Fragment key={row.memberId}>
                      <tr className={`hover:bg-muted/30 transition-colors ${
                        isExpanded ? "bg-primary/[0.03]" : !hasBusiness ? "bg-muted/[0.02] opacity-80" : ""
                      }`}>
                        {/* Expand toggle */}
                        <td className="px-2 py-3 text-center">
                          <button
                            onClick={() => toggleExpandRow(row.memberId)}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                            title={isExpanded ? "Collapse salary criteria details" : "Expand salary criteria details"}
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90 text-primary" : ""}`} />
                          </button>
                        </td>

                        {/* Employee with Join Date, Probation Start & Months Serving */}
                        <td className="px-3 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-foreground text-sm leading-tight">{row.name}</p>
                              <span className="text-[10px] font-mono font-bold text-muted-foreground/70 uppercase">
                                {row.empNo}
                              </span>
                              {!hasBusiness && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-wide" title="No business volume or commissions this month">
                                  <UserX className="w-2.5 h-2.5" />
                                  No Business
                                </span>
                              )}
                              <button
                                onClick={() => setAuditModalRow(row)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 cursor-pointer"
                                title="Open detailed calculation criteria audit modal"
                              >
                                <Info className="w-2.5 h-2.5" />
                                Audit
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="font-bold text-muted-foreground">{row.position}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                row.status === "PERMANENT"
                                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              }`}>
                                {row.status === "PERMANENT" ? "Permanent" : "Probation"}
                              </span>
                            </div>

                            {/* Service context: Join Date, Probation Start, Serving duration */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] text-muted-foreground font-medium">
                              {row.dateOfJoin && (
                                <span className="flex items-center gap-1 bg-muted/40 px-1.5 py-0.5 rounded border border-border/50" title="Join Date">
                                  <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                                  Joined: <strong className="text-foreground">{new Date(row.dateOfJoin).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</strong>
                                </span>
                              )}
                              {(row.probationStartDate || row.effectiveProbationStart) && (
                                <span className="flex items-center gap-1 bg-muted/40 px-1.5 py-0.5 rounded border border-border/50" title="Probation Start Date">
                                  <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
                                  Probation: <strong className="text-foreground">{new Date(row.probationStartDate || row.effectiveProbationStart).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>
                                </span>
                              )}
                              {row.tenureMonthCount > 0 && (
                                <span className="flex items-center gap-1 bg-primary/5 text-primary px-1.5 py-0.5 rounded border border-primary/20 font-bold">
                                  Serving: {row.tenureMonthCount} mo{row.tenureMonthCount > 1 ? "s" : ""}
                                  {row.status === "PROBATION" && row.monthsInProbation && (
                                    <span className="font-normal text-muted-foreground">
                                      (P{row.probationPeriod ?? 1} M{row.probationMonthInPeriod ?? 1})
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Target */}
                        <td className="px-3 py-3 text-right">
                          <span className="text-xs font-bold text-foreground">
                            {fmt(targetAmt)}
                          </span>
                        </td>

                        {/* Editable volume input */}
                        <td className="px-3 py-3 text-right">
                          <input
                            type="number"
                            value={volumes[row.memberId] ?? 0}
                            onChange={(e) => handleVolumeChange(row.memberId, Number(e.target.value))}
                            className="w-28 text-right px-2.5 py-1.5 bg-muted/30 border border-border rounded-lg text-xs font-bold text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                          />
                        </td>

                        {/* Achieved % */}
                        <td className="px-3 py-3 text-right">
                          {targetAmt > 0 ? (
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-tight ${
                                achPct >= 100
                                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                                  : achPct >= 75
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                  : achPct >= 25
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              }`}
                            >
                              {achPct.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60">—</span>
                          )}
                        </td>

                        {/* Active Team */}
                        <td className="px-3 py-3 text-right">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-xs font-bold text-foreground">
                              {row.activeTeamCounts?.advisors ?? 0} FA
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {row.activeTeamCounts?.fms ?? 0} FM · {row.activeTeamCounts?.bms ?? 0} BM
                            </span>
                          </div>
                        </td>

                        {/* Partial incentive — 20K when hurdle cleared */}
                        <td className="px-5 py-4 text-right text-xs font-bold">
                          <span className={row.breakdown?.incentiveHit ? "text-primary" : "text-muted-foreground/40"}>
                            {fmt(row.breakdown?.incentiveEarned ?? 0)}
                          </span>
                        </td>

                        {/* Full incentive — non-FA bonusAmount at 100% target */}
                        <td className="px-5 py-4 text-right text-xs font-bold">
                          <span className={row.breakdown?.fullIncentiveHit ? "text-primary" : "text-muted-foreground/40"}>
                            {fmt(row.breakdown?.fullIncentive ?? 0)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right text-xs font-bold">
                          <span className={row.breakdown?.targetBudgetSalary > 0 ? "text-primary" : "text-muted-foreground/40"}>
                            {fmt(row.breakdown?.targetBudgetSalary ?? 0)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right text-xs font-bold">
                          <span className={row.breakdown?.vehicleHit ? "text-primary" : "text-muted-foreground/40"}>
                            {fmt(row.breakdown?.vehicleEarned ?? 0)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right text-xs font-bold">
                          <span className={row.breakdown?.teamActiveHit ? "text-primary" : "text-muted-foreground/40"}>
                            {fmt(row.breakdown?.teamActiveEarned ?? 0)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right text-xs font-bold text-blue-600">
                          {fmt(row.orcEarned ?? 0)}
                        </td>

                        <td className="px-5 py-4 text-right text-xs font-bold text-primary">
                          {fmt(row.personalCommissionEarned ?? 0)}
                        </td>

                        <td className="px-5 py-4 text-right text-xs font-bold text-emerald-600">
                          {fmt(row.breakdown?.excessCommission ?? 0)}
                        </td>

                        <td className="px-5 py-4 text-right text-xs font-bold text-destructive">
                          -{fmt(row.breakdown?.epfDeduction ?? 0)}
                        </td>

                        <td className="px-5 py-4 text-right text-xs font-bold">
                          {row.advanceDeducted > 0 ? (
                            <div
                              className="flex flex-col items-end gap-0.5 cursor-help"
                              title={
                                row.outstandingAdvanceRemaining > row.advanceDeducted
                                  ? `${fmt(row.outstandingAdvanceRemaining - row.advanceDeducted)} remaining after this deduction`
                                  : "Fully paid off after this deduction"
                              }
                            >
                              <span className="text-destructive">-{fmt(row.advanceDeducted)}</span>
                              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                                {row.advanceTypes?.join(" + ")}
                              </span>
                            </div>
                          ) : row.outstandingAdvanceRemaining > 0 ? (
                            <div
                              className="flex flex-col items-end gap-0.5 cursor-help"
                              title={`${fmt(row.outstandingAdvanceRemaining)} remaining`}
                            >
                              <span className="text-amber-600">Rs. 0</span>
                              <span className="text-[9px] font-bold text-amber-600/70 uppercase tracking-wider">
                                Pending — no earnings
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-bold text-foreground">
                          {fmt(row.breakdown?.netPay ?? 0)}
                        </td>

                        <td className="px-5 py-4 text-center">
                          {row.alreadyProcessed ? (
                            <span className="text-[10px] font-bold text-green-600 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full uppercase tracking-tight">
                              Done
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground/50 bg-muted border border-border px-3 py-1 rounded-full uppercase tracking-tight">
                              Wait
                            </span>
                          )}
                        </td>

                        {/* ── Per-row payslip download ── */}
                        <td className="px-4 py-4 text-center">
                          <button
                            disabled={!row.alreadyProcessed}
                            title={row.alreadyProcessed ? "Download payslip PDF" : "Run payroll first"}
                            onClick={() => {
                              const payrollRecord = {
                                year,
                                month,
                                payrollCategory: "MARKETING" as const,
                                volumeAchieved:           row.volumeAchieved ?? 0,
                                monthlyTarget:            row.breakdown?.monthlyTarget ?? 0,
                                targetBudgetSalary:       row.breakdown?.targetBudgetSalary ?? 0,
                                incentiveEarned:          row.breakdown?.incentiveEarned ?? 0,
                                incentivePartialEarned:   row.breakdown?.incentivePartialEarned ?? 0,
                                excessCommission:         row.breakdown?.excessCommission ?? 0,
                                excessEarned:             row.breakdown?.excessEarned ?? 0,
                                vehicleEarned:            row.breakdown?.vehicleEarned ?? 0,
                                activationAllowanceEarned: row.breakdown?.teamActiveEarned ?? 0,
                                commissionEarned:         row.personalCommissionEarned ?? 0,
                                orcEarned:                row.orcEarned ?? 0,
                                grossPay:                 row.breakdown?.grossPay ?? 0,
                                netPay:                   row.breakdown?.netPay ?? 0,
                                epfDeduction:             row.breakdown?.epfDeduction ?? 0,
                                epfEmployer:              row.breakdown?.epfEmployer ?? 0,
                                etfEmployer:              row.breakdown?.etfEmployer ?? 0,
                                advanceDeducted:          row.advanceDeducted ?? 0,
                                incentiveHit:             row.breakdown?.incentiveHit ?? false,
                                incentivePartialHit:      row.breakdown?.incentivePartialHit ?? false,
                                vehicleHit:               row.breakdown?.vehicleHit ?? false,
                                tenureMonthCount:         row.tenureMonthCount ?? 0,
                                basicSalaryPermanent: 0,
                                fixedAllowance: 0,
                                fuelAllowance: 0,
                                channelOperation: 0,
                                attendanceAllowance: 0,
                                loanInstalments: 0,
                                festivalAdvance: 0,
                                merchandiseDeduction: 0,
                              };
                              const memberShape = {
                                nameWithInitials: row.name,
                                empNo:            row.empNo,
                                dateOfJoin:       row.dateOfJoin ?? null,
                                probationStartDate: row.probationStartDate ?? null,
                                position:         { title: row.position },
                                branches:         [{ branch: { name: branches.find((b) => b.id === selectedBranchId)?.name ?? "—" } }],
                              };
                              generateMemberPayslipPDF(payrollRecord, memberShape);
                            }}
                            className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-primary/10"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>

                      {/* ── Expandable Comprehensive Salary Criteria Panel ── */}
                      {isExpanded && (
                        <tr className="bg-muted/15 border-b border-border">
                          <td colSpan={19} className="p-3 bg-muted/10">
                            <SalaryCriteriaPanel row={row} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Criteria Breakdown Modal */}
      <SalaryCriteriaModal
        isOpen={!!auditModalRow}
        onClose={() => setAuditModalRow(null)}
        row={auditModalRow}
      />

      {/* Action Buttons */}
      {preview.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={() => handleRunPayroll(false)}
            disabled={running}
            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 disabled:opacity-50 hover:opacity-90 shadow-xl shadow-primary/20"
          >
            {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
            Run Standard Batch
          </button>
          <button
            onClick={() => handleRunPayroll(true)}
            disabled={running}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 border border-destructive/20 hover:bg-destructive/20"
          >
            <RefreshCw className="w-5 h-5" />
            Force Re-run All
          </button>
        </div>
      )}
    </div>
  );
}
