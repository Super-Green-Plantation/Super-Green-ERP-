// src/components/proposal/ProposalDownloadButton.tsx
"use client";

import dynamic from "next/dynamic";
import { ProposalPDF } from "../Doc/ProposalTemplate";

// PDFDownloadLink must be dynamically imported with ssr: false.
// @react-pdf uses browser APIs that are not available on the server.
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface Props {
  data: any;
  filename?: string;
}

export function ProposalDownloadButton({ data, filename }: Props) {
  const pdfFilename =
    filename ??
    `Proposal_${data.applicant?.nic ?? "draft"}.pdf`;

  return (
    <PDFDownloadLink
      document={<ProposalPDF data={data} />}
      fileName={pdfFilename}
    >
      {({ loading, error }) => {
        if (error) return <span style={{ color: "red" }}>Error generating PDF</span>;
        return (
          <button
            disabled={loading}
            style={{
              padding: "8px 18px",
              backgroundColor: loading ? "#9cb99c" : "#1e6b1e",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Preparing PDF…" : "Download Proposal PDF"}
          </button>
        );
      }}
    </PDFDownloadLink>
  );
}