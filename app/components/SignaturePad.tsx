"use client";

import SignatureCanvas from "react-signature-canvas";
import { useRef } from "react";
import { Eraser, CheckCircle2 } from "lucide-react";
import { useFormContext } from "../context/FormContext";

export default function SignaturePad() {
  const { form } = useFormContext();
  const { setValue } = form;
  const sigRef = useRef<SignatureCanvas>(null);

  const saveSignature = async (e: any) => {
    e.preventDefault();
    if (!sigRef.current || sigRef.current.isEmpty()) return;

    const dataUrl = sigRef.current.toDataURL("image/png");
    console.log("Signature captured:", dataUrl);

    const res = await fetch("/api/src/client-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });

    const data = await res.json();
    setValue("applicant.signature", data.url);
    console.log("Cloudinary URL:", data.url);
  };

  const clear = (e: any) => {
    e.preventDefault();
    sigRef.current?.clear();
  };

  return (
    <div className="space-y-3">
      <div className="relative group">
        {/* Canvas Container */}
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden transition-all group-hover:border-blue-300">
          <SignatureCanvas
            ref={sigRef}
            penColor="#1e293b" // Deep slate for a more professional "ink" look
            canvasProps={{
              className: "w-full h-40 cursor-crosshair",
            }}
          />
        </div>

        {/* Floating Instruction */}
        <div className="absolute top-2 right-4 pointer-events-none">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 opacity-50">
            Sign inside the box
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Eraser className="w-3 h-3" />
            Clear
          </button>

          <button
            type="button"
            onClick={saveSignature}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <CheckCircle2 className="w-3 h-3" />
            Confirm Signature
          </button>
        </div>

        <p className="text-[10px] text-gray-400 font-medium italic">
          Digital ID Verified
        </p>
      </div>
    </div>
  );
}
