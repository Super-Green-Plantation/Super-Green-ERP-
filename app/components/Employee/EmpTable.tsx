"use client";

import Pagination from "@/app/components/Pagination";
import { deleteEmployee } from "@/app/features/employees/actions";
import { useEmployees } from "@/app/hooks/useEmployee";
import { Member } from "@/app/types/member";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  ExternalLink,
  Pen,
  Phone,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Error from "../Status/Error";
import Loading from "../Status/Loading";
import ConfirmDialog from "../ui/ConfirmDialog";
import { usePermission } from "@/app/hooks/usePermission";
import { getInvestmentCountsPerAdvisor } from "@/app/features/investments/actions";
import { toggleEmployeeStatus } from "@/app/features/branches/actions";

interface EmpTableProps {
  onEdit: (emp: Member) => void;
  onRefresh: () => void;
  branchId?: any;
  searchQuery?: string;
}
const PAGE_SIZE = 10;

const EmpTable = ({ onEdit, onRefresh, branchId, searchQuery }: EmpTableProps) => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [investmentCounts, setInvestmentCounts] = useState<Record<number, number>>({});



  const canEdit = usePermission(userRole, PERMISSIONS.UPDATE_EMPLOYEES);

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; branchId: number | null }>({
    open: false,
    branchId: null,
  });

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useEmployees(branchId, debouncedSearchQuery);

  const allEmployees = data?.pages.flatMap((page) => page.emp) ?? [];

  const totalLoaded = allEmployees.length;
  const loadedPages = data?.pages.length ?? 0;

  // Visible slice for current page
  const pageEmployees = allEmployees.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Total pages we know about (may grow as we load more)
  const knownTotalPages = Math.max(
    loadedPages,
    Math.ceil(totalLoaded / PAGE_SIZE) + (hasNextPage ? 1 : 0)
  );

  const handlePageChange = async (page: number) => {
    const neededItems = page * PAGE_SIZE;
    if (neededItems > totalLoaded && hasNextPage) {
      await fetchNextPage();
    }
    setCurrentPage(page);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", branchId] });
      toast.success("Employee deleted successfully");
      setCurrentPage(1);
      onRefresh();
    },
    onError: () => {
      toast.error("Failed to delete employee");
    },
  });

  const handleDeleteClick = (branchId: number) => {
    setDeleteDialog({ open: true, branchId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.branchId) return;
    deleteMutation.mutate(deleteDialog.branchId);
  };


  const getLoggedUserRole = async () => {
    const role = await fetch("/api/me").then((res) => res.json());
    setUserRole(role.role);
  }
  useEffect(() => {
    getLoggedUserRole();

  }, []);

  useEffect(() => {
    if (!data) return;

    // Flatten all employees across pages
    const allEmployees = data.pages.flatMap(page => page.emp);
    const allIds = allEmployees.map(emp => emp.id);

    if (allIds.length === 0) return;

    getInvestmentCountsPerAdvisor(allIds).then(counts => {
      setInvestmentCounts(counts);
    });
  }, [data?.pages.length]);

  // Add alongside deleteMutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleEmployeeStatus(id, isActive),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["employees", branchId] });
      toast.success(`Employee marked as ${isActive ? "inactive" : "active"}`);
    },
    onError: () => {
      toast.error("Failed to update employee status");
    },
  });


  if (isLoading) return <Loading />
  if (isError) return <Error />

  return (
<div className="w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_10px_35px_rgba(34,43,72,0.05)]">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><User size={16} /></div><div><p className="text-sm font-bold text-foreground">Team directory</p><p className="mt-0.5 text-[10px] font-medium text-muted-foreground">Manage team members and access</p></div></div>
        <span className="hidden rounded-lg bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground sm:inline-flex">{allEmployees.length} loaded</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b border-border/70 bg-muted/35">
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">
                Emp No
              </th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">
                Employee Name
              </th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">
                Position
              </th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">
                Contact
              </th>

              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">
                Status
              </th>

             
              <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">
                Actions
              </th>


            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {pageEmployees?.map((e: any) => (
              <tr
                key={e.id}
                className="group transition-colors hover:bg-primary/[0.025]"
              >
                <td className="px-5 py-4 sm:px-6">
                  <span className="rounded-lg bg-muted px-2.5 py-1 text-[10px] font-bold tracking-wide text-muted-foreground tabular-nums">
                    #{e.empNo}
                  </span>
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">

                    <span className="text-sm font-bold leading-tight text-foreground">
                      {e.nameWithInitials}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-primary/10 bg-primary/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    <Briefcase size={12} className="opacity-70" />
                    {e.position?.title || "N/A"}
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground/50">
                      <Phone size={12} />
                    </div>
                    {e.phone ?? "-"}
                  </div>
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <button
                    onClick={() =>
                      toggleStatusMutation.mutate({ id: e.id, isActive: e.isActive })
                    }
                    disabled={toggleStatusMutation.isPending}
                    title={e.isActive ? "Mark as Inactive" : "Mark as Active"}
                    className="flex items-center gap-2 group/toggle"
                  >
                    {e.isActive ? (
                      <>
                        <ToggleRight size={22} className="text-emerald-500" />
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          Active
                        </span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={22} className="text-muted-foreground/50" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                          Inactive
                        </span>
                      </>
                    )}
                  </button>
                </td>

             

                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(e)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-card hover:shadow-sm border border-transparent hover:border-border rounded-xl transition-all"
                      title="Edit"
                    >
                      <Pen size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(e.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-card hover:shadow-sm border border-transparent hover:border-border rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                    <Link
                      href={`/features/branches/employees/${branchId}/${e.id}`}
                      className="ml-2 inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:scale-95"
                    >
                      Profile
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </td>


              </tr>
            ))}
          </tbody>
        </table>

        {allEmployees.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground/50">
              <User size={24} />
            </div>
            <p className="text-sm font-bold text-muted-foreground italic">
              No employees found
            </p>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={knownTotalPages}
        onPageChange={handlePageChange}
        isLoading={isFetchingNextPage}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, branchId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee"
        description="This will permanently delete this employee and all associated data. This action cannot be undone."
        confirmLabel="Delete Employee"
        cancelLabel="Keep it"
        variant="danger"
      />
    </div>
  );
};

export default EmpTable;
