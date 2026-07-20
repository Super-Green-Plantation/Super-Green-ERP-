import { Suspense } from "react";
import PayrollTabs from "./PayrollTabs";

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen flex flex-col">
      <Suspense fallback={<div className="border-b border-border bg-card px-4 sm:px-8 pt-6 h-[52px]" />}>
        <PayrollTabs />
      </Suspense>
      {children}
    </div>
  );
}