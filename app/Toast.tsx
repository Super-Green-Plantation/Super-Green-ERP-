"use client";

import { Toaster } from "sonner";

export default function Toast({ children }: { children: React.ReactNode }) {
  
  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  );
}
