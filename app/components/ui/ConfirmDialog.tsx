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
    danger: "bg-destructive text-destructive-foreground hover:opacity-90 shadow-lg shadow-destructive/20",
    warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20",
    default: "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20",
  }[variant];

  const iconBg = {
    danger: "bg-destructive/10",
    warning: "bg-amber-500/10",
    default: "bg-primary/10",
  }[variant];

  const iconColor = {
    danger: "text-destructive",
    warning: "text-amber-600",
    default: "text-primary",
  }[variant];

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl border border-border bg-card shadow-xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mb-4`}>
            <Trash2 className={`w-6 h-6 ${iconColor}`} />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground font-medium mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border flex flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-border text-muted-foreground text-xs font-bold uppercase tracking-widest hover:bg-muted transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${confirmStyles}`}
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
