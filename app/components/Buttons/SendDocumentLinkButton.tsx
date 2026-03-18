"use client";

// SendDocumentLinkButton.tsx — updated with emailSent status
// Drop this into your ApplicationViewPage alongside the other action buttons.

import { useState } from "react";
import { Link2, Loader2, CheckCircle2, Copy } from "lucide-react";
import { generateUploadUrl } from "@/app/features/clients/actions";
import { toast } from "sonner";

export default function SendDocumentLinkButton({ clientId }: { clientId: number }) {
  const [loading, setLoading] = useState(false);
  const [uploadLink, setUploadLink] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateUploadUrl(clientId);
      setUploadLink(res.uploadLink);

      // Also copy to clipboard automatically
      await navigator.clipboard.writeText(res.uploadLink);
      toast.success("Link generated, copied to clipboard & emailed to client.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate upload link.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!uploadLink) return;
    await navigator.clipboard.writeText(uploadLink);
    toast.success("Link copied to clipboard.");
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-violet-600 disabled:bg-slate-400 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all shadow-lg active:scale-95 border border-white/5"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
        ) : (
          <><Link2 className="w-4 h-4 text-violet-400" /> Send Doc Request</>
        )}
      </button>

      {/* Show the link inline with a copy button after generation */}
      {uploadLink && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-[10px] text-slate-500 truncate flex-1">{uploadLink}</p>
          <button
            onClick={handleCopy}
            className="shrink-0 p-1.5 hover:bg-slate-200 rounded-md transition-colors"
            title="Copy link"
          >
            <Copy className="w-3 h-3 text-slate-600" />
          </button>
        </div>
      )}
    </div>
  );
}