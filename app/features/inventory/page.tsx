"use client";

// app/features/inventory/page.tsx

import { useEffect, useState, useCallback } from "react";
import { Package, Plus, Search, Pencil, Trash2, Filter, Building2 } from "lucide-react";

import { getBranches } from "@/app/features/branches/actions";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { UserAvatar } from "@/app/components/Dashboard/UserAvatar";
import InventoryModal, {
  InventoryModalItem,
} from "@/app/components/Inventory/InventoryModal";
import { ItemCondition, InventoryCompany } from "@prisma/client";
import { toast } from "sonner";
import { deleteInventoryItem, getInventoryItems } from "./inventory-actions";

type Item = Awaited<ReturnType<typeof getInventoryItems>>[number];
type Branch = { id: number; name: string };

const conditionBadge: Record<ItemCondition, string> = {
  GOOD: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  FAIR: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  DAMAGED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const COMPANIES: { value: InventoryCompany; label: string; short: string }[] = [
  { value: "SGP", label: "Super Green Plantation", short: "SGP" },
  { value: "MICRO_CREDIT", label: "Micro Credit", short: "Micro Credit" },
];

export default function InventoryPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<InventoryCompany>("SGP");
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [conditionFilter, setConditionFilter] = useState<ItemCondition | "ALL">("ALL");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [dbUser, setDbUser] = useState<any>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingItem, setEditingItem] = useState<InventoryModalItem | null>(null);

  // Load user + branches on mount
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(({ dbUser }) => setDbUser(dbUser))
      .catch(() => {});

    getBranches().then((data: any[]) => {
      const mapped = data.map((b) => ({ id: b.id, name: b.name }));
      setBranches(mapped);
      if (mapped.length > 0) setSelectedBranchId(mapped[0].id);
    });
  }, []);

  // When company switches, reset branch selection for SGP
  const handleCompanyChange = (company: InventoryCompany) => {
    setSelectedCompany(company);
    setSearchQuery("");
    setConditionFilter("ALL");
    if (company === "SGP" && branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    } else {
      setSelectedBranchId(null);
    }
  };

  // Load items whenever company or branch changes
  const loadItems = useCallback(() => {
    // For SGP, wait until a branch is selected
    if (selectedCompany === "SGP" && !selectedBranchId) return;
    setLoading(true);
    getInventoryItems({
      company: selectedCompany,
      branchId: selectedCompany === "SGP" ? selectedBranchId ?? undefined : undefined,
    })
      .then(setItems)
      .finally(() => setLoading(false));
  }, [selectedCompany, selectedBranchId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Open add modal
  const openAdd = () => {
    setEditingItem(null);
    setModalMode("add");
    setModalOpen(true);
  };

  // Open edit modal
  const openEdit = (item: Item) => {
    setEditingItem({
      id: item.id,
      company: item.company,
      name: item.name,
      quantity: item.quantity,
      condition: item.condition,
      notes: item.notes ?? null,
      categoryId: item.categoryId,
      branchId: item.branchId ?? null,
      itemCode: item.itemCode,
      InventoryCategory: { name: item.InventoryCategory.name },
      Branch: item.Branch ? { name: item.Branch.name } : null,
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

  const filtered = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      item.name.toLowerCase().includes(q) ||
      item.itemCode.toLowerCase().includes(q) ||
      item.InventoryCategory.name.toLowerCase().includes(q);
    const matchCondition =
      conditionFilter === "ALL" || item.condition === conditionFilter;
    return matchSearch && matchCondition;
  });

  const totalQty = filtered.reduce((sum, i) => sum + i.quantity, 0);
  const displayName = dbUser?.name ?? "Admin User";
  const displayRole = dbUser?.role ?? "ADMIN";
  const isMC = selectedCompany === "MICRO_CREDIT";

  return (
    <>
      <div className="max-w-[1400px] mx-auto min-h-screen p-3 sm:p-6 lg:p-8 font-sans transition-colors duration-300 w-full">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
              Inventory Management
            </h1>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {totalQty} units across {filtered.length} line items
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <ThemeToggle />
            <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:flex flex-col justify-center">
                <span className="text-sm font-bold leading-none text-gray-900 dark:text-gray-100">
                  {displayName}
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  {displayRole}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 shrink-0">
                <UserAvatar seed={displayName} className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Company Toggle */}
        <div className="flex items-center gap-2 mb-5 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl w-fit">
          {COMPANIES.map((c) => (
            <button
              key={c.value}
              onClick={() => handleCompanyChange(c.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs transition-all whitespace-nowrap ${
                selectedCompany === c.value
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-gray-700"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              {c.short}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0f5132] text-white font-semibold text-xs rounded-lg hover:bg-[#146c43] transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option value="ALL">All Conditions</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </div>
        </div>

        {/* Branch Tabs — only shown for SGP */}
        {!isMC && (
          <div className="w-full overflow-x-auto no-scrollbar pb-1 mb-5">
            <div className="flex items-center gap-2 min-w-max">
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`px-4 py-2 rounded-xl transition-all font-semibold whitespace-nowrap text-sm ${
                    selectedBranchId === b.id
                      ? "bg-[#0f5132] text-white shadow-md shadow-green-900/20"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MC label — shown instead of branch tabs */}
        {isMC && (
          <div className="flex items-center gap-2 mb-5">
            <span className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800/40">
              Micro Credit — All Items
            </span>
          </div>
        )}

        {/* Search */}
        <div className="relative w-full border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 shadow-sm flex items-center mb-5">
          <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="Search by name, code, or category…"
            className="w-full bg-transparent border-none py-2.5 px-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-0 outline-none"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#0f5132] rounded-full animate-spin" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">
              Loading inventory…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
            <Package className="w-10 h-10 opacity-30" />
            <p className="text-sm font-semibold">No items found</p>
            <button
              onClick={openAdd}
              className="text-xs font-bold text-[#0f5132] dark:text-emerald-400 hover:underline"
            >
              + Add the first item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {[
                    "Item Code",
                    "Name",
                    "Category",
                    ...(isMC ? [] : ["Branch"]),
                    "Qty",
                    "Condition",
                    "Notes",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {item.itemCode}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.InventoryCategory.name}
                    </td>
                    {/* Branch column only for SGP */}
                    {!isMC && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {item.Branch?.name ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${conditionBadge[item.condition]}`}
                      >
                        {item.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-[200px] truncate">
                      {item.notes ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#0f5132] hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
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

      {/* Inline Modal */}
      {modalOpen && (
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