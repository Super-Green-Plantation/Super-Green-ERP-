"use client";

// app/features/inventory/[id]/edit/page.tsx

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Package } from "lucide-react";
import Link from "next/link";

import { inputClass, labelClass } from "@/app/const/inputStyles";
import { ItemCondition } from "@prisma/client";
import { getInventoryItemById, updateInventoryItem } from "../inventory-actions";

export default function EditInventoryItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    quantity: "1",
    condition: "GOOD" as ItemCondition,
    notes: "",
  });

  useEffect(() => {
    getInventoryItemById(Number(id)).then((data:any) => {
      if (data) {
        setItem(data);
        setForm({
          name: data.name,
          quantity: String(data.quantity),
          condition: data.condition as ItemCondition,
          notes: data.notes ?? "",
        });
      }
      setLoading(false);
    });
  }, [id]);

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await updateInventoryItem(Number(id), {
        name: form.name.trim(),
        quantity: Math.max(1, Number(form.quantity)),
        condition: form.condition,
        notes: form.notes.trim() || undefined,
      });
      if (res.success) {
        router.push("/features/inventory");
      } else {
        setError("Failed to update item.");
      }
    } catch (e: any) {
      setError(e?.message ?? "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
          Loading…
        </p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-sm font-semibold text-gray-500">Item not found.</p>
        <Link
          href="/features/inventory"
          className="text-xs font-bold text-[#0f5132] hover:underline"
        >
          ← Back to Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen p-4 sm:p-8">
      <Link
        href="/features/inventory"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0f5132] dark:hover:text-emerald-400 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Inventory
      </Link>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <Package className="w-5 h-5 text-[#0f5132] dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Edit Inventory Item
            </h1>
            <p className="text-xs font-mono text-gray-400 mt-0.5">
              {item.itemCode}
            </p>
          </div>
        </div>

        {/* Read-only info */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div>
            <p className={labelClass}>Branch</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {item.Branch.name}
            </p>
          </div>
          <div>
            <p className={labelClass}>Category</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {item.InventoryCategory.name}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className={labelClass}>Item Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              className={inputClass}
            />
          </div>

          {/* Quantity + Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Quantity *</label>
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={set("quantity")}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Condition *</label>
              <select
                value={form.condition}
                onChange={set("condition")}
                className={inputClass}
              >
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="DAMAGED">Damaged</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 bg-[#0f5132] hover:bg-[#146c43] text-white font-bold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}