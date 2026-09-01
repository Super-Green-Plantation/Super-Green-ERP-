"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createMonthlyProposal, CreateMonthlyProposalInput, MonthlyFrequency, MonthlyPlanType } from "@/app/features/monthly-proposals/actions";

const frequencies: { value: MonthlyFrequency; label: string; min: number; periods: number }[] = [
  { value: "MONTHLY", label: "Monthly", min: 15000, periods: 12 },
  { value: "QUARTERLY", label: "Quarterly", min: 50000, periods: 4 },
  { value: "SEMI_ANNUAL", label: "Semi-annual", min: 100000, periods: 2 },
  { value: "ANNUAL", label: "Annual", min: 200000, periods: 1 },
];
const plans: Record<MonthlyPlanType, { label: string; durations: number[]; payingYears: number }> = {
  CHILD: { label: "Child Plan", durations: [6, 9, 12], payingYears: 3 },
  RAN_ASWANU: { label: "RAN ASWANU", durations: [6, 9, 12], payingYears: 3 },
  MARGE: { label: "Marriage Plan", durations: [5, 10, 15], payingYears: 5 },
  PENSION: { label: "Retirement Plan", durations: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], payingYears: 0 },
};
const inputClass = "w-full rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40";
const labelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground";

export default function MonthlyProposalForm({ clientId = null, onSaved }: { clientId?: number | null; onSaved?: (id: number) => void }) {
  const router = useRouter();
  const [planType, setPlanType] = useState<MonthlyPlanType>("CHILD");
  const [frequency, setFrequency] = useState<MonthlyFrequency>("MONTHLY");
  const [duration, setDuration] = useState(6);
  const [premium, setPremium] = useState(15000);
  const [form, setForm] = useState<Record<string, string>>({});
  const [proposalFormNo, setProposalFormNo] = useState("");
  const [proposalNumberLoading, setProposalNumberLoading] = useState(true);


  const set = (key: string, value: string) => setForm((old) => ({ ...old, [key]: value }));
  const value = (key: string) => form[key] ?? "";
  const frequencyMeta = frequencies.find((item) => item.value === frequency)!;

  const mutation = useMutation({
    mutationFn: (input: CreateMonthlyProposalInput) => createMonthlyProposal(input),
    onSuccess: (result) => {
      toast.success(`Proposal saved — ${result.proposalFormNo}`);
      onSaved?.(result.id);
      router.push(`/features/monthly-proposals/${result.id}`);
    },
    onError: async (error: Error) => {
      toast.error(error.message || "Failed to save proposal");

      try {
        const response = await fetch(
          "/api/investments/next-proposal-number",
          { cache: "no-store" }
        );
        const result = await response.json();
        setProposalFormNo(result.proposalFormNo ?? "");
      } catch {
        setProposalFormNo("");
      }
    },

  });

  useEffect(() => {
    let cancelled = false;

    async function loadNextProposalNumber() {
      try {
        setProposalNumberLoading(true);

        const response = await fetch(
          "/api/investments/next-proposal-number",
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Failed to load proposal number");
        }

        const result: { proposalFormNo?: string } = await response.json();

        if (!cancelled) {
          setProposalFormNo(result.proposalFormNo ?? "");
        }
      } catch (error) {
        console.error("Proposal number preview failed:", error);

        if (!cancelled) {
          setProposalFormNo("");
        }
      } finally {
        if (!cancelled) {
          setProposalNumberLoading(false);
        }
      }
    }

    loadNextProposalNumber();

    return () => {
      cancelled = true;
    };
  }, []);




  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!value("applicantName").trim()) return toast.error("Applicant name is required");
    if (premium < frequencyMeta.min) return toast.error(`Minimum premium is Rs. ${frequencyMeta.min.toLocaleString()}`);
    const payingYears = planType === "PENSION" ? duration : plans[planType].payingYears;
    const totalInvested = premium * frequencyMeta.periods * payingYears;
    const interestRate = planType === "PENSION" ? Math.min(20, 6 + duration * 2) : frequency === "MONTHLY" ? 15 : frequency === "QUARTERLY" ? 18 : frequency === "SEMI_ANNUAL" ? 21 : 24;
    const interestEarned = totalInvested * (interestRate / 100) * Math.max(1, duration / 2);
    const maturityAmount = totalInvested + interestEarned - 500;
    mutation.mutate({
      planType, clientId, applicantName: value("applicantName").trim(), applicantNic: value("applicantNic") || undefined,
      applicantDob: value("applicantDob") || undefined, applicantAge: value("applicantAge") ? Number(value("applicantAge")) : undefined,
      applicantAddress: value("applicantAddress") || undefined, applicantPhone: value("applicantPhone") || undefined, applicantEmail: value("applicantEmail") || undefined,
      gender: value("gender") || undefined, maritalStatus: value("maritalStatus") || undefined,
      applicantBankAccNo: value("applicantBankAccNo") || undefined, applicantBankName: value("applicantBankName") || undefined,
      childName: planType === "CHILD" ? value("childName") || undefined : undefined, childDob: planType === "CHILD" ? value("childDob") || undefined : undefined,
      childBirthCertNo: planType === "CHILD" ? value("childBirthCertNo") || undefined : undefined, childSchool: planType === "CHILD" ? value("childSchool") || undefined : undefined, childGrade: planType === "CHILD" ? value("childGrade") || undefined : undefined,
      duration, retirementAge: planType === "PENSION" && value("retirementAge") ? Number(value("retirementAge")) : undefined, frequency, premium,
      totalInvested, interestRate, interestEarned, maturityAmount, documentCharge: 500,
      nomineeName: value("nomineeName") || undefined, nomineeNic: value("nomineeNic") || undefined, nomineeRelationship: value("nomineeRelationship") || undefined, nomineePhone: value("nomineePhone") || undefined,
      agentBankAccNo: value("agentBankAccNo") || undefined, agentBankName: value("agentBankName") || undefined, agentBankBranch: value("agentBankBranch") || undefined,
    });
  }

  const field = (key: string, label: string, type = "text", extra = "") => <div className={extra}><label className={labelClass}>{label}</label><input className={inputClass} type={type} value={value(key)} onChange={(e) => set(key, e.target.value)} /></div>;

  return <form onSubmit={submit} className="space-y-7 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
    <div>
      <h2 className="text-lg font-bold">New Monthly Proposal</h2><p className="mt-1 text-sm text-muted-foreground">Create a proposal matching the printed Super Green forms.</p></div>
    <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold">New Monthly Proposal</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a proposal matching the printed Super Green forms.
        </p>
      </div>

      <div className="min-w-[220px] rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Proposal Form No.
        </p>

        <p className="mt-1 font-mono text-base font-bold text-primary">
          {proposalNumberLoading ? "Loading…" : proposalFormNo || "Unavailable"}
        </p>

        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
          Number is confirmed when the proposal is saved.
        </p>
      </div>
    </div>


    <section>
      <h3 className="mb-3 border-b border-border pb-2 text-sm font-bold">Plan selection</h3>
      <div className="grid gap-3 sm:grid-cols-3">{(Object.keys(plans) as MonthlyPlanType[]).map((type) => <button key={type} type="button" onClick={() => { setPlanType(type); setDuration(plans[type].durations[0]); }} className={`rounded-xl border p-3 text-sm font-semibold ${planType === type ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/20"}`}>{plans[type].label}<span className="mt-1 block text-[10px] opacity-70">{type}</span></button>)}</div></section>
    <section>
      <h3 className="mb-3 border-b border-border pb-2 text-sm font-bold">Applicant / parent / guardian details</h3><div className="grid gap-4 sm:grid-cols-2">{field("applicantName", "Full name *", "text", "sm:col-span-2")}{field("applicantNic", "NIC")}{field("applicantDob", "Date of birth", "date")}{field("applicantAge", "Age", "number")}{field("applicantPhone", "Phone")}{field("applicantEmail", "Email", "email")}{field("applicantAddress", "Address", "text", "sm:col-span-2")}{planType === "MARGE" && <>{field("gender", "Gender")}{field("maritalStatus", "Marital status")}</>}{(planType === "PENSION" || planType === "MARGE") && <>{field("applicantBankAccNo", "Applicant bank account")}{field("applicantBankName", "Applicant bank name")}</>}</div></section>
    {planType === "CHILD" && <section>
      <h3 className="mb-3 border-b border-border pb-2 text-sm font-bold">Child details</h3><div className="grid gap-4 sm:grid-cols-2">{field("childName", "Child full name", "text", "sm:col-span-2")}{field("childDob", "Child date of birth", "date")}{field("childBirthCertNo", "Birth certificate no.")}{field("childSchool", "School")}{field("childGrade", "Grade / class")}</div></section>}
    <section>
      <h3 className="mb-3 border-b border-border pb-2 text-sm font-bold">Plan and payment</h3><div className="grid gap-4 sm:grid-cols-2"> <div><label className={labelClass}>Duration</label><select className={inputClass} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>{plans[planType].durations.map((year) => <option key={year} value={year}>{year} years</option>)}</select></div>{planType === "PENSION" && field("retirementAge", "Retirement age", "number")}<div><label className={labelClass}>Payment frequency</label><select className={inputClass} value={frequency} onChange={(e) => { const next = e.target.value as MonthlyFrequency; setFrequency(next); setPremium(Math.max(premium, frequencies.find((f) => f.value === next)!.min)); }}>{frequencies.map((item) => <option key={item.value} value={item.value}>{item.label} — min Rs. {item.min.toLocaleString()}</option>)}</select></div><div><label className={labelClass}>Premium</label><input className={inputClass} type="number" min={frequencyMeta.min} value={premium} onChange={(e) => setPremium(Number(e.target.value))} /></div></div></section>
    <section>
      <h3 className="mb-3 border-b border-border pb-2 text-sm font-bold">Nominee / beneficiary</h3><div className="grid gap-4 sm:grid-cols-2">{field("nomineeName", "Name")}{field("nomineeNic", "NIC")}{field("nomineeRelationship", "Relationship")}{field("nomineePhone", "Phone")}</div></section>
    <section>
      <h3 className="mb-3 border-b border-border pb-2 text-sm font-bold">Agent bank details</h3><div className="grid gap-4 sm:grid-cols-3">{field("agentBankAccNo", "Account no.")}{field("agentBankName", "Bank name")}{field("agentBankBranch", "Branch")}</div></section>
    <div className="flex justify-end gap-3">

      <button type="button" onClick={() => router.back()} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={mutation.isPending} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{mutation.isPending ? "Saving…" : "Save proposal"}</button></div>
  </form>;
}

export { frequencies, plans };
