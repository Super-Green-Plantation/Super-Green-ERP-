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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6 transition-colors duration-500">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-[12%] -top-[12%] h-[45%] w-[45%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[12%] -right-[12%] h-[45%] w-[45%] rounded-full bg-emerald-400/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Logo/Branding Area */}
        <div className="mb-8 text-center">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card shadow-[0_14px_35px_rgba(34,43,72,0.10)]">
            <Image src="/logo.png" alt="Logo" width={64} height={60} />
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">
            Sign In
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">
            Your workspace, all in one place
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-border/80 bg-card/95 p-7 shadow-[0_24px_70px_rgba(34,43,72,0.10)] backdrop-blur-xl sm:p-9">
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
                  className="w-full rounded-xl border border-border bg-muted/40 py-3.5 pl-11 pr-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all"
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
                  className="w-full rounded-xl border border-border bg-muted/40 py-3.5 pl-11 pr-11 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all"
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
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-105 disabled:bg-muted disabled:text-muted-foreground active:scale-[0.98]"
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
          Internal workspace · Secured by SSL encryption
        </p>
      </div>
    </div>
  );
}
