"use client";

import { useEffect, useMemo, useState } from "react";
import { useInvestments } from "@/app/hooks/useInvestments";
import Loading from "@/app/components/Status/Loading";
import Error from "@/app/components/Status/Error";
import Pagination from "@/app/components/Pagination";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSessionUser } from "@/app/hooks/useSessionUser";
import {
  BanknoteArrowUp, Calendar, Download,
  ExternalLink, TrendingUp, User, AlertCircle, Wallet,
  Pencil,
  Loader2,
  Search,
  X,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useIsMounted } from "@/app/hooks/useIsMounted";
import { generateInvestmentsReportPDF } from "@/app/pdf/InvestmentsReport";
import Heading from "@/app/components/Heading";
import { ProposalReportExport } from "@/app/components/Buttons/ProposalReportExport";
import { useQuery } from "@tanstack/react-query";
import { getBranches } from "../branches/actions";
import { getInvestmentSummary, searchInvestments, getInvestments } from "./actions";
import { InvestmentDownloadButton } from "@/app/components/Proposal/InvestmentDownloadButton";

const getMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    options.push({ value, label });
  }
  return options;
};


const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(0)}K`
      : String(n);

const getDaysUntilMaturity = (maturityDate: string) => {
  const today = new Date();
  const maturity = new Date(maturityDate);
  return Math.ceil((maturity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const MaturityBadge = ({ maturityDate, isMatured, isMounted }: {
  maturityDate?: string;
  isMatured?: boolean;
  isMounted: boolean;
}) => {
  if (!maturityDate || !isMounted) return <span className="text-slate-300 text-xs">—</span>;
  const days = getDaysUntilMaturity(maturityDate);

  if (isMatured || days < 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-bold uppercase">
      Matured
    </span>
  );
  if (days === 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase">
      Today
    </span>
  );
  if (days <= 30) return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-bold">
      <AlertCircle className="w-2.5 h-2.5" />{days}d left
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold">
      {days}d left
    </span>
  );
};

export default function InvestmentsPage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { data: userData, isLoading: userLoading } = useSessionUser();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [branchId, setBranchId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const [selectedMonth, setSelectedMonth] = useState<string>("all"); // "2026-04" format or "all"

  const dateFilters = useMemo(() => {
    if (selectedMonth === "all") return { from: undefined, to: undefined };
    const [year, month] = selectedMonth.split("-").map(Number);
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59, 999); // last day of month
    return { from, to };
  }, [selectedMonth]);

  const { data: summary } = useQuery({
    queryKey: ["investment-summary", branchId, selectedMonth],
    queryFn: () => {
      let from: Date | undefined;
      let to: Date | undefined;
      if (selectedMonth !== "all") {
        const [year, mon] = selectedMonth.split("-").map(Number);
        from = new Date(year, mon - 1, 1);
        to = new Date(year, mon, 0, 23, 59, 59, 999);
      }
      return getInvestmentSummary({
        branchId: branchId !== "all" ? Number(branchId) : undefined,
        from,
        to,
      });
    },
  });

  const { data: branchData } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await getBranches();
      return res?.branches || res || [];
    },
  });

  useEffect(() => { setCurrentPage(1); }, [searchText, branchId, activeTab]);

  const { data, isLoading, isError } = useInvestments(currentPage, 10, activeTab);

  console.log("inv data : ", data);

  const isFiltered = searchText.trim() !== "" || branchId !== "all" || selectedMonth !== "all" || activeTab !== "ALL";

  const { data: filteredData, isFetching: isFilterFetching } = useQuery({
    queryKey: ["investments-filtered", searchText, branchId, selectedMonth, currentPage, activeTab],
    queryFn: () => searchInvestments(
      searchText,
      branchId !== "all" ? Number(branchId) : undefined,
      selectedMonth,  // pass the string directly
      currentPage,
      10,
      activeTab
    ),
    enabled: isFiltered,
  });


  useEffect(() => {
    if (!userLoading && userData) {
      const isPrivileged = ["ADMIN", "HR", "DEV", "BRANCH_MANAGER"].includes(userData.role);
      if (!isPrivileged) router.push("/features/clients");
    }
  }, [userData, userLoading, router]);

  if (isLoading || userLoading) return <Loading />;
  if (isError) return <Error />;

  const investments = isFiltered
    ? (filteredData?.investments ?? [])
    : (data?.investments ?? []);

  const totalPages = isFiltered
    ? (filteredData?.totalPages ?? 1)  // was hardcoded to 1
    : (data?.totalPages ?? 1);

  const total = isFiltered ? (filteredData?.total ?? 0) : (data?.total ?? 0);
  const isTableFetching = isFiltered && isFilterFetching;

  const handleClear = () => {
    setSearchText("");
    setBranchId("all");
    setSelectedMonth("all");
    setActiveTab("ALL");
    setCurrentPage(1);
  };

  const getCurrentRate = (inv: any): string => {
    const rates: number[] = Array.isArray(inv.investmentRates) ? inv.investmentRates : [];
    if (rates.length === 0) return "N/A";
    if (rates.length === 1) return `${rates[0]}%`;
    const months = inv.plan?.duration ?? 0;
    if (!months) return `${rates[0]}%`;
    const monthsPerYear = months / rates.length;
    const monthsElapsed =
      (new Date().getFullYear() - new Date(inv.investmentDate).getFullYear()) * 12 +
      (new Date().getMonth() - new Date(inv.investmentDate).getMonth());
    const yearIndex = Math.min(
      Math.floor(monthsElapsed / monthsPerYear),
      rates.length - 1
    );
    return `${rates[yearIndex]}% (Yr ${yearIndex + 1})`;
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1480px] space-y-5 px-4 pb-10 pt-5 sm:px-7 sm:pt-8">

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <Heading className="mt-1">Investments</Heading>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{total} total investments across your portfolio</p>
          </div>
        </div>
        <div className="flex  items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {investments.length > 0 && (
            <button
              onClick={async () => {
                const toastId = toast.loading("Preparing PDF...");
                try {
                  let allInvestments = [];
                  if (isFiltered) {
                    const res = await searchInvestments(
                      searchText,
                      branchId !== "all" ? Number(branchId) : undefined,
                      selectedMonth,
                      1,
                      -1,
                      activeTab
                    );
                    allInvestments = res.investments;
                  } else {
                    const res = await getInvestments(1, -1, activeTab);
                    allInvestments = res.investments;
                  }
                  generateInvestmentsReportPDF(allInvestments);
                  toast.success("PDF generated", { id: toastId });
                } catch (error) {
                  toast.error("Failed to generate PDF", { id: toastId });
                }
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold tracking-wide text-foreground shadow-sm transition-all hover:bg-muted active:scale-95"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Export</span>
            </button>
          )}
          <Link
            href="/features/clients/createClient"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold tracking-wide text-primary-foreground shadow-md shadow-primary/15 transition-all hover:brightness-105 active:scale-95"
          >
            New Investment
          </Link>
        </div>
      </div>

      {/* Date range + Summary cards */}
      <div className="space-y-4">


        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_10px_35px_rgba(34,43,72,0.05)]">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Total Invested
            </p>
            <p className="text-2xl font-black text-foreground tabular-nums tracking-tight">
              <span className="text-sm font-bold text-muted-foreground mr-1">Rs.</span>
              {(summary?.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            {selectedMonth !== "all" && (
              <p className="text-[10px] text-muted-foreground font-medium">
                {new Date(dateFilters.from!).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </p>
            )}
          </div>
          {/* <div className="sm:flex-col flex gap-3">
            <div className=" bg-card border border-border rounded-2xl p-5 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Total Investments
              </p>
              <p className="text-2xl font-black text-foreground tabular-nums">
                {summary?.investmentCount ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">records</p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_10px_35px_rgba(34,43,72,0.05)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Proposals Filed
              </p>
              <p className="text-2xl font-black text-foreground tabular-nums">
                {summary?.proposalCount ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">
                of {summary?.investmentCount ?? 0} have proposal no.
              </p>
            </div>
          </div> */}



        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${activeTab === tab ? "bg-card text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-card hover:text-foreground"}`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="rounded-2xl border border-border/70 bg-card/70 p-3 shadow-sm">
        <div className="mb-2 hidden items-center justify-between px-1 sm:flex"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Find an investment</p>{isFiltered && <span className="text-[10px] font-semibold text-primary">Filters active</span>}</div>
        <div className="flex flex-col items-center gap-2 md:flex-row">

        <div className="flex min-h-11 flex-1 items-center rounded-xl border border-border bg-background/70">
          <div className="relative flex-1 w-full">
            {isTableFetching ? (
              <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
            ) : (
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            )}
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              type="text"
              placeholder="Search by Client Name, NIC, Proposal No. or Ref No."
              className="w-full border-none bg-transparent py-3 pl-10 pr-10 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative w-full md:w-52">
            <select
              value={branchId}
              onChange={e => setBranchId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border bg-background/70 py-3 pl-3.5 pr-10 text-xs font-semibold text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            >
              <option value="all">All Branches</option>
              {branchData?.map((branch: any) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative w-full md:w-64">
            <select
              value={selectedMonth}
              onChange={e => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
              className="w-full appearance-none rounded-xl border border-border bg-background/70 py-3 pl-3.5 pr-10 text-xs font-semibold text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            >
              <option value="all">All Time</option>
              {getMonthOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>



        {isFiltered && (
          <button
            onClick={handleClear}
            className="w-full rounded-xl border border-transparent px-4 py-3 text-xs font-bold text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground md:w-auto"
          >
            Clear
          </button>
        )}
        </div>
      </div>

      {/* Table */}
      {investments.length === 0 && !isTableFetching ? (
        <div className="rounded-2xl border border-border/70 bg-card p-16 text-center shadow-[0_10px_35px_rgba(34,43,72,0.05)]">
          <div className="p-4 bg-muted/30 rounded-2xl w-fit mx-auto mb-4">
            <Wallet className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-2">
            {isFiltered ? "No results found" : "No investments yet"}
          </h3>
          <p className="text-xs text-muted-foreground font-medium mb-6">
            {isFiltered ? "Try a different search or clear filters" : "Get started by creating your first investment"}
          </p>
          {!isFiltered && (
            <Link
              href="/features/investments/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95"
            >
              <BanknoteArrowUp className="w-4 h-4" /> Create Investment
            </Link>
          )}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_10px_35px_rgba(34,43,72,0.05)]">
          {isTableFetching && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          )}
<div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left">
              <thead>
                <tr className="border-b border-border/70 bg-muted/35">
                  {["Proposal No.", "Client", "Plan", "Amount", "Inv. Date", "Maturity", "Advisor", "Status", "Actions"].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground ${h === "Actions" ? "text-center" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {investments.map((inv: any) => (
                  <tr key={inv.id} className="group transition-colors hover:bg-primary/[0.025]">
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold text-muted-foreground/80 font-mono tracking-tighter">
                        {inv.proposalFormNo ?? `#${inv.id}`}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-sm font-bold text-foreground leading-tight">{inv.client?.fullName ?? "—"}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">{inv.client?.nic ?? "No NIC"}</p>
                    </td>
                    <td className="px-6 py-5 text-right font-medium text-muted-foreground text-xs text-nowrap">
                      <p>{inv.plan?.name || "N/A"}</p>
                      <p className="text-foreground font-bold mt-0.5">{getCurrentRate(inv)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-black text-foreground tabular-nums">Rs. {fmt(inv.amount)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-bold text-muted-foreground/90">
                        {inv.investmentDate && isMounted
                          ? new Date(inv.investmentDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <MaturityBadge maturityDate={inv.maturityDate} isMatured={inv.isMatured} isMounted={isMounted} />
                        {inv.maturityDate && isMounted && (
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            {new Date(inv.maturityDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-foreground/80">
                        {inv.advisor?.nameWithInitials ?? <span className="text-muted-foreground/40 italic">Unassigned</span>}
                      </p>
                      {inv.advisor && <p className="text-[10px] text-primary font-bold">{inv.advisor.empNo}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide
                        ${inv.approvalStatus === "APPROVED" ? "bg-green-500/10 text-green-600" :
                          inv.approvalStatus === "REJECTED" ? "bg-red-500/10 text-red-600" :
                            "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {inv.approvalStatus || "PENDING"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/features/investments/${inv.id}`}
                          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-accent hover:bg-accent/5 hover:border-accent/30 border border-transparent shadow-sm transition-all rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight"
                        >
                          <Pencil className="w-3 h-3" />
                        </Link>
                        <Link
                          href={`/features/clients/${inv.clientId}`}
                          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary hover:bg-card hover:border-border border border-transparent shadow-sm transition-all rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight"
                        >
                          View Client
                        </Link>
                        <InvestmentDownloadButton
                          investment={inv}           // the full investment object from your API
                          beneficiary={inv.beneficiary}  // if you include it in the query
                          nominee={inv.nominee}          // same
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border/70 bg-muted/20">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}