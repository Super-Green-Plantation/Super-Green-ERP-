import { AlertCircle } from "lucide-react";
import React from "react";

const Error = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-rose-50/30 rounded-3xl border border-rose-100/50 border-dashed">
      <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest">
        Connection Interrupted
      </h3>
      <p className="mt-1 text-xs font-bold text-rose-600/70">
        We couldn't fetch the branch records. Please check your network.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-2 bg-white text-rose-600 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm active:scale-95"
      >
        Retry Synchronization
      </button>
    </div>
  );
};

export default Error;
