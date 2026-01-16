"use client";

import { useFormContext } from "@/app/context/FormContext";
import { useState } from "react";
import { toast } from "sonner";

type Status = "success" | "error" | null;

export const SubmitButton = () => {
  const { form } = useFormContext();

  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setStatus(null);

    const data = form.getValues(); // ✅ correct

    try {
      const res = await fetch("/api/src/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        setStatus("error");
        toast.error("Something went wrong, please try again");
        return;
      }

      toast.success("Client Saved success !");
      form.reset(); // ✅ optional: reset form after success
    } catch (err) {
      toast.error("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        type="submit"
        disabled={loading}
        className={`w-full py-3 rounded-lg font-bold transition mt-5
          ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }
        `}
      >
        {loading ? "Submitting..." : "Submit Application"}
      </button>
    </>
  );
};
