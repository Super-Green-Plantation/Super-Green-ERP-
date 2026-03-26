
"use client";

import { useFormContext } from "@/app/context/FormContext";
import { uploadClientSignature } from "@/app/features/uploads/actions";
import { Eraser, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";import { toast } from "sonner";

export default function SignaturePad() {
  const { form } = useFormContext();
  const { setValue } = form;
  const sigRef = useRef<SignatureCanvas>(null);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const saveSignature = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Please draw your signature first.");
      return;
    }

    setSaving(true);
    try {
      const dataUrl = sigRef.current.toDataURL("image/png");
      const data = await uploadClientSignature(dataUrl);
      setValue("applicant.signature", data.url, { shouldDirty: true });
      setConfirmed(true);
      toast.success("Signature saved.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload signature. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const clear = (e: React.MouseEvent) => {
    e.preventDefault();
    sigRef.current?.clear();
    setConfirmed(false);
    setValue("applicant.signature", "");
  };

  return (
    <div className="space-y-3">
      <div className="relative group">
        <div
          className={`bg-gray-50 border-2 border-dashed rounded-2xl overflow-hidden transition-all ${
            confirmed
              ? "border-green-400 bg-green-50/30"
              : "border-gray-200 group-hover:border-blue-300"
          }`}
        >
          <SignatureCanvas
            ref={sigRef}
            penColor="#1e293b"
            canvasProps={{ className: "w-full h-40 cursor-crosshair" }}
          />
        </div>

        <div className="absolute top-2 sm:right-4 right-6 pointer-events-none">
          {confirmed ? (
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-green-500">
              ✓ Signature confirmed
            </span>
          ) : (
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 opacity-50">
              Sign inside the box
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <Eraser className="w-3 h-3" />
            Clear
          </button>

          <button
            type="button"
            onClick={saveSignature}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            ) : (
              "Confirm Signature"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
