"use client";

import SignatureCanvas from "react-signature-canvas";
import { useRef } from "react";

export default function SignaturePad() {
  const sigRef = useRef<SignatureCanvas>(null);

  const saveSignature = (e:any) => {
    e.preventDefault()
    if (!sigRef.current) return;

    const dataUrl = sigRef.current.toDataURL("image/png");
    console.log(dataUrl); // send this to backend
  };

  const clear = (e:any)=>{
    e.preventDefault()
    sigRef.current?.clear()
  }

  return (
    <div>
      <SignatureCanvas
        ref={sigRef}
        penColor="black"
        canvasProps={{
          width: 500,
          height: 200,
          className: "border rounded",
        }}
      />

      <div className="mt-2 flex gap-2">
        <button 
        className="px-4 py-1 bg-gray-200 rounded"
        onClick={(e)=>clear(e) }>
          Clear
        </button>
        <button onClick={(e)=>saveSignature(e)} 
        className="px-4 py-1 bg-gray-200 rounded">
          Save Signature
        </button>
      </div>
    </div>
  );
}
