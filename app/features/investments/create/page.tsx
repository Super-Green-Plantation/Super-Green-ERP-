"use client";

import { useEffect, useState, useRef } from "react";
import { getFinancialPlans } from "@/app/features/financial_plans/actions";
import { getClients } from "@/app/features/clients/actions";
import {
createInvestmentForExistingClient,
updateInvestment,
rejectInvestment,
} from "@/app/features/investments/actions";
import { useSessionUser } from "@/app/hooks/useSessionUser";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import {
  User, DollarSign, Landmark, Users, Plus, Pencil,
  Check, Loader2, BanknoteArrowUp, Search, X, Lock,
} from "lucide-react";
import { toast } from "sonner";
import Back from "@/app/components/Buttons/Back";
import { createPortal } from "react-dom";
import { investmentFormSchema } from "@/lib/validations/investment.schema";
import AdvisorHierarchy from "./AdvisorHierarchy";
import { approveInvestmentWithHierarchyLog } from "../../hr/salary/action";

type BeneficiaryMode = "existing" | "new" | "none";
type NomineeMode = "existing" | "new" | "none";

type BeneficiaryFields = {
  fullName: string; nic: string; phone: string;
  bankName: string; bankBranch: string; accountNo: string; relationship: string;
};
type NomineeFields = {
  fullName: string; nic: string;
  permanentAddress: string; postalAddress: string;
};

// ---------- sub-components (unchanged) ----------
function SectionHeader({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 mb-1">
      <div className="flex items-center gap-2 text-primary font-semibold">
        <span className="shrink-0">{icon}</span>
        <span className="text-[18px] font-semibold uppercase tracking-tight">{title}</span>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  readOnly,
  placeholder,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-muted-foreground uppercase block">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={e => onChange?.(e.target.value)}
          className={`w-full border rounded-lg text-sm py-2 px-3 transition-colors outline-none focus:ring-1 ${disabled || readOnly
              ? "bg-muted/50 border-border cursor-not-allowed text-muted-foreground focus:ring-0 focus:border-border"
              : error
                ? "bg-card border-red-500 focus:ring-red-500 focus:border-red-500"
                : "bg-card border-border focus:ring-primary focus:border-primary"
            }`}
        />
      </div>
      {error && (
        <p className="mt-1 ml-1 text-[10px] font-bold text-red-500 tracking-wide">{error}</p>
      )}
    </div>
  );
}

function ModeToggle({ value, onChange }: { value: string; onChange: (v: any) => void }) {
  return (
    <div className="flex p-1 bg-muted/50 rounded-lg gap-1">
      {(["none", "existing", "new"] as const).map(mode => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`px-4 py-1.5 text-[11px] font-semibold rounded-md transition-all uppercase ${value === mode
              ? "bg-primary text-primary-foreground shadow-sm font-bold"
              : "text-muted-foreground hover:bg-background hover:shadow-sm"
            }`}
        >
          {mode === "none" ? "Skip" : mode === "existing" ? "Use Existing" : "Add New"}
        </button>
      ))}
    </div>
  );
}

