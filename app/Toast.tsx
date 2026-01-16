"use client";

import { useEffect } from "react";
import { toast, Toaster } from "sonner";

export default function Toast({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    toast.success("Toast system is working");
  }, []);

  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  );
}
