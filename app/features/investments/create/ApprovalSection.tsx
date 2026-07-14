"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "./ui";
import AdvisorHierarchy from "./AdvisorHierarchy";
import { approveInvestmentWithHierarchyLog } from "../../hr/salary/action";
import { rejectInvestment } from "@/app/features/investments/actions";
import { HierarchyState } from "./types";

export default function ApprovalSection({
  investmentId,
  hierarchy,
  onHierarchyChange,
  advisorId,
  reviewNote,
  onReviewNoteChange,
  userData,
  isUpdating,
  onSuccess,
}: {
  investmentId: number;
  hierarchy: HierarchyState;
  onHierarchyChange: (key: keyof HierarchyState, id: number | null) => void;
  advisorId: number | null;
  reviewNote: string;
  onReviewNoteChange: (v: string) => void;
  userData: any;
  isUpdating: boolean;
  onSuccess?: () => void;
}) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    const res = await approveInvestmentWithHierarchyLog({
      investmentId,
      advisorId,
      ...hierarchy,
      reviewNote,
    });
    setIsApproving(false);
    if (res.success) {
      if (res.commissionError) {
        toast.success("Investment approved.");
        toast.warning(`Commission processing needs attention: ${res.commissionError}. Use the Commissions page to process manually.`);
      } else {
        toast.success("Investment approved and commissions processed.");
      }
      onSuccess?.();
    } else {
      toast.error(res.error || "Failed to approve investment. Please try again.");
    }
  };

  const handleReject = async () => {
    if (!reviewNote.trim()) {
      toast.warning("A review note is required to reject this investment.");
      return;
    }
    setIsRejecting(true);
    const res = await rejectInvestment({ investmentId, reviewNote });
    setIsRejecting(false);
    if (res.success) {
      toast.success("Investment has been successfully rejected.");
      onSuccess?.();
    } else {
      toast.error(res.error || "Failed to reject investment.");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-border">
        <SectionHeader icon={<Check className="w-[20px] h-[20px]" />} title="Management Approval Hierarchy" />
      </div>
      <div className="flex flex-col">
        <div className="p-6">
          <AdvisorHierarchy
            values={hierarchy}
            onChange={onHierarchyChange}
            hideCard
          />
        </div>

        <div className="px-6 pb-6 space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase block">
            Review Note
          </label>
          <textarea
            value={reviewNote}
            onChange={e => onReviewNoteChange(e.target.value)}
            placeholder="Add comments or rejection reason..."
            className="w-full bg-background border border-border rounded-lg text-sm py-3 px-4 focus:ring-1 focus:ring-primary focus:border-primary shadow-inner outline-none transition-all"
            rows={3}
          />
        </div>

        {/* Quick Actions Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 text-[11px] font-bold text-muted-foreground uppercase">
            Reviewing as: <span className="text-foreground ml-1">{userData?.name}</span>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving || isRejecting || isUpdating}
              className="flex-1 md:flex-none px-8 py-3 bg-[#0f5132] text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:brightness-95 active:scale-95 transition-all disabled:opacity-50"
            >
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              APPROVE
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={isApproving || isRejecting || isUpdating}
              className="flex-1 md:flex-none px-8 py-3 bg-red-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:brightness-95 active:scale-95 transition-all disabled:opacity-50"
            >
              {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              REJECT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}