"use client";

// app/components/Inventory/CategoryModal.tsx

import { useEffect, useState } from "react";
import { X, Tags, Plus, Check, Trash2, Pencil } from "lucide-react";

import { inputStylesNoIcon, labelStyles } from "@/app/const/styles";
import { toast } from "sonner";
import { createInventoryCategory, deleteInventoryCategory, getInventoryCategories, updateInventoryCategory } from "@/app/features/inventory/inventory-actions";

type Category = { id: number; name: string; abbreviation: string };

type Props = {
  onClose: () => void;
};

type EditState = { id: number; name: string; abbreviation: string } | null;

export default function CategoryModal({ onClose }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [addName, setAddName] = useState("");
  const [addAbbr, setAddAbbr] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editState, setEditState] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    getInventoryCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // ── Add ────────────────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addAbbr.trim()) {
      toast.error("Name and abbreviation are required.");
      return;
    }
    setAdding(true);
    try {
      await createInventoryCategory({
        name: addName.trim(),
        abbreviation: addAbbr.trim().toUpperCase(),
      });
      toast.success("Category added");
      setAddName("");
      setAddAbbr("");
      load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to add category");
    } finally {
      setAdding(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const startEdit = (cat: Category) => {
    setEditState({ id: cat.id, name: cat.name, abbreviation: cat.abbreviation });
  };

  const handleSaveEdit = async () => {
    if (!editState) return;
    if (!editState.name.trim() || !editState.abbreviation.trim()) {
      toast.error("Name and abbreviation are required.");
      return;
    }
    setSaving(true);
    try {
      await updateInventoryCategory(editState.id, {
        name: editState.name.trim(),
        abbreviation: editState.abbreviation.trim().toUpperCase(),
      });
      toast.success("Category updated");
      setEditState(null);
      load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category? Items using it will be unaffected."))
      return;
    setDeletingId(id);
    try {
      await deleteInventoryCategory(id);
      toast.success("Category deleted");
      load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete category");
    } finally {
      setDeletingId(null);
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
              <Tags className="w-4 h-4 text-[#0f5132] dark:text-emerald-400" />
            </div>
            <h2 className="text-base font-bold text-foreground uppercase tracking-tight">
              Manage Categories
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">

          {/* ── Add form ── */}
          <form onSubmit={handleAdd} className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Add New Category
            </p>
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div className="space-y-3">
                <div>
                  <label className={labelStyles}>Category Name *</label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Computer Chair"
                    className={inputStylesNoIcon}
                  />
                </div>
                <div>
                  <label className={labelStyles}>Abbreviation *</label>
                  <input
                    type="text"
                    value={addAbbr}
                    onChange={(e) => setAddAbbr(e.target.value.toUpperCase())}
                    placeholder="e.g. CCH"
                    maxLength={6}
                    className={inputStylesNoIcon}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={adding}
                className="h-10 w-10 mb-0.5 flex items-center justify-center bg-[#0f5132] text-white rounded-xl hover:bg-[#146c43] transition-colors disabled:opacity-50 shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="border-t border-border" />

          {/* ── Category list ── */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Existing Categories ({categories.length})
            </p>

            {loading ? (
              <div className="flex items-center justify-center h-24">
                <div className="w-5 h-5 border-2 border-muted border-t-[#0f5132] rounded-full animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No categories yet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {categories.map((cat) =>
                  editState?.id === cat.id ? (
                    // ── Inline edit row ──
                    <div
                      key={cat.id}
                      className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border"
                    >
                      <input
                        type="text"
                        value={editState.name}
                        onChange={(e) =>
                          setEditState((s) => s && { ...s, name: e.target.value })
                        }
                        className={`${inputStylesNoIcon} flex-1 !py-1.5 !text-xs`}
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={editState.abbreviation}
                        onChange={(e) =>
                          setEditState(
                            (s) =>
                              s && {
                                ...s,
                                abbreviation: e.target.value.toUpperCase(),
                              }
                          )
                        }
                        maxLength={6}
                        className={`${inputStylesNoIcon} w-20 !py-1.5 !text-xs`}
                        placeholder="Abbr"
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="p-1.5 rounded-lg bg-[#0f5132] text-white hover:bg-[#146c43] transition-colors disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditState(null)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    // ── Display row ──
                    <div
                      key={cat.id}
                      className="flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 rounded-xl border border-transparent hover:border-border transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold tracking-wider shrink-0">
                          {cat.abbreviation}
                        </span>
                        <span className="text-sm font-semibold text-foreground truncate">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-[#0f5132] hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={deletingId === cat.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-border bg-muted/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all border border-transparent hover:border-border"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}