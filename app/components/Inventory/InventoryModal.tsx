"use client";

// app/components/Inventory/InventoryModal.tsx

import { useEffect, useState } from "react";
import { X, Package, Check } from "lucide-react";
import { ItemCondition } from "@prisma/client";

import { getBranches } from "@/app/features/branches/actions";
import { inputStylesNoIcon, labelStyles } from "@/app/const/styles";
import { toast } from "sonner";
import { createInventoryItem, getInventoryCategories, updateInventoryItem } from "@/app/features/inventory/inventory-actions";

type Category = { id: number; name: string; abbreviation: string };
type Branch = { id: number; name: string };

export type InventoryModalItem = {
  id: number;
  name: string;
  quantity: number;
  condition: ItemCondition;
  notes: string | null;
  categoryId: number;
  branchId: number;
  itemCode: string;
  InventoryCategory: { name: string };
  Branch: { name: string };
};

type Props = {
  mode: "add" | "edit";
  initialData?: InventoryModalItem;
  onClose: () => void;
  onSuccess: () => void;
};

export default function InventoryModal({
  mode,
  initialData,
  onClose,
  onSuccess,
}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    branchId: initialData ? String(initialData.branchId) : "",
    categoryId: initialData ? String(initialData.categoryId) : "",
    name: initialData?.name ?? "",
    quantity: initialData ? String(initialData.quantity) : "1",
    condition: (initialData?.condition ?? "GOOD") as ItemCondition,
    notes: initialData?.notes ?? "",
  });

  useEffect(() => {
    Promise.all([getInventoryCategories(), getBranches()]).then(
      ([cats, brs]) => {
        setCategories(cats);
        setBranches(brs.map((b: any) => ({ id: b.id, name: b.name })));
      }
    );
  }, []);

  const set =
    (field: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.branchId || !form.categoryId || !form.name.trim()) {
      toast.error("Branch, category, and name are required.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "add") {
        const res = await createInventoryItem({
          branchId: Number(form.branchId),
          categoryId: Number(form.categoryId),
          name: form.name.trim(),
          quantity: Math.max(1, Number(form.quantity)),
          condition: form.condition,
          notes: form.notes.trim() || undefined,
        });
        if (!res.success) throw new Error("Failed to create item");
        toast.success("Item added successfully");
      } else {
        const res = await updateInventoryItem(initialData!.id, {
          name: form.name.trim(),
          quantity: Math.max(1, Number(form.quantity)),
          condition: form.condition,
          notes: form.notes.trim() || undefined,
        });
        if (!res.success) throw new Error("Failed to update item");
        toast.success("Item updated successfully");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 py-6 overflow-y-auto animate-in fade-in duration-300">
      <div
        className="w-full max-w-lg bg-card rounded-[2.5rem] shadow-2xl border border-border overflow-hidden relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <Package className="w-4 h-4 text-[#0f5132] dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground uppercase tracking-tight">
                {mode === "add" ? "Add Inventory Item" : "Edit Inventory Item"}
              </h2>
              {mode === "edit" && initialData && (
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  {initialData.itemCode}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all border border-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">

            {/* Edit mode: show read-only branch + category */}
            {mode === "edit" && initialData ? (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl border border-border">
                <div>
                  <p className={labelStyles}>Branch</p>
                  <p className="text-sm font-semibold text-foreground">
                    {initialData.Branch.name}
                  </p>
                </div>
                <div>
                  <p className={labelStyles}>Category</p>
                  <p className="text-sm font-semibold text-foreground">
                    {initialData.InventoryCategory.name}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Branch */}
                <div>
                  <label className={labelStyles}>Branch *</label>
                  <select
                    value={form.branchId}
                    onChange={set("branchId")}
                    className={inputStylesNoIcon}
                    required
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
                  <label className={labelStyles}>Category *</label>
                  <select
                    value={form.categoryId}
                    onChange={set("categoryId")}
                    className={inputStylesNoIcon}
                    required
                  >
                    <option value="">Select category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Name */}
            <div>
              <label className={labelStyles}>Item Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. Computer Chair – Black"
                className={inputStylesNoIcon}
                required
              />
            </div>

            {/* Quantity + Condition */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyles}>Quantity *</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={set("quantity")}
                  className={inputStylesNoIcon}
                  required
                />
              </div>
              <div>
                <label className={labelStyles}>Condition *</label>
                <select
                  value={form.condition}
                  onChange={set("condition")}
                  className={inputStylesNoIcon}
                >
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelStyles}>Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={set("notes")}
                rows={3}
                placeholder="Any additional details…"
                className={`${inputStylesNoIcon} resize-none`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-border bg-muted/20 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all border border-transparent hover:border-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {loading
                ? "Saving…"
                : mode === "add"
                ? "Add Item"
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}