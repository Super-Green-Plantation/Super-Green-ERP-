"use client";


import { useFormContext } from "@/app/context/FormContext";

export const SubmitButton = () => {
  const { form } = useFormContext();
  const data = form.getValues;
  const handleSubmit = async () => {
    console.log("Submitting all data:", data);

    const res = await fetch("/api/src/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    console.log(result);
  };

  return <button onClick={handleSubmit}>Submit Application</button>;
};
