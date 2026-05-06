"use client";

import BranchTable from "@/app/components/Branch/BranchTable";
import BranchModal from "@/app/components/Branch/Model";
import ExportButton from "@/app/components/Doc/ExportStatement";
import Heading from "@/app/components/Heading";
import { ProposalReportExport } from "@/app/components/Buttons/ProposalReportExport";
import Loading from "@/app/components/Status/Loading";
import Error from "@/app/components/Status/Error";
import { useBranches } from "@/app/hooks/useBranches";
import { getBranches } from "@/app/features/branches/actions";
import { generateBranchNetworkPDF } from "@/app/pdf/BranchNetwork";
import { Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getBranchById,
  getBranchesByMemberId,
  getBranchThisMonthProposalCount,
} from "../actions";
import { searchEmployees } from "../../employees/actions";

type TabId = "employees" | "network";

interface Branch {
  id: number;
  name: string;
  members: Array<any>;
}

interface BranchProposalCount {
  branchName: string;
  branchId: number;
  proposalCount: number;
}

const Page = () => {
  const [activeTab, setActiveTab] = useState<TabId>("employees");

  // ── Employees tab state ──────────────────────────────────────────────────
  const { data: branches, isLoading: branchesLoading, error } = useBranches();
  const [dbUser, setDbUser] = useState<any>(null);
  const [branch, setBranch] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [empSearchLoading, setEmpSearchLoading] = useState(false);
  const [proposalCounts, setProposalCounts] = useState<BranchProposalCount[]>([]);

  const proposalMap = new Map<number, number>(
    proposalCounts.map((p) => [p.branchId, p.proposalCount])
  );

  // ── Network tab state ────────────────────────────────────────────────────
  const [networkBranches, setNetworkBranches] = useState<any[]>([]);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkSearchQuery, setNetworkSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // ── Shared fetches ───────────────────────────────────────────────────────
  useEffect(() => {
    getBranchThisMonthProposalCount().then(setProposalCounts);
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then(({ dbUser }) => setDbUser(dbUser));
  }, []);

  useEffect(() => {
    if (!dbUser || !branches) return;
    const load = async () => {
      if (["ADMIN", "HR", "DEV"].includes(dbUser.role)) {
        setBranch(branches ?? []);
      } else if (dbUser.member?.id) {
        const memberBranches = await getBranchesByMemberId(dbUser.member.id);
        setBranch(memberBranches);
      } else if (dbUser.branchId) {
        const single = await getBranchById(dbUser.branchId);
        setBranch([single]);
      }
    };
    load();
  }, [dbUser, branches]);

  useEffect(() => {
    if (!searchText) { setResults([]); return; }
    const delay = setTimeout(async () => {
      setEmpSearchLoading(true);
      const res = await searchEmployees(searchText);
      setResults(res ?? []);
      setEmpSearchLoading(false);
    }, 400);
    return () => clearTimeout(delay);
  }, [searchText]);

  // Fetch network data only once when that tab is first visited
  const fetchNetworkData = async () => {
    try {
      setNetworkLoading(true);
      setNetworkBranches(await getBranches());
    } catch (e) {
      console.error("Failed to fetch branches", e);
    } finally {
      setNetworkLoading(false);
    }
  };

  const handleTabSwitch = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === "network" && networkBranches.length === 0) {
      fetchNetworkData();
    }
  };

  // ── Early returns ────────────────────────────────────────────────────────
  if (branchesLoading) return <Loading />;
  if (error) return <Error />;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-4 sm:p-4 md:p-8 min-h-screen">

      {/* ── Shared header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Heading>Branch Management</Heading>
          <p className="text-sm text-muted-foreground font-medium mt-2 max-w-2xl">
            {activeTab === "employees"
              ? "Select a branch to view and manage team members and their profiles."
              : "View, add, and manage branches across the network."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center shrink-0">
          {activeTab === "network" && (
            <ExportButton
              data={networkBranches}
              exportFn={generateBranchNetworkPDF}
              label="Network Report"
            />
          )}
          {activeTab === "employees" && <ProposalReportExport />}
         
        </div> 
       
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 bg-muted/40 border border-border rounded-2xl p-1 w-fit">
        {(
          [
            { id: "employees", label: "Branch Employees" },
            { id: "network", label: "Branch Network" },
          ] as { id: TabId; label: string }[]
        ).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleTabSwitch(id)}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === id
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))} <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-primary/10 active:scale-95 hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB: BRANCH EMPLOYEES
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "employees" && (
        <>
          {/* Employee search */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              type="text"
              placeholder="Search by name, employee ID"
              className="w-full bg-transparent border-2 border-teal-800 rounded-full pl-11 pr-4 py-3 text-sm font-semibold outline-none"
            />

            {searchText && (
              <div className="absolute z-50 mt-2 w-full dark:bg-teal-900 bg-white border border-border rounded-2xl shadow-xl max-h-72 overflow-y-auto">
                {empSearchLoading ? (
                  <div className="p-4 text-sm text-muted-foreground">Searching…</div>
                ) : results.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No employees found</div>
                ) : (
                  results.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() =>
                        window.open(
                          `/features/branches/employees/${emp?.branches[0]?.branchId}/${emp.id}`,
                          "_blank"
                        )
                      }
                      className="px-4 py-3 hover:bg-muted cursor-pointer flex flex-col"
                    >
                      <span className="text-sm font-bold">{emp.nameWithInitials}</span>
                      <span className="text-xs text-muted-foreground">
                        {emp.empNo} • {emp.nic}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Branch cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {branch?.map((b: Branch) => {
              const proposals = proposalMap.get(b.id) ?? 0;
              return (
                <Link key={b.id} href={`/features/branches/employees/${b.id}`} className="group">
                  <div className="rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:bg-muted/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 group-active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                        <Users size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                          {b.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest bg-muted px-2 py-0.5 rounded-lg border border-border/50">
                            {b.members.length} Staff
                          </span>
                          <span className="text-[10px] font-bold text-primary/70 uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                            This month {proposals} Proposals
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] mt-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                          Manage Team →
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: BRANCH NETWORK
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "network" && (
        <>
          <p className="text-sm font-bold text-foreground -mt-4">
            Total Branches: {networkLoading ? "—" : networkBranches.length}
          </p>

          {/* Network search */}
          <div className="border-2 border-teal-800 rounded-full shadow-sm flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search branch"
                className="w-full bg-muted/30 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                value={networkSearchQuery}
                onChange={(e) => setNetworkSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Branch table */}
          {networkLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loading />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                Loading Branch Network…
              </p>
            </div>
          ) : (
            <BranchTable
              data={networkBranches.filter(
                (b) =>
                  b.name?.toLowerCase().includes(networkSearchQuery.toLowerCase()) ||
                  b.location?.toLowerCase().includes(networkSearchQuery.toLowerCase())
              )}
              isLoading={networkLoading}
              onRefresh={fetchNetworkData}
            />
          )}
        </>
      )}

      {/* ── Add Branch modal (shared) ── */}
      {showAddModal && (
        <BranchModal
          mode="add"
          onClose={() => {
            setShowAddModal(false);
            // Refresh whichever tab is visible
            if (activeTab === "network") fetchNetworkData();
          }}
        />
      )}
    </div>
  );
};

export default Page;