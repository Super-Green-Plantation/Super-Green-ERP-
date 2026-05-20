"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBranches } from "../../branches/actions";
import { getFinancialPlans } from "../../financial_plans/actions";
import { useFormContext } from "@/app/context/FormContext";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import { Branch } from "@/app/types/branch";
import SignaturePad from "@/app/components/Client/SignaturePad";
import { searchClients } from "../actions";
import { Lock } from "lucide-react";
import { LockedClient } from "@/app/types/client";

const SRI_LANKA_NIC = /^(\d{9}[VXvx]|\d{12})$/;
const SRI_LANKA_PHONE = /^\d{9,10}$/;

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1 ml-1 text-[10px] font-bold text-red-500 tracking-wide">
      {message}
    </p>
  ) : null;

type ClientMatch = Awaited<ReturnType<typeof searchClients>>;

// ── Duplicate/match banner ────────────────────────────────────────────────────

const DuplicateBanner = ({
  client,
  onDismiss,
  onUseExisting,
  onViewClient,
}: {
  client: NonNullable<ClientMatch>;
  onDismiss: () => void;
  onUseExisting: (c: NonNullable<ClientMatch>) => void;
  onViewClient: (id: number) => void;
}) => (
  <div className="md:col-span-2 rounded-[1.5rem] border border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-700/40 p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
          Existing Client Found
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-amber-500 hover:text-amber-700 transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>

    {/* Client details */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
      {[
        { label: "Name", value: client.fullName },
        { label: "NIC", value: client.nic ?? "—" },
        { label: "Branch", value: (client as any).branch?.name ?? "—" },
        { label: "Investments", value: String((client as any).investments?.length ?? 0) },
      ].map(({ label, value }) => (
        <div
          key={label}
          className="bg-amber-100/60 dark:bg-amber-900/20 rounded-xl px-3 py-2"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-0.5">
            {label}
          </p>
          <p className="font-semibold text-amber-900 dark:text-amber-200 truncate">{value}</p>
        </div>
      ))}
    </div>

    <div className="flex flex-wrap items-center gap-3 pt-1">
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
      >
        Continue as new
      </button>
      <span className="text-amber-300">|</span>
      {/* PRIMARY action — add investment to existing client */}
      <button
        type="button"
        onClick={() => onUseExisting(client)}
        className="text-xs font-black text-primary hover:underline"
      >
        Add investment to this client →
      </button>
      <span className="text-amber-300">|</span>
      <button
        type="button"
        onClick={() => onViewClient(client.id)}
        className="text-xs font-bold text-muted-foreground hover:underline"
      >
        View client profile
      </button>
    </div>
  </div>
);

// ── Locked-field display ──────────────────────────────────────────────────────

const LockedField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 ml-1 block">
      {label}
    </label>
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-muted bg-muted/40">
      <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-sm font-semibold text-muted-foreground">{value || "—"}</span>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  lockedClient: LockedClient | null;
  onClientLock: (client: LockedClient) => void;
};

