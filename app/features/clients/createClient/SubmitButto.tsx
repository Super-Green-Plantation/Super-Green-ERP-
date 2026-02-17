"use client";

import { useFormContext } from "@/app/context/FormContext";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Rocket } from "lucide-react"; // Matching our icon set
import { createClient } from "../actions";

type Status = "success" | "error" | null;

export const SubmitButton = () => {
  const { form } = useFormContext();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    const data = form.getValues(); 
    console.log(data);

    try {
      const res = await createClient(data);

      if (!res.success) {
        toast.error(res.error || "Something went wrong, please try again");
        return;
      }

      toast.success("Client Saved successfully!");
      form.reset(); 
    } catch (err) {
      toast.error("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleSubmit}
        type="submit"
        disabled={loading}
        className={`
          w-full py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300
          flex items-center justify-center gap-3
          ${
            loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 active:scale-[0.98] hover:-translate-y-0.5"
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Application...
          </>
        ) : (
          <>
            
            Finalize & Register Client
          </>
        )}
      </button>
      
      {!loading && (
        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-4">
          Encrypted Secure Submission
        </p>
      )}
    </div>
  );
};