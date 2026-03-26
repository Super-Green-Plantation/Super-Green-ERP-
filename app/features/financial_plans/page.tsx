"use client";

import AddPlanModal from "@/app/components/FinancialPlans/AddPlanModal";
import EditPlanModal from "@/app/components/FinancialPlans/EditPlanModal";
import Heading from "@/app/components/Heading";
import Error from "@/app/components/Status/Error";
import Loading from "@/app/components/Status/Loading";
import { usePlans } from "@/app/hooks/usePlans";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { usePermission } from "@/lib/auth/usePermission";
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

  const getLoggedUserRole = async () => {
    const role = await fetch("/api/me").then((res) => res.json());
    setUserRole(role.role);
    console.log("user", role.role);

    // return user.role;
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
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
      <div className="sm:flex justify-between items-start space-y-4 sm:space-y-0 mb-8">
        <div>
          <Heading>
            Financial Plans
          </Heading>

          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage company financial products and terms
          </p>
        </div>
        {canAdd && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-primary/10 active:scale-95 hover:opacity-90"
          >
            <Plus size={17} /> Add Financial Plan
          </button>
        )}

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.length > 0 ? (
          plans.map((plan: any) => (
            <div
              key={plan.id}
              className="bg-card rounded-2xl shadow-sm border border-border hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="p-3  sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">
                    {plan.name}
                  </h3>
                  <span className="bg-green-500/10 text-green-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-green-500/20">
                    {plan.status}
                  </span>
                </div>


                {/* <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed">
                  {plan.description}
                </p> */}

                <div className="flex flex-col gap-3 mb-6 bg-muted/50 p-4 rounded-xl border border-border">
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
                      {plan.rate}%
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
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-muted py-3 rounded-xl transition-all border border-transparent hover:border-border"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteClick(plan.id)}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 py-3 rounded-xl transition-all border border-transparent hover:border-destructive/20"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>



              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-24 text-muted-foreground/30 border-2 border-dashed border-border rounded-2xl flex flex-col items-center gap-4">
            <CircleDollarSign size={48} strokeWidth={1} className="opacity-20" />
            <p className="text-sm font-bold uppercase tracking-[0.2em]">No financial plans found</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddPlanModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
          }}
        />
      )}


      {selectedPlan && (
        <EditPlanModal
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
