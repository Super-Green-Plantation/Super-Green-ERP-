"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Search,
  Users,
  Plus,
  FileBarChart,
  MapPin,
  Loader2,
} from "lucide-react";
import Back from "@/app/components/Back";
import EmpTable from "@/app/components/Employee/EmpTable";
import EmpModal from "@/app/components/Employee/Model";
import { getBranchDetails } from "@/app/services/branches.service";
import { getMembers } from "@/app/services/member.service";
import { Member } from "@/app/types/member";
import { generateBranchEmployeePDF } from "@/app/api/src/utils/allMembersPdf"; // Adjust path
import ExportButton from "@/app/components/ExportStatement";

const Page = () => {
  const params = useParams();
  const branchId = params.branchId;

  const [branchData, setBranchData] = useState<any>(null);
  const [employees, setEmployees] = useState<Member[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Member | null>(null);

  const fetchData = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const branchRes = await getBranchDetails(Number(branchId));
      const memberRes = await getMembers(Number(branchId));

      setBranchData(branchRes);
      setEmployees(memberRes.employees);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  if (!branchId)
    return <div className="p-10 text-red-500 font-bold">Branch ID missing</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 min-h-screen">
      {/* --- PREMIUM HEADER --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-5">
          <Back />
          <div className="h-12 w-px bg-slate-200 hidden md:block" />
          <div>
            <div className="flex items-center gap-2 mb-1"></div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              {loading ? (
                <Loader2 className="animate-spin w-6 h-6 text-slate-300" />
              ) : (
                branchData?.name
              )}
              <span className="text-slate-400 font-medium">Branch</span>
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400" />
                {branchData?.location || "Loading location..."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton
            data={{ ...branchData, members: employees }}
            exportFn={generateBranchEmployeePDF}
          />

          <button
            onClick={() => {
              setSelectedEmp(null);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* --- STATS & SEARCH BAR --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Staff
            </p>
            <p className="text-2xl font-black text-slate-900">
              {employees?.length || 0}
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, employee ID or position..."
              className="w-full bg-slate-50/50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="">
        <div className="p-1">
          <EmpTable
            onEdit={(emp) => {
              setSelectedEmp(emp);
              setIsModalOpen(true);
            }}
            onRefresh={fetchData}
            branchId={branchId}
          />
        </div>
      </div>

      {isModalOpen && (
        <EmpModal
          mode={selectedEmp ? "edit" : "add"}
          initialData={selectedEmp || undefined}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEmp(null);
          }}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default Page;