function ClientSearch({
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

// ---------- helpers ----------
const EMPTY_BENEFICIARY: BeneficiaryFields = {
  fullName: "", nic: "", phone: "", bankName: "", bankBranch: "", accountNo: "", relationship: "",
};
const EMPTY_NOMINEE: NomineeFields = {
  fullName: "", nic: "", permanentAddress: "", postalAddress: "",
};

function beneficiaryFromRecord(b: any): BeneficiaryFields {
  return {
    fullName: b.fullName ?? "", nic: b.nic ?? "", phone: b.phone ?? "",
    bankName: b.bankName ?? "", bankBranch: b.bankBranch ?? "",
    accountNo: b.accountNo ?? "", relationship: b.relationship ?? "",
  };
}
function nomineeFromRecord(n: any): NomineeFields {
  return {
    fullName: n.fullName ?? "", nic: n.nic ?? "",
    permanentAddress: n.permanentAddress ?? "", postalAddress: n.postalAddress ?? "",
  };
}
function isEqual<T extends object>(a: T, b: T) {
  return Object.keys(a).every(k => (a as any)[k] === (b as any)[k]);
}

// =========================================================
// PROPS
// =========================================================
type InitialData = {
  planId?: number;
  amount: number;
  investmentDate: string;
  investmentRates?: number[];
  beneficiary?: any;   // full record
  nominee?: any;       // full record
  proposalFormNo?: string;
  faId?: number | null;
  fmId?: number | null;
  bmId?: number | null;
  rmId?: number | null;
  zmId?: number | null;
  agmId?: number | null;
  ccoId?: number | null;
  fa?: any; fm?: any; bm?: any; rm?: any; zm?: any; agm?: any; cco?: any;
  approvalStatus?: string;
  reviewNote?: string;
  reviewedBy?: string;
};

export default function CreateInvestmentForm({
  onSuccess,
  investmentId,
  initialData,
  lockedClient,       // pass the full client object when in edit mode
  hideHeader,         // set true when embedding inside another page
}: {
  onSuccess?: () => void;
  investmentId?: number;
  initialData?: InitialData;
  lockedClient?: any;
  hideHeader?: boolean;
}) {
  const isEditMode = !!investmentId;

  const hierarchyInitialMembers = {
    faId: initialData?.fa ? { id: initialData.fa.id, nameWithInitials: initialData.fa.nameWithInitials, position: initialData.fa.position } : null,
    fmId: initialData?.fm ? { id: initialData.fm.id, nameWithInitials: initialData.fm.nameWithInitials, position: initialData.fm.position } : null,
    bmId: initialData?.bm ? { id: initialData.bm.id, nameWithInitials: initialData.bm.nameWithInitials, position: initialData.bm.position } : null,
    rmId: initialData?.rm ? { id: initialData.rm.id, nameWithInitials: initialData.rm.nameWithInitials, position: initialData.rm.position } : null,
    zmId: initialData?.zm ? { id: initialData.zm.id, nameWithInitials: initialData.zm.nameWithInitials, position: initialData.zm.position } : null,
    agmId: initialData?.agm ? { id: initialData.agm.id, nameWithInitials: initialData.agm.nameWithInitials, position: initialData.agm.position } : null,
    ccoId: initialData?.cco ? { id: initialData.cco.id, nameWithInitials: initialData.cco.nameWithInitials, position: initialData.cco.position } : null,
  };



  const [clients, setClients] = useState<any[]>([]);
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(lockedClient ?? null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});


  const { data: userData } = useSessionUser();
  const isManager = userData && ["ADMIN", "AGM", "REGIONAL_MANAGER", "BRANCH_MANAGER", "HR", "DEV", "ZONAL_MANAGER"].includes(userData.role);

  const approvalStatus = initialData?.approvalStatus || "PENDING";
  const isApprovedOrRejected = approvalStatus === "APPROVED" || approvalStatus === "REJECTED";
  const isLockedForSubmitter = false; // Restored update functionality
  const showApprovalSection = isEditMode && approvalStatus === "PENDING" && isManager;

  const [reviewNote, setReviewNote] = useState(initialData?.reviewNote || "");

  // Investment fields — pre-fill from initialData in edit mode
  const [planId, setPlanId] = useState(String(initialData?.planId ?? ""));
  const [amount, setAmount] = useState(String(initialData?.amount ?? ""));
  const [proposal, setProposal] = useState("");
  const [proposalFormNo, setProposalFormNo] = useState(initialData?.proposalFormNo ?? "");
  const [investmentDate, setInvestmentDate] = useState(
    initialData?.investmentDate ?? new Date().toISOString().slice(0, 10)
  );
  const [investmentRates, setInvestmentRates] = useState<number[]>(
    initialData?.investmentRates ?? []
  );
  const [totalHarvest, setTotalHarvest] = useState("");
  const [monthlyHarvest, setMonthlyHarvest] = useState("");

  // ---- Beneficiary ----
  const [beneficiaryMode, setBeneficiaryMode] = useState<BeneficiaryMode>(
    initialData?.beneficiary ? "existing" : "none"
  );
  // ID of the originally linked record (null = none or new)
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<number | null>(
    initialData?.beneficiary?.id ?? null
  );
  // Snapshot taken when user clicks a card — used for change-detection
  const [originalBeneficiary, setOriginalBeneficiary] = useState<BeneficiaryFields | null>(
    initialData?.beneficiary ? beneficiaryFromRecord(initialData.beneficiary) : null
  );
  // Editable fields (either blank for "new", or pre-filled from existing)
  const [beneficiaryFields, setBeneficiaryFields] = useState<BeneficiaryFields>(
    initialData?.beneficiary ? beneficiaryFromRecord(initialData.beneficiary) : EMPTY_BENEFICIARY
  );
  // Label shown on the edit panel ("Editing: Kamal Perera")
  const [beneficiaryLabel, setBeneficiaryLabel] = useState<string | null>(
    initialData?.beneficiary?.fullName ?? null
  );

  // ---- Nominee ----
  const [nomineeMode, setNomineeMode] = useState<NomineeMode>(
    initialData?.nominee ? "existing" : "none"
  );
  const [selectedNomineeId, setSelectedNomineeId] = useState<number | null>(
    initialData?.nominee?.id ?? null
  );
  const [originalNominee, setOriginalNominee] = useState<NomineeFields | null>(
    initialData?.nominee ? nomineeFromRecord(initialData.nominee) : null
  );
  const [nomineeFields, setNomineeFields] = useState<NomineeFields>(
    initialData?.nominee ? nomineeFromRecord(initialData.nominee) : EMPTY_NOMINEE
  );
  const [nomineeLabel, setNomineeLabel] = useState<string | null>(
    initialData?.nominee?.fullName ?? null
  );


  // ---- Hierarchy ----
  const [hierarchy, setHierarchy] = useState({
    faId: initialData?.faId ?? null,
    fmId: initialData?.fmId ?? null,
    bmId: initialData?.bmId ?? null,
    rmId: initialData?.rmId ?? null,
    zmId: initialData?.zmId ?? null,
    agmId: initialData?.agmId ?? null,
    ccoId: initialData?.ccoId ?? null,
  });

  const HIERARCHY_PRIORITY = [
    { key: "faId", label: "FA" },
    { key: "fmId", label: "FM" },
    { key: "bmId", label: "BM" },
    { key: "rmId", label: "RM" },
    { key: "zmId", label: "ZM" },
    { key: "agmId", label: "AGM" },
    { key: "ccoId", label: "CCO" },
  ] as const;

  const [advisorId, setAdvisorId] = useState<number | null>(null);
  const [advisorOverridden, setAdvisorOverridden] = useState(false);


  useEffect(() => {
    if (advisorOverridden) return;
    const auto = HIERARCHY_PRIORITY.find(({ key }) => hierarchy[key] != null);
    setAdvisorId(auto ? (hierarchy[auto.key] ?? null) : null);
  }, [hierarchy, advisorOverridden]);


  // When client changes, auto-fill from client if we aren't in edit mode or if client changed
  useEffect(() => {
    if (selectedClient && !lockedClient) {
      setHierarchy({
        faId: selectedClient.faId ?? null,
        fmId: selectedClient.fmId ?? null,
        bmId: selectedClient.bmId ?? null,
        rmId: selectedClient.rmId ?? null,
        zmId: selectedClient.zmId ?? null,
        agmId: selectedClient.agmId ?? null,
        ccoId: selectedClient.ccoId ?? null,
      });
    }
  }, [selectedClient, lockedClient]);

  const hierarchyDisplays = {
    faId: initialData?.fa?.nameWithInitials ?? undefined,
    fmId: initialData?.fm?.nameWithInitials ?? undefined,
    bmId: initialData?.bm?.nameWithInitials ?? undefined,
    rmId: initialData?.rm?.nameWithInitials ?? undefined,
    zmId: initialData?.zm?.nameWithInitials ?? undefined,
    agmId: initialData?.agm?.nameWithInitials ?? undefined,
    ccoId: initialData?.cco?.nameWithInitials ?? undefined,
  };

  useEffect(() => {
    if (!isEditMode) getClients().then(res => setClients(res.clients));
    getFinancialPlans().then(setPlans);
  }, [isEditMode]);

  // Auto-fill rate from plan (only when user picks a plan, don't override edit-mode initial rate)
  const rateOverriddenByUser = useRef(false);

  // ── plan selection: pre-fill year rates ─────────────────────────────────────

  useEffect(() => {
    if (!planId || rateOverriddenByUser.current) return;
    const plan = plans.find(p => p.id === Number(planId));
    if (!plan || isEditMode) return;

    const years = Math.ceil(plan.duration / 12);

    // plan.rate is Float[] — if it has the right count use it, else repeat first value
    const defaults: number[] =
      plan.rate.length === years
        ? plan.rate
        : Array(years).fill(plan.rate[0] ?? 0);

    setInvestmentRates(defaults);
  }, [planId, plans, isEditMode]);

  // ── harvest calculation: sum across years ────────────────────────────────────
  useEffect(() => {
    const plan = plans.find(p => p.id === Number(planId));
    const amt = Number(amount);
    const months = plan?.duration ?? 0;

    if (!amt || !months || investmentRates.length === 0) {
      setTotalHarvest(""); setMonthlyHarvest(""); return;
    }

    // each rate covers (duration / years) months
    const years = investmentRates.length;
    const monthsPerYear = months / years;

    const total = investmentRates.reduce((sum, rate) => {
      return sum + amt * (rate / 100) * (monthsPerYear / 12);
    }, 0);

    setTotalHarvest(total.toFixed(2));
    setMonthlyHarvest((total / months).toFixed(2));
  }, [amount, investmentRates, planId, plans]);


  // When switching away from "existing" mode, clear the snapshot/label
  const handleBeneficiaryModeChange = (mode: BeneficiaryMode) => {
    setBeneficiaryMode(mode);
    if (mode === "new") {
      setBeneficiaryFields(EMPTY_BENEFICIARY);
      setOriginalBeneficiary(null);
      setBeneficiaryLabel(null);
      setSelectedBeneficiaryId(null);
    }
    if (mode === "none") {
      setSelectedBeneficiaryId(null);
      setOriginalBeneficiary(null);
      setBeneficiaryLabel(null);
    }
  };

  const handleNomineeModeChange = (mode: NomineeMode) => {
    setNomineeMode(mode);
    if (mode === "new") {
      setNomineeFields(EMPTY_NOMINEE);
      setOriginalNominee(null);
      setNomineeLabel(null);
      setSelectedNomineeId(null);
    }
    if (mode === "none") {
      setSelectedNomineeId(null);
      setOriginalNominee(null);
      setNomineeLabel(null);
    }
  };

  // Selecting a beneficiary card: populate fields + take snapshot
  const handleBeneficiarySelect = (b: any) => {
    const fields = beneficiaryFromRecord(b);
    setSelectedBeneficiaryId(b.id);
    setBeneficiaryFields(fields);
    setOriginalBeneficiary(fields);
    setBeneficiaryLabel(b.fullName);
  };

  const handleNomineeSelect = (n: any) => {
    const fields = nomineeFromRecord(n);
    setSelectedNomineeId(n.id);
    setNomineeFields(fields);
    setOriginalNominee(fields);
    setNomineeLabel(n.fullName);
  };

  const handleClientSelect = (client: any | null) => {
    setSelectedClient(client);
    handleBeneficiaryModeChange("none");
    handleNomineeModeChange("none");
  };



  // ---- submit logic ----
  const resolveBeneficiary = () => {
    if (beneficiaryMode === "none") return { beneficiaryId: null, newBeneficiary: null };
    if (beneficiaryMode === "new") {
      return { beneficiaryId: null, newBeneficiary: beneficiaryFields.fullName ? beneficiaryFields : null };
    }
    // "existing" — but user may have edited fields
    if (selectedBeneficiaryId && originalBeneficiary && isEqual(beneficiaryFields, originalBeneficiary)) {
      return { beneficiaryId: selectedBeneficiaryId, newBeneficiary: null }; // unchanged
    }
    // changed → create new record
    return { beneficiaryId: null, newBeneficiary: beneficiaryFields.fullName ? beneficiaryFields : null };
  };

  const resolveNominee = () => {
    if (nomineeMode === "none") return { nomineeId: null, newNominee: null };
    if (nomineeMode === "new") {
      return { nomineeId: null, newNominee: nomineeFields.fullName ? nomineeFields : null };
    }
    if (selectedNomineeId && originalNominee && isEqual(nomineeFields, originalNominee)) {
      return { nomineeId: selectedNomineeId, newNominee: null };
    }
    return { nomineeId: null, newNominee: nomineeFields.fullName ? nomineeFields : null };
  };

  const handleSubmit = async () => {
    const client = selectedClient ?? lockedClient;
    if (!client) { toast.error("Please select a client"); return; }

    // ── Client-side Zod validation ────────────────────────────────────────────
    const formParsed = investmentFormSchema.safeParse({ amount, proposalFormNo, investmentDate });
    if (!formParsed.success) {
      const errs: Record<string, string> = {};
      formParsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      toast.error(formParsed.error.issues[0]?.message ?? "Please fix form errors.");
      return;
    }
    setFieldErrors({});

    const { beneficiaryId, newBeneficiary } = resolveBeneficiary();
    const { nomineeId, newNominee } = resolveNominee();

    setIsUpdating(true);
    try {
      if (isEditMode) {
        const res = await updateInvestment({
          investmentId: investmentId!,
          planId: planId ? Number(planId) : undefined,
          amount: Number(amount),
          investmentDate: new Date(investmentDate),
          investmentRates,
          beneficiaryId,
          nomineeId,
          newBeneficiary,
          newNominee,
          proposalFormNo,
          ...hierarchy,
        });
        if (!res.success) { toast.error(res.error ?? "Update failed"); return; }
        toast.success("Investment updated successfully");
      } else {
        const res = await createInvestmentForExistingClient({
          clientId: client.id,
          branchId: client.branchId,
          planId: planId ? Number(planId) : undefined,
          amount: Number(amount),
          investmentDate: new Date(investmentDate),
          investmentRates,
          beneficiaryId,
          nomineeId,
          newBeneficiary,
          newNominee,
          proposal,
          ...hierarchy,
        });
        if (!res.success) { toast.error(res.error ?? "Failed"); return; }
        toast.success("Investment created successfully");
      }
      onSuccess?.();
    } finally {
      setIsUpdating(false);
    }
  };

  const client = selectedClient ?? lockedClient;

  // ---- shared beneficiary edit panel ----
  const BeneficiaryEditPanel = (
    <div className="space-y-5">
      {/* Show card list only in create mode (existing tab) */}
      {beneficiaryMode === "existing" && !beneficiaryLabel && (
        <div className="grid grid-cols-1 gap-3">
          {client?.beneficiaries?.length > 0 ? client.beneficiaries.map((b: any) => (
            <div
              key={b.id}
              onClick={() => handleBeneficiarySelect(b)}
              className={`group flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                ${selectedBeneficiaryId === b.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
            >
              <div>
                <p className={`text-sm font-black ${selectedBeneficiaryId === b.id ? "text-primary" : "text-foreground"}`}>
                  {b.fullName}
                </p>
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-tight mt-1">
                  {[b.relationship, b.bankName, b.accountNo].filter(Boolean).join(" • ")}
                </p>
              </div>
              {selectedBeneficiaryId === b.id && (
                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}
            </div>
          )) : (
            <p className="text-sm text-muted-foreground italic font-medium">No saved beneficiaries found.</p>
          )}
        </div>
      )}

      {/* Edit fields — shown when: mode=new, OR mode=existing and a card was selected */}
      {(beneficiaryMode === "new" || (beneficiaryMode === "existing" && beneficiaryLabel)) && (
        <div className="space-y-4">
          {beneficiaryLabel && (
            <div className="p-3 bg-muted/30 rounded-lg border border-primary/20 flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Pencil className="w-[18px] h-[18px] text-primary" />
                <span className="text-[11px] font-bold text-foreground">
                  Editing: <span className="uppercase">{beneficiaryLabel}</span>
                </span>
                {originalBeneficiary && !isEqual(beneficiaryFields, originalBeneficiary) && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-bold">
                    MODIFIED
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedBeneficiaryId(null);
                  setBeneficiaryLabel(null);
                  setOriginalBeneficiary(null);
                  setBeneficiaryFields(EMPTY_BENEFICIARY);
                }}
                className="text-primary text-[10px] font-bold underline uppercase"
              >
                Change
              </button>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div className="sm:col-span-2">
              <Field label="Full Name" value={beneficiaryFields.fullName}
                onChange={v => setBeneficiaryFields(p => ({ ...p, fullName: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="NIC" value={beneficiaryFields.nic} onChange={v => setBeneficiaryFields(p => ({ ...p, nic: v }))} />
              <Field label="Relationship" value={beneficiaryFields.relationship} onChange={v => setBeneficiaryFields(p => ({ ...p, relationship: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" value={beneficiaryFields.phone} onChange={v => setBeneficiaryFields(p => ({ ...p, phone: v }))} />
              <Field label="Bank Name" value={beneficiaryFields.bankName} onChange={v => setBeneficiaryFields(p => ({ ...p, bankName: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bank Branch" value={beneficiaryFields.bankBranch} onChange={v => setBeneficiaryFields(p => ({ ...p, bankBranch: v }))} />
              <Field label="Account No." value={beneficiaryFields.accountNo} onChange={v => setBeneficiaryFields(p => ({ ...p, accountNo: v }))} />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const NomineeEditPanel = (
    <div className="space-y-5">
      {nomineeMode === "existing" && !nomineeLabel && (
        <div className="grid grid-cols-1 gap-3">
          {client?.nominees?.length > 0 ? client.nominees.map((n: any) => (
            <div
              key={n.id}
              onClick={() => handleNomineeSelect(n)}
              className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                ${selectedNomineeId === n.id
                  ? "border-accent bg-accent/5 ring-1 ring-accent"
                  : "border-border hover:border-accent/40 hover:bg-muted/30"
                }`}
            >
              <div>
                <p className={`text-sm font-black ${selectedNomineeId === n.id ? "text-accent" : "text-foreground"}`}>
                  {n.fullName}
                </p>
                <p className="text-[11px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">
                  {n.permanentAddress}
                </p>
              </div>
              {selectedNomineeId === n.id && (
                <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
                  <Check className="w-3.5 h-3.5 text-accent-foreground" />
                </div>
              )}
            </div>
          )) : (
            <p className="text-sm text-muted-foreground italic font-medium">No saved nominees found.</p>
          )}
        </div>
      )}

      {(nomineeMode === "new" || (nomineeMode === "existing" && nomineeLabel)) && (
        <div className="space-y-4">
          {nomineeLabel && (
            <div className="p-3 bg-muted/30 rounded-lg border border-primary/20 flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Pencil className="w-[18px] h-[18px] text-primary" />
                <span className="text-[11px] font-bold text-foreground">
                  Editing: <span className="uppercase">{nomineeLabel}</span>
                </span>
                {originalNominee && !isEqual(nomineeFields, originalNominee) && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-bold">
                    MODIFIED
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedNomineeId(null);
                  setNomineeLabel(null);
                  setOriginalNominee(null);
                  setNomineeFields(EMPTY_NOMINEE);
                }}
                className="text-primary text-[10px] font-bold underline uppercase"
              >
                Change
              </button>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div className="sm:col-span-2">
              <Field label="Full Name" value={nomineeFields.fullName}
                onChange={v => setNomineeFields(p => ({ ...p, fullName: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="NIC" value={nomineeFields.nic} onChange={v => setNomineeFields(p => ({ ...p, nic: v }))} />
              <Field label="Contact No." value={nomineeFields.postalAddress} onChange={v => setNomineeFields(p => ({ ...p, postalAddress: v }))} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Permanent Address</label>
              <textarea
                value={nomineeFields.permanentAddress}
                onChange={e => setNomineeFields(p => ({ ...p, permanentAddress: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm font-semibold bg-card border border-border rounded-md outline-none focus:border-[#0f5132] focus:ring-1 focus:ring-[#0f5132] transition-all resize-y min-h-[80px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Postal Address</label>
              <textarea
                value={nomineeFields.postalAddress}
                onChange={e => setNomineeFields(p => ({ ...p, postalAddress: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm font-semibold bg-card border border-border rounded-md outline-none focus:border-[#0f5132] focus:ring-1 focus:ring-[#0f5132] transition-all resize-y min-h-[80px]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 w-full md:max-w-8xl mx-auto pb-12">
      {/* Header — hidden when embedded inside another page */}
      {!hideHeader && (
        <div className="flex items-center gap-5 pb-8 border-b border-border">
          <Back />

          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {isEditMode ? "Update Investment" : "Create Investment"}
            </h1>
            <p className="text-sm text-muted-foreground font-semibold mt-1">
              {isEditMode ? "Edit investment details. Beneficiary/nominee changes create new records." : "Add a new investment for an existing client."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Client (Account Owner) */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <SectionHeader icon={<User className="w-[20px] h-[20px]" />} title="Account Owner" />
            <div className="space-y-4">
              <ClientSearch clients={clients} selected={selectedClient} onSelect={handleClientSelect} locked={isEditMode} />
              {client && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                  <Field label="Assigned Branch" value={client.branch?.name ?? "No Branch"} disabled />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Investment Details */}
        {client && (
          <section className="col-span-12 lg:col-span-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4 animate-in fade-in duration-500 h-full">
              <SectionHeader icon={<DollarSign className="w-[20px] h-[20px]" />} title="Investment Parameters" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Row 1 */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase block">
                    Financial Plan
                  </label>
                  <select
                    value={planId}
                    disabled={isLockedForSubmitter}
                    onChange={e => setPlanId(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg text-sm py-2 px-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Plan</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.rate.length === 1 ? `${p.rate[0]}%` : `${p.rate[0]}–${p.rate[p.rate.length - 1]}%`})
                      </option>
                    ))}
                  </select>
                </div>

                <Field label="Investment Date *" value={investmentDate} disabled={isLockedForSubmitter} onChange={setInvestmentDate} type="date" error={fieldErrors.investmentDate} />
                <Field label="Investment Amount (LKR) *" value={amount} disabled={isLockedForSubmitter} onChange={v => { setAmount(v); setFieldErrors(p => ({ ...p, amount: "" })); }} placeholder="0.00" type="number" error={fieldErrors.amount} />

                {/* Row 2 */}
                <Field label="Proposal No. *" value={proposalFormNo} disabled={isLockedForSubmitter} onChange={v => { setProposalFormNo(v); setFieldErrors(p => ({ ...p, proposal: "" })); }} type="text" error={fieldErrors.proposal} />
                <Field label="Monthly Harvest (LKR)" value={monthlyHarvest} placeholder="—" readOnly />
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase block">
                    Total Harvest
                  </label>
                  <input
                    type="text"
                    value={totalHarvest || "—"}
                    readOnly
                    className="w-full bg-card border border-border rounded-lg text-sm py-2 px-3 font-bold text-primary outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>

                {/* Row 3 */}
                <div className="space-y-2 md:col-span-3">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Rate per Year (%)
                  </label>
                  {investmentRates.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic font-medium py-1">
                      Select a plan to set rates.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {investmentRates.map((rate, i) => (
                        <div key={i} className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground/80 uppercase block">
                            Year {i + 1}
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={rate || ""}
                              disabled={isLockedForSubmitter}
                              onChange={(e) => {
                                const updated = [...investmentRates];
                                updated[i] = e.target.value === "" ? 0 : Number(e.target.value);
                                setInvestmentRates(updated);
                                rateOverriddenByUser.current = true;
                              }}
                              // [X-ONLY]: Hides native spinners across Chrome, Safari, and Firefox
                               className="w-full bg-card border border-border rounded-lg text-sm py-2 px-3 font-bold text-primary outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                              placeholder="0"
                            />
                            <span className="text-sm font-medium text-muted-foreground select-none ml-1">
                              %
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {client && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Beneficiary */}
            <section className="col-span-12 xl:col-span-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <SectionHeader
                  icon={<Landmark className="w-[20px] h-[20px]" />}
                  title="Beneficiary Details"
                  action={!isLockedForSubmitter && <ModeToggle value={beneficiaryMode} onChange={handleBeneficiaryModeChange} />}
                />
                <div className="pt-2">
                  {beneficiaryMode !== "none" && BeneficiaryEditPanel}
                </div>
              </div>
            </section>

            {/* Nominee */}
            <section className="col-span-12 xl:col-span-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <SectionHeader
                  icon={<Users className="w-[20px] h-[20px]" />}
                  title="Nominee Details"
                  action={!isLockedForSubmitter && <ModeToggle value={nomineeMode} onChange={handleNomineeModeChange} />}
                />
                <div className="pt-2">
                  {nomineeMode !== "none" && NomineeEditPanel}
                </div>
              </div>
            </section>
          </div>

          {/* Hierarchy */}
          <section className="w-full">
            {(!isEditMode || isApprovedOrRejected) && (
              <AdvisorHierarchy
                values={hierarchy}
                onChange={(key, id) => setHierarchy(p => ({ ...p, [key]: id }))}
                initialMembers={hierarchyInitialMembers} />
            )}
          </section>

          {isApprovedOrRejected && (
            <div className={`p-5 rounded-lg border ${approvalStatus === "APPROVED" ? "bg-green-500/10 border-green-500/20 text-green-700" : "bg-red-500/10 border-red-500/20 text-red-700"}`}>
              <p className="font-bold uppercase tracking-wider text-xs mb-1">
                {approvalStatus} by Management
              </p>
              {initialData?.reviewNote && (
                <p className="text-sm mt-2">{initialData.reviewNote}</p>
              )}
            </div>
          )}

          {showApprovalSection && (
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-8">
              <div className="px-6 py-4 border-b border-border">
                <SectionHeader icon={<Check className="w-[20px] h-[20px]" />} title="Management Approval Hierarchy" />
              </div>
              <div className="flex flex-col">
                <div className="p-6">
                  <AdvisorHierarchy
                    values={hierarchy}
                    onChange={(key, id) => setHierarchy(p => ({ ...p, [key]: id }))}
                    hideCard
                  />
                </div>

                <div className="px-6 pb-6 space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase block">
                    Review Note
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
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
                      onClick={async () => {
                        setIsApproving(true);
                        const res = await approveInvestmentWithHierarchyLog({
                          investmentId: investmentId!,
                          advisorId,
                          ...hierarchy,
                          reviewNote
                        });
                        setIsApproving(false);
                        if (res.success) {
                          toast.success("Investment successfully approved.");
                          onSuccess?.();
                        } else {
                          toast.error(res.error || "Failed to approve investment. Please try again.");
                        }
                      }}
                      disabled={isApproving || isRejecting || isUpdating}
                      className="flex-1 md:flex-none px-8 py-3 bg-[#0f5132] text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:brightness-95 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      APPROVE
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!reviewNote.trim()) {
                          toast.warning("A review note is required to reject this investment.");
                          return;
                        }
                        setIsRejecting(true);
                        const res = await rejectInvestment({
                          investmentId: investmentId!,
                          reviewNote
                        });
                        setIsRejecting(false);
                        if (res.success) {
                          toast.success("Investment has been successfully rejected.");
                          onSuccess?.();
                        } else {
                          toast.error(res.error || "Failed to reject investment.");
                        }
                      }}
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
          )}

          {/* Submit */}
          {!isLockedForSubmitter && (
            <div className="pt-2 pb-12">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isApproving || isRejecting || isUpdating}
                className={`w-full py-5 bg-[#0f5132] text-white rounded-xl font-bold text-[18px] flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.99] transition-all uppercase tracking-widest disabled:opacity-50`}
              >
                {isUpdating
                  ? <><Loader2 className="w-6 h-6 animate-spin" /> {isEditMode ? "Saving Updates..." : "Finalizing..."}</>
                  : <><Check className="w-6 h-6" /> {isEditMode ? "Update Investment Record" : "Create Investment Record"}</>
                }
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}