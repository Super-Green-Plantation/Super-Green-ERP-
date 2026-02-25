"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { Mail, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/resetPassword/newPassword`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset email sent. Check your inbox.");
      }
    } catch (err) {
      toast.error("Something went wrong.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 transition-colors duration-500 font-sans">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Branding Area */}
        <div className="text-center mb-10">
          <div className="inline-flex overflow-hidden items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-2xl shadow-white/5 mb-6">
            <Image src="/logo.jpeg" alt="Logo" width={64} height={60} className="object-cover" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
            Reset Access
          </h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">
            Secure Terminal v1.0
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/5 p-10">
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2 text-center pb-2">
               <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Enter your authorized email to receive a secure password reset link.
              </p>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Authorized Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within:text-blue-400 transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="you@supergreen.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/5 rounded-2xl text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-slate-800 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || email === ""}
              className="group relative w-full bg-white hover:bg-slate-100 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-white/5 active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <Link 
                href="/auth/signin" 
                className="inline-flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                <ArrowLeft size={12} />
                Back to Authentication
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Internal Use Only &bull; Secured by SSL encryption
        </p>
      </div>
    </div>
  );
}