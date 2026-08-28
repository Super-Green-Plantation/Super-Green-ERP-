"use client";

/**
 * AddMonthlyProposalModal
 *
 * Three plan types — exactly matching the printed proposal forms:
 *   PENSION  — SUPER GREEN විශ්‍රාම සැලසුම (Retirement)
 *   CHILD    — රන් අස්වනු ළමා අනාගත සැලැස්ම (Child Plan)
 *   MARGE    — රන් අස්වනු දෑවැද්ද (Marriage Plan)
 *
 * Field layout mirrors the PDF sections 1–4/5 exactly.
 */

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Baby, TrendingUp, Landmark, X, Info, ChevronDown, ChevronUp } from "lucide-react";
import {
  createMonthlyProposal,
  MonthlyPlanType,
  MonthlyFrequency,
  CreateMonthlyProposalInput,
} from "@/app/features/monthly-proposals/actions";

// ─── Plan config ──────────────────────────────────────────────────────────────

const PLAN_META = {
  PENSION: {
    label: "Retirement Plan",
    sinhala: "විශ්‍රාම සැලසුම",
    icon: <Landmark className="w-4 h-4" />,
    payingTerm: null as null,   // paying term == duration for pension
    durations: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as number[],
    retirementAges: [35, 40, 45, 50, 55] as number[],
    hasGender: false,
    hasMaritalStatus: false,
    hasBankDetails: true,
    hasChildDetails: false,
    nomineeSections: 4,
  },
  CHILD: {
    label: "Child Plan",
    sinhala: "ළමා අනාගත සැලැස්ම",
    icon: <Baby className="w-4 h-4" />,
    payingTerm: 3 as number,
    durations: [6, 9, 12] as number[],
    retirementAges: [] as number[],
    hasGender: false,
    hasMaritalStatus: false,
    hasBankDetails: false,
    hasChildDetails: true,
    nomineeSections: 5,
  },
  MARGE: {
    label: "Marriage Plan",
    sinhala: "රන් අස්වනු දෑවැද්ද",
    icon: <TrendingUp className="w-4 h-4" />,
    payingTerm: 5 as number,
    durations: [5, 10, 15] as number[],
    retirementAges: [] as number[],
    hasGender: true,
    hasMaritalStatus: true,
    hasBankDetails: true,
    hasChildDetails: false,
    nomineeSections: 4,
  },
} as const;

// ─── Payment frequencies ──────────────────────────────────────────────────────

const FREQUENCIES: { value: MonthlyFrequency; sinhala: string; label: string; min: number; periods: number }[] = [
  { value: "MONTHLY",     sinhala: "මාසික",              label: "Monthly",     min: 15000,  periods: 12 },
  { value: "QUARTERLY",   sinhala: "මාස 3කට වරක්",       label: "Quarterly",   min: 50000,  periods: 4  },
  { value: "SEMI_ANNUAL", sinhala: "මාස 6කට වරක්",       label: "Semi-Annual", min: 100000, periods: 2  },
  { value: "ANNUAL",      sinhala: "වාර්ෂික",             label: "Annual",      min: 200000, periods: 1  },
];

// ─── Interest rates ───────────────────────────────────────────────────────────

const PENSION_RATES: Record<string, Record<number, number>> = {
  MONTHLY:     { 1: 6,  2: 9,  3: 12, 4: 15, 5: 18, 6: 20, 7: 20, 8: 20, 9: 20, 10: 20 },
  QUARTERLY:   { 1: 6,  2: 9,  3: 12, 4: 15, 5: 18, 6: 20, 7: 20, 8: 20, 9: 20, 10: 20 },
  SEMI_ANNUAL: { 1: 10, 2: 12, 3: 15, 4: 18, 5: 18, 6: 20, 7: 20, 8: 20, 9: 20, 10: 20 },
  ANNUAL:      { 1: 10, 2: 12, 3: 15, 4: 18, 5: 18, 6: 20, 7: 20, 8: 20, 9: 20, 10: 20 },
};

const CHILD_MARGE_RATES: Record<MonthlyFrequency, number> = {
  MONTHLY: 15, QUARTERLY: 18, SEMI_ANNUAL: 21, ANNUAL: 24,
};

function getRate(planType: MonthlyPlanType, frequency: MonthlyFrequency, duration: number) {
  if (planType === "PENSION") return PENSION_RATES[frequency][duration] ?? 20;
  return CHILD_MARGE_RATES[frequency];
}

