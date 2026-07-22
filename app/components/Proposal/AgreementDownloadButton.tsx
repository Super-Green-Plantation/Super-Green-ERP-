"use client";

/**
 * AgreementDownloadButton.tsx
 * Place at: /app/components/Proposal/AgreementDownloadButton.tsx
 *
 * Generates and downloads the Sinhala investment agreement as a .docx file.
 * No react-pdf involved — pure docx + file-saver.
 *
 * npm install docx file-saver
 * npm install --save-dev @types/file-saver
 */

import { useState } from "react";
import { FileText } from "lucide-react";
import { generateAgreementDocx } from "@/lib/generateAgreementDocx";

interface Props {
  investment: {
    proposalFormNo: string | number;
    investmentDate: Date | string;
    amount: number | string;
    branch?: { name?: string; code?: string; address?: string };
    beneficiary?: { fullName?: string; address?: string; nic?: string } | null;
  };
  client: {
    applicant: { fullName: string; nic: string; address?: string };
  };
  branchCode?: string;
  className?: string;
}

export function AgreementDownloadButton({ investment, client, branchCode, className }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await generateAgreementDocx(investment, client, branchCode);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        "shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors disabled:opacity-50"
      }
    >
      <FileText className="w-3.5 h-3.5" />
      {loading ? "Preparing…" : "Agreement"}
    </button>
  );
}