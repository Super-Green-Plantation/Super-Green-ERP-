"use client";

import { deleteBranch } from "@/app/features/branches/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pen, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import BranchModal from "./Model";
import Pagination from "@/app/components/Pagination";
import Loading from "../Status/Loading";
import ConfirmDialog from "../ui/ConfirmDialog";

interface Branch {
  id: number;
  name: string;
  location: string;
  members: any[];
}

interface BranchTableProps {
  data: Branch[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const PAGE_SIZE = 10;

const BranchTable = ({ data, isLoading, onRefresh }: BranchTableProps) => {
  const [updateModel, setUpdateModel] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);


  const totalPages = Math.ceil((data?.length ?? 0) / PAGE_SIZE);
  const paginatedData = data?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const queryClient = useQueryClient();

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; branchId: number | null }>({
    open: false,
    branchId: null,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBranch(id),
    onSuccess: () => {
      toast.success("Branch Deleted");
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setCurrentPage(1);
      if (onRefresh) onRefresh();
    },
    onError: () => {
      toast.error("Something went wrong, try again!");
    },
  });

  const handelUpdate = (branch: Branch) => {
    setSelectedBranch(branch);
    setUpdateModel(true);
  };
  const handleDeleteClick = (branchId: number) => {
    setDeleteDialog({ open: true, branchId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.branchId) return;
    deleteMutation.mutate(deleteDialog.branchId);
  };

  // Styled Loading State
  if (isLoading) return <Loading />

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex justify-end  items-center">
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Code
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Branch Name
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Location
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Total Employees
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData?.map((branch: Branch) => (
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
                  <div className="flex items-center text-center justify-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
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
                      onClick={() => handleDeleteClick(branch.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl transition-all"
                      title="Delete Branch"
                    >
                      <Trash2 size={18} />
                    </button>



                    <div className="h-4 w-px bg-slate-200 mx-1" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!data || data.length === 0) && (
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

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

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, branchId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Branch"
        description="This will permanently delete this branch and all associated data. This action cannot be undone."
        confirmLabel="Delete Branch"
        cancelLabel="Keep it"
        variant="danger"
      />
    </div>
  );
};

export default BranchTable;
