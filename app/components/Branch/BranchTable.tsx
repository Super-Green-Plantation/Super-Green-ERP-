"use client";

import { ExternalLink, Link, MapPin, Pen, Trash2 } from "lucide-react";
import { useState } from "react";
import { useBranches } from "../../hooks/useBranches";
import BranchModal from "./Model";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBranch } from "@/app/api/src/utils/mutation";
import { toast } from "sonner";

interface Branch {
  id: number;
  name: string;
  location: string;
  members: string[];
}

const BranchTable = () => {
  const [updateModel, setUpdateModel] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const { data: branches, isLoading, error } = useBranches();

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBranch(id),
    onSuccess: () => {
      // Refetch branches after deletion
      toast.success("Branch Deleted");
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: () => {
      toast.error("Something went wrong, try again!");
    },
  });

  const handelUpdate = (branch: Branch) => {
    setSelectedBranch(branch);
    setUpdateModel(true);
  };
  const handelDelete = async (branchId: number) => {
    if (confirm("Are you sure you want to delete this branch?")) {
      deleteMutation.mutate(branchId);
    }
  };

  // Styled Loading State
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-500">
            Loading branches...
          </p>
        </div>
      </div>
    );
  }
  // Styled Error State
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <p className="font-semibold text-red-600">Error loading data</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Code
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Branch Identity
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Region / Location
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Operational Capacity
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-center">
                  Management
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branches?.map((branch: Branch) => (
                <tr
                  key={branch.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* ID Column */}
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-400 tabular-nums">
                      #{branch.id.toString().padStart(3, "0")}
                    </span>
                  </td>

                  {/* Branch Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 group-hover:bg-orange-100 transition-colors">
                        <MapPin size={16} />
                      </div>
                      <span className="text-sm font-semibold text-slate-900 tracking-tight">
                        {branch.name}
                      </span>
                    </div>
                  </td>

                  {/* Location Column */}
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                        {branch.location}
                      </div>
                  </td>

                  {/* Team Size Column */}
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-black uppercase tracking-tight">
                        {branch.members?.length || 0} Staff Members
                      </span>
                    </div>
                  </td>

                  {/* Action Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handelUpdate(branch)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl transition-all"
                        title="Edit Branch"
                      >
                        <Pen size={18} />
                      </button>

                      <button
                        onClick={() => handelDelete(branch.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl transition-all"
                        title="Archive Branch"
                      >
                        <Trash2 size={18} />
                      </button>

                      <div className="h-4 w-px bg-slate-200 mx-1" />

                      {/* <Link
                        href={`/features/branches/${branch.id}`}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl transition-all"
                      >
                        <ExternalLink size={18} />
                      </Link> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!branches || branches.length === 0) && (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="p-4 bg-slate-50 rounded-full text-slate-200 mb-4">
                <MapPin size={32} />
              </div>
              <p className="text-sm font-bold text-slate-400 italic">
                No registered branches found
              </p>
            </div>
          )}
        </div>
      

      {/* Empty State Handling */}
      {branches?.length === 0 && (
        <div className="p-8 text-center text-gray-500">No branches found.</div>
      )}

      {/* Update Modal */}
      {updateModel && selectedBranch && (
        <BranchModal
          mode="edit"
          initialData={{
            id: selectedBranch.id,
            name: selectedBranch.name,
            location: selectedBranch.location,
          }}
          onClose={() => {
            setUpdateModel(false);
            setSelectedBranch(null);
          }}
        />
      )}
    </div>
  );
};

export default BranchTable;
