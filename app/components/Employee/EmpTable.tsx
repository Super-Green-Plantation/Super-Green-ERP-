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

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useEmployees(branchId);

  console.log(data);


  const allEmployees = data?.pages.flatMap((page) => page.emp) ?? [];

  const filteredEmployees = useMemo(() => {
    if (!searchQuery?.trim()) return allEmployees;
    const q = searchQuery.toLowerCase();
    return allEmployees.filter(emp =>
      emp.nameWithInitials?.toLowerCase().includes(q) ||
      emp.empNo?.toLowerCase().includes(q) ||
      emp.position?.title?.toLowerCase().includes(q)
    );
  }, [allEmployees, searchQuery]);

  const totalLoaded = allEmployees.length;
  const loadedPages = data?.pages.length ?? 0;

  // Visible slice for current page
  const pageEmployees = filteredEmployees.slice(
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
    console.log("user", role.role);

    // return user.role;
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

  if (isLoading) return <Loading />
  if (isError) return <Error />

  return (
    <div className="w-full overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Emp No
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Employee Name
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Position
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Contact
              </th>

              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Proposal Count
              </th>

              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                Actions
              </th>


            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageEmployees?.map((e: any) => (
              <tr
                key={e.id}
                className="hover:bg-muted/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-muted-foreground tabular-nums">
                    #{e.empNo}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">

                    <span className="text-sm font-bold text-foreground leading-tight">
                      {e.nameWithInitials}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold bg-green-500/10 text-green-600 border border-green-500/20 uppercase tracking-tight">
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
                <td>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 uppercase tracking-tight">
                    {investmentCounts[e.id] ?? 0} Proposals
                  </div>
                </td>

                <td className="px-6 py-4">
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
                      className="ml-2 px-4 py-2 text-[10px] font-bold uppercase tracking-tighter text-foreground bg-muted border border-border rounded-xl hover:bg-card hover:shadow-md hover:text-primary transition-all flex items-center gap-1.5 active:scale-95"
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
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground/30 mb-3">
              <User size={24} />
            </div>
            <p className="text-sm font-bold text-muted-foreground italic">
              No employees found in records
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
