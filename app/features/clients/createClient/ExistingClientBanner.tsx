"use client";

import { LockedClient } from "@/app/types/client";
import { Lock, X, User, Building2, CreditCard } from "lucide-react";

export const ExistingClientBanner = ({
  client,
  onUnlock,
}: {
  client: LockedClient;
  onUnlock: () => void;
}) => {
  return (
    <div className="relative rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Lock icon */}
      <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Lock className="w-5 h-5 text-primary" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
          Existing Client — Investment Mode
        </p>
        <p className="text-sm font-bold text-foreground truncate">{client.fullName}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1.5">
          {client.nic && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
              <CreditCard className="w-3 h-3" /> {client.nic}
            </span>
          )}
          {client.branch?.name && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
              <Building2 className="w-3 h-3" /> {client.branch.name}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
            <User className="w-3 h-3" /> Client #{client.id}
          </span>
        </div>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 shrink-0">
        {(client.beneficiaries?.length ?? 0) > 0 && (
          <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
            {client.beneficiaries!.length} beneficiar{client.beneficiaries!.length === 1 ? "y" : "ies"}
          </span>
        )}
        {(client.nominees?.length ?? 0) > 0 && (
          <span className="px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest">
            {client.nominees!.length} nominee{client.nominees!.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Dismiss — goes back to new-client mode */}
      <button
        type="button"
        onClick={onUnlock}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        title="Switch to new client registration"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};