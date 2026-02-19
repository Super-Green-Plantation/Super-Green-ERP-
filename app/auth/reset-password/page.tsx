"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Leaf, Loader2, Lock } from "lucide-react";

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
  .shake { animation: shake 0.55s cubic-bezier(.36,.07,.19,.97) both; }
  @keyframes cardIn { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes shake { 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)} 30%,50%,70%{transform:translateX(-6px)} 40%,60%{transform:translateX(6px)} }
  .logo-wrap { display: flex; align-items: center; justify-content: center; gap: 0.6rem; margin-bottom: 1.75rem; }
  .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #16a34a, #22c55e); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(34,197,94,0.35); }
  .logo-text { font-size: 1.3rem; font-weight: 800; letter-spacing: -0.02em; color: #f0fdf4; }
  .logo-text span { color: #22c55e; }
  .auth-header { text-align: center; margin-bottom: 2rem; }
  .auth-title { font-size: 1.5rem; font-weight: 700; color: #f9fafb; margin: 0 0 0.35rem 0; letter-spacing: -0.02em; }
  .auth-subtitle { font-size: 0.875rem; color: #6b7280; margin: 0; line-height: 1.6; }
  .input-group { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
  .input-label { display: block; font-size: 0.8rem; font-weight: 500; color: #9ca3af; margin-bottom: 0.4rem; letter-spacing: 0.02em; text-transform: uppercase; }
  .input-inner { position: relative; display: flex; align-items: center; }
  .input-icon { position: absolute; left: 0.875rem; color: #4b5563; pointer-events: none; transition: color 0.2s; }
  .input-inner input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.7rem 2.75rem; font-size: 0.925rem; color: #f9fafb; outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; font-family: inherit; box-sizing: border-box; }
  .input-inner input.input-error { border-color: rgba(239,68,68,0.5); background: rgba(239,68,68,0.04); }
  .input-inner input::placeholder { color: #374151; }
  .input-inner input:focus { border-color: rgba(34,197,94,0.5); background: rgba(34,197,94,0.04); box-shadow: 0 0 0 3px rgba(34,197,94,0.1); }
  .input-inner:focus-within .input-icon { color: #22c55e; }
  .toggle-btn { position: absolute; right: 0.875rem; background: none; border: none; cursor: pointer; color: #4b5563; padding: 0; display: flex; align-items: center; transition: color 0.2s; }
  .toggle-btn:hover { color: #9ca3af; }
  .field-error { font-size: 0.78rem; color: #fca5a5; margin-top: 0.35rem; display: block; }
  .error-box { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); border-radius: 10px; padding: 0.7rem 0.875rem; display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 1.25rem; animation: fadeIn 0.2s ease; }
  .error-dot { width: 6px; height: 6px; background: #ef4444; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
  .error-text { font-size: 0.85rem; color: #fca5a5; line-height: 1.5; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  .submit-btn { width: 100%; background: linear-gradient(135deg, #16a34a, #22c55e); color: #fff; font-weight: 600; font-size: 0.925rem; border: none; border-radius: 10px; padding: 0.8rem 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s; box-shadow: 0 4px 20px rgba(34,197,94,0.3); font-family: inherit; }
  .submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 6px 28px rgba(34,197,94,0.4); }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .divider { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
  .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
  .divider-text { font-size: 0.75rem; color: #374151; white-space: nowrap; }
  /* password strength bar */
  .strength-bar-wrap { display: flex; gap: 4px; margin-top: 0.5rem; }
  .strength-seg { height: 3px; flex: 1; border-radius: 2px; background: rgba(255,255,255,0.06); transition: background 0.3s; }
  .strength-seg.active-weak { background: #ef4444; }
  .strength-seg.active-fair { background: #f59e0b; }
  .strength-seg.active-good { background: #22c55e; }
  .strength-seg.active-strong { background: #16a34a; }
  .strength-label { font-size: 0.75rem; margin-top: 0.3rem; }
  .strength-weak   { color: #ef4444; }
  .strength-fair   { color: #f59e0b; }
  .strength-good   { color: #22c55e; }
  .strength-strong { color: #16a34a; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

function getStrength(pwd: string): 0 | 1 | 2 | 3 | 4 {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score as 0 | 1 | 2 | 3 | 4;
}

const strengthMeta: Record<number, { label: string; cls: string }> = {
  0: { label: "", cls: "" },
  1: { label: "Weak", cls: "strength-weak" },
  2: { label: "Fair", cls: "strength-fair" },
  3: { label: "Good", cls: "strength-good" },
  4: { label: "Strong", cls: "strength-strong" },
};

const segClass = (seg: number, strength: number): string => {
  if (strength === 0 || seg > strength) return "strength-seg";
  if (strength === 1) return "strength-seg active-weak";
  if (strength === 2) return "strength-seg active-fair";
  if (strength === 3) return "strength-seg active-good";
  return "strength-seg active-strong";
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const router = useRouter();
  const supabase = supabaseBrowser();

  const strength = getStrength(password);
  const mismatch = confirm.length > 0 && password !== confirm;

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      setError("Passwords do not match.");
      triggerShake();
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      triggerShake();
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      triggerShake();
      return;
    }

    // Sign out so user logs in fresh with the new password
    await supabase.auth.signOut();
    router.push("/auth/signin?reset=success");
  };

  return (
    <>
      <style>{sharedStyles}</style>
      <div className="auth-root">
        <div className={`auth-card ${shake ? "shake" : ""}`}>
          {/* Logo */}
          <div className="logo-wrap">
            <div className="logo-icon">
              <Leaf size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <div className="logo-text">Super<span>Green</span></div>
          </div>

          {/* Header */}
          <div className="auth-header">
            <h1 className="auth-title">Set new password</h1>
            <p className="auth-subtitle">Choose a strong password for your account.</p>
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
              {/* New Password */}
              <div>
                <label className="input-label" htmlFor="password">New password</label>
                <div className="input-inner">
                  <input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <Lock size={15} className="input-icon" />
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => setShowPwd((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Strength indicator */}
                {password.length > 0 && (
                  <>
                    <div className="strength-bar-wrap">
                      {[1, 2, 3, 4].map((seg) => (
                        <div key={seg} className={segClass(seg, strength)} />
                      ))}
                    </div>
                    <span className={`strength-label ${strengthMeta[strength].cls}`}>
                      {strengthMeta[strength].label}
                    </span>
                  </>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="input-label" htmlFor="confirm">Confirm password</label>
                <div className="input-inner">
                  <input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    required
                    placeholder="Re-enter password"
                    className={mismatch ? "input-error" : ""}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                  <Lock size={15} className="input-icon" />
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {mismatch && (
                  <span className="field-error">Passwords do not match</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || mismatch}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Updating password…
                </>
              ) : (
                "Update password"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
