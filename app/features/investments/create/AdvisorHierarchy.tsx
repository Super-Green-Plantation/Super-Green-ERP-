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
  { key: "faId", label: "FA", placeholder: "Search Financial Advisor..." },
  { key: "fmId", label: "FM", placeholder: "Search Field Manager..." },
  { key: "bmId", label: "BM", placeholder: "Search Branch Manager..." },
  { key: "rmId", label: "RM", placeholder: "Search Regional Manager..." },
  { key: "zmId", label: "ZM", placeholder: "Search Zone Manager..." },
  { key: "agmId", label: "AGM", placeholder: "Search Asst. General Manager..." },
  { key: "ccoId", label: "CCO", placeholder: "Search Chief Commercial Officer..." },
];

// ── Field-level search input ───────────────────────────────────────────────────

type MemberSearchInputProps = {
  slot: HierarchySlot;
  value: number | null;
  onChange: (id: number | null, member: MemberSearchResult | null) => void;
  initialMember?: { id: number; nameWithInitials: string; position: { title: string } } | null;
};

const MemberSearchInput = ({ slot, value, onChange, initialMember }: MemberSearchInputProps) => {
  const [query, setQuery] = useState(initialMember?.nameWithInitials ?? "");
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<MemberSearchResult | null>(
    initialMember ? (initialMember as MemberSearchResult) : null
  );
  const lockedRef = useRef(!!initialMember);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // True while the field still holds its pre-populated value untouched

  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-1";
  const badgeClass = "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-primary/10 text-primary/70";

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
    "w-full pl-10 pr-3 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:bg-card focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50";

  useEffect(() => {
    if (lockedRef.current) return;   // ← pre-populated, user hasn't typed yet
    if (selected) return;
    clearTimeout(debounceRef.current ?? undefined);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => clearTimeout(debounceRef.current ?? undefined);
  }, [query, selected, search]);


  return (
    <div ref={containerRef} className="relative">
      <label className={labelClass}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
        <span className="inline-flex items-center gap-2">
          {slot.label}
          {selected && (
            <span className={badgeClass}>{selected?.position?.title ? selected.position.title : null}</span>
          )}
        </span>
      </label>

      <div className="relative">
        {/* Search icon / loader */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {loading
            ? <Loader2 className="w-[18px] h-[18px] animate-spin" />
            : <Search className="w-[18px] h-[18px]" />
          }
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            lockedRef.current = false;       // ← user is now typing, unlock search
            setQuery(e.target.value);
            if (selected) { setSelected(null); onChange(null, null); }
          }}
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder={slot.placeholder}
          className={inputClass}
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
        <div className="absolute z-50 mt-1.5 w-full bg-card border border-border/50 rounded-xl shadow-lg ">
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
  initialMembers?: Partial<Record<keyof HierarchyState, { id: number; nameWithInitials: string; position: { title: string } } | null>>;
  hideCard?: boolean;
};

const AdvisorHierarchy = ({ values, onChange, initialMembers = {}, hideCard }: AdvisorHierarchyProps) => {
  const GridContent = (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 ${hideCard ? '' : 'p-6'}`}>
      {SLOTS.map((slot) => (
        <div key={slot.key} className={slot.key === "ccoId" ? "col-span-1 md:col-span-2" : ""}>
          <MemberSearchInput
            slot={slot}
            value={values[slot.key]}
            initialMember={initialMembers[slot.key]}
            onChange={(id) => onChange(slot.key, id)}
          />
        </div>
      ))}
    </div>
  );

  if (hideCard) return GridContent;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col mt-6">
      <div className="px-6 py-4 border-b border-border flex items-center gap-2 text-primary font-semibold">
        <Network className="w-[20px] h-[20px]" />
        <span className="text-[18px] font-semibold uppercase tracking-tight">
          Advisor Hierarchy
        </span>
      </div>
      {GridContent}
    </div>
  );
};

export default AdvisorHierarchy;