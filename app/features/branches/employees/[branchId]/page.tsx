"use client";

import Back from "@/app/components/Buttons/Back";
import EmpTable from "@/app/components/Employee/EmpTable";
import EmpModal from "@/app/components/Employee/Model";
import Heading from "@/app/components/Heading";
import { Member } from "@/app/types/member";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Clock, Plus, Search, TrendingUp, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getBranchById } from "../../actions";
import { getInvestmentSummary } from "@/app/features/investments/actions";

const Page = () => {
  const params = useParams();
  const branchId = parseInt(params.branchId as string, 10);
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [branch, setBranch] = useState<any | null>("");

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["employees", branchId] });
  };

  if (!branchId || isNaN(branchId)) {
    return <div className="p-10 text-red-500 text-lg font-semibold">Branch ID missing</div>;
  }

  const getBranch = async () => {
    const branch = await getBranchById(branchId);
    setBranch(branch);
  }

  useEffect(() => {
    getBranch();
  }, [branchId])

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: summary } = useQuery({
    queryKey: ["investment-summary", branchId, dateFrom, dateTo],
    queryFn: () => getInvestmentSummary({
      branchId: branchId,
      from: dateFrom ? new Date(dateFrom) : undefined,
      to: dateTo ? new Date(dateTo) : undefined,
    }),
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <Back />
          <div className="h-12 w-px bg-border hidden md:block" />
          <div>
            <Heading>{branch?.name + " Employees" || "Employees"}</Heading>
          </div>
        </div>

        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:items-center">
          <button
            onClick={() => { setSelectedEmp(null); setIsModalOpen(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-primary/20 active:scale-95 hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Refined Date Picker Group */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="group flex items-center bg-card border border-border rounded-2xl p-1.5 shadow-sm focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all">

            {/* From Date */}
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="bg-transparent text-sm font-bold text-foreground outline-none min-w-30 cursor-pointer"
                />
              </div>
            </div>

            {/* Connection Arrow */}
            <div className="flex items-center justify-center px-2">
              <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center border border-border/50">
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* To Date */}
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="bg-transparent text-sm font-bold text-foreground outline-none min-w-30 cursor-pointer"
                />
              </div>
            </div>

            {/* Clear Button - Nested for a cleaner look */}
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="ml-2 mr-2 p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-colors"
                title="Clear range"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

         
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Invested */}
          <div className="relative overflow-hidden bg-card border border-border rounded-2xl p-5 group hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Invested
              </p>
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-muted-foreground">Rs.</span>
              <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {(summary?.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            {dateFrom || dateTo ? (
              <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {dateFrom && dateTo
                  ? `${new Date(dateFrom).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(dateTo).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                  : dateFrom ? `From ${new Date(dateFrom).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : `Until ${new Date(dateTo).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-muted-foreground italic">Lifetime total</p>
            )}
          </div>

          {/* Total Investments */}
          <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-colors">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Total Investments
            </p>
            <p className="text-3xl font-bold text-foreground tabular-nums">
              {summary?.investmentCount ?? 0}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-full" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase">Records</span>
            </div>
          </div>

          {/* Proposals Filed */}
          <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-colors">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Proposals Filed
            </p>
            <p className="text-3xl font-bold text-foreground tabular-nums">
              {summary?.proposalCount ?? 0}
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground font-medium">
              <span className="text-primary">
                {Math.round(((summary?.proposalCount ?? 0) / (summary?.investmentCount || 1)) * 100)}%
              </span> completion rate
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-border shadow-sm overflow-hidden bg-card">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="Search by name, employee ID or position..."
            className="w-full bg-transparent border-none rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-foreground placeholder:text-muted-foreground/30 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
          />
        </div>
      </div>

      {/* Table — owns its own data fetching */}
      <EmpTable
        onEdit={(emp) => { setSelectedEmp(emp); setIsModalOpen(true); }}
        onRefresh={handleRefresh}
        branchId={branchId}
        searchQuery={searchQuery}
      />

      {isModalOpen && (
        <EmpModal
          mode={selectedEmp ? "edit" : "add"}
          initialData={selectedEmp || undefined}
          onClose={() => { setIsModalOpen(false); setSelectedEmp(null); }}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
};

export default Page;