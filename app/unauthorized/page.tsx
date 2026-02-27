"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon with subtle pulse effect */}
        <div className="relative">
          <div className="absolute inset-0 bg-red-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
          <div className="relative flex justify-center">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-red-50 to-white">
              <ShieldAlert className="w-16 h-16 text-red-500" />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Access Denied
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            Oops! You don't have the required permissions to view this page. 
            Please contact your administrator if you believe this is a mistake.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-xl transition-all border border-slate-200 shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          
          <button
            onClick={() => router.push("/")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-95"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>
        </div>

        {/* Status Code Footer */}
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 pt-8">
          Error Code: 403 Forbidden
        </p>
      </div>
    </div>
  );
}