"use client";

import { useState, useEffect } from "react";
import { useClients } from "@/app/hooks/useClients";
import { usePlans } from "@/app/hooks/usePlans";
import { createInvestment } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowLeft, DollarSign, User, Building2, FileText, UserCircle } from "lucide-react";
import Link from "next/link";
import Loading from "@/app/components/Loading";
import Error from "@/app/components/Error";

export default function CreateInvestmentPage() {
  const router = useRouter();
  const { data: clientsData, isLoading: loadingClients, isError: clientsError } = useClients();
  const { data: plans = [], isLoading: loadingPlans, isError: plansError } = usePlans();

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clients = clientsData?.clients || [];
  const selectedClient = clients.find((c: any) => c.id === selectedClientId);
  const availableAdvisors = selectedClient?.branch?.members || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const investmentAmount = parseFloat(amount);
    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      toast.error("Please enter a valid investment amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createInvestment({
        clientId: selectedClientId,
        planId: selectedPlanId || undefined,
        advisorId: selectedAdvisorId || undefined,
        amount: investmentAmount,
      });

      if (result.success) {
        toast.success("Investment created successfully!");
        router.push("/features/investments");
      } else {
        toast.error(result.error || "Failed to create investment");
      }
    } catch (error) {
      toast.error("An error occurred while creating the investment");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingClients || loadingPlans) return <Loading />;
  if (clientsError || plansError) return <Error />;

  return (
    <div className="min-h-screen bg-gray-50/30 py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/features/investments">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Create Investment
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Add new investment for existing client
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="space-y-6">
            {/* Client Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-[15px] font-semibold text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Select Client *
              </label>
              <select
                className="p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition cursor-pointer text-gray-600"
                value={selectedClientId || ""}
                onChange={(e) => setSelectedClientId(Number(e.target.value))}
                required
              >
                <option value="">Choose a client...</option>
                {clients.map((client: any) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName} {client.nic ? `(${client.nic})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch (Auto-filled) */}
            {selectedClient && (
              <div className="flex flex-col gap-2">
                <label className="text-[15px] font-semibold text-gray-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-green-600" />
                  Branch
                </label>
                <input
                  type="text"
                  value={selectedClient.branch?.name || "N/A"}
                  disabled
                  className="p-3.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
            )}

            {/* Financial Plan Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-[15px] font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Financial Plan (Optional)
              </label>
              <select
                className="p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition cursor-pointer text-gray-600"
                value={selectedPlanId || ""}
                onChange={(e) => setSelectedPlanId(Number(e.target.value) || null)}
              >
                <option value="">Choose a plan...</option>
                {plans.map((plan: any) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {plan.rate}% p.a. ({plan.duration} months)
                  </option>
                ))}
              </select>
            </div>

            {/* Advisor Selection */}
            {availableAdvisors.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-[15px] font-semibold text-gray-700 flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-orange-600" />
                  Financial Advisor (Optional)
                </label>
                <select
                  className="p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition cursor-pointer text-gray-600"
                  value={selectedAdvisorId || ""}
                  onChange={(e) => setSelectedAdvisorId(Number(e.target.value) || null)}
                >
                  <option value="">Choose an advisor...</option>
                  {availableAdvisors.map((advisor: any) => (
                    <option key={advisor.id} value={advisor.id}>
                      {advisor.name} - {advisor.position?.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Investment Amount */}
            <div className="flex flex-col gap-2">
              <label className="text-[15px] font-semibold text-gray-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Investment Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition text-gray-600"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <Link href="/features/investments">
              <button
                type="button"
                className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Creating...
                </>
              ) : (
                "Create Investment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
