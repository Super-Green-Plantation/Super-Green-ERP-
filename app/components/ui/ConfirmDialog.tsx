"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const confirmStyles = {
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20",
    warning: "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20",
    default: "bg-slate-900 hover:bg-slate-700 text-white shadow-lg shadow-slate-900/20",
  }[variant];

  const iconBg = {
    danger: "bg-red-100",
    warning: "bg-amber-100",
    default: "bg-slate-100",
  }[variant];

  const iconColor = {
    danger: "text-red-600",
    warning: "text-amber-600",
    default: "text-slate-600",
  }[variant];

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl border border-slate-200 shadow-xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mb-4`}>
            <Trash2 className={`w-6 h-6 ${iconColor}`} />
          </div>
          <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 font-medium mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${confirmStyles}`}
          >
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...</>
              : confirmLabel
            }
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}