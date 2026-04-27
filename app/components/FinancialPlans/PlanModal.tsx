"use client";

import React, { useState, useEffect } from "react";
import { createFinancialPlan, updateFinancialPlan } from "@/app/features/financial_plans/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: any; // if provided → edit mode
}

function Field({
  label, name, type = "text", placeholder, defaultValue, required, step, children,
}: {
  label: string; name?: string; type?: string; placeholder?: string;
  defaultValue?: any; required?: boolean; step?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-0.5">
        {label}
      </label>
      {children ?? (
        <input
          name={name}
          type={type}
          step={step}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
      )}
    </div>
  );
}

const PlanModal = ({ isOpen, onClose, plan }: PlanModalProps) => {
  const isEdit = !!plan;
  const queryClient = useQueryClient();

  const [duration, setDuration] = useState<number>(plan?.duration ?? 0);
  const [rates, setRates] = useState<number[]>(plan?.rate ?? []);

  // when duration changes, resize the rates array
  useEffect(() => {
    if (!duration) return;
    const years = Math.ceil(duration / 12);
    setRates(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];  // ← guard
      if (safePrev.length === years) return safePrev;
      if (safePrev.length > years) return safePrev.slice(0, years);
      const fill = safePrev[safePrev.length - 1] ?? 0;
      return [...safePrev, ...Array(years - safePrev.length).fill(fill)];
    });
  }, [duration]);

  // re-sync when plan changes (switching between edit targets)
  useEffect(() => {
    if (plan) {
      setDuration(plan.duration ?? 0);
      setRates(Array.isArray(plan.rate) ? plan.rate : []);
    } else {
      setDuration(0);
      setRates([]);
    }
  }, [plan]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = isEdit
        ? await updateFinancialPlan(plan.id, payload)
        : await createFinancialPlan(payload);

      if (!res.success) throw new Error(res.error ?? "Operation failed");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success(isEdit ? "Plan updated" : "Plan created");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message ?? (isEdit ? "Failed to update plan" : "Failed to create plan"));
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (rates.some(r => !r && r !== 0)) {
      toast.error("Please fill in all year rates.");
      return;
    }

    const payload = {
      name: fd.get("name") as string,
      duration: parseInt(fd.get("duration") as string),
      rate: rates.map(r => parseFloat(r as any)),  // ← ensure Float
      description: fd.get("description") as string,
      investment: fd.get("investment") ? parseFloat(fd.get("investment") as string) : null,
    };

    mutation.mutate(payload);
  };

  const years = Math.ceil((duration || 0) / 12);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {isEdit ? "Edit Financial Plan" : "New Financial Plan"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEdit ? `Editing: ${plan.name}` : "Fill in the plan details below"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <Field label="Plan Name" name="name" required placeholder="e.g. Life Secure Pro" defaultValue={plan?.name} />

          <div className="grid grid-cols-2 gap-4">
            {/* Duration drives year count */}
            <Field label="Duration (Months)" name="duration" type="number" required placeholder="e.g. 60" defaultValue={plan?.duration}>
              <input
                name="duration"
                type="number"
                required
                placeholder="e.g. 60"
                defaultValue={plan?.duration}
                onChange={e => setDuration(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </Field>

            <Field label="Min. Investment (Optional)" name="investment" type="number" placeholder="e.g. 50000" defaultValue={plan?.investment} />
          </div>

          {/* Per-year rate inputs — rendered once duration is set */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-0.5">
              Rate per Year (%)
              {years > 0 && (
                <span className="ml-2 text-blue-500 normal-case font-semibold tracking-normal">
                  {years} year{years > 1 ? "s" : ""}
                </span>
              )}
            </label>

            {years === 0 ? (
              <p className="text-xs text-gray-400 italic py-1">Enter duration to set rates.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {Array.from({ length: years }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 font-bold text-center">Yr {i + 1}</span>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                      <input
                        type="number"
                        step="0.1"
                        value={rates[i] ?? ""}
                        onChange={e => {
                          const updated = [...rates];
                          updated[i] = parseFloat(e.target.value) || 0.0;  // ← parseFloat not parseInt
                          setRates(updated);
                        }}
                        className="w-full px-2 py-2.5 text-sm font-bold text-gray-800 bg-transparent outline-none text-center"
                        placeholder="0"
                      />
                      <span className="pr-2 text-[11px] text-gray-400 font-bold">%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick-fill helper: set all years to same rate */}
            {years > 1 && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-400 font-bold">Fill all:</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 36"
                  className="w-24 px-3 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                  onChange={e => {
                    const v = parseFloat(e.target.value) || 0;
                    if (v) setRates(Array(years).fill(v));
                  }}
                />
                <span className="text-[10px] text-gray-400">% across all years</span>
              </div>
            )}
          </div>

          <Field label="Description" name="description" required>
            <textarea
              name="description"
              required
              defaultValue={plan?.description}
              rows={3}
              placeholder="Describe the benefits of this plan..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 disabled:opacity-50 transition-all"
            >
              {mutation.isPending
                ? (isEdit ? "Saving..." : "Creating...")
                : (isEdit ? "Save Changes" : "Create Plan")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanModal;