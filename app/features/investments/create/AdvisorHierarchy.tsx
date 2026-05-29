"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Network, Search, X, Loader2 } from "lucide-react";
import { searchMembersByName } from "@/app/features/clients/actions";

// ── Types ──────────────────────────────────────────────────────────────────────

type MemberSearchResult = {
  id: number;
  nameWithInitials: string;
  empNo: string;
  position: { title: string };
};

type HierarchySlot = {
  key: "faId" | "fmId" | "bmId" | "rmId" | "zmId" | "agmId" | "ccoId";
  label: string;
  placeholder: string;
};

const SLOTS: HierarchySlot[] = [
  { key: "faId",  label: "FA",  placeholder: "Search Financial Advisor..."   },
  { key: "fmId",  label: "FM",  placeholder: "Search Field Manager..."       },
  { key: "bmId",  label: "BM",  placeholder: "Search Branch Manager..."      },
  { key: "rmId",  label: "RM",  placeholder: "Search Regional Manager..."    },
  { key: "zmId",  label: "ZM",  placeholder: "Search Zone Manager..."        },
  { key: "agmId", label: "AGM", placeholder: "Search Asst. General Manager..."},
  { key: "ccoId", label: "CCO", placeholder: "Search Chief Commercial Officer..."},
];

// ── Field-level search input ───────────────────────────────────────────────────

type MemberSearchInputProps = {
  slot: HierarchySlot;
  value: number | null;
  onChange: (id: number | null, member: MemberSearchResult | null) => void;
  initialDisplay?: string;
};

const MemberSearchInput = ({
  slot,
  value,
  onChange,
  initialDisplay,
}: MemberSearchInputProps) => {
  const [query, setQuery]         = useState(initialDisplay ?? "");
  const [results, setResults]     = useState<MemberSearchResult[]>([]);
  const [loading, setLoading]     = useState(false);
  const [open, setOpen]           = useState(false);
  const [selected, setSelected]   = useState<MemberSearchResult | null>(null);
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);  const containerRef              = useRef<HTMLDivElement>(null);

  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 ml-1 block";
  const badgeClass = "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-primary/10 text-primary/70";

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await searchMembersByName(q);
setResults(res.filter((m) => m.nameWithInitials !== null) as MemberSearchResult[]);
setOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected) return;
    clearTimeout(debounceRef.current ?? undefined);
debounceRef.current = setTimeout(() => search(query), 300);
    return () => clearTimeout(debounceRef.current ?? undefined);
  }, [query, selected, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (member: MemberSearchResult) => {
    setSelected(member);
    setQuery(`${member.nameWithInitials}`);
    setOpen(false);
    onChange(member.id, member);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    setResults([]);
    onChange(null, null);
  };

  const inputClass =
    "bg-background/50 border border-border/50 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:bg-background outline-none transition-all w-full placeholder:text-muted-foreground/30 font-medium pr-10";

  return (
    <div ref={containerRef} className="relative">
      <label className={labelClass}>
        <span className="inline-flex items-center gap-2">
          {slot.label}
          {selected && (
            <span className={badgeClass}>{selected.position.title}</span>
          )}
        </span>
      </label>

      <div className="relative">
        {/* Search icon / loader */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none">
          {loading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Search className="w-3.5 h-3.5" />
          }
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected) { setSelected(null); onChange(null, null); }
          }}
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder={slot.placeholder}
          className={`${inputClass} pl-9`}
        />

        {/* Clear button */}
        {(selected || query) && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden">
          {results.map((member) => (
            <button
              key={member.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(member); }}
              className="w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors flex items-center justify-between gap-3 group"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {member.nameWithInitials}
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-medium">
                  {member.empNo}
                </span>
              </div>
              <span className={`${badgeClass} shrink-0`}>
                {member.position.title}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && !loading && results.length === 0 && query.trim() && (
        <div className="absolute z-50 mt-1.5 w-full bg-card border border-border/50 rounded-xl shadow-lg px-4 py-3">
          <p className="text-[11px] text-muted-foreground/50 font-medium">No members found</p>
        </div>
      )}
    </div>
  );
};

// ── Main card ──────────────────────────────────────────────────────────────────

type HierarchyState = {
  faId: number | null;
  fmId: number | null;
  bmId: number | null;
  rmId: number | null;
  zmId: number | null;
  agmId: number | null;
  ccoId: number | null;
};

type AdvisorHierarchyProps = {
  values: HierarchyState;
  onChange: (key: keyof HierarchyState, id: number | null) => void;
  displays?: Partial<Record<keyof HierarchyState, string>>;
};

const AdvisorHierarchy = ({ values, onChange, displays = {} }: AdvisorHierarchyProps) => {
  return (
    <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden text-card-foreground mt-6">
      {/* Header */}
      <div className="px-8 py-5 border-b border-border/30 flex items-center gap-3">
        <Network className="w-4 h-4 text-muted-foreground/60" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground opacity-60">
          Advisor Hierarchy (Investment Specific)
        </h2>
      </div>

      {/* Fields */}
      <div className="sm:p-6 p-4 space-y-6">
        {SLOTS.map((slot) => (
          <MemberSearchInput
            key={slot.key}
            slot={slot}
            value={values[slot.key]}
            initialDisplay={displays[slot.key]}
            onChange={(id) => onChange(slot.key, id)}
          />
        ))}
      </div>
    </div>
  );
};

export default AdvisorHierarchy;