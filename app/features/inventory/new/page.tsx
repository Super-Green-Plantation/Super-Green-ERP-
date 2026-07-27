"use client";

// app/features/inventory/new/page.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Package } from "lucide-react";
import Link from "next/link";
import { getBranches } from "@/app/features/branches/actions";
import { inputClass, labelClass } from "@/app/const/inputStyles";
import { ItemCondition } from "@prisma/client";
import { createInventoryItem, getInventoryCategories } from "../inventory-actions";

type Category = { id: number; name: string; abbreviation: string };
type Branch = { id: number; name: string };

export default function NewInventoryItemPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    branchId: "",
    categoryId: "",
    name: "",
    quantity: "1",
    condition: "GOOD" as ItemCondition,
    notes: "",
  });

  useEffect(() => {
    Promise.all([getInventoryCategories(), getBranches()]).then(
      ([cats, brs]) => {
        setCategories(cats);
        setBranches(brs.map((b: any) => ({ id: b.id, name: b.name })));
      }
    );
  }, []);

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.branchId || !form.categoryId || !form.name.trim()) {
      setError("Branch, category, and name are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await createInventoryItem({
        branchId: Number(form.branchId),
        categoryId: Number(form.categoryId),
        name: form.name.trim(),
        quantity: Math.max(1, Number(form.quantity)),
        condition: form.condition,
        notes: form.notes.trim() || undefined,
      });
      if (res.success) {
        router.push("/features/inventory");
      } else {
        setError("Failed to create item. Please try again.");
      }
    } catch (e: any) {
      setError(e?.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen p-4 sm:p-8">
      {/* Back link */}
      <Link
        href="/features/inventory"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0f5132] dark:hover:text-emerald-400 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Inventory
      </Link>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 sm:p-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <Package className="w-5 h-5 text-[#0f5132] dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Add Inventory Item
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Item code will be auto-generated on save
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Branch */}
          <div>
            <label className={labelClass}>Branch *</label>
            <select
              value={form.branchId}
              onChange={set("branchId")}
              className={inputClass}
            >
              <option value="">Select branch…</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Category *</label>
            <select
              value={form.categoryId}
              onChange={set("categoryId")}
              className={inputClass}
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.abbreviation})
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className={labelClass}>Item Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. Computer Chair – Black"
              className={inputClass}
            />
          </div>

          {/* Quantity + Condition — side by side */}
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
              placeholder="Any additional details…"
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-[#0f5132] hover:bg-[#146c43] text-white font-bold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving…" : "Save Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
