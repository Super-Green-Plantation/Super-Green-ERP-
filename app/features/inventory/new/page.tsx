"use client";

// app/features/inventory/new/page.tsx

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Package, Building2, Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { getBranches } from "@/app/features/branches/actions";
import { inputClass, labelClass } from "@/app/const/inputStyles";
import { ItemCondition, InventoryCompany } from "@prisma/client";
import { createInventoryItem, getInventoryCategories } from "../inventory-actions";

type Category = { id: number; name: string; abbreviation: string };
type Branch = { id: number; name: string };

const COMPANY_OPTIONS: { value: InventoryCompany; label: string }[] = [
  { value: "SGP", label: "Super Green Plantation (SGP)" },
  { value: "MICRO_CREDIT", label: "Micro Credit (MC)" },
];

// ── Inline CategoryCombobox (same logic as in InventoryModal) ──
function CategoryCombobox({
  categories,
  selectedId,
  onSelect,
  inputClass: cls,
}: {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  inputClass: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = categories.find((c) => String(c.id) === selectedId);

  const filtered =
    query.trim() === ""
      ? categories
      : categories.filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.abbreviation.toLowerCase().includes(query.toLowerCase())
        );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePick = (cat: Category) => {
    onSelect(String(cat.id));
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`${cls} flex items-center gap-2 cursor-text pr-3`}
        onClick={() => { setOpen(true); setQuery(""); setTimeout(() => inputRef.current?.select(), 0); }}
      >
        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 min-w-0"
          placeholder={selected ? `${selected.name} (${selected.abbreviation})` : "Search categories…"}
          value={open ? query : ""}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(""); }}
        />
        {!open && selected && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 whitespace-nowrap">
            {selected.name}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-400 text-center">No categories match "{query}"</div>
          ) : (
            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(cat)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      String(cat.id) === selectedId
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-[#0f5132] dark:text-emerald-400"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-[10px] font-bold text-gray-400 ml-2 shrink-0">{cat.abbreviation}</span>
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

export default function NewInventoryItemPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    company: "SGP" as InventoryCompany,
    branchId: "",
    categoryId: "",
    name: "",
    quantity: "1",
    condition: "GOOD" as ItemCondition,
    notes: "",
  });

  const isMC = form.company === "MICRO_CREDIT";

  useEffect(() => {
    Promise.all([getInventoryCategories(), getBranches()]).then(([cats, brs]) => {
      setCategories(cats);
      setBranches(brs.map((b: any) => ({ id: b.id, name: b.name })));
    });
  }, []);

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCompanyChange = (company: InventoryCompany) => {
    setForm((prev) => ({
      ...prev,
      company,
      branchId: company === "MICRO_CREDIT" ? "" : prev.branchId,
    }));
  };

  const handleSubmit = async () => {
    if (!form.categoryId || !form.name.trim()) {
      setError("Category and name are required.");
      return;
    }
    if (!isMC && !form.branchId) {
      setError("Branch is required for SGP items.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await createInventoryItem({
        company: form.company,
        branchId: form.branchId ? Number(form.branchId) : null,
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
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Inventory Item</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Item code will be auto-generated on save</p>
          </div>
        </div>

        <div className="space-y-5">

          {/* Company toggle */}
          <div>
            <label className={labelClass}>Company *</label>
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              {COMPANY_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => handleCompanyChange(c.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    form.company === c.value
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-gray-700"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  {c.value === "SGP" ? "SGP" : "Micro Credit"}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
              {isMC
                ? "Item code prefix: MC/YY/CAT/NNN — no branch required"
                : "Item code prefix: SGP/YY/CAT/NNN — branch required"}
            </p>
          </div>

          {/* Branch — SGP only */}
          {!isMC && (
            <div>
              <label className={labelClass}>Branch *</label>
              <select value={form.branchId} onChange={set("branchId")} className={inputClass}>
                <option value="">Select branch…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Category — combobox */}
          <div>
            <label className={labelClass}>Category *</label>
            <CategoryCombobox
              categories={categories}
              selectedId={form.categoryId}
              onSelect={(id) => setForm((prev) => ({ ...prev, categoryId: id }))}
              inputClass={inputClass}
            />
            {!form.categoryId && (
              <p className="text-[10px] text-gray-400 mt-1 ml-1">
                Start typing to filter, or scroll to browse all categories
              </p>
            )}
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

          {/* Quantity + Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Quantity *</label>
              <input type="number" min={1} value={form.quantity} onChange={set("quantity")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Condition *</label>
              <select value={form.condition} onChange={set("condition")} className={inputClass}>
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