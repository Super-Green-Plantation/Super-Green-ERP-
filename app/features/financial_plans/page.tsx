// app/features/financial_plans/FinancialPlansClient.tsx
"use client"

import AddPlanModal from "@/app/components/FinancialPlans/AddPlanModal";
import { Calendar, Clock, Edit2, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useState } from 'react';


// මෙලෙස වෙනස් කරන්න
export default function FinancialPlansClient({ initialPlans = [] }: { initialPlans: any[] }) {  const [isModalOpen, setIsModalOpen] = useState(false);

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
          onClick={() => setIsModalOpen(true)}
          className="h-9 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
        >
          <Plus size={17} /> Add Financial Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialPlans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Calendar size={24} />
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase">Active</span>
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
              </div>

              <div className="flex gap-3 border-t pt-5">
                <button className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-gray-600 hover:text-blue-600 hover:bg-blue-50 py-2.5 rounded-lg transition-all border border-transparent hover:border-blue-100">
                  <Edit2 size={16} /> Edit
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 py-2.5 rounded-lg transition-all border border-transparent hover:border-red-100">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AddPlanModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}