// components/SupportButton.tsx
"use client";

import { Mail } from "lucide-react";


export default function SupportButton() {
    const handleClick = () => {
        const to = "supergreenitdep@gmail.com";
        const subject = encodeURIComponent("SGP ERP — Support Request");
        const body = encodeURIComponent(
            `Hi ,

I need help with the following issue:

Module / area: 
Branch: 
Description:

Expected behaviour:


---
Submitted via SGP ERP`
        );

        window.open(
            `https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`,
            "_blank"
        );
    };

   return (
  <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
    <div className="px-3 py-2 rounded-md bg-slate-100 text-slate-800 text-sm whitespace-nowrap shadow-sm">
      Contact support
    </div>
    <button
      onClick={handleClick}
      title="Contact support"
      className="animate-pulse w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 transition-colors shadow-sm"
    >
      <Mail size={18} />
    </button>
  </div>
);
}