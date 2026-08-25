"use client";

// app/features/inventory/page.tsx

import { useEffect, useState, useCallback } from "react";
import { Package, Plus, Search, Pencil, Trash2, Filter, Building2, Tags } from "lucide-react";
import { ItemCondition, InventoryCompany } from "@prisma/client";
import { toast } from "sonner";

import { getBranches } from "@/app/features/branches/actions";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { UserAvatar } from "@/app/components/Dashboard/UserAvatar";
import InventoryModal, { InventoryModalItem } from "@/app/components/Inventory/InventoryModal";
import CategoryModal from "@/app/components/Inventory/CategoryModal";
import { deleteInventoryItem, getInventoryItems } from "./inventory-actions";

type Item = Awaited<ReturnType<typeof getInventoryItems>>[number];
type Branch = { id: number; name: string };

const conditionBadge: Record<ItemCondition, string> = {
  GOOD:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  FAIR:    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  DAMAGED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const COMPANIES: { value: InventoryCompany; short: string }[] = [
  { value: "SGP",          short: "SGP"          },
  { value: "MICRO_CREDIT", short: "Micro Credit" },
];

export default function InventoryPage() {
  const [branches,         setBranches]         = useState<Branch[]>([]);
  const [selectedCompany,  setSelectedCompany]  = useState<InventoryCompany>("SGP");
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [items,            setItems]            = useState<Item[]>([]);
  const [loading,          setLoading]          = useState(false);
  const [searchQuery,      setSearchQuery]      = useState("");
  const [conditionFilter,  setConditionFilter]  = useState<ItemCondition | "ALL">("ALL");
  const [deletingId,       setDeletingId]       = useState<number | null>(null);
  const [dbUser,           setDbUser]           = useState<any>(null);

  // Modal
  const [modalOpen,   setModalOpen]   = useState(false);
  const [modalMode,   setModalMode]   = useState<"add" | "edit">("add");
  const [editingItem, setEditingItem] = useState<InventoryModalItem | null>(null);
  const [mounted,     setMounted]     = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);

  // ── Load user + branches once on mount ──────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    fetch("/api/me")
      .then((r) => r.json())
      .then(({ dbUser }) => setDbUser(dbUser))
      .catch(() => {});

    getBranches().then((data: any[]) => {
      const mapped: Branch[] = data.map((b) => ({ id: b.id, name: b.name }));
      setBranches(mapped);
      if (mapped.length > 0) setSelectedBranchId(mapped[0].id);
    });
  }, []);

  // ── Switch company ───────────────────────────────────────────────────────────
  const handleCompanyChange = (company: InventoryCompany) => {
    setSelectedCompany(company);
    setSearchQuery("");
    setConditionFilter("ALL");
    if (company === "SGP") {
      setSelectedBranchId((prev) => prev ?? (branches[0]?.id ?? null));
    } else {
      setSelectedBranchId(null);
    }
  };

  // ── Load items ───────────────────────────────────────────────────────────────
  const loadItems = useCallback(() => {
    if (selectedCompany === "SGP" && selectedBranchId === null) return;

    setLoading(true);
    getInventoryItems({
      company:  selectedCompany,
      branchId: selectedCompany === "SGP" ? (selectedBranchId ?? undefined) : undefined,
    })
      .then(setItems)
      .finally(() => setLoading(false));
  }, [selectedCompany, selectedBranchId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingItem(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingItem({
      id:                item.id,
      company:           item.company,
      name:              item.name,
      quantity:          item.quantity,
      condition:         item.condition,
      notes:             item.notes ?? null,
      categoryId:        item.categoryId,
      branchId:          item.branchId ?? null,
      itemCode:          item.itemCode,
      InventoryCategory: { name: item.InventoryCategory.name },
      Branch:            item.Branch ? { name: item.Branch.name } : null,
    });
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this inventory item?")) return;
    setDeletingId(id);
    try {
      await deleteInventoryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const filtered = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      item.name.toLowerCase().includes(q) ||
      item.itemCode.toLowerCase().includes(q) ||
      item.InventoryCategory.name.toLowerCase().includes(q);
    const matchCondition = conditionFilter === "ALL" || item.condition === conditionFilter;
    return matchSearch && matchCondition;
  });

  const totalQty    = filtered.reduce((sum, i) => sum + i.quantity, 0);
  const displayName = dbUser?.name ?? "Admin User";
  const displayRole = dbUser?.role ?? "ADMIN";
  const isMC        = selectedCompany === "MICRO_CREDIT";

  return (
    <>
      <div className="mx-auto min-h-screen w-full max-w-[1480px] space-y-5 px-4 pb-10 pt-5 font-sans transition-colors duration-300 sm:px-7 sm:pt-8">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="saas-eyebrow">Operations workspace</p>
            <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-foreground sm:text-[30px]">
              Inventory Management
            </h1>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {totalQty} units across {filtered.length} line items
            </p>
          </div>
          
        </div>

        {/* ── Company Toggle ──────────────────────────────────────────────────── */}
        <div className="flex w-fit items-center gap-1 rounded-xl bg-muted/60 p-1">
          {COMPANIES.map((c) => (
            <button
              key={c.value}
              onClick={() => handleCompanyChange(c.value)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                selectedCompany === c.value
                  ? "bg-card text-primary shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              {c.short}
            </button>
          ))}
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/70 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold tracking-wide text-primary-foreground shadow-md shadow-primary/15 transition-all hover:brightness-105"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </button>
          <button
            onClick={() => setCatModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold tracking-wide text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <Tags className="w-3.5 h-3.5" />
            Categories
          </button>

          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value as any)}
              className="cursor-pointer bg-transparent text-xs font-semibold text-foreground outline-none"
            >
              <option value="ALL">All Conditions</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="DAMAGED">Damaged</option>
            </select>
                    </div>
        </div>

        {/* ── Branch Tabs (SGP only) ──────────────────────────────────────────── */}
        {!isMC && (
          <div className="w-full overflow-x-auto pb-1">
            {branches.length === 0 ? (
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-9 w-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex min-w-max items-center gap-2 rounded-xl bg-muted/40 p-1">
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBranchId(b.id)}
                    className={`rounded-lg px-4 py-2 text-sm font-bold transition-all whitespace-nowrap ${
                      selectedBranchId === b.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MC label ────────────────────────────────────────────────────────── */}
        {isMC && (
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-primary/15 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
              Micro Credit — All Items
            </span>
          </div>
        )}

        {/* ── Search ──────────────────────────────────────────────────────────── */}
        <div className="relative flex w-full items-center rounded-2xl border border-border/70 bg-card shadow-sm">
          <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="Search by name, code, or category…"
            className="w-full border-none bg-transparent px-2 py-3 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
          />
        </div>

        {/* ── Table ───────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-border/70 bg-card shadow-sm">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#0f5132] rounded-full animate-spin" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">
              Loading inventory…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border text-muted-foreground">
            <Package className="w-10 h-10 opacity-30" />
            <p className="text-sm font-semibold">No items found</p>
            <button onClick={openAdd} className="text-xs font-bold text-primary hover:underline">
              + Add the first item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-[0_10px_35px_rgba(34,43,72,0.05)]">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/35">
                  {["Item Code", "Name", "Category", ...(isMC ? [] : ["Branch"]), "Qty", "Condition", "Notes", ""].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-primary/[0.025]">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.itemCode}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{item.InventoryCategory.name}</td>
                    {!isMC && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{item.Branch?.name ?? "—"}</td>
                    )}
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">{item.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${conditionBadge[item.condition]}`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-[200px] truncate">{item.notes ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mounted && catModalOpen && (
        <CategoryModal onClose={() => setCatModalOpen(false)} />
      )}

      {mounted && modalOpen && (
        <InventoryModal
          mode={modalMode}
          initialData={editingItem ?? undefined}
          defaultCompany={selectedCompany}
          defaultBranchId={selectedCompany === "SGP" ? selectedBranchId : null}
          onClose={() => setModalOpen(false)}
          onSuccess={loadItems}
        />
      )}
    </>
  );
}