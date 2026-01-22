"use client"
import { useState, useEffect } from "react";
import { updateFinancialPlan } from "../../features/financial_plans/actions";

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: any;
}

export default function EditPlanModal({ isOpen, onClose, plan }: EditPlanModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !plan) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      duration: parseInt(formData.get("duration") as string),
      rate: parseFloat(formData.get("rate") as string),
      description: formData.get("description"),
      investment: formData.get("investment") ? parseFloat(formData.get("investment") as string) : null
    };

    const res = await updateFinancialPlan(plan.id, data);
    setLoading(false);
    
    if (res.success) {
      onClose();
    } else {
      alert("Update is not completed.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] ">
      <div className="bg-white p-8 rounded-3xl w-[450px] shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Financial Plan</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-gray-500 ml-1">Plan Name</label>
            <input name="name" defaultValue={plan.name} required className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-500 ml-1">Duration (Months)</label>
              <input name="duration" type="number" defaultValue={plan.duration} required className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-500 ml-1">Interest Rate %</label>
              <input name="rate" type="number" step="0.01" defaultValue={plan.rate} required className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-gray-500 ml-1">Min. Investment</label>
            <input name="investment" type="number" defaultValue={plan.investment} className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-gray-500 ml-1">Description</label>
            <textarea name="description" defaultValue={plan.description} rows={3} className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>

          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold p-3 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50">
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}