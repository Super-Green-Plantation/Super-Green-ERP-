"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Check,
  Copy,
  Clock,
  User,
  Building,
  Tag,
  ArrowRight,
  ShieldCheck,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";

interface ActivityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: any | null;
}

export default function ActivityDetailsModal({
  isOpen,
  onClose,
  activity,
}: ActivityDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "json">("summary");

  if (!activity) return null;

  const metadata = activity.metadata || {};
  const hasBeforeAfter =
    metadata.before &&
    metadata.after &&
    typeof metadata.before === "object" &&
    typeof metadata.after === "object";

  // Calculate field differences if before & after exist
  let fieldDiffs: { key: string; beforeVal: string; afterVal: string }[] = [];
  if (hasBeforeAfter) {
    const allKeys = Array.from(
      new Set([
        ...Object.keys(metadata.before || {}),
        ...Object.keys(metadata.after || {}),
      ])
    );
    for (const k of allKeys) {
      const b = metadata.before?.[k];
      const a = metadata.after?.[k];
      if (JSON.stringify(b) !== JSON.stringify(a)) {
        fieldDiffs.push({
          key: k,
          beforeVal: b !== undefined ? JSON.stringify(b) : "—",
          afterVal: a !== undefined ? JSON.stringify(a) : "—",
        });
      }
    }
  }

  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(activity, null, 2));
      setCopied(true);
      toast.success("JSON copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy JSON");
    }
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "UPDATE":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "DELETE":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "APPROVE":
        return "bg-green-600/10 text-green-700 dark:text-green-300 border-green-600/30";
      case "REJECT":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "LOGIN":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30";
    }
  };

  const performerName =
    activity.performedBy?.nameWithInitials ||
    activity.performedBy?.user?.name ||
    "System / Automated";
  const empNo = activity.performedBy?.empNo;
  const userRole = activity.performedBy?.user?.role;
  const email = activity.performedBy?.email || activity.performedBy?.user?.email;
  const branchName = activity.branch?.name || "Global / Unassigned";
  const formattedDate = new Date(activity.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl">
        {/* Header */}
        <div className="border-b border-border/70 p-5 bg-card/70">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getActionBadgeClass(
                  activity.action
                )}`}
              >
                {activity.action}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
                {activity.entity} #{activity.entityId ?? "N/A"}
              </span>
              <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1.5 font-medium">
                <Clock size={13} />
                {formattedDate}
              </span>
            </div>
            <DialogTitle className="text-lg font-bold text-foreground mt-2">
              Activity #{activity.id} Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Audit log record for action performed by {performerName}
            </DialogDescription>
          </DialogHeader>

          {/* Tab selector */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab("summary")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === "summary"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Changes & Context
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "json"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileCode size={13} /> Raw JSON
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === "summary" ? (
            <>
              {/* Performed By Card */}
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
                  <User size={14} className="text-primary" />
                  Performed By
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">User Name</span>
                    <span className="font-semibold text-foreground text-sm">{performerName}</span>
                  </div>
                  {empNo && (
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Employee No</span>
                      <span className="font-mono font-bold text-foreground">{empNo}</span>
                    </div>
                  )}
                  {userRole && (
                    <div>
                      <span className="text-muted-foreground block text-[11px]">System Role</span>
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <ShieldCheck size={13} className="text-primary" />
                        {userRole}
                      </span>
                    </div>
                  )}
                  {email && (
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Email</span>
                      <span className="text-foreground">{email}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Branch</span>
                    <span className="inline-flex items-center gap-1 text-foreground">
                      <Building size={13} className="text-muted-foreground" />
                      {branchName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Target Entity Card */}
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
                  <Tag size={14} className="text-primary" />
                  Target Entity
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Entity Type</span>
                    <span className="font-bold text-foreground">{activity.entity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Entity ID</span>
                    <span className="font-mono font-bold text-foreground">
                      {activity.entityId ? `#${activity.entityId}` : "None"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Action Type</span>
                    <span className="font-semibold text-foreground">{activity.action}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Diffs or Metadata */}
              {fieldDiffs.length > 0 ? (
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Modified Fields ({fieldDiffs.length})
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/60 text-muted-foreground">
                          <th className="py-2 px-2 font-semibold">Field</th>
                          <th className="py-2 px-2 font-semibold">Previous Value</th>
                          <th className="py-2 px-1 text-center w-6"></th>
                          <th className="py-2 px-2 font-semibold">New Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                        {fieldDiffs.map((diff) => (
                          <tr key={diff.key} className="hover:bg-muted/30">
                            <td className="py-2 px-2 font-bold text-foreground">{diff.key}</td>
                            <td className="py-2 px-2 text-rose-500 break-all bg-rose-500/5 rounded">
                              {diff.beforeVal}
                            </td>
                            <td className="py-2 px-1 text-center text-muted-foreground">
                              <ArrowRight size={12} className="inline" />
                            </td>
                            <td className="py-2 px-2 text-emerald-600 dark:text-emerald-400 break-all bg-emerald-500/5 rounded">
                              {diff.afterVal}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : metadata && Object.keys(metadata).length > 0 ? (
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
                    Metadata Content
                  </div>
                  <pre className="text-[11px] font-mono bg-muted/50 p-3 rounded-lg overflow-x-auto text-foreground">
                    {JSON.stringify(metadata, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No additional metadata recorded for this action.
                </div>
              )}
            </>
          ) : (
            <div className="relative">
              <button
                onClick={handleCopyJson}
                className="absolute top-2 right-2 flex items-center gap-1 text-[11px] font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded border border-border hover:bg-secondary/80 transition-colors z-10"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <pre className="text-xs font-mono bg-muted/60 p-4 rounded-xl overflow-x-auto max-h-[50vh] text-foreground border border-border">
                {JSON.stringify(activity, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
