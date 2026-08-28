"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMonthlyProposal, getMonthlyProposal } from "../actions";
import MonthlyProposalPrintButton from "@/app/components/MonthlyProposals/MonthlyProposalPrintButton";

const label: Record<string, string> = { CHILD: "Child Plan", MARGE: "Marriage Plan", PENSION: "Retirement Plan" };
const money = (n: any) => `Rs. ${Number(n || 0).toLocaleString("en-LK", { maximumFractionDigits: 2 })}`;
function Group({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><h2 className="mb-4 border-b border-border pb-2 text-sm font-black uppercase tracking-wider text-primary">{title}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div></section>; }
function Item({ name, value }: { name: string; value: any }) { return <div><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{name}</p><p className="mt-1 text-sm font-semibold">{value || "—"}</p></div>; }

export default function MonthlyProposalDetailPage() {
  const router = useRouter(); const params = useParams<{ id: string }>(); const id = Number(params.id);
  const { data, isLoading, error } = useQuery({ queryKey: ["monthly-proposal", id], queryFn: () => getMonthlyProposal(id), enabled: Number.isFinite(id) });
  async function remove() { if (!window.confirm("Delete this proposal?")) return; try { await deleteMonthlyProposal(id); toast.success("Proposal deleted"); router.push("/features/monthly-proposals"); } catch (e: any) { toast.error(e.message || "Delete failed"); } }
  if (isLoading) return <main className="p-8 text-sm text-muted-foreground">Loading proposal…</main>;
  if (error || !data) return <main className="p-8 text-sm text-destructive">Unable to load this proposal.</main>;
  return <main className="mx-auto min-h-screen w-full max-w-[1300px] space-y-5 px-4 pb-12 pt-6 sm:px-7"><header className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><Link href="/features/monthly-proposals" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"><ArrowLeft size={14} /> Back to proposals</Link><h1 className="text-2xl font-black tracking-tight">{data.proposalFormNo || "Monthly Proposal"}</h1><p className="mt-1 text-sm text-muted-foreground">{label[data.planType]} · Created {new Date(data.createdAt).toLocaleString()}</p></div><div className="flex gap-2"><MonthlyProposalPrintButton proposalId={id} /><button onClick={remove} className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10"><Trash2 size={16} /> Delete</button></div></header>
  <Group title="Proposal metadata"><Item name="Proposal number" value={data.proposalFormNo} /><Item name="Plan type" value={label[data.planType]} /><Item name="Created by" value={data.createdBy?.nameWithInitials} /><Item name="Created date" value={new Date(data.createdAt).toLocaleDateString()} />{data.client && <Item name="Linked client" value={<Link className="inline-flex items-center gap-1 text-primary hover:underline" href={`/features/clients/${data.client.id}`}>{data.client.fullName}<ExternalLink size={12} /></Link>} />}</Group>
  <Group title="Applicant / parent / guardian"><Item name="Full name" value={data.applicantName} /><Item name="NIC" value={data.applicantNic} /><Item name="Date of birth" value={data.applicantDob && new Date(data.applicantDob).toLocaleDateString()} /><Item name="Age" value={data.applicantAge} /><Item name="Phone" value={data.applicantPhone} /><Item name="Email" value={data.applicantEmail} /><Item name="Address" value={data.applicantAddress} /><Item name="Gender" value={data.gender} /><Item name="Marital status" value={data.maritalStatus} /><Item name="Bank account" value={data.applicantBankAccNo} /><Item name="Bank name" value={data.applicantBankName} /></Group>
  {data.planType === "CHILD" && <Group title="Child details"><Item name="Child name" value={data.childName} /><Item name="Date of birth" value={data.childDob && new Date(data.childDob).toLocaleDateString()} /><Item name="Birth certificate" value={data.childBirthCertNo} /><Item name="School" value={data.childSchool} /><Item name="Grade" value={data.childGrade} /></Group>}
  <Group title="Plan and payment"><Item name="Duration" value={`${data.duration} years`} /><Item name="Retirement age" value={data.retirementAge} /><Item name="Frequency" value={String(data.frequency).replace("_", " ")} /><Item name="Premium" value={money(data.premium)} /></Group>
  <Group title="Financial summary"><Item name="Total invested" value={money(data.totalInvested)} /><Item name="Interest rate" value={`${data.interestRate}%`} /><Item name="Interest earned" value={money(data.interestEarned)} /><Item name="Document charge" value={money(data.documentCharge)} /><Item name="Maturity amount" value={money(data.maturityAmount)} /></Group>
  <Group title="Nominee / beneficiary"><Item name="Name" value={data.nomineeName} /><Item name="NIC" value={data.nomineeNic} /><Item name="Relationship" value={data.nomineeRelationship} /><Item name="Phone" value={data.nomineePhone} /></Group>
  <Group title="Agent bank details"><Item name="Account number" value={data.agentBankAccNo} /><Item name="Bank name" value={data.agentBankName} /><Item name="Branch" value={data.agentBankBranch} /></Group>
  </main>;
}
