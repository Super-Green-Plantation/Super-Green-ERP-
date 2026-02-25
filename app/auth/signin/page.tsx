"use client";

import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import * as z from "zod";
import { login } from "./action";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [Loading, setLoading] = useState(false);
  const router = useRouter()

  const initialState = { error: null }

  const [state, formAction] = useActionState(login, initialState)

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);


  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 transition-colors duration-500">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Branding Area */}
        <div className="text-center mb-10">
          <div className="inline-flex overflow-hidden items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-2xl shadow-white/5 mb-6">
            <Image src="/logo.jpeg" alt="Logo" width={64} height={60} />

          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
            Sign In
          </h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">
            Secure Terminal v1.0
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/5 p-10">
          <form action={formAction} className="space-y-6">

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within:text-blue-400 transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  placeholder="you@supergreen.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/5 rounded-2xl text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-slate-800 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Password
                </label>
                <button
                  onClick={()=> router.push("/auth/resetPassword")}
                  type="button" className="text-[10px] font-bold text-blue-400 uppercase tracking-tight hover:text-blue-300 transition-colors">
                  Forgot Password ?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within:text-blue-400 transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-white/5 rounded-2xl text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-slate-800 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={email === "" || password === ""}
              className="group relative w-full bg-white hover:bg-slate-100 disabled:bg-slate-700 text-slate-950 rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-white/5 active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden"
            >
              {Loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-[0.1em]">
          Internal Use Only &bull; Secured by SSL encryption
        </p>
      </div>
    </div>
  );
}
