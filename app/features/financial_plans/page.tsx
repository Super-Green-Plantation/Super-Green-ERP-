"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Edit2,
  Plus,
  Trash2,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react";
import AddPlanModal from "@/app/components/FinancialPlans/AddPlanModal";
import EditPlanModal from "@/app/components/FinancialPlans/EditPlanModal";
import { getFinancialPlans, deleteFinancialPlan } from "./actions";
import { usePlans } from "@/app/hooks/usePlans";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import Loading from "@/app/components/Loading";
import Error from "@/app/components/Error";
import Heading from "@/app/components/Heading";

export default function Page() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading, isError } = usePlans();

  console.log(plans);

  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => deleteFinancialPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete plan");
    },
  });

  const handleDelete = (id: number) => {
    if (!confirm("Do you want to delete this financial plan?")) return;
    deletePlanMutation.mutate(id);
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
    const eligibleRoles = ["ADMIN", "HR", "IT_DEV", "BRANCH_MANAGER"];
    if (eligibleRoles.includes(userRole!)) {
      setAllowed(true);
    } else {
      setAllowed(false);
    }
  }, []);

  if (isLoading) return <Loading />;
  if (isError) return <Error />;
  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
      <div className="sm:flex justify-between items-start space-y-4 sm:space-y-0 mb-8">
        <div>
          <Heading>
            Financial Plans
          </Heading>

          <p className="text-gray-500 mt-1">
            Manage company financial products and terms
          </p>
        </div>
        {/* {allowed && ( */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            <Plus size={17} /> Add Financial Plan
          </button>
        {/* )} */}

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.length > 0 ? (
          plans.map((plan: any) => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="p-3  sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {plan.name}
                  </h3>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                    {plan.status}
                  </span>
                </div>


                {/* <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed">
                  {plan.description}
                </p> */}

                <div className="flex flex-col gap-3 mb-6 bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-blue-500" />
                      <span className="text-sm font-semibold text-gray-500">
                        Duration
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">
                      {plan.duration}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={18} className="text-green-500" />
                      <span className="text-sm font-semibold text-gray-500">
                        Interest Rate
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">
                      {plan.rate}% p.a.
                    </span>
                  </div>

                  {plan.investment && (
                    <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-1">
                      <div className="flex items-center gap-2">
                        <CircleDollarSign
                          size={18}
                          className="text-purple-500"
                        />
                        <span className="text-sm font-semibold text-gray-500">
                          Min. Investment
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">
                        Rs. {Number(plan.investment).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {allowed && (
                  <div className="flex gap-3 border-t pt-5">
                    <button
                      onClick={() => handleEditClick(plan)}
                      className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-gray-600 hover:text-blue-600 hover:bg-blue-50 py-2.5 rounded-lg transition-all border border-transparent hover:border-blue-100"
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 py-2.5 rounded-lg transition-all border border-transparent hover:border-red-100"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                )}


              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-gray-400 border-2 border-dashed rounded-2xl">
            No financial plans found.
          </div>
        )}
      </div>

      {/* Modals */}
      <AddPlanModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
        }}
      />

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
    </div>
  );
}
