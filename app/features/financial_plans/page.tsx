"use client";

import Error from "@/app/components/Status/Error";
import Loading from "@/app/components/Status/Loading";
import { usePlans } from "@/app/hooks/usePlans";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { usePermission } from "@/app/hooks/usePermission";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CircleDollarSign,
  Clock,
  Edit2,
  Plus,
  Trash2,
  TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { deleteFinancialPlan } from "./actions";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import PlanModal from "@/app/components/FinancialPlans/PlanModal";
import Heading from "@/app/components/Heading";

export default function Page() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading, isError } = usePlans();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; branchId: number | null }>({
    open: false,
    branchId: null,
  });


  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFinancialPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete plan");
    },
  });

  const handleDeleteClick = (branchId: number) => {
    setDeleteDialog({ open: true, branchId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.branchId) return;
    deleteMutation.mutate(deleteDialog.branchId);
  };

  const handleEditClick = (plan: any) => {
    setSelectedPlan(plan);
    setIsEditModalOpen(true);
  };

  const formatInterestRate = (rate: unknown) => {
  if (Array.isArray(rate)) {
    return rate.length > 0 ? rate.map((value) => `${value}%`).join(", ") : "N/A";
  }
  if (rate === null || rate === undefined || rate === "") return "N/A";
  return `${rate}%`;
};

  const getLoggedUserRole = async () => {
    const role = await fetch("/api/me").then((res) => res.json());
    setUserRole(role.role);
  }
  useEffect(() => {
    getLoggedUserRole();

  }, []);

  const canAdd = usePermission(
    userRole,
    PERMISSIONS.CREATE_FINANCIAL_PLAN
  );
  const canEdit = usePermission(userRole, PERMISSIONS.UPDATE_FINANCIAL_PLAN);
  const canDelete = usePermission(userRole, [PERMISSIONS.DELETE_FINANCIAL_PLAN, PERMISSIONS.UPDATE_FINANCIAL_PLAN]);



  if (isLoading) return <Loading />;
  if (isError) return <Error />;
  return (
    <div className="mx-auto min-h-screen w-full max-w-[1480px] space-y-5 px-4 pb-10 pt-5 sm:px-7 sm:pt-8">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Heading className="mt-1">
            Financial Plans
          </Heading>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Manage company financial products and terms
          </p>
        </div>
        {canAdd && (
          <div className="flex gap-3">
            <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold tracking-wide text-primary-foreground shadow-md shadow-primary/15 transition-all hover:brightness-105 active:scale-95 sm:flex-none"
          >
            <Plus size={17} /> Add Plan
          </button>

         
          </div>
          
          
        )}

      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {plans.length > 0 ? (
          plans.map((plan: any) => (
            <div
              key={plan.id}
              className="group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_10px_35px_rgba(34,43,72,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_18px_42px_rgba(34,43,72,0.09)]"
            >
              <div className="flex h-full flex-col p-5 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {plan.name}
                  </h3>
                  <span className="rounded-lg border border-emerald-500/15 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                    {plan.status}
                  </span>
                </div>


                {/* <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed">
                  {plan.description}
                </p> */}

                <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/35 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-primary opacity-70" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Duration
                      </span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {plan.duration}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-green-500 opacity-70" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Interest Rate
                      </span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {formatInterestRate(plan.rate)}
                    </span>
                  </div>

                  {plan.investment && (
                    <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
                      <div className="flex items-center gap-2">
                        <CircleDollarSign
                          size={16}
                          className="text-amber-500 opacity-70"
                        />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Min. Investment
                        </span>
                      </div>
                      <span className="text-sm font-bold text-foreground">
                        Rs. {Number(plan.investment).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-auto">
                  {canEdit && (
                    <button
                      onClick={() => handleEditClick(plan)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-transparent py-2.5 text-xs font-bold tracking-wide text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-primary"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteClick(plan.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-transparent py-2.5 text-xs font-bold tracking-wide text-destructive transition-all hover:border-destructive/20 hover:bg-destructive/10"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>



              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-24 text-center text-muted-foreground/50">
            <CircleDollarSign size={48} strokeWidth={1} className="opacity-20" />
            <p className="text-sm font-bold uppercase tracking-[0.2em]">No financial plans found</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <PlanModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
          }}
        />
      )}


      {selectedPlan && (
        <PlanModal
          isOpen={isEditModalOpen}
          plan={selectedPlan}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPlan(null);
          }}
        />
      )}

      
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, branchId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Investment Plan"
        description="This will permanently delete this investment plan and all associated data. This action cannot be undone."
        confirmLabel="Delete Plan"
        cancelLabel="Keep it"
        variant="danger"
      />
    </div>
  );
}
