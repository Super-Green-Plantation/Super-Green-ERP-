"use client";

// app/components/Inventory/InventoryModal.tsx

import { useEffect, useRef, useState } from "react";
import { X, Package, Check, Building2, ChevronDown, Search } from "lucide-react";
import { ItemCondition, InventoryCompany } from "@prisma/client";

import { getBranches } from "@/app/features/branches/actions";
import { inputStylesNoIcon, labelStyles } from "@/app/const/styles";
import { toast } from "sonner";
import {
  createInventoryItem,
  getInventoryCategories,
  updateInventoryItem,
} from "@/app/features/inventory/inventory-actions";

type Category = { id: number; name: string; abbreviation: string };
type Branch = { id: number; name: string };

export type InventoryModalItem = {
  id: number;
  company: InventoryCompany;
  name: string;
  quantity: number;
  condition: ItemCondition;
  notes: string | null;
  categoryId: number;
  branchId: number | null;
  itemCode: string;
  InventoryCategory: { name: string };
  Branch: { name: string } | null;
};

type Props = {
  mode: "add" | "edit";
  initialData?: InventoryModalItem;
  defaultCompany?: InventoryCompany;
  defaultBranchId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
};

const COMPANY_OPTIONS: { value: InventoryCompany; label: string }[] = [
  { value: "SGP", label: "Super Green Plantation (SGP)" },
  { value: "MICRO_CREDIT", label: "Micro Credit (MC)" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CategoryCombobox — type to filter, click to select, shows all when empty
// ─────────────────────────────────────────────────────────────────────────────
function CategoryCombobox({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = categories.find((c) => String(c.id) === selectedId);

  // Filter: show all when query empty, otherwise filter by name or abbreviation
  const filtered =
    query.trim() === ""
      ? categories
      : categories.filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.abbreviation.toLowerCase().includes(query.toLowerCase())
        );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // If user typed but didn't pick anything, reset display to selected name
        if (selected) setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected]);

  const handleInputClick = () => {
    setOpen(true);
    setQuery(""); // always show full list when opening
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handlePick = (cat: Category) => {
    onSelect(String(cat.id));
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div
        className={`${inputStylesNoIcon} flex items-center gap-2 cursor-text pr-3`}
        onClick={handleInputClick}
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground min-w-0"
          placeholder={selected ? `${selected.name} (${selected.abbreviation})` : "Search categories…"}
          value={open ? query : ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={handleInputClick}
          // Show selected name as placeholder when closed
          style={{ caretColor: open ? undefined : "transparent" }}
        />
        {/* Show selected badge when closed */}
        {!open && selected && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 whitespace-nowrap">
            {selected.name}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground text-center">
              No categories match "{query}"
            </div>
          ) : (
            <ul className="max-h-48 overflow-y-auto custom-scrollbar py-1">
              {filtered.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(cat)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-muted/60 ${
                      String(cat.id) === selectedId
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-[#0f5132] dark:text-emerald-400"
                        : "text-foreground"
                    }`}
                  >
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground ml-2 shrink-0">
                      {cat.abbreviation}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────────────────────
export default function InventoryModal({
  mode,
  initialData,
  defaultCompany = "SGP",
  defaultBranchId = null,
  onClose,
  onSuccess,
}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    company: (initialData?.company ?? defaultCompany) as InventoryCompany,
    branchId: initialData?.branchId
      ? String(initialData.branchId)
      : defaultBranchId
      ? String(defaultBranchId)
      : "",
    categoryId: initialData ? String(initialData.categoryId) : "",
    name: initialData?.name ?? "",
    quantity: initialData ? String(initialData.quantity) : "1",
    condition: (initialData?.condition ?? "GOOD") as ItemCondition,
    notes: initialData?.notes ?? "",
  });

  const isMC = form.company === "MICRO_CREDIT";

  useEffect(() => {
    Promise.all([getInventoryCategories(), getBranches()]).then(
      ([cats, brs]) => {
        setCategories(cats);
        setBranches(brs.map((b: any) => ({ id: b.id, name: b.name })));
      }
    );
  }, []);

  const handleCompanyChange = (company: InventoryCompany) => {
    setForm((prev) => ({
      ...prev,
      company,
      branchId: company === "MICRO_CREDIT" ? "" : prev.branchId,
    }));
  };

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId || !form.name.trim()) {
      toast.error("Category and name are required.");
      return;
    }
    if (!isMC && !form.branchId) {
      toast.error("Branch is required for SGP items.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "add") {
        const res = await createInventoryItem({
          company: form.company,
          branchId: form.branchId ? Number(form.branchId) : undefined,
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

            {mode === "add" ? (
              <>
                {/* Company toggle */}
                <div>
                  <label className={labelStyles}>Company *</label>
                  <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-xl border border-border">
                    {COMPANY_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleCompanyChange(c.value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          form.company === c.value
                            ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm border border-border"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        {c.value === "SGP" ? "SGP" : "Micro Credit"}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
                    {isMC
                      ? "Item code prefix: MC/YY/CAT/NNN — no branch required"
                      : "Item code prefix: SGP/YY/CAT/NNN — branch required"}
                  </p>
                </div>

                {/* Branch — SGP only */}
                {!isMC && (
                  <div>
                    <label className={labelStyles}>Branch *</label>
                    <select
                      value={form.branchId}
                      onChange={set("branchId")}
                      className={inputStylesNoIcon}
                      required={!isMC}
                    >
                      <option value="">Select branch…</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Category — combobox */}
                <div>
                  <label className={labelStyles}>Category *</label>
                  <CategoryCombobox
                    categories={categories}
                    selectedId={form.categoryId}
                    onSelect={(id) => setForm((prev) => ({ ...prev, categoryId: id }))}
                  />
                  {!form.categoryId && (
                    <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                      Start typing to filter, or scroll to browse all categories
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* Edit mode — read-only summary */
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl border border-border">
                <div>
                  <p className={labelStyles}>Company</p>
                  <p className="text-sm font-semibold text-foreground">
                    {initialData?.company === "MICRO_CREDIT" ? "Micro Credit" : "SGP"}
                  </p>
                </div>
                {initialData?.Branch && (
                  <div>
                    <p className={labelStyles}>Branch</p>
                    <p className="text-sm font-semibold text-foreground">
                      {initialData.Branch.name}
                    </p>
                  </div>
                )}
                <div className={initialData?.Branch ? "col-span-2" : ""}>
                  <p className={labelStyles}>Category</p>
                  <p className="text-sm font-semibold text-foreground">
                    {initialData?.InventoryCategory.name}
                  </p>
                </div>
              </div>
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
              {loading ? "Saving…" : mode === "add" ? "Add Item" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}