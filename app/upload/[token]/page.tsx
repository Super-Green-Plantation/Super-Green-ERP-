"use client";

// app/upload/[token]/page.tsx

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck, UploadCloud, FileText, X,
  CheckCircle2, Loader2, AlertTriangle, Eraser, PenLine,
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { validateUploadToken, saveUploadedDocuments } from "@/app/features/clients/actions";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "kyc-documents";

type TokenState = "loading" | "valid" | "invalid" | "expired" | "used" | "done";

const uploadFileToSupabase = async (key: string, file: File): Promise<string> => {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${key}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) throw new Error(`Upload failed for ${key}: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

// Converts base64 dataUrl → Uint8Array and uploads directly from browser
const uploadBase64ToSupabase = async (key: string, dataUrl: string): Promise<string> => {
  const supabase = createClient();
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const path = `${key}/${Date.now()}-${crypto.randomUUID()}.png`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, binary, {
    cacheControl: "3600",
    upsert: false,
    contentType: "image/png",
  });

  if (error) throw new Error(`Signature upload failed: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

const docFields = [
  { key: "idFront",     label: "ID / NIC — Front", description: "Clear photo or scan of front side" },
  { key: "idBack",      label: "ID / NIC — Back",  description: "Clear photo or scan of back side" },
  { key: "paymentSlip", label: "Payment Slip",      description: "Your payment receipt or slip" },
];

export default function PublicUploadPage() {
  const { token } = useParams<{ token: string }>();

  const [tokenState, setTokenState]     = useState<TokenState>("loading");
  const [clientName, setClientName]     = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading]       = useState(false);

  const [files, setFiles] = useState<Record<string, File | null>>({
    idFront: null, idBack: null, paymentSlip: null,
  });
  const [previews, setPreviews] = useState<Record<string, string | null>>({
    idFront: null, idBack: null, paymentSlip: null,
  });

  // Signature state
  const sigRef = useRef<SignatureCanvas>(null);
  const [sigConfirmed, setSigConfirmed] = useState(false);
  const [sigDataUrl, setSigDataUrl]     = useState<string | null>(null);

  useEffect(() => {
    validateUploadToken(token).then((res) => {
      if (!res.valid) {
        setErrorMessage(res.error!);
        setTokenState(
          res.error?.includes("expired") ? "expired"
          : res.error?.includes("already") ? "used"
          : "invalid"
        );
        return;
      }
      setClientName(res.request!.client.fullName);
      setTokenState("valid");
    });
  }, [token]);

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setPreviews((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key]!);
      return { ...prev, [key]: file ? URL.createObjectURL(file) : null };
    });
  };

  const handleConfirmSignature = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      alert("Please draw your signature first.");
      return;
    }
    setSigDataUrl(sigRef.current.toDataURL("image/png"));
    setSigConfirmed(true);
  };

  const handleClearSignature = () => {
    sigRef.current?.clear();
    setSigConfirmed(false);
    setSigDataUrl(null);
  };

  const handleSubmit = async () => {
    const hasFiles = Object.values(files).some(Boolean);
    if (!hasFiles && !sigDataUrl) {
      alert("Please upload at least one document or provide your signature.");
      return;
    }

    setUploading(true);
    try {
      const urls: Record<string, string> = {};

      for (const [key, file] of Object.entries(files)) {
        if (file) urls[key] = await uploadFileToSupabase(key, file);
      }

      if (sigDataUrl) {
        urls["signature"] = await uploadBase64ToSupabase("signatures", sigDataUrl);
      }

      const res = await saveUploadedDocuments(token, urls);
      if (!res.success) throw new Error(res.error);

      setTokenState("done");
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (tokenState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  if (tokenState === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Documents Received</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Thank you, <strong>{clientName}</strong>. Your documents and signature have been
            securely uploaded. You may close this page.
          </p>
        </div>
      </div>
    );
  }

  // ── Invalid / Expired / Used ───────────────────────────────────────────────
  if (["invalid", "expired", "used"].includes(tokenState)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Link Unavailable</h1>
          <p className="text-slate-500 text-sm">{errorMessage}</p>
          <p className="text-slate-400 text-xs">
            Please contact your advisor to request a new upload link.
          </p>
        </div>
      </div>
    );
  }

  // ── Valid — upload form ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="px-8 py-6 bg-slate-900 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-black uppercase tracking-widest">Document Upload</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Hi <span className="text-white font-semibold">{clientName}</span>, please
            upload the required documents and provide your signature below.
          </p>
        </div>

        <div className="p-8 space-y-8">

          {/* Notice */}
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
              This link is valid for 48 hours and can only be used once.
              Make sure all documents are clear and legible before submitting.
            </p>
          </div>

          {/* ── Documents ── */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Documents
            </p>

            {docFields.map(({ key, label, description }) => {
              const file = files[key];
              const preview = previews[key];
              const isPDF = file?.type === "application/pdf";

              return (
                <div key={key}>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    {label}
                  </label>
                  <div className="relative group rounded-xl border-2 border-dashed border-slate-200 h-36 overflow-hidden hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                    />
                    {file ? (
                      <div className="absolute inset-0 z-0">
                        {isPDF ? (
                          <div className="flex flex-col items-center justify-center h-full bg-slate-50 gap-1">
                            <FileText className="w-8 h-8 text-slate-400" />
                            <p className="text-[10px] text-slate-500 truncate max-w-50">{file.name}</p>
                          </div>
                        ) : (
                          <img src={preview!} alt="preview" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                          <span className="text-white text-[10px] font-black uppercase tracking-widest">Replace</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleFileChange(key, null); }}
                          className="absolute top-2 right-2 z-20 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2">
                        <UploadCloud className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        <p className="text-xs font-bold text-slate-500">Click to upload</p>
                        <p className="text-[10px] text-slate-400">{description}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Signature pad ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <PenLine className="w-3 h-3" /> Digital Signature
            </p>

            <div className={`relative rounded-2xl border-2 border-dashed overflow-hidden transition-all ${
              sigConfirmed
                ? "border-green-400 bg-green-50/30"
                : "border-slate-200 hover:border-blue-300 bg-gray-50"
            }`}>
              {sigConfirmed && sigDataUrl ? (
                /* Show confirmed preview */
                <div className="flex flex-col items-center justify-center h-40 gap-2 p-4">
                  <img
                    src={sigDataUrl}
                    alt="Your signature"
                    className="max-h-24 object-contain mix-blend-multiply"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-600">
                    ✓ Signature confirmed
                  </span>
                </div>
              ) : (
                <SignatureCanvas
                  ref={sigRef}
                  penColor="#1e293b"
                  canvasProps={{ className: "w-full h-40 cursor-crosshair" }}
                />
              )}

              {!sigConfirmed && (
                <div className="absolute top-2 right-3 pointer-events-none">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">
                    Sign inside the box
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClearSignature}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Eraser className="w-3 h-3" /> Clear
              </button>
              {!sigConfirmed && (
                <button
                  type="button"
                  onClick={handleConfirmSignature}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Confirm Signature
                </button>
              )}
            </div>
          </div>

          {/* ── Submit ── */}
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full py-3.5 bg-slate-900 hover:bg-blue-600 disabled:bg-slate-400 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            ) : (
              <><UploadCloud className="w-4 h-4" /> Submit Documents</>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}