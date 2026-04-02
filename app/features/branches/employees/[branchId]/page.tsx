"use client";

import Back from "@/app/components/Buttons/Back";
import EmpTable from "@/app/components/Employee/EmpTable";
import EmpModal from "@/app/components/Employee/Model";
import Heading from "@/app/components/Heading";
import { Member } from "@/app/types/member";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getBranchById } from "../../actions";

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

  const getBranch=async ()=>{
    const branch = await getBranchById(branchId);
    setBranch(branch);
  }

  useEffect(()=>{
    getBranch();
  },[branchId])

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <Back />
          <div className="h-12 w-px bg-border hidden md:block" />
          <div>
            <Heading>{branch?.name + " Employees" || "Employees" }</Heading>
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