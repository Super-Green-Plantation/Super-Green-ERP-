"use client";

/**
 * RecordPaymentModal
 * Records a premium payment against one installment slot.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, DollarSign } from "lucide-react";
import { recordProposalPayment } from "@/app/features/monthly-proposals/actions";
import { inputStylesNoIcon, labelStyles } from "@/app/const/styles";

interface PaymentSlot {
  id: number;
  installmentNo: number;
  dueDate: string;
  monthlyProposalId: number;
}

interface Props {
  slot: PaymentSlot;
  defaultAmount: number;   // proposal.premium
  onClose: () => void;
}

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque"];

export default function RecordPaymentModal({ slot, defaultAmount, onClose }: Props) {
  const queryClient = useQueryClient();

  const [paidAmount,    setPaidAmount]    = useState<number>(defaultAmount);
  const [paidAt,        setPaidAt]        = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [receiptNo,     setReceiptNo]     = useState<string>("");
  const [notes,         setNotes]         = useState<string>("");

  const mutation = useMutation({
    mutationFn: () =>
      recordProposalPayment({
        paymentId:     slot.id,
        paidAmount,
        paidAt,
        receiptNo:     receiptNo || undefined,
        paymentMethod,
        notes:         notes     || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-payments", slot.monthlyProposalId] });
      queryClient.invalidateQueries({ queryKey: ["monthly-proposal",  slot.monthlyProposalId] });
      toast.success(`Installment #${slot.installmentNo} recorded`);
      onClose();
    },
    onError: (e: any) => toast.error(e.message || "Failed to record payment"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paidAmount <= 0) { toast.error("Amount must be greater than 0"); return; }
    mutation.mutate();
  };

  const dueDisplay = new Date(slot.dueDate).toLocaleDateString("en-LK", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <div>
              <h2 className="font-bold text-sm text-card-foreground">
                Record Payment — Installment #{slot.installmentNo}
              </h2>
              <p className="text-xs text-muted-foreground">Due: {dueDisplay}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form className="p-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={labelStyles}>Amount Paid (Rs.) *</label>
            <input
              type="number"
              step="any"
              min={1}
              required
              value={paidAmount}
              onChange={(e) => setPaidAmount(Number(e.target.value))}
              className={inputStylesNoIcon}
            />
          </div>

          <div>
            <label className={labelStyles}>Payment Date *</label>
            <input
              type="date"
              required
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className={inputStylesNoIcon}
            />
          </div>

          <div>
            <label className={labelStyles}>Payment Method *</label>
            <div className="flex gap-2 flex-wrap">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    paymentMethod === m
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/20 text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelStyles}>Receipt No. (optional)</label>
            <input
              type="text"
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
              className={inputStylesNoIcon}
              placeholder="e.g. RC-2025-001"
            />
          </div>

          <div>
            <label className={labelStyles}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`${inputStylesNoIcon} resize-none`}
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50 shadow"
            >
              {mutation.isPending ? "Saving…" : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}