const ApplicantDetails = ({ lockedClient, onClientLock }: Props) => {
  const { form } = useFormContext();
  const { register, watch, setValue, formState: { errors } } = form;
  const applicantErrors = errors.applicant as any;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  const [investmentRates, setInvestmentRates] = useState<number[]>([]);

  const selectedPlanId = watch("investment.planId");

  // Duplicate search state
  const [searchQuery, setSearchQuery] = useState("");
  const [matchedClient, setMatchedClient] = useState<ClientMatch>(null);
  const [dismissed, setDismissed] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When a client gets locked, clear the search
  useEffect(() => {
    if (lockedClient) {
      setMatchedClient(null);
      setDismissed(true);
      setSearchQuery("");
    }
  }, [lockedClient]);

  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val);
    setDismissed(false);

    if (val.trim().length < 2) {
      setMatchedClient(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchClients(val.trim());
        setMatchedClient(result);
      } catch {
        setMatchedClient(null);
      } finally {
        setSearching(false);
      }
    }, 450);
  }, []);

  useEffect(
    () => () => { if (debounceRef.current) clearTimeout(debounceRef.current); },
    []
  );

  // Auto-fill rates from plan
  useEffect(() => {
    if (!selectedPlanId) return;
    const plan = plans.find((p) => p.id === Number(selectedPlanId));
    if (!plan) return;

    const years = Math.ceil(plan.duration / 12);
    const defaults: number[] =
      Array.isArray(plan.rate) && plan.rate.length === years
        ? plan.rate
        : Array(years).fill(plan.rate[0] ?? 0);

    setInvestmentRates(defaults);
    setValue("investment.investmentRates", defaults);
  }, [selectedPlanId, plans, setValue]);

  useEffect(() => {
    setValue("investment.investmentRates", investmentRates);
  }, [investmentRates, setValue]);

  useEffect(() => { getBranches().then(setBranches); }, []);
  useEffect(() => { getFinancialPlans().then(setPlans); }, []);

  // When user picks "Add investment to this client"
  const handleUseExistingClient = (client: NonNullable<ClientMatch>) => {
    const locked: LockedClient = {
      id: client.id,
      fullName: client.fullName,
      nic: client.nic ?? null,
      branchId: (client as any).branchId,
      branch: (client as any).branch,
      beneficiaries: (client as any).beneficiaries ?? [],
      nominees: (client as any).nominees ?? [],
    };

    // Pre-fill read-only applicant fields so validation doesn't block submit.
    // These are just display; the server action uses client.id, not these values.
    setValue("applicant.fullName", client.fullName, { shouldValidate: true });
    setValue("applicant.nic", client.nic ?? "");
    setValue("applicant.branchId", (client as any).branchId, { shouldValidate: true });
    // Clear investment amount so user explicitly sets it for this investment
    setValue("applicant.investmentAmount", 0);

    onClientLock(locked);
  };

  const inputClass = (hasError?: boolean) =>
    `bg-background/50 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:bg-background outline-none transition-all w-full placeholder:text-muted-foreground/30 font-medium ${
      hasError ? "border-red-400 focus:ring-red-400" : "border-border/50"
    }`;
  const labelClass =
    "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 ml-1 block";

  return (
    <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden text-card-foreground">
      <div className="px-8 py-6 border-b border-border/30 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-[0.25em] text-foreground opacity-80">
          Applicant Information
        </h2>
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      </div>

      <div className="p-3 space-y-5">
        {/* ── Duplicate search — hidden once a client is locked ── */}
        {!lockedClient && (
          <div className="md:col-span-2">
            <label className={labelClass}>
              Search existing clients
              <span className="ml-1 text-muted-foreground/40 normal-case font-semibold tracking-normal">
                — by name or NIC before adding
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Type a name or NIC number…"
                className={inputClass()}
              />
              {searching && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/50 animate-pulse">
                  Searching…
                </span>
              )}
            </div>
          </div>
        )}

        {matchedClient && !dismissed && (
          <DuplicateBanner
            client={matchedClient}
            onDismiss={() => setDismissed(true)}
            onUseExisting={handleUseExistingClient}
            onViewClient={(id) => {
              window.location.href = `/features/clients/${id}`;
            }}
          />
        )}
      </div>

      <div className="sm:p-8 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── If client is locked, show read-only header fields ── */}
          {lockedClient ? (
            <>
              <div className="md:col-span-2">
                <LockedField label="Full Name" value={lockedClient.fullName} />
              </div>
              <LockedField label="NIC Number" value={lockedClient.nic ?? "—"} />
              <LockedField label="Assigned Branch" value={lockedClient.branch?.name ?? "—"} />
            </>
          ) : (
            <>
              {/* ── New client fields ── */}
              <div className="md:col-span-2">
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  {...register("applicant.fullName", {
                    required: "Full name is required",
                    minLength: { value: 2, message: "Must be at least 2 characters" },
                  })}
                  placeholder="Legal name as per NIC"
                  className={inputClass(!!applicantErrors?.fullName)}
                />
                <FieldError message={applicantErrors?.fullName?.message} />
              </div>

              <div>
                <label className={labelClass}>NIC Number</label>
                <input
                  type="text"
                  {...register("applicant.nic", {
                    validate: (val) =>
                      !val ||
                      SRI_LANKA_NIC.test(val.trim()) ||
                      "NIC must be 9 digits + V/X or 12 digits",
                  })}
                  className={inputClass(!!applicantErrors?.nic)}
                />
                <FieldError message={applicantErrors?.nic?.message} />
              </div>

              <div>
                <label className={labelClass}>Driving License</label>
                <input
                  type="text"
                  {...register("applicant.drivingLicense")}
                  className={inputClass()}
                />
              </div>

              <div>
                <label className={labelClass}>Passport No</label>
                <input
                  type="text"
                  {...register("applicant.passportNo")}
                  className={inputClass()}
                />
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  {...register("applicant.email", {
                    validate: (val) =>
                      !val ||
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ||
                      "Invalid email address",
                  })}
                  className={inputClass(!!applicantErrors?.email)}
                />
                <FieldError message={applicantErrors?.email?.message} />
              </div>

              <div>
                <label className={labelClass}>Mobile Phone</label>
                <input
                  type="text"
                  {...register("applicant.phoneMobile", {
                    validate: (val) =>
                      !val ||
                      SRI_LANKA_PHONE.test(val.replace(/[\s\-+]/g, "")) ||
                      "Phone must be 9–10 digits",
                  })}
                  className={inputClass(!!applicantErrors?.phoneMobile)}
                />
                <FieldError message={applicantErrors?.phoneMobile?.message} />
              </div>

              <div>
                <label className={labelClass}>Land Phone</label>
                <input
                  type="text"
                  {...register("applicant.phoneLand", {
                    validate: (val) =>
                      !val ||
                      SRI_LANKA_PHONE.test(val.replace(/[\s\-+]/g, "")) ||
                      "Phone must be 9–10 digits",
                  })}
                  className={inputClass(!!applicantErrors?.phoneLand)}
                />
                <FieldError message={applicantErrors?.phoneLand?.message} />
              </div>

              <div>
                <label className={labelClass}>Date of Birth</label>
                <input
                  type="date"
                  {...register("applicant.dateOfBirth")}
                  className={inputClass()}
                />
              </div>

              <div>
                <label className={labelClass}>Occupation</label>
                <input
                  type="text"
                  {...register("applicant.occupation")}
                  className={inputClass()}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Full Residential Address *</label>
                <input
                  type="text"
                  {...register("applicant.address", {
                    required: "Address is required",
                    minLength: {
                      value: 5,
                      message: "Address must be at least 5 characters",
                    },
                  })}
                  className={inputClass(!!applicantErrors?.address)}
                />
                <FieldError message={applicantErrors?.address?.message} />
              </div>

              <div>
                <label className={labelClass}>Assigned Branch *</label>
                <select
                  className={inputClass(!!applicantErrors?.branchId)}
                  {...register("applicant.branchId", {
                    required: "Please select a branch",
                    validate: (val) => val !== "" || "Please select a branch",
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                >
                  <option value="">Choose a branch...</option>
                  {branches.map((b) => (
                    <option value={b.id} key={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <FieldError message={applicantErrors?.branchId?.message} />
              </div>
            </>
          )}

          {/* ── Proposal form No — always shown ── */}
          <div className={lockedClient ? "" : ""}>
            <label className={labelClass}>Proposal Form Number *</label>
            <input
              type="text"
              {...register("applicant.proposalFormNo", {
                required: "Proposal form number is required",
                minLength: { value: 3, message: "Must be at least 3 characters" },
              })}
              className={inputClass(!!applicantErrors?.proposalFormNo)}
            />
            <FieldError message={applicantErrors?.proposalFormNo?.message} />
          </div>

          {/* ── Financial Calibration ── */}
          <div
            className={`${
              lockedClient ? "md:col-span-2" : "md:col-span-2"
            } p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-6`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Financial Calibration
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Investment Amount *</label>
                <input
                  type="text"
                  {...register("applicant.investmentAmount", {
                    required: "Investment amount is required",
                    validate: (val) =>
                      Number(val) > 0 || "Amount must be a positive number",
                  })}
                  placeholder="0.00"
                  className={`${inputClass(!!applicantErrors?.investmentAmount)} font-black text-primary text-lg`}
                />
                <FieldError message={applicantErrors?.investmentAmount?.message} />
              </div>

              <div>
                <label className={labelClass}>Target Plan</label>
                <select
                  className={inputClass()}
                  {...register("investment.planId", {
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                >
                  <option value="">Choose a Plan...</option>
                  {plans.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Investment Date</label>
                <input
                  type="date"
                  {...register("applicant.investmentDate")}
                  className={inputClass()}
                />
              </div>
            </div>

            {/* Per-year rate inputs */}
            {investmentRates.length > 0 && (
              <div className="space-y-3">
                <label className={labelClass}>
                  Rate per Year (%)
                  <span className="ml-2 text-primary normal-case font-semibold tracking-normal">
                    {investmentRates.length} year
                    {investmentRates.length > 1 ? "s" : ""}
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {investmentRates.map((rate, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground/60 font-bold text-center">
                        Yr {i + 1}
                      </span>
                      <div
                        className={`flex items-center ${inputClass()} p-0 overflow-hidden`}
                      >
                        <input
                          type="number"
                          step="0.1"
                          value={rate}
                          onChange={(e) => {
                            const updated = [...investmentRates];
                            updated[i] = parseFloat(e.target.value) || 0;
                            setInvestmentRates(updated);
                          }}
                          className="flex-1 px-2 py-3 text-sm font-bold bg-transparent outline-none text-center"
                        />
                        <span className="pr-2 text-[11px] text-muted-foreground font-bold">
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {investmentRates.length === 0 && (
              <p className="text-xs text-muted-foreground/50 italic">
                Select a plan to configure rates.
              </p>
            )}
          </div>

          {/* E-Signature — only for new clients */}
          {!lockedClient && (
            <div className="md:col-span-2 pt-4">
              <label className={labelClass}>E-Signature</label>
              <SignaturePad />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantDetails;

