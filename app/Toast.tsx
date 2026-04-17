"use client";

import { Toaster } from "sonner";

export default function Toast({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            error: "!bg-red-50 !text-red-800 !border-red-200",
            success: "!bg-green-50 !text-green-800 !border-green-200",
            warning: "!bg-yellow-50 !text-yellow-800 !border-yellow-200",
            info: "!bg-blue-50 !text-blue-800 !border-blue-200",
          },
        }}
      />
    </>
  );
}