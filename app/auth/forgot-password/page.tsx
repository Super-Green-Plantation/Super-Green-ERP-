"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import React, { useState } from "react";
import Link from "next/link";
import { Leaf, Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .auth-root {
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(34,197,94,0.18) 0%, transparent 60%),
                linear-gradient(160deg, #0d1117 0%, #111827 50%, #0d1117 100%);
    display: flex; align-items: center; justify-content: center;
    padding: 1rem; position: relative; overflow: hidden;
  }
  .auth-root::before {
    content: ''; position: absolute; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%);
    top: -150px; left: -150px; pointer-events: none;
  }
  .auth-root::after {
    content: ''; position: absolute; width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%);
    bottom: -100px; right: -100px; pointer-events: none;
  }
  .auth-card {
    position: relative; width: 100%; max-width: 420px;
    background: rgba(22, 27, 34, 0.85);
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.07); border-radius: 20px;
    padding: 2.5rem 2.25rem;
    box-shadow: 0 0 0 1px rgba(34,197,94,0.06), 0 20px 60px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.3);
    animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .logo-wrap { display: flex; align-items: center; justify-content: center; gap: 0.6rem; margin-bottom: 1.75rem; }
  .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #16a34a, #22c55e); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(34,197,94,0.35); }
  .logo-text { font-size: 1.3rem; font-weight: 800; letter-spacing: -0.02em; color: #f0fdf4; }
  .logo-text span { color: #22c55e; }
  .auth-header { text-align: center; margin-bottom: 2rem; }
  .auth-title { font-size: 1.5rem; font-weight: 700; color: #f9fafb; margin: 0 0 0.35rem 0; letter-spacing: -0.02em; }
  .auth-subtitle { font-size: 0.875rem; color: #6b7280; margin: 0; line-height: 1.6; }
  .input-group { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
  .input-field { position: relative; }
  .input-label { display: block; font-size: 0.8rem; font-weight: 500; color: #9ca3af; margin-bottom: 0.4rem; letter-spacing: 0.02em; text-transform: uppercase; }
  .input-inner { position: relative; display: flex; align-items: center; }
  .input-icon { position: absolute; left: 0.875rem; color: #4b5563; pointer-events: none; transition: color 0.2s; }
  .input-inner input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.7rem 0.875rem 0.7rem 2.75rem; font-size: 0.925rem; color: #f9fafb; outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; font-family: inherit; box-sizing: border-box; }
  .input-inner input::placeholder { color: #374151; }
  .input-inner input:focus { border-color: rgba(34,197,94,0.5); background: rgba(34,197,94,0.04); box-shadow: 0 0 0 3px rgba(34,197,94,0.1); }
  .input-inner:focus-within .input-icon { color: #22c55e; }
  .error-box { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); border-radius: 10px; padding: 0.7rem 0.875rem; display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 1.25rem; animation: fadeIn 0.2s ease; }
  .error-dot { width: 6px; height: 6px; background: #ef4444; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
  .error-text { font-size: 0.85rem; color: #fca5a5; line-height: 1.5; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  .submit-btn { width: 100%; background: linear-gradient(135deg, #16a34a, #22c55e); color: #fff; font-weight: 600; font-size: 0.925rem; border: none; border-radius: 10px; padding: 0.8rem 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s; box-shadow: 0 4px 20px rgba(34,197,94,0.3); font-family: inherit; }
  .submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 6px 28px rgba(34,197,94,0.4); }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .back-link { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: #6b7280; text-decoration: none; margin-top: 1.5rem; transition: color 0.2s; }
  .back-link:hover { color: #22c55e; }
  .divider { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
  .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
  .divider-text { font-size: 0.75rem; color: #374151; white-space: nowrap; }
  /* success state */
  .success-wrap { text-align: center; padding: 0.5rem 0; }
  .success-icon { display: flex; justify-content: center; margin-bottom: 1.25rem; }
  .success-title { font-size: 1.25rem; font-weight: 700; color: #f9fafb; margin: 0 0 0.5rem; }
  .success-body { font-size: 0.875rem; color: #6b7280; line-height: 1.7; margin: 0; }
  .success-body strong { color: #22c55e; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const supabase = supabaseBrowser();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  return (
    <>
      <style>{sharedStyles}</style>
      <div className="auth-root">
        <div className="auth-card">
          {/* Logo */}
          <div className="logo-wrap">
            <div className="logo-icon">
              <Leaf size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <div className="logo-text">Super<span>Green</span></div>
          </div>

          {sent ? (
            /* ── Success state ── */
            <div className="success-wrap">
              <div className="success-icon">
                <CheckCircle2 size={52} color="#22c55e" strokeWidth={1.5} />
              </div>
              <h1 className="success-title">Check your inbox</h1>
              <p className="success-body">
                We've sent a password reset link to{" "}
                <strong>{email}</strong>.<br />
                The link expires in 1 hour.
              </p>
              <div style={{ marginTop: "2rem" }}>
                <Link href="/auth/signin" className="back-link" style={{ justifyContent: "center" }}>
                  <ArrowLeft size={14} />
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="auth-header">
                <h1 className="auth-title">Reset your password</h1>
                <p className="auth-subtitle">
                  Enter your work email and we'll send you a reset link.
                </p>
              </div>

              <div className="divider">
                <div className="divider-line" />
                <span className="divider-text">EMPLOYEE PORTAL</span>
                <div className="divider-line" />
              </div>

              {error && (
                <div className="error-box">
                  <div className="error-dot" />
                  <span className="error-text">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="input-group">
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
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                      Sending link…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              <div style={{ textAlign: "center" }}>
                <Link href="/auth/signin" className="back-link">
                  <ArrowLeft size={14} />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
