"use client";

import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import { SingleInvestmentPDF } from "../Doc/ProposalTemplate";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => null }
);

interface Props {
  /** Raw investment object from your API (with .client, .plan, .branch) */
  investment: any;
  /** Beneficiary object (fetch separately or pass from parent) */
  beneficiary?: any;
  /** Nominee object (fetch separately or pass from parent) */
  nominee?: any;
  className?: string;
}

export function InvestmentDownloadButton({
  investment,
  beneficiary,
  nominee,
  className,
}: Props) {
  // Transform your API shape → the shape SingleInvestmentPDF expects
  const data = {
    applicant: {
      ...investment.client,
      proposalFormNo: investment.proposalFormNo,
      nameWithInitials: investment.client?.fullName ?? "",
      race:    investment.client?.race    ?? "",
      country: investment.client?.country ?? "Sri Lanka",
    },
    investments: [
      {
        ...investment,
        // map investmentRates array → single rate value
        investmentRate: investment.investmentRates?.[0] ?? investment.plan?.rate?.[0] ?? "",
        beneficiaryId: "b1",
        nomineeId:     "n1",
      },
    ],
    beneficiaries: beneficiary ? [{ ...beneficiary, id: "b1" }] : [],
    nominees:      nominee     ? [{ ...nominee,     id: "n1" }] : [],
  };

  const fileName = `Proposal_${investment.proposalFormNo ?? investment.refNumber}.pdf`;

  return (
    <PDFDownloadLink
      document={<SingleInvestmentPDF data={data} investmentId={investment.id.toString()} />}
      fileName={fileName}
    >
      {({ loading, error }) => {
        if (error) return <span className="text-red-500 text-xs">Error</span>;
        return (
          <button
            disabled={loading}
            title={loading ? "Preparing PDF…" : `Download ${investment.refNumber}`}
            className={
              className ??
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 " +
              (loading
                ? "bg-muted text-muted-foreground cursor-wait"
                : "bg-primary text-primary-foreground hover:opacity-90")
            }
          >
            <Download className="w-3.5 h-3.5" />
            {loading ? "…" : "PDF"}
          </button>
        );
      }}
    </PDFDownloadLink>
  );
}