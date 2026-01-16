"use client"

import { useState, useEffect } from 'react';
import { Calendar, Clock, Edit2, Plus, Trash2, TrendingUp, CircleDollarSign } from 'lucide-react';
import AddPlanModal from "@/app/components/FinancialPlans/AddPlanModal";
import EditPlanModal from "@/app/components/FinancialPlans/EditPlanModal";
import { getFinancialPlans, deleteFinancialPlan } from "./actions"; 

export default function Page() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await getFinancialPlans();
      setPlans(data);
    } catch (error) {
      console.error("Error loading plans:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm("Do you want to delete this financial plan?")) {
      const res = await deleteFinancialPlan(id);
      if (res.success) {
        loadPlans();
      } else {
        alert("Delete is not completed.");
      }
    }
  };

  const handleEditClick = (plan: any) => {
    setSelectedPlan(plan);
    setIsEditModalOpen(true);
  };

  const formatDuration = (months: number) => {
    if (months >= 12) { 
      const years = months / 12;
      return `${years} ${years === 1 ? 'Year' : 'Years'}`;
    }
    return `${months} Months`;
  };

  return (
    <div className="font-sans p-6 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Financial Plans</h1>
          <p className="text-gray-500 mt-1">Manage company financial products and terms</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="h-9 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
        >
          <Plus size={17} /> Add Financial Plan
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.length > 0 ? (
            plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Calendar size={24} />
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase">{plan.status}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed">{plan.description}</p>

                  <div className="flex flex-col gap-3 mb-6 bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-blue-500" />
                        <span className="text-sm font-semibold text-gray-500">Duration</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{formatDuration(plan.duration)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={18} className="text-green-500" />
                        <span className="text-sm font-semibold text-gray-500">Interest Rate</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{plan.rate}% p.a.</span>
                    </div>

                    {plan.investment && (
                      <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-1">
                        <div className="flex items-center gap-2">
                          <CircleDollarSign size={18} className="text-purple-500" />
                          <span className="text-sm font-semibold text-gray-500">Min. Investment</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">
                          Rs. {Number(plan.investment).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

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
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-gray-400 border-2 border-dashed rounded-2xl">
              No financial plans found.
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddPlanModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          loadPlans(); 
        }} 
      />

      {selectedPlan && (
        <EditPlanModal 
          isOpen={isEditModalOpen} 
          plan={selectedPlan}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPlan(null);
            loadPlans();
          }} 
        />
      )}
    </div>
  );
}