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
import { Plus, Search, Users, Bell, Calendar, UserPlus } from "lucide-react";
import Link from "next/link";
import EmpTable from "@/app/components/Employee/EmpTable";
import EmpModal from "@/app/components/Employee/Model";
import { Member } from "@/app/types/member";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getBranchById,
  getBranchesByMemberId,
  getBranchThisMonthProposalCount,
} from "../actions";
import { searchEmployees } from "../../employees/actions";
import { usePermission } from "@/app/hooks/usePermission";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { UserAvatar } from "@/app/components/Dashboard/UserAvatar";

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

  const queryClient = useQueryClient();
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Member | null>(null);

  useEffect(() => {
    if (branch && branch.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branch[0].id);
    }
  }, [branch, selectedBranchId]);

  const handleRefreshEmployees = () => {
    if (selectedBranchId) {
      queryClient.invalidateQueries({ queryKey: ["employees", selectedBranchId] });
    }
  };
  const [proposalCounts, setProposalCounts] = useState<BranchProposalCount[]>([]);

  const proposalMap = new Map<number, number>(
    proposalCounts.map((p) => [p.branchId, p.proposalCount])
  );

  // ── Network tab state ────────────────────────────────────────────────────
  const [networkBranches, setNetworkBranches] = useState<any[]>([]);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkSearchQuery, setNetworkSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

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
  const getLoggedUserRole = async () => {
    const role = await fetch("/api/me").then((res) => res.json());
    setUserRole(role.role);
  }
  useEffect(() => {
    getLoggedUserRole();
  }, []);

  const canEdit = usePermission(userRole, PERMISSIONS.UPDATE_FINANCIAL_PLAN);

  // ── Early returns ────────────────────────────────────────────────────────
  if (branchesLoading) return <Loading />;
  if (error) return <Error />;

  const displayUserName = dbUser?.name || "Admin User";
  const displayUserRole = dbUser?.role || "ADMIN";
  
  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto min-h-screen p-3 sm:p-6 lg:p-8 font-sans transition-colors duration-300 w-full">

      {/* ── Top Header ── */}
      <div className="flex items-center justify-between gap-3 mb-6">
        {/* Left: Title */}
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
          {canEdit ? "Branch Management" : "Employee Management"}
        </h1>

      
      </div>

      {/* ── Toolbar: Tabs + Actions in one cohesive bar ── */}
      {canEdit && (
        <div className="flex items-center justify-between gap-3 mb-5 border-b border-gray-200 dark:border-gray-800 pb-3">
          {/* Left: Tabs */}
          <div className="flex items-center gap-1">
            {(["employees", "network"] as TabId[]).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabSwitch(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  activeTab === tab
                    ? "bg-[#0f5132] text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {tab === "employees" ? "Employees" : "Branches"}
              </button>
            ))}
          </div>

          {/* Right: Context actions */}
          <div className="flex items-center gap-2 shrink-0">
            {activeTab === "network" ? (
              <>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#0f5132] text-white font-bold text-xs rounded-lg hover:bg-[#146c43] transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Branch
                </button>
                <ExportButton
                  className="!rounded-lg !text-xs !py-2 !px-3 !bg-gray-100 dark:!bg-gray-800 !text-gray-700 dark:!text-gray-300 hover:!bg-gray-200 dark:hover:!bg-gray-700 shrink-0"
                  data={networkBranches}
                  exportFn={generateBranchNetworkPDF}
                  label="Export Report"
                />
              </>
            ) : (
              <ProposalReportExport />
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: BRANCH EMPLOYEES
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "employees" && (
        <div className="space-y-4">

          {/* Branch Selector — scrollable pill row */}
          <div className="w-full overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max py-1">
              {branch?.map((b) => {
                const isActive = selectedBranchId === b.id;
                const count = b.members?.length || 0;
                const proposals = proposalMap.get(b.id) ?? 0;
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBranchId(b.id)}
                    className={`group relative flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-[#0f5132] text-white shadow-md shadow-green-900/20"
                        : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-[#0f5132]/40 hover:text-[#0f5132] dark:hover:text-[#4ade80]"
                    }`}
                  >
                    <span className="text-sm font-bold">{b.name}</span>
                    <span className={`flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md text-[11px] font-bold tabular-nums ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}>
                      {count}
                    </span>
                    {proposals > 0 && (
                      <span className={`flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md text-[11px] font-bold tabular-nums ${
                        isActive
                          ? "bg-emerald-400/30 text-emerald-100"
                          : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      }`} title={`${proposals} proposals this month`}>
                        +{proposals}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search + Add Employee */}
          {selectedBranchId && (
            <div className="space-y-3">
              <div className="flex gap-2 w-full">
                <div className="relative flex-1 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 shadow-sm flex items-center min-w-0">
                  <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    type="text"
                    placeholder="Search employees..."
                    className="w-full bg-transparent border-none py-2.5 px-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-0 outline-none"
                  />
                </div>
                <button
                  onClick={() => { setSelectedEmp(null); setIsEmpModalOpen(true); }}
                  className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-[#20c997] hover:bg-[#1ba87e] text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">ADD EMPLOYEE</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <EmpTable
                  onEdit={(emp) => { setSelectedEmp(emp); setIsEmpModalOpen(true); }}
                  onRefresh={handleRefreshEmployees}
                  branchId={selectedBranchId}
                  searchQuery={searchText}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: BRANCH NETWORK
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "network" && (
        <div className="space-y-4">
          <div className="relative w-full border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 shadow-sm flex items-center">
            <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
            <input
              type="text"
              placeholder="Search branch"
              className="w-full bg-transparent border-none py-2.5 px-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-0 outline-none"
              value={networkSearchQuery}
              onChange={(e) => setNetworkSearchQuery(e.target.value)}
            />
          </div>

          {networkLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loading />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">
                Loading Branch Network…
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-3 sm:p-4">
              <BranchTable
                data={networkBranches.filter(
                  (b) =>
                    b.name?.toLowerCase().includes(networkSearchQuery.toLowerCase()) ||
                    b.location?.toLowerCase().includes(networkSearchQuery.toLowerCase())
                )}
                isLoading={networkLoading}
                onRefresh={fetchNetworkData}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showAddModal && (
        <BranchModal
          mode="add"
          onClose={() => {
            setShowAddModal(false);
            if (activeTab === "network") fetchNetworkData();
          }}
        />
      )}

      {isEmpModalOpen && (
        <EmpModal
          mode={selectedEmp ? "edit" : "add"}
          initialData={selectedEmp || undefined}
          onClose={() => { setIsEmpModalOpen(false); setSelectedEmp(null); }}
          onSuccess={handleRefreshEmployees}
          branchId={selectedBranchId || undefined}
        />
      )}
    </div>
  );
};

export default Page;