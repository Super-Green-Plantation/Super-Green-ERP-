"use client";

import { useState } from "react";
import { Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { generateMonthlyProposalPDF, MonthlyProposalPDFData } from "@/app/pdf/MonthlyProposal";
import { getMonthlyProposal } from "@/app/features/monthly-proposals/actions";

export default function MonthlyProposalPrintButton({ proposalId, data, compact = false }: { proposalId?: number; data?: Partial<MonthlyProposalPDFData> & Record<string, any>; compact?: boolean }) {
  const [loading, setLoading] = useState(false);
  async function print() {
    setLoading(true);
    try {
      const record: any = proposalId ? await getMonthlyProposal(proposalId) : data;
      if (!record) throw new Error("Proposal data unavailable");
      await generateMonthlyProposalPDF({ ...record, createdAt: record.createdAt || new Date(), proposalFormNo: record.proposalFormNo || "monthly-proposal", documentCharge: Number(record.documentCharge || 500), totalInvested: Number(record.totalInvested || 0), interestRate: Number(record.interestRate || 0), interestEarned: Number(record.interestEarned || 0), maturityAmount: Number(record.maturityAmount || 0), premium: Number(record.premium || 0), duration: Number(record.duration || 0) } as MonthlyProposalPDFData);
      toast.success("PDF generated");
    } catch (error: any) { toast.error(error.message || "Could not generate PDF"); } finally { setLoading(false); }
  }
  return <button type="button" onClick={print} disabled={loading} title="Print PDF" className={compact ? "rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-50" : "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"}>{loading ? <Loader2 size={compact ? 16 : 17} className="animate-spin" /> : <Printer size={compact ? 16 : 17} />}{!compact && "Print PDF"}</button>;
}
