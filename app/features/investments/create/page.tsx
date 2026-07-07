"use client";

/**
 * Investment create/edit form — root orchestration component.
 *
 * This file owns all state, effects, and submit logic. Rendering is
 * delegated to sibling files in this folder:
 *   ui.tsx                 → SectionHeader, Field, ModeToggle (generic primitives)
 *   ClientSearch.tsx        → client search + locked view
 *   BeneficiaryPanel.tsx    → beneficiary card list / edit fields
 *   NomineePanel.tsx        → nominee card list / edit fields
 *   InvestmentDocuments.tsx → pay slip / proposal / agreement upload cards
 *   ApprovalSection.tsx     → management approve/reject panel
 *   types.ts                → shared types, constants, and helpers
 *
 * See README.md in this folder for the full data flow and the
 * beneficiary/nominee "existing vs new record" business rule — that logic
 * looks like it could be a bug if you don't know it's intentional.
 */

import { useEffect, useState, useRef } from "react";
import { getFinancialPlans } from "@/app/features/financial_plans/actions";
import { getClients } from "@/app/features/clients/actions";
import {
  createInvestmentForExistingClient,
  updateInvestment,
  updateInvestmentDocuments,
} from "@/app/features/investments/actions";
import { useSessionUser } from "@/app/hooks/useSessionUser";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import { User, DollarSign, Landmark, Users, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Back from "@/app/components/Buttons/Back";
import { investmentFormSchema } from "@/lib/validations/investment.schema";

import AdvisorHierarchy from "./AdvisorHierarchy";
import { SectionHeader, Field, ModeToggle } from "./ui";
import ClientSearch from "./ClientSearch";
import BeneficiaryPanel from "./BeneficiaryPanel";
import NomineePanel from "./NomineePanel";
import InvestmentDocuments from "./InvestmentDocuments";
import {
  InitialData,
  BeneficiaryMode,
  NomineeMode,
  BeneficiaryFields,
  NomineeFields,
  HierarchyState,
  EMPTY_BENEFICIARY,
  EMPTY_NOMINEE,
  beneficiaryFromRecord,
  nomineeFromRecord,
  isEqual,
  uploadToSupabase,
} from "./types";
import ApprovalSection from "./ApprovalSection";

export default function CreateInvestmentForm({
  onSuccess,
  investmentId,
  initialData,
  lockedClient,       // pass the full client object when in edit mode
  hideHeader,          // set true when embedding inside another page
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ---- Investment documents (create mode only) ----
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({
    paymentSlip: null,
    proposal: null,
    agreement: null,
  });
  const [docPreviews, setDocPreviews] = useState<Record<string, string | null>>({
    paymentSlip: null,
    proposal: null,
    agreement: null,
  });

  const handleDocFileChange = (key: string, file: File | null) => {
    setDocFiles(prev => ({ ...prev, [key]: file }));
    setDocPreviews(prev => {
      if (prev[key]) URL.revokeObjectURL(prev[key]!);
      return { ...prev, [key]: file ? URL.createObjectURL(file) : null };
    });
  };

  const { data: userData } = useSessionUser();
  const isManager = userData && ["ADMIN", "HR", "DEV"].includes(userData.role);

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
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<number | null>(
    initialData?.beneficiary?.id ?? null
  );
  const [originalBeneficiary, setOriginalBeneficiary] = useState<BeneficiaryFields | null>(
    initialData?.beneficiary ? beneficiaryFromRecord(initialData.beneficiary) : null
  );
  const [beneficiaryFields, setBeneficiaryFields] = useState<BeneficiaryFields>(
    initialData?.beneficiary ? beneficiaryFromRecord(initialData.beneficiary) : EMPTY_BENEFICIARY
  );
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
  const [hierarchy, setHierarchy] = useState<HierarchyState>({
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

  // `advisorOverridden` tracks whether the user manually picked an advisor
  // in AdvisorHierarchy. Until they do, `advisorId` auto-follows the
  // lowest-ranked (closest to client) hierarchy field that's set — see
  // HIERARCHY_PRIORITY above. Once overridden, auto-fill stops so we don't
  // clobber a deliberate manual choice.
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

  const handleBeneficiaryClear = () => {
    setSelectedBeneficiaryId(null);
    setBeneficiaryLabel(null);
    setOriginalBeneficiary(null);
    setBeneficiaryFields(EMPTY_BENEFICIARY);
  };

  const handleNomineeClear = () => {
    setSelectedNomineeId(null);
    setNomineeLabel(null);
    setOriginalNominee(null);
    setNomineeFields(EMPTY_NOMINEE);
  };

  // ---- submit logic ----
  // NOTE (business rule — see README.md): editing an "existing" beneficiary
  // or nominee's fields never mutates the original record. If the fields
  // still match the snapshot taken at selection time, we reuse the id.
  // If anything was edited, we fork a brand-new record instead and link
  // that to the investment. This is intentional, not a bug.
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
          proposalFormNo,
          ...hierarchy,
        });
        if (!res.success) { toast.error(res.error ?? "Failed"); return; }

        // ── Upload investment documents if any were selected ──────────────
        // Uploads happen *after* creation succeeds, because the storage
        // path is keyed by the newly created investment's id.
        const hasDocFiles = Object.values(docFiles).some(Boolean);
        if (hasDocFiles && res.investment?.id) {
          toast.loading("Uploading investment documents...", { id: "inv-doc-upload" });
          try {
            const uploaded: Record<string, string> = {};
            await Promise.all(
              Object.entries(docFiles).map(async ([key, file]) => {
                if (!file) return;
                const url = await uploadToSupabase(key, file);
                uploaded[key] = url;
              })
            );
            await updateInvestmentDocuments(res.investment.id, {
              paymentSlip: uploaded.paymentSlip,
              proposal: uploaded.proposal,
              agreement: uploaded.agreement,
            });
          } catch (uploadErr) {
            console.error("Document upload error:", uploadErr);
            toast.warning("Investment created but some documents failed to upload.");
          } finally {
            toast.dismiss("inv-doc-upload");
          }
        }

        toast.success("Investment created successfully");
      }
      onSuccess?.();
    } finally {
      setIsUpdating(false);
    }
  };

  const client = selectedClient ?? lockedClient;

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
                  {beneficiaryMode !== "none" && (
                    <BeneficiaryPanel
                      mode={beneficiaryMode}
                      client={client}
                      selectedId={selectedBeneficiaryId}
                      label={beneficiaryLabel}
                      fields={beneficiaryFields}
                      originalFields={originalBeneficiary}
                      onSelect={handleBeneficiarySelect}
                      onFieldChange={updater => setBeneficiaryFields(updater)}
                      onClear={handleBeneficiaryClear}
                    />
                  )}
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
                  {nomineeMode !== "none" && (
                    <NomineePanel
                      mode={nomineeMode}
                      client={client}
                      selectedId={selectedNomineeId}
                      label={nomineeLabel}
                      fields={nomineeFields}
                      originalFields={originalNominee}
                      onSelect={handleNomineeSelect}
                      onFieldChange={updater => setNomineeFields(updater)}
                      onClear={handleNomineeClear}
                    />
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Investment Documents — only shown in create mode */}
          {!isEditMode && (
            <InvestmentDocuments files={docFiles} previews={docPreviews} onChange={handleDocFileChange} />
          )}

          {/* Hierarchy — only visible to management roles */}
          {isManager && (
            <section className="w-full">
              {(!isEditMode || isApprovedOrRejected) && (
                <AdvisorHierarchy
                  values={hierarchy}
                  onChange={(key, id) => setHierarchy(p => ({ ...p, [key]: id }))}
                  initialMembers={hierarchyInitialMembers} />
              )}
            </section>
          )}

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
            <ApprovalSection
              investmentId={investmentId!}
              hierarchy={hierarchy}
              onHierarchyChange={(key, id) => setHierarchy(p => ({ ...p, [key]: id }))}
              advisorId={advisorId}
              reviewNote={reviewNote}
              onReviewNoteChange={setReviewNote}
              userData={userData}
              isUpdating={isUpdating}
              onSuccess={onSuccess}
            />
          )}

          {/* Submit */}
          {!isLockedForSubmitter && (
            <div className="pt-2 pb-12">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isUpdating}
                className={`w-full py-5 bg-[#0f5132] text-white rounded-xl font-bold text-[12px] flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.99] transition-all uppercase tracking-widest disabled:opacity-50`}
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
