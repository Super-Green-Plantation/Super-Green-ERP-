// components/FinancialPlans/AddPlanModal.tsx
"use client"

import React from 'react';
import { createFinancialPlan } from "@/app/features/financial_plans/actions";

interface AddPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddPlanModal = ({ isOpen, onClose }: AddPlanModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">New Financial Plan</h2>
            <p className="text-sm text-gray-500">Fill in the product details below</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {/* Action එක මෙහි සම්බන්ධ කර ඇත */}
        <form 
          className="p-8 space-y-5" 
          action={async (formData) => {
            const res = await createFinancialPlan(formData);
            if (res.success) onClose();
          }}
        >
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Plan Name</label>
            <input name="name" type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Life Secure Pro" />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Duration (Months)</label>
              <input name="duration" type="number" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 12" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Interest Rate (%)</label>
              <input name="rate" type="number" step="0.1" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 15.0" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Description</label>
            <textarea name="description" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none h-28 resize-none" placeholder="Describe the benefits of this plan..."></textarea>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50">Discard</button>
            <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg active:scale-95">Save Plan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlanModal;