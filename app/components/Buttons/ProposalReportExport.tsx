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

    <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4 w-full md:w-auto">
      
      {/* Date Pickers Container: Side-by-side even on small screens, but stretching equally */}
      <div className="flex gap-3 w-full md:w-auto">
        <div className="grid gap-1.5 flex-1 md:w-36">
          <Label>From</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full min-w-30 cursor-pointer"
          />
        </div>
        
        <div className="grid gap-1.5 flex-1 md:w-36">
          <Label>To</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full min-w-30 cursor-pointer"
          />
        </div>
      </div>

      {/* Button takes full width on mobile, auto-sizes on desktop */}
      <Button
        onClick={handleExport}
        disabled={!from || !to || loading}
        className="w-full md:w-auto shrink-0"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Export Investment Report
      </Button>
    </div>
  );
}