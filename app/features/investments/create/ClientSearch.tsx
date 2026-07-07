"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, X, Lock, Check } from "lucide-react";

export default function ClientSearch({
  clients, selected, onSelect, locked,
}: {
  clients: any[]; selected: any | null;
  onSelect: (client: any | null) => void; locked?: boolean;
}) {
  const [query, setQuery] = useState(selected?.fullName ?? "");
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  // keep query in sync when locked client is pre-filled
  useEffect(() => {
    if (locked && selected) setQuery(selected.fullName);
  }, [locked, selected]);

  const filtered = !locked && query.trim().length > 0
    ? clients.filter(c =>
      c.fullName.toLowerCase().includes(query.toLowerCase()) ||
      (c.nic ?? "").toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8)
    : [];

  const updateDropdownPosition = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (locked && selected) {
    return (
      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
          Client (Locked)
        </label>
        <div className="flex items-center gap-3 px-4 py-3 border border-muted bg-muted/30 rounded-lg">
          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-bold text-foreground">{selected.fullName}</p>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
              {[selected.nic, selected.branch?.name].filter(Boolean).join(" • ")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
        Search Client *
      </label>
      <div
        ref={inputRef}
        className="flex items-center border border-border rounded-lg bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all"
      >
        <Search className="ml-3 w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={query}
          placeholder="Type client name or NIC..."
          onChange={e => {
            setQuery(e.target.value);
            updateDropdownPosition();
            setOpen(true);
            if (!e.target.value) onSelect(null);
          }}
          onFocus={() => {
            if (query.trim().length > 0) { updateDropdownPosition(); setOpen(true); }
          }}
          className="flex-1 px-3 py-2 text-sm font-semibold text-foreground outline-none bg-transparent"
        />
        {query && (
          <button type="button" onClick={() => { onSelect(null); setQuery(""); setOpen(false); }}
            className="mr-3 text-muted-foreground hover:text-destructive">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && createPortal(
        <div style={dropdownStyle} className="bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          {filtered.map(c => (
            <button key={c.id} type="button" onClick={e => e.preventDefault()}
              onMouseDown={() => { onSelect(c); setQuery(c.fullName); setOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div>
                <p className="text-sm font-bold text-foreground">{c.fullName}</p>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight mt-0.5">
                  {[c.nic, c.branch?.name].filter(Boolean).join(" • ")}
                </p>
              </div>
              {selected?.id === c.id && <Check className="w-4 h-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
