"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Leaf, Loader2, Lock, Mail, CheckCircle2 } from "lucide-react";

function SignInInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const linkExpired = searchParams.get("error") === "link-expired";
  const supabase = supabaseBrowser();

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      const msg =
        authError.message === "Invalid login credentials"
          ? "Incorrect email or password. Please try again."
          : authError.message === "Email not confirmed"
          ? "Your account email is not confirmed. Please contact your administrator."
          : authError.message;
      setError(msg);
      triggerShake();
      return;
    }

    router.push("/features/dashboard");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .signin-root {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(34,197,94,0.18) 0%, transparent 60%),
                      linear-gradient(160deg, #0d1117 0%, #111827 50%, #0d1117 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          position: relative;
          overflow: hidden;
        }

        /* Ambient orbs */
        .signin-root::before {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%);
          top: -150px;
          left: -150px;
          pointer-events: none;
        }
        .signin-root::after {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%);
          bottom: -100px;
          right: -100px;
          pointer-events: none;
        }

        .signin-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: rgba(22, 27, 34, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 2.5rem 2.25rem;
          box-shadow:
            0 0 0 1px rgba(34,197,94,0.06),
            0 20px 60px rgba(0,0,0,0.5),
            0 4px 20px rgba(0,0,0,0.3);
          animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .shake {
          animation: shake 0.55s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-6px); }
          40%, 60% { transform: translateX(6px); }
        }

        /* Logo */
        .logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          margin-bottom: 1.75rem;
        }
        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #16a34a, #22c55e);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(34,197,94,0.35);
        }
        .logo-text {
          font-size: 1.3rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #f0fdf4;
        }
        .logo-text span {
          color: #22c55e;
        }

        /* Header */
        .signin-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .signin-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: #f9fafb;
          margin: 0 0 0.35rem 0;
          letter-spacing: -0.02em;
        }
        .signin-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        /* Input group */
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .input-field {
          position: relative;
        }
        .input-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: #9ca3af;
          margin-bottom: 0.4rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .input-inner {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 0.875rem;
          color: #4b5563;
          pointer-events: none;
          transition: color 0.2s;
        }
        .input-inner input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 0.7rem 0.875rem 0.7rem 2.75rem;
          font-size: 0.925rem;
          color: #f9fafb;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          font-family: inherit;
          box-sizing: border-box;
        }
        .input-inner input::placeholder {
          color: #374151;
        }
        .input-inner input:focus {
          border-color: rgba(34,197,94,0.5);
          background: rgba(34,197,94,0.04);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.1);
        }
        .input-inner input:focus + .input-icon,
        .input-inner:focus-within .input-icon {
          color: #22c55e;
        }
        .input-inner input.has-toggle {
          padding-right: 2.75rem;
        }
        .toggle-btn {
          position: absolute;
          right: 0.875rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #4b5563;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .toggle-btn:hover {
          color: #9ca3af;
        }

        /* Error */
        .error-box {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          padding: 0.7rem 0.875rem;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .error-dot {
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 5px;
        }
        .error-text {
          font-size: 0.85rem;
          color: #fca5a5;
          line-height: 1.5;
        }

        /* Submit button */
        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #16a34a, #22c55e);
          color: #fff;
          font-weight: 600;
          font-size: 0.925rem;
          border: none;
          border-radius: 10px;
          padding: 0.8rem 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          letter-spacing: 0.01em;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(34,197,94,0.3);
          font-family: inherit;
        }
        .submit-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(34,197,94,0.4);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Footer */
        .signin-footer {
          text-align: center;
          margin-top: 1.75rem;
          font-size: 0.78rem;
          color: #374151;
        }
        .signin-footer span {
          color: #22c55e;
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .divider-text {
          font-size: 0.75rem;
          color: #374151;
          white-space: nowrap;
        }
      `}</style>

      <div className="signin-root">
        <div className={`signin-card ${shake ? "shake" : ""}`}>

          {/* Logo */}
          <div className="logo-wrap">
            <div className="logo-icon">
              <Leaf size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <div className="logo-text">Super<span>Green</span></div>
          </div>

          {/* Header */}
          <div className="signin-header">
            <h1 className="signin-title">Welcome back</h1>
            <p className="signin-subtitle">Sign in to your employee account</p>
          </div>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">EMPLOYEE PORTAL</span>
            <div className="divider-line" />
          </div>

          {/* Reset success banner */}
          {resetSuccess && (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', padding: '0.7rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', animation: 'fadeIn 0.2s ease' }}>
              <CheckCircle2 size={15} color="#22c55e" />
              <span style={{ fontSize: '0.85rem', color: '#86efac', lineHeight: 1.5 }}>Password updated successfully. Please sign in.</span>
            </div>
          )}

          {/* Link-expired banner */}
          {linkExpired && (
            <div className="error-box">
              <div className="error-dot" />
              <span className="error-text">Your reset link has expired. Please request a new one.</span>
            </div>
          )}

          {/* Auth error */}
          {error && (
            <div className="error-box">
              <div className="error-dot" />
              <span className="error-text">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              {/* Email */}
              <div className="input-field">
                <label className="input-label" htmlFor="email">Email address</label>
                <div className="input-inner">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@supergreen.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail size={15} className="input-icon" />
                </div>
              </div>

              {/* Password */}
              <div className="input-field">
                <label className="input-label" htmlFor="password">Password</label>
                <div className="input-inner">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="has-toggle"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock size={15} className="input-icon" />
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Forgot password link */}
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
              <Link href="/auth/forgot-password" style={{ fontSize: '0.8rem', color: '#6b7280', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#22c55e')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
              >
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="signin-footer">
            Need access? Contact your <span>administrator</span>.
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  );
}