// ─── Calculation ──────────────────────────────────────────────────────────────

const DOC_CHARGE = 500;

function calcFinancials(
  planType: MonthlyPlanType,
  frequency: MonthlyFrequency,
  premium: number,
  duration: number,
) {
  const freq = FREQUENCIES.find((f) => f.value === frequency)!;
  const meta = PLAN_META[planType];
  const payingYears = planType === "PENSION" ? duration : (meta.payingTerm ?? duration);
  const totalPayments = payingYears * freq.periods;
  const totalInvested = premium * totalPayments;
  const R = getRate(planType, frequency, duration);

  let maturityGross: number;

  if (planType === "PENSION") {
    const rPerPeriod = R / 100 / freq.periods;
    maturityGross =
      rPerPeriod === 0
        ? totalInvested
        : premium * ((Math.pow(1 + rPerPeriod, totalPayments) - 1) / rPerPeriod);
  } else {
    // Child / Marriage: paying term then holding term at same rate
    const holdingYears = duration - payingYears;
    const annualDeposit = premium * freq.periods;
    const rate = R / 100;
    let balance = 0;
    for (let y = 0; y < payingYears; y++) balance = (balance + annualDeposit) * (1 + rate);
    for (let y = 0; y < holdingYears; y++) balance = balance * (1 + rate);
    maturityGross = balance;
  }

  const interestEarned = maturityGross - totalInvested;
  const netMaturity    = maturityGross - DOC_CHARGE;

  return { totalPayments, totalInvested, interestRate: R, interestEarned, netMaturity };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "Rs. " + n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const inputCls =
  "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-colors";
const labelCls =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";
const sectionHeadCls =
  "text-sm font-bold text-card-foreground mb-3 pb-1.5 border-b border-border/50 flex items-center gap-2";

// ─── Component ────────────────────────────────────────────────────────────────

interface LockedClient {
  id: number;
  fullName: string;
  nic?: string | null;
  address?: string | null;
  phoneMobile?: string | null;
  email?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clientId?: number | null;
  lockedClient?: LockedClient | null;
  onSuccess?: (proposalFormNo: string) => void;
}

const AddMonthlyProposalModal = ({ isOpen, onClose, clientId, lockedClient, onSuccess }: Props) => {
  const queryClient = useQueryClient();

  // ── Plan state ─────────────────────────────────────────────────────────────
  const [planType,       setPlanType]       = useState<MonthlyPlanType>("CHILD");
  const [frequency,      setFrequency]      = useState<MonthlyFrequency>("MONTHLY");
  const [duration,       setDuration]       = useState<number>(6);
  const [retirementAge,  setRetirementAge]  = useState<number>(55);
  const [premium,        setPremium]        = useState<number>(15000);

  // ── Section 1 — Applicant / Parent ────────────────────────────────────────
  const [applicantName,       setApplicantName]       = useState(lockedClient?.fullName ?? "");
  const [applicantNic,        setApplicantNic]        = useState(lockedClient?.nic ?? "");
  const [applicantDob,        setApplicantDob]        = useState("");
  const [applicantAge,        setApplicantAge]        = useState<number | "">("");
  const [applicantAddress,    setApplicantAddress]    = useState(lockedClient?.address ?? "");
  const [applicantPhone,      setApplicantPhone]      = useState(lockedClient?.phoneMobile ?? "");
  const [applicantEmail,      setApplicantEmail]      = useState(lockedClient?.email ?? "");
  const [gender,              setGender]              = useState<"Male" | "Female" | "">("");
  const [maritalStatus,       setMaritalStatus]       = useState<"Married" | "Single" | "">("");
  const [applicantBankAccNo,  setApplicantBankAccNo]  = useState("");
  const [applicantBankName,   setApplicantBankName]   = useState("");

  // ── Section 2 — Child details (CHILD only) ────────────────────────────────
  const [childName,        setChildName]        = useState("");
  const [childDob,         setChildDob]         = useState("");
  const [childBirthCertNo, setChildBirthCertNo] = useState("");
  const [childSchool,      setChildSchool]      = useState("");
  const [childGrade,       setChildGrade]       = useState("");

  // ── Nominee ───────────────────────────────────────────────────────────────
  const [nomineeName,         setNomineeName]         = useState("");
  const [nomineeNic,          setNomineeNic]          = useState("");
  const [nomineeRelationship, setNomineeRelationship] = useState("");
  const [nomineePhone,        setNomineePhone]        = useState("");

  // ── Agent bank (page 2, all forms) ────────────────────────────────────────
  const [agentBankAccNo,  setAgentBankAccNo]  = useState("");
  const [agentBankName,   setAgentBankName]   = useState("");
  const [agentBankBranch, setAgentBankBranch] = useState("");

  const [notes,           setNotes]           = useState("");
  const [agentOpen,       setAgentOpen]       = useState(false);

  // ── Sync plan defaults when plan type changes ─────────────────────────────
  useEffect(() => {
    const meta = PLAN_META[planType];
    setDuration(meta.durations[0]);
    const freq = FREQUENCIES.find((f) => f.value === frequency)!;
    setPremium(freq.min);
  }, [planType]);

  // ── Sync premium floor when frequency changes ─────────────────────────────
  useEffect(() => {
    const freq = FREQUENCIES.find((f) => f.value === frequency)!;
    if (premium < freq.min) setPremium(freq.min);
  }, [frequency]);

  // ── Pre-fill from locked client ───────────────────────────────────────────
  useEffect(() => {
    if (lockedClient) {
      setApplicantName(lockedClient.fullName ?? "");
      setApplicantNic(lockedClient.nic ?? "");
      setApplicantAddress(lockedClient.address ?? "");
      setApplicantPhone(lockedClient.phoneMobile ?? "");
      setApplicantEmail(lockedClient.email ?? "");
    }
  }, [lockedClient]);

  const meta    = PLAN_META[planType];
  const freqObj = FREQUENCIES.find((f) => f.value === frequency)!;
  const minPrem = freqObj.min;
  const calc    = calcFinancials(planType, frequency, premium, duration);

  // ── Submit ────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (input: CreateMonthlyProposalInput) => createMonthlyProposal(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["monthly-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["client-monthly-proposals"] });
      toast.success(`Proposal saved — ${result.proposalFormNo}`);
      onSuccess?.(result.proposalFormNo);
      onClose();
    },
    onError: () => toast.error("Failed to save proposal"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim()) { toast.error("Applicant name is required"); return; }
    if (premium < minPrem) {
      toast.error(`Minimum premium is ${fmt(minPrem)} for ${freqObj.label}`);
      return;
    }

    mutation.mutate({
      planType,
      clientId: clientId ?? lockedClient?.id ?? null,
      applicantName:    applicantName.trim(),
      applicantNic:     applicantNic     || undefined,
      applicantDob:     applicantDob     || undefined,
      applicantAge:     applicantAge !== "" ? Number(applicantAge) : undefined,
      applicantAddress: applicantAddress || undefined,
      applicantPhone:   applicantPhone   || undefined,
      applicantEmail:   applicantEmail   || undefined,
      gender:           gender           || undefined,
      maritalStatus:    maritalStatus    || undefined,
      applicantBankAccNo: applicantBankAccNo || undefined,
      applicantBankName:  applicantBankName  || undefined,
      childName:        planType === "CHILD" ? childName        || undefined : undefined,
      childDob:         planType === "CHILD" ? childDob         || undefined : undefined,
      childBirthCertNo: planType === "CHILD" ? childBirthCertNo || undefined : undefined,
      childSchool:      planType === "CHILD" ? childSchool      || undefined : undefined,
      childGrade:       planType === "CHILD" ? childGrade       || undefined : undefined,
      duration,
      retirementAge: planType === "PENSION" ? retirementAge : undefined,
      frequency,
      premium,
      totalInvested:  calc.totalInvested,
      interestRate:   calc.interestRate,
      interestEarned: calc.interestEarned,
      maturityAmount: calc.netMaturity,
      documentCharge: DOC_CHARGE,
      nomineeName:         nomineeName         || undefined,
      nomineeNic:          nomineeNic          || undefined,
      nomineeRelationship: nomineeRelationship || undefined,
      nomineePhone:        nomineePhone        || undefined,
      agentBankAccNo:  agentBankAccNo  || undefined,
      agentBankName:   agentBankName   || undefined,
      agentBankBranch: agentBankBranch || undefined,
      notes: notes || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 py-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="p-6 border-b bg-muted/30 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">New Monthly Proposal</h2>
            <p className="text-sm text-muted-foreground">
              {lockedClient ? `For ${lockedClient.fullName}` : "Monthly installment plan proposal"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          className="p-6 space-y-7 overflow-y-auto max-h-[calc(100vh-8rem)]"
          onSubmit={handleSubmit}
        >

          {/* ═══════════════════════════════════════
              Plan type selector
          ═══════════════════════════════════════ */}
          <div>
            <label className={labelCls}>Plan Type</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(PLAN_META) as MonthlyPlanType[]).map((pt) => {
                const m = PLAN_META[pt];
                const active = planType === pt;
                return (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setPlanType(pt)}
                    className={`py-3 px-2 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center gap-1.5 ${
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow"
                        : "bg-muted/20 text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                    <span className={`text-[10px] font-normal text-center leading-tight ${active ? "text-primary-foreground/80" : "text-muted-foreground/60"}`}>
                      {m.sinhala}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══════════════════════════════════════
              Section 1 — Applicant / Parent / Guardian
          ═══════════════════════════════════════ */}
          <div>
            <h3 className={sectionHeadCls}>
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
              {planType === "CHILD" ? "දෙමාපියන් / භාරකරුගේ තොරතුරු" : "අයදුම්කරුගේ තොරතුරු"}
              <span className="text-muted-foreground font-normal text-xs ml-1">
                ({planType === "CHILD" ? "Parent / Guardian Details" : "Applicant Details"})
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-4">

              {/* Full name — always col-span-2 */}
              <div className="col-span-2">
                <label className={labelCls}>සම්පූර්ණ නම (Full Name) *</label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className={inputCls}
                  placeholder="Full name as on NIC"
                />
              </div>

              {/* NIC */}
              <div>
                <label className={labelCls}>ජාතික හැඳුනුම්පත් අංකය (NIC)</label>
                <input
                  type="text"
                  value={applicantNic}
                  onChange={(e) => setApplicantNic(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 991234567V"
                />
              </div>

              {/* DOB — PENSION has it; CHILD form does NOT; MARGE has it */}
              {(planType === "PENSION" || planType === "MARGE") && (
                <div>
                  <label className={labelCls}>උපන් දිනය (Date of Birth)</label>
                  <input
                    type="date"
                    value={applicantDob}
                    onChange={(e) => setApplicantDob(e.target.value)}
                    className={inputCls}
                  />
                </div>
              )}

              {/* Age — PENSION only */}
              {planType === "PENSION" && (
                <div>
                  <label className={labelCls}>වයස (Age)</label>
                  <input
                    type="number"
                    min={18}
                    max={54}
                    value={applicantAge}
                    onChange={(e) => setApplicantAge(Number(e.target.value))}
                    className={inputCls}
                    placeholder="Years"
                  />
                </div>
              )}

              {/* Gender — MARGE only */}
              {meta.hasGender && (
                <div>
                  <label className={labelCls}>ස්ත්‍රී / පුරුෂ (Gender)</label>
                  <div className="flex gap-3 mt-1">
                    {(["Female", "Male"] as const).map((g) => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={gender === g}
                          onChange={() => setGender(g)}
                          className="accent-primary"
                        />
                        {g === "Female" ? "ස්ත්‍රී" : "පුරුෂ"}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Marital status — MARGE only */}
              {meta.hasMaritalStatus && (
                <div>
                  <label className={labelCls}>විවාහ තත්ත්වය (Marital Status)</label>
                  <div className="flex gap-3 mt-1">
                    {(["Married", "Single"] as const).map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          name="maritalStatus"
                          value={s}
                          checked={maritalStatus === s}
                          onChange={() => setMaritalStatus(s)}
                          className="accent-primary"
                        />
                        {s === "Married" ? "විවාහක" : "අවිවාහක"}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Phone */}
              <div>
                <label className={labelCls}>දුරකථන අංකය (Phone)</label>
                <input
                  type="tel"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  className={inputCls}
                  placeholder="07X XXX XXXX"
                />
              </div>

              {/* Email */}
              <div>
                <label className={labelCls}>විද්‍යුත් තැපෑල / ඊමේල් (Email)</label>
                <input
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  className={inputCls}
                  placeholder="email@example.com"
                />
              </div>

              {/* Address — PENSION + CHILD have it; MARGE form too (ලිපිනය) */}
              <div className="col-span-2">
                <label className={labelCls}>ලිපිනය (Address)</label>
                <input
                  type="text"
                  value={applicantAddress}
                  onChange={(e) => setApplicantAddress(e.target.value)}
                  className={inputCls}
                  placeholder="Residential address"
                />
              </div>

              {/* Bank details — PENSION + MARGE forms */}
              {meta.hasBankDetails && (
                <>
                  <div>
                    <label className={labelCls}>බැංකු ගිණුම් අංකය (Bank Acc. No.)</label>
                    <input
                      type="text"
                      value={applicantBankAccNo}
                      onChange={(e) => setApplicantBankAccNo(e.target.value)}
                      className={inputCls}
                      placeholder="Account number"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>බැංකුවේ නම (Bank Name)</label>
                    <input
                      type="text"
                      value={applicantBankName}
                      onChange={(e) => setApplicantBankName(e.target.value)}
                      className={inputCls}
                      placeholder="Bank name"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════
              Section 2 — Child details (CHILD only)
          ═══════════════════════════════════════ */}
          {meta.hasChildDetails && (
            <div>
              <h3 className={sectionHeadCls}>
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                දරුවාගේ තොරතුරු
                <span className="text-muted-foreground font-normal text-xs ml-1">(Child Details)</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>සම්පූර්ණ නම (Child's Full Name)</label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className={inputCls}
                    placeholder="As on birth certificate"
                  />
                </div>
                <div>
                  <label className={labelCls}>උපන් දිනය (Date of Birth)</label>
                  <input
                    type="date"
                    value={childDob}
                    onChange={(e) => setChildDob(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>උප්පැන්න සහතික අංකය (Birth Cert. No.)</label>
                  <input
                    type="text"
                    value={childBirthCertNo}
                    onChange={(e) => setChildBirthCertNo(e.target.value)}
                    className={inputCls}
                    placeholder="Certificate number"
                  />
                </div>
                <div>
                  <label className={labelCls}>පාසල (School)</label>
                  <input
                    type="text"
                    value={childSchool}
                    onChange={(e) => setChildSchool(e.target.value)}
                    className={inputCls}
                    placeholder="School name"
                  />
                </div>
                <div>
                  <label className={labelCls}>පන්තිය (Grade / Class)</label>
                  <input
                    type="text"
                    value={childGrade}
                    onChange={(e) => setChildGrade(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Grade 5 / පන්ති 5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              Section 2/3 — Investment details
              (PENSION: section 2 | CHILD: section 3 | MARGE: section 2)
          ═══════════════════════════════════════ */}
          <div>
            <h3 className={sectionHeadCls}>
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                {planType === "CHILD" ? "3" : "2"}
              </span>
              {planType === "PENSION"
                ? "ආයෝජන තොරතුරු"
                : planType === "CHILD"
                ? "තෝරාගත් සැලැස්ම"
                : "තෝරාගත් සැලැස්ම"}
              <span className="text-muted-foreground font-normal text-xs ml-1">
                {planType === "PENSION"
                  ? "(Investment Details)"
                  : `(Plan — paying term: ${meta.payingTerm ?? duration} yrs)`}
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Duration */}
              <div>
                <label className={labelCls}>ආයෝජන කාලය (Duration)</label>
                <div className="flex flex-wrap gap-2">
                  {meta.durations.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all ${
                        duration === d
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/20 text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {d}Y
                    </button>
                  ))}
                </div>
              </div>

              {/* Retirement age — PENSION only */}
              {planType === "PENSION" && (
                <div>
                  <label className={labelCls}>විශ්‍රාම වයස (Retirement Age)</label>
                  <div className="flex flex-wrap gap-2">
                    {meta.retirementAges.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setRetirementAge(a)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all ${
                          retirementAge === a
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/20 text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════
              Section 3/4 — Payment method (ගෙවීම් ක්‍රමය)
          ═══════════════════════════════════════ */}
          <div>
            <h3 className={sectionHeadCls}>
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                {planType === "CHILD" ? "4" : "3"}
              </span>
              ගෙවීම් ක්‍රමය
              <span className="text-muted-foreground font-normal text-xs ml-1">(Payment Method)</span>
            </h3>

            <div className="space-y-2.5 mb-4">
              {FREQUENCIES.map((f) => (
                <label
                  key={f.value}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                    frequency === f.value
                      ? "bg-primary/10 border-primary"
                      : "bg-muted/10 border-border hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={f.value}
                    checked={frequency === f.value}
                    onChange={() => setFrequency(f.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm flex-1">
                    <span className="font-semibold text-card-foreground">{f.sinhala}</span>
                    <span className="text-muted-foreground ml-2">({f.label})</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    min {fmt(f.min)}
                  </span>
                </label>
              ))}
            </div>

            {/* Premium input */}
            <div>
              <label className={labelCls}>
                Premium Amount (Rs.) — min {fmt(minPrem)} for {freqObj.label}
              </label>
              <input
                type="number"
                step="any"
                required
                min={minPrem}
                value={premium}
                onChange={(e) => setPremium(Number(e.target.value))}
                className={`${inputCls} ${premium < minPrem ? "border-red-400 ring-1 ring-red-300" : ""}`}
                placeholder={`Min ${minPrem.toLocaleString()}`}
              />
              {premium < minPrem && (
                <p className="text-xs text-red-500 mt-1">
                  Minimum premium is {fmt(minPrem)}
                </p>
              )}
            </div>

            {/* Financial summary */}
            <div className="mt-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 grid grid-cols-2 gap-x-6 gap-y-2">
              <SRow label="Plan"             value={`${meta.label} | ${duration}Y`} />
              <SRow label="Total Payments"   value={`${calc.totalPayments}×`} />
              <SRow label="Total Invested"   value={fmt(calc.totalInvested)} />
              <SRow label="Interest Rate"    value={`${calc.interestRate.toFixed(1)}% p.a.`} hl />
              <SRow label="Interest Earned"  value={fmt(calc.interestEarned)} hl />
              <SRow label="Document Charge"  value={`− ${fmt(DOC_CHARGE)}`} />
              <SRow label="Net Maturity"     value={fmt(calc.netMaturity)} big />
            </div>
          </div>

          {/* ═══════════════════════════════════════
              Section 4/5 — Nominee / Beneficiary
          ═══════════════════════════════════════ */}
          <div>
            <h3 className={sectionHeadCls}>
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                {meta.nomineeSections}
              </span>
              {planType === "CHILD" ? "ප්‍රතිලාභියා" : "නාමිත ප්‍රතිලාභියා"}
              <span className="text-muted-foreground font-normal text-xs ml-1">
                ({planType === "CHILD" ? "Beneficiary" : "Nominee"})
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>නම (Name)</label>
                <input
                  type="text"
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  className={inputCls}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className={labelCls}>ජාතික හැඳුනුම්පත් (NIC)</label>
                <input
                  type="text"
                  value={nomineeNic}
                  onChange={(e) => setNomineeNic(e.target.value)}
                  className={inputCls}
                  placeholder="NIC number"
                />
              </div>
              <div>
                <label className={labelCls}>සම්බන්ධතාවය (Relationship)</label>
                <input
                  type="text"
                  value={nomineeRelationship}
                  onChange={(e) => setNomineeRelationship(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Spouse, Child, Parent"
                />
              </div>
              {/* Phone on nominee — Child + MARGE forms have it; PENSION doesn't */}
              {planType !== "PENSION" && (
                <div>
                  <label className={labelCls}>දුරකථන අංකය (Phone)</label>
                  <input
                    type="tel"
                    value={nomineePhone}
                    onChange={(e) => setNomineePhone(e.target.value)}
                    className={inputCls}
                    placeholder="07X XXX XXXX"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════
              Agent bank details (page 2, collapsible)
          ═══════════════════════════════════════ */}
          <div className="border border-border/50 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setAgentOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 text-sm font-semibold text-card-foreground hover:bg-muted/30 transition-colors"
            >
              <span>Agent Bank Details (Page 2)</span>
              {agentOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {agentOpen && (
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Agent Account Number</label>
                  <input
                    type="text"
                    value={agentBankAccNo}
                    onChange={(e) => setAgentBankAccNo(e.target.value)}
                    className={inputCls}
                    placeholder="Account number"
                  />
                </div>
                <div>
                  <label className={labelCls}>Agent Bank Name</label>
                  <input
                    type="text"
                    value={agentBankName}
                    onChange={(e) => setAgentBankName(e.target.value)}
                    className={inputCls}
                    placeholder="Bank name"
                  />
                </div>
                <div>
                  <label className={labelCls}>Agent Branch Name</label>
                  <input
                    type="text"
                    value={agentBankBranch}
                    onChange={(e) => setAgentBankBranch(e.target.value)}
                    className={inputCls}
                    placeholder="Branch name"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-border rounded-xl font-semibold text-muted-foreground hover:bg-muted/30 text-sm"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || premium < minPrem}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 shadow-lg active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "Saving…" : "Save Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SRow = ({
  label, value, hl, big,
}: { label: string; value: string; hl?: boolean; big?: boolean }) => (
  <div className="flex flex-col">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className={`font-semibold text-sm ${big ? "text-primary text-base" : hl ? "text-primary" : "text-card-foreground"}`}>
      {value}
    </span>
  </div>
);

export default AddMonthlyProposalModal;