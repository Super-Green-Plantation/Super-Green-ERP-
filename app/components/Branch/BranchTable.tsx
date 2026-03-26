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
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex justify-end  items-center">
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Code
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Branch Name
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Location
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Employees
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData?.map((branch: Branch) => (
              <tr
                key={branch.id}
                className="hover:bg-muted/30 transition-colors group"
              >
                {/* ID Column */}
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-muted-foreground tabular-nums">
                    #{branch.id.toString().padStart(3, "0")}
                  </span>
                </td>

                {/* Branch Name */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                      <MapPin size={16} />
                    </div>
                    <span className="text-sm font-semibold text-foreground tracking-tight">
                      {branch.name}
                    </span>
                  </div>
                </td>

                {/* Location Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                    {branch.location}
                  </div>
                </td>

                {/* Team Size Column */}
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                    <span className="text-[11px] font-bold uppercase tracking-tight">
                      {branch.members?.length || 0} Staff
                    </span>
                  </div>
                </td>

                {/* Action Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handelUpdate(branch)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-card hover:shadow-sm border border-transparent hover:border-border rounded-xl transition-all"
                      title="Edit Branch"
                    >
                      <Pen size={18} />
                    </button>

                    <button
                      onClick={() => handleDeleteClick(branch.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-card hover:shadow-sm border border-transparent hover:border-border rounded-xl transition-all"
                      title="Delete Branch"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="h-4 w-px bg-border mx-1" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!data || data.length === 0) && (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="p-4 bg-muted rounded-full text-muted-foreground/30 mb-4">
              <MapPin size={32} />
            </div>
            <p className="text-sm font-bold text-muted-foreground italic">
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
