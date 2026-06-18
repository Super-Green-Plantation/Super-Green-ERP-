// components/ProposalReportExport.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2 } from "lucide-react";
import { getProposalReportByBranch } from "@/app/features/investments/actions";
import { exportBranchReport } from "@/lib/reports/export-branch-report";

export function ProposalReportExport() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!from || !to) return;

    setLoading(true);
    try {
      const data = await getProposalReportByBranch(
        new Date(from),
        new Date(to + "T23:59:59") // include full end day
      );
      exportBranchReport(data, from, to);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-2 w-full sm:w-auto">

      {/* Date Pickers — side by side, compact */}
      <div className="flex gap-2 flex-1 sm:flex-none">
        <div className="grid gap-1 flex-1 sm:w-32">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full text-xs cursor-pointer h-8"
          />
        </div>

        <div className="grid gap-1 flex-1 sm:w-32">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full text-xs cursor-pointer h-8"
          />
        </div>
      </div>

      {/* Export button */}
      <Button
        onClick={handleExport}
        disabled={!from || !to || loading}
        size="sm"
        className="shrink-0 h-8 text-xs"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Download className="mr-1.5 h-3 w-3" />
        )}
        Export Report
      </Button>
    </div>
  );
}