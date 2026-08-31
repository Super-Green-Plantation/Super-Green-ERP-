"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Trash2, Zap, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { deleteMonthlyProposal, getMonthlyProposal } from "../actions";
import MonthlyProposalPrintButton from "@/app/components/MonthlyProposals/MonthlyProposalPrintButton";
import ActivateProposalModal from "@/app/components/MonthlyProposals/ActivateProposalModal";

const label: Record<string, string> = {
  CHILD: "Child Plan", MARGE: "Marriage Plan", PENSION: "Retirement Plan",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  ACTIVE:    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  MATURED:   "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  LAPSED:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  CANCELLED: "bg-gray-200 text-gray-500",
};
const money = (n: any) =>
  `Rs. ${Number(n || 0).toLocaleString("en-LK", { maximumFractionDigits: 2 })}`;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h2 className="mb-4 border-b border-border pb-2 text-sm font-black uppercase tracking-wider text-primary">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}
function Item({ name, value }: { name: string; value: any }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{name}</p>
      <p className="mt-1 text-sm font-semibold">{value || "—"}</p>
    </div>
  );
}

export default function MonthlyProposalDetailPage() {
  const router      = useRouter();
  const params      = useParams<{ id: string }>();
  const id          = Number(params.id);
  const queryClient = useQueryClient();

  const [activateOpen, setActivateOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["monthly-proposal", id],
    queryFn:  () => getMonthlyProposal(id),
    enabled:  Number.isFinite(id),
  });

  async function remove() {
    if (!window.confirm("Delete this proposal?")) return;
    try {
      await deleteMonthlyProposal(id);
      toast.success("Proposal deleted");
      router.push("/features/monthly-proposals");
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  }

  if (isLoading) return <main className="p-8 text-sm text-muted-foreground">Loading proposal…</main>;
  if (error || !data) return <main className="p-8 text-sm text-destructive">Unable to load this proposal.</main>;

  const isPending = data.status === "PENDING";
  const isActive  = data.status === "ACTIVE" || data.status === "COMPLETED";

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1300px] space-y-5 px-4 pb-12 pt-6 sm:px-7">

      {/* ── Header ── */}
      <header className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/features/monthly-proposals"
            className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft size={14} /> Back to proposals
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight">
              {data.proposalFormNo || "Monthly Proposal"}
            </h1>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[data.status] ?? ""}`}>
              {data.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {label[data.planType]} · Created {new Date(data.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Activate — only shown for PENDING proposals */}
          {isPending && (
            <button
              onClick={() => setActivateOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 px-4 py-2.5 text-sm font-bold text-white shadow transition-all active:scale-95"
            >
              <Zap size={15} /> Activate
            </button>
          )}

          {/* View Payments — only shown for ACTIVE / COMPLETED */}
          {isActive && (
            <Link
              href={`/features/monthly-proposals/${id}/payments`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 text-sm font-bold transition-all"
            >
              <CreditCard size={15} /> View Payments
            </Link>
          )}

          <MonthlyProposalPrintButton proposalId={id} />

          <button
            onClick={remove}
            className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </header>

      {/* ── Activation info banner (ACTIVE / COMPLETED) ── */}
      {isActive && data.activatedAt && (
        <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 px-5 py-4 flex flex-wrap items-center gap-6 text-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-green-700 dark:text-green-400">Activated On</span>
            <p className="font-semibold text-green-800 dark:text-green-300">
              {new Date(data.activatedAt).toLocaleDateString()}
            </p>
          </div>
          {data.maturityDate && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-green-700 dark:text-green-400">Maturity Date</span>
              <p className="font-semibold text-green-800 dark:text-green-300">
                {new Date(data.maturityDate).toLocaleDateString()}
              </p>
            </div>
          )}
          <Link
            href={`/features/monthly-proposals/${id}/payments`}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700"
          >
            <CreditCard size={12} /> Track Payments
          </Link>
        </div>
      )}

      {/* ── Detail sections ── */}
      <Group title="Proposal Metadata">
        <Item name="Proposal number" value={data.proposalFormNo} />
        <Item name="Plan type"       value={label[data.planType]} />
        <Item name="Status"          value={data.status} />
        <Item name="Created by"      value={data.createdBy?.nameWithInitials} />
        <Item name="Created date"    value={new Date(data.createdAt).toLocaleDateString()} />
        {data.client && (
          <Item name="Linked client" value={
            <Link
              className="inline-flex items-center gap-1 text-primary hover:underline"
              href={`/features/clients/${data.client.id}`}
            >
              {data.client.fullName}<ExternalLink size={12} />
            </Link>
          } />
        )}
      </Group>

      <Group title="Applicant / Parent / Guardian">
        <Item name="Full name"      value={data.applicantName} />
        <Item name="NIC"            value={data.applicantNic} />
        <Item name="Date of birth"  value={data.applicantDob && new Date(data.applicantDob).toLocaleDateString()} />
        <Item name="Age"            value={data.applicantAge} />
        <Item name="Phone"          value={data.applicantPhone} />
        <Item name="Email"          value={data.applicantEmail} />
        <Item name="Address"        value={data.applicantAddress} />
        <Item name="Gender"         value={data.gender} />
        <Item name="Marital status" value={data.maritalStatus} />
        <Item name="Bank account"   value={data.applicantBankAccNo} />
        <Item name="Bank name"      value={data.applicantBankName} />
      </Group>

      {data.planType === "CHILD" && (
        <Group title="Child Details">
          <Item name="Child name"        value={data.childName} />
          <Item name="Date of birth"     value={data.childDob && new Date(data.childDob).toLocaleDateString()} />
          <Item name="Birth certificate" value={data.childBirthCertNo} />
          <Item name="School"            value={data.childSchool} />
          <Item name="Grade"             value={data.childGrade} />
        </Group>
      )}

      <Group title="Plan and Payment">
        <Item name="Duration"        value={`${data.duration} years`} />
        <Item name="Retirement age"  value={data.retirementAge} />
        <Item name="Frequency"       value={String(data.frequency).replace("_", " ")} />
        <Item name="Premium"         value={money(data.premium)} />
      </Group>

      <Group title="Financial Summary">
        <Item name="Total invested"  value={money(data.totalInvested)} />
        <Item name="Interest rate"   value={`${data.interestRate}%`} />
        <Item name="Interest earned" value={money(data.interestEarned)} />
        <Item name="Document charge" value={money(data.documentCharge)} />
        <Item name="Maturity amount" value={money(data.maturityAmount)} />
      </Group>

      <Group title="Nominee / Beneficiary">
        <Item name="Name"         value={data.nomineeName} />
        <Item name="NIC"          value={data.nomineeNic} />
        <Item name="Relationship" value={data.nomineeRelationship} />
        <Item name="Phone"        value={data.nomineePhone} />
      </Group>

      <Group title="Agent Bank Details">
        <Item name="Account number" value={data.agentBankAccNo} />
        <Item name="Bank name"      value={data.agentBankName} />
        <Item name="Branch"         value={data.agentBankBranch} />
      </Group>

      {/* ── Activate modal ── */}
      {activateOpen && (
        <ActivateProposalModal
          proposal={data}
          onClose={() => setActivateOpen(false)}
          onActivated={() => {
            queryClient.invalidateQueries({ queryKey: ["monthly-proposal", id] });
          }}
        />
      )}
    </main>
  );
}