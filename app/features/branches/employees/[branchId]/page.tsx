"use client";

import Back from "@/app/components/Back";
import EmpTable from "@/app/components/Employee/EmpTable";
import EmpModal from "@/app/components/Employee/Model";
import { getBranchDetails } from "@/app/services/branches.service";
import { getMembers } from "@/app/services/member.service";
import { Member } from "@/app/types/member";
import { Search, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const params = useParams();
  const branchId = params.branchId;

  if (!branchId) {
    return <div className="text-red-500">Branch ID missing in URL</div>;
  }

  const [branchName, setBranchName] = useState("");
  const [employees, setEmployees] = useState<Member[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Member | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const branchRes = await getBranchDetails(Number(branchId));
      const memberRes = await getMembers(Number(branchId));
      console.log(branchRes);
      console.log(memberRes.employees);

      setBranchName(branchRes.name);
      setEmployees(memberRes.employees);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (emp: Member) => {
    console.log("EDIT EMP:", emp);
    setSelectedEmp(emp);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Back/>
          <div>
            <h2 className="text-2xl font-semibold">
              {loading ? "Loading..." : `${branchName} Branch`}
            </h2>
            <p className="text-sm text-gray-500">
              Manage employees for this location
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedEmp(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
        >
          + Add Employee
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-30 rounded-lg border border-gray-200 px-4 py-3 bg-gray-50/50">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Users className="w-3 h-3" /> Total Staff
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {employees?.length || 0}
            </p>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              className="h-9 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="border-t border-gray-100" />

        <EmpTable
          employees={employees}
          onEdit={handleEdit}
          onRefresh={fetchData}
           branchId={branchId}
        />
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
