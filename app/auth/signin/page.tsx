"use client";

import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { login } from "./action";

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
      setLoading(false);
    }
  }, [state.error]);


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 transition-colors duration-500">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Branding Area */}
        <div className="text-center mb-10">
          <div className="inline-flex overflow-hidden items-center justify-center w-16 h-16 bg-card rounded-2xl shadow-2xl shadow-primary/5 mb-6 border border-border">
            <Image src="/logo.png" alt="Logo" width={64} height={60} />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tighter uppercase">
            Sign In
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">
            Secure Terminal v1.0
          </p>
        </div>

        {/* Card */}
        <div className="bg-card backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-border p-10">
          <form action={formAction} className="space-y-6">

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-muted-foreground group-focus-within:text-primary transition-colors">
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
                  className="w-full pl-12 pr-4 py-4 bg-muted/30 border border-border rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-card transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Password
                </label>
                <button
                  onClick={()=> router.push("/auth/resetPassword")}
                  type="button" className="text-[10px] font-bold text-primary uppercase tracking-tight hover:underline transition-colors">
                  Forgot Password ?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-muted-foreground group-focus-within:text-primary transition-colors">
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
                  className="w-full pl-12 pr-12 py-4 bg-muted/30 border border-border rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-card transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
            onClick={()=>setLoading(true)}
              type="submit"
              disabled={email === "" || password === ""}
              className="group relative w-full bg-primary hover:opacity-90 disabled:bg-muted text-primary-foreground rounded-2xl py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/10 active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden"
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
        <p className="text-center mt-8 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Internal Use Only &bull; Secured by SSL encryption
        </p>
      </div>
    </div>
  );
}
