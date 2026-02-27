"use client";

import BranchTable from "@/app/components/Branch/BranchTable";
import BranchModal from "@/app/components/Branch/Model";
import ExportButton from "@/app/components/ExportStatement";
import Heading from "@/app/components/Heading";
import Loading from "@/app/components/Loading";
import { getBranches } from "@/app/features/branches/actions";
import { generateBranchNetworkPDF } from "@/app/utils/pdfGenerator";
import {
  Building2,
  Plus,
  Search
} from "lucide-react";
import { useEffect, useState } from "react";

const Page = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getBranches();
      setBranches(data);
    } catch (error) {
      console.error("Failed to fetch branches", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalBranches = branches.length;
  // Calculate total staff across all branches

  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
      <div>
        <h1 className="sm:text-2xl text-lg font-semibold md:text-3xl text-slate-900 tracking-tighter flex items-center gap-3">

        </h1>
        <Heading>
          Branch Network
        </Heading>
      </div>


      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:items-center">
        <ExportButton
          data={branches}
          exportFn={generateBranchNetworkPDF}
          label="Network Report"
        />

        <button
          onClick={() => setShowAddModal(true)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-slate-200 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Branch
        </button>
      </div>

      {/* --- STATS & SEARCH BAR --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stat 1 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-5 relative overflow-hidden">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center z-10">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Branches
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? "-" : totalBranches}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search branch"
              className="w-full bg-slate-50/50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loading />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
              Loading Branch Network...
            </p>
          </div>
        ) : (
          <BranchTable
            data={branches.filter((b) =>
              b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              b.location?.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            isLoading={loading}
            onRefresh={fetchData}
          />
        )}
      </div>

      {showAddModal && (
        <BranchModal mode="add" onClose={() => {
          setShowAddModal(false);
          fetchData();
        }} />
      )}
    </div>
  );
};

export default Page;
