"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import Heading from "@/app/components/Heading";
import AdministrationTabs from "../AdministrationTabs";
import { getActivityLogs } from "./action";
import ActivityDetailsModal from "./ActivityDetailsModal";
import {
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Shield,
  Layers,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  Trash2,
  PlusCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

export default function ActivityLogsPage() {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [action, setAction] = useState<string>("ALL");
  const [entity, setEntity] = useState<string>("ALL");
  const [branchId, setBranchId] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Data states
  const [logs, setLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [todayCount, setTodayCount] = useState(0);
  const [branches, setBranches] = useState<{ id: number; name: string; code: string }[]>([]);

  // Selected activity for modal
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch activity logs
  const loadLogs = useCallback(() => {
    setLoading(true);
    startTransition(async () => {
      try {
        const res = await getActivityLogs({
          page,
          pageSize,
          search: debouncedSearch,
          action,
          entity,
          branchId,
          dateRange,
        });

        if (res.success && res.data) {
          setLogs(res.data.logs || []);
          setTotalCount(res.data.totalCount || 0);
          setTotalPages(res.data.totalPages || 1);
          setTodayCount(res.data.todayCount || 0);
          if (res.data.branches?.length) {
            setBranches(res.data.branches);
          }
        } else {
          toast.error(res.error || "Failed to load activity logs");
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred while fetching activity logs");
      } finally {
        setLoading(false);
      }
    });
  }, [page, pageSize, debouncedSearch, action, entity, branchId, dateRange]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setAction("ALL");
    setEntity("ALL");
    setBranchId("ALL");
    setDateRange("all");
    setPage(1);
  };

  const getActionBadge = (act: string) => {
    switch (act) {
      case "CREATE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <PlusCircle size={11} /> CREATE
          </span>
        );
      case "UPDATE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
            <RefreshCw size={10} /> UPDATE
          </span>
        );
      case "DELETE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
            <Trash2 size={11} /> DELETE
          </span>
        );
      case "APPROVE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-green-600/30 bg-green-600/10 px-2.5 py-0.5 text-[11px] font-bold text-green-700 dark:text-green-300">
            <CheckCircle2 size={11} /> APPROVE
          </span>
        );
      case "REJECT":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
            <AlertCircle size={11} /> REJECT
          </span>
        );
      case "LOGIN":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400">
            <User size={11} /> LOGIN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/30 bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
            {act}
          </span>
        );
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const getActivitySummary = (log: any) => {
    const meta = log.metadata || {};
    if (meta.event === "hierarchy_snapshot_at_approval") {
      return "Hierarchy snapshot captured on approval";
    }
    if (meta.event === "hierarchy_manual_override") {
      return "Manual hierarchy override applied";
    }
    if (meta.action === "documents_uploaded_via_token") {
      return "Client documents uploaded via secure token";
    }
    if (meta.deletedFieldValue) {
      return `Deleted ${meta.deletedFieldValue} document`;
    }
    if (meta.updatedFields && Array.isArray(meta.updatedFields)) {
      return `Updated fields: ${meta.updatedFields.join(", ")}`;
    }
    if (meta.before && meta.after && typeof meta.before === "object" && typeof meta.after === "object") {
      const changedKeys = Object.keys(meta.after).filter(
        (k) => JSON.stringify(meta.before[k]) !== JSON.stringify(meta.after[k])
      );
      if (changedKeys.length > 0) {
        return `Modified ${changedKeys.length} field${changedKeys.length > 1 ? "s" : ""} (${changedKeys.slice(0, 3).join(", ")}${changedKeys.length > 3 ? "..." : ""})`;
      }
    }
    if (meta.deleted) {
      return `Removed ${log.entity} record`;
    }
    return `${log.action} ${log.entity}${log.entityId ? ` #${log.entityId}` : ""}`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      {/* Top Administration Tabs */}
      <AdministrationTabs />

      <div className="space-y-4 px-3 pb-10 pt-4 sm:px-5 lg:px-7">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/70 pb-4">
          <div>
            <Heading>Activity Log</Heading>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
              Audit trail & user activity tracker across all system modules
            </p>
          </div>
          <button
            onClick={() => loadLogs()}
            disabled={loading || isPending}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Activities</span>
              <Layers size={15} className="text-primary" />
            </div>
            <p className="mt-2 text-2xl font-black tabular-nums text-foreground">{totalCount}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Historical logged actions</p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Actions Today</span>
              <Sparkles size={15} className="text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
              {todayCount}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Events recorded since midnight</p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Current Filter</span>
              <Filter size={15} className="text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-black tabular-nums text-blue-600 dark:text-blue-400">
              {logs.length}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Visible on this page</p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Branches</span>
              <Building size={15} className="text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
              {branches.length}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Active branch locations</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search Input */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search user, ID, entity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Action Filter */}
            <div>
              <select
                aria-label="Filter by action"
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
              >
                <option value="ALL">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="APPROVE">APPROVE</option>
                <option value="REJECT">REJECT</option>
                <option value="LOGIN">LOGIN</option>
              </select>
            </div>

            {/* Entity Filter */}
            <div>
              <select
                aria-label="Filter by entity"
                value={entity}
                onChange={(e) => {
                  setEntity(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
              >
                <option value="ALL">All Entities</option>
                <option value="CLIENT">CLIENT</option>
                <option value="INVESTMENT">INVESTMENT</option>
                <option value="COMMISSION">COMMISSION</option>
                <option value="PROFIT">PROFIT</option>
                <option value="MEMBER">MEMBER</option>
                <option value="BRANCH">BRANCH</option>
                <option value="FINANCIAL_PLAN">FINANCIAL PLAN</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <select
                aria-label="Filter by branch"
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code || `#${b.id}`})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <select
                aria-label="Filter by date range"
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Past 7 Days</option>
                <option value="30days">Past 30 Days</option>
              </select>
            </div>
          </div>

          {/* Active filters / Reset button */}
          {(search || action !== "ALL" || entity !== "ALL" || branchId !== "ALL" || dateRange !== "all") && (
            <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
              <span className="text-muted-foreground text-[11px]">Active filters applied</span>
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Activity Table */}
        <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 uppercase tracking-wider text-[10px] font-bold text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">When</th>
                  <th className="py-3 px-4">Who (Performer)</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity & ID</th>
                  <th className="py-3 px-4">Description / Summary</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-3 w-20 bg-muted rounded" /></td>
                      <td className="py-4 px-4"><div className="h-3 w-32 bg-muted rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-16 bg-muted rounded-full" /></td>
                      <td className="py-4 px-4"><div className="h-3 w-24 bg-muted rounded" /></td>
                      <td className="py-4 px-4"><div className="h-3 w-44 bg-muted rounded" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-6 w-14 bg-muted rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Clock size={32} className="mx-auto text-muted-foreground/60" />
                        <p className="font-semibold text-foreground">No activity logs found</p>
                        <p className="text-[11px]">
                          No user actions match the current filter criteria or have been recorded yet.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const performerName =
                      log.performedBy?.nameWithInitials ||
                      log.performedBy?.user?.name ||
                      "System Automated";
                    const empNo = log.performedBy?.empNo;
                    const role = log.performedBy?.user?.role;
                    const branchName = log.branch?.name;
                    const date = new Date(log.createdAt);

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        {/* When */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-foreground">
                            {formatRelativeTime(log.createdAt)}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock size={10} />
                            {date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            {date.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        {/* Who */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                              {performerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-1.5">
                                {performerName}
                                {empNo && (
                                  <span className="font-mono text-[10px] bg-muted px-1.5 py-0.2 rounded text-muted-foreground font-normal">
                                    {empNo}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                {role && <span>{role}</span>}
                                {role && branchName && <span>•</span>}
                                {branchName && (
                                  <span className="flex items-center gap-0.5">
                                    <Building size={10} /> {branchName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>

                        {/* Entity & ID */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-foreground flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">
                              {log.entity}
                            </span>
                            {log.entityId && (
                              <span className="text-muted-foreground font-mono text-[11px]">
                                #{log.entityId}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                          <span className="text-foreground font-medium">
                            {getActivitySummary(log)}
                          </span>
                        </td>

                        {/* Details Button */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedActivity(log);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-xs hover:bg-muted transition-colors"
                          >
                            <Eye size={12} />
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && totalCount > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border px-4 py-3 bg-card/60">
              <div className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {(page - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(page * pageSize, totalCount)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{totalCount}</span> entries
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Show</span>
                  <select
                    aria-label="Items per page"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    aria-label="Previous page"
                    className="p-1 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-2 text-xs font-semibold text-foreground">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    aria-label="Next page"
                    className="p-1 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <ActivityDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedActivity(null);
        }}
        activity={selectedActivity}
      />
    </div>
  );
}
