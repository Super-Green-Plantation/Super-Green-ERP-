'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

// ── Edit this list to match your SGP employees ──────────────────────────────
const EMPLOYEES: { label: string; email: string }[] = [
  { label: 'Info', email: 'info@supergreenplantation.lk' },
  { label: 'Accounts', email: 'accounts@supergreenplantation.lk' },
  { label: 'HR', email: 'hr@supergreenplantation.lk' },
  { label: 'Manager', email: 'manager@supergreenplantation.lk' },
  // Add more: { label: 'Name', email: 'name@supergreenplantation.lk' },
];

const CPANEL_LOGIN_URL = 'https://morgana.webserverlive.com:2096/login/';
const GOTO_URI = '/3rdparty/roundcube/?_task=mail&_mbox=INBOX';
// ─────────────────────────────────────────────────────────────────────────────

export default function EmailLauncherPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [activeEmp, setActiveEmp] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const formUser = useRef<HTMLInputElement>(null);
  const formPass = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function selectEmployee(emp: { label: string; email: string }) {
    setActiveEmp(emp.email);
    setEmail(emp.email);
    setError(false);
    passwordRef.current?.focus();
  }

  function doLogin() {
    if (!email.trim() || !password) {
      setError(true);
      return;
    }
    setError(false);
    setLoading(true);
    if (formUser.current) formUser.current.value = email.trim();
    if (formPass.current) formPass.current.value = password;
    formRef.current?.submit();
  }

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        :root {
          --gd: #1a3d2b;
          --gm: #2d6a4a;
          --gl: #e8f5ee;
          --ga: #3a8c5c;
          --tp: #0f1f16;
          --tm: #5a7366;
          --bd: #c8ddd1;
          --bg: #f4f9f6;
        }

        html, body { margin: 0; padding: 0; }

        .sgp-page {
          font-family: 'Inter', system-ui, sans-serif;
          background: var(--bg);
          color: var(--tp);
          min-height: 100vh;
          display: grid;
          grid-template-rows: 1fr auto;
        }

        .sgp-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: calc(100vh - 48px);
        }

        /* Brand panel */
        .sgp-brand {
          background: var(--gd);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 4rem 3.5rem;
          position: relative;
          overflow: hidden;
        }
        .sgp-brand::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: rgba(58,140,92,0.18);
        }
        .sgp-brand::after {
          content: '';
          position: absolute;
          bottom: -80px; left: -80px;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: rgba(58,140,92,0.12);
        }

        .sgp-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 3rem;
          position: relative;
          z-index: 1;
        }
        .sgp-logo-text { font-size: 18px; font-weight: 600; color: #fff; letter-spacing: -0.01em; }
        .sgp-logo-sub  { font-size: 11px; color: rgba(255,255,255,0.55); letter-spacing: 0.05em; text-transform: uppercase; margin-top: 1px; }

        .sgp-headline {
          font-size: 32px; font-weight: 600; color: #fff;
          line-height: 1.25; letter-spacing: -0.02em;
          margin: 0 0 1rem; position: relative; z-index: 1;
        }
        .sgp-sub {
          font-size: 15px; color: rgba(255,255,255,0.55);
          line-height: 1.6; max-width: 340px;
          margin: 0; position: relative; z-index: 1;
        }
        .sgp-pills {
          display: flex; gap: 10px; flex-wrap: wrap;
          margin-top: 2.5rem; position: relative; z-index: 1;
        }
        .sgp-pill {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.7);
          font-size: 12px; padding: 5px 12px; border-radius: 100px;
        }

        /* Login panel */
        .sgp-login {
          display: flex; flex-direction: column;
          justify-content: center;
          padding: 4rem 3.5rem;
          background: #fff;
        }
        .sgp-login-inner { max-width: 380px; width: 100%; }

        .sgp-title { font-size: 22px; font-weight: 600; color: var(--tp); letter-spacing: -0.02em; margin: 0 0 6px; }
        .sgp-hint  { font-size: 14px; color: var(--tm); margin: 0 0 2rem; }

        /* Employee chips */
        .sgp-quick { margin-bottom: 20px; }
        .sgp-quick-label { font-size: 12px; color: var(--tm); margin-bottom: 8px; display: block; }
        .sgp-emp-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .sgp-emp-btn {
          background: var(--gl);
          border: 1.5px solid var(--bd);
          color: var(--gd);
          font-size: 12px; font-weight: 500; font-family: inherit;
          padding: 5px 12px; border-radius: 100px;
          cursor: pointer;
          transition: background 0.12s, border-color 0.12s;
        }
        .sgp-emp-btn:hover, .sgp-emp-btn.active {
          background: var(--gm); border-color: var(--gm); color: #fff;
        }

        /* Divider */
        .sgp-divider {
          display: flex; align-items: center; gap: 12px; margin: 18px 0;
        }
        .sgp-divider span { font-size: 12px; color: var(--tm); white-space: nowrap; }
        .sgp-divider::before, .sgp-divider::after {
          content: ''; flex: 1; height: 1px; background: var(--bd);
        }

        /* Fields */
        .sgp-field { margin-bottom: 16px; }
        .sgp-field label { display: block; font-size: 13px; font-weight: 500; color: var(--tp); margin-bottom: 6px; }
        .sgp-input {
          width: 100%; height: 42px; padding: 0 14px;
          font-size: 14px; font-family: inherit;
          border: 1.5px solid var(--bd); border-radius: 8px;
          background: var(--bg); color: var(--tp);
          outline: none; box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .sgp-input:focus {
          border-color: var(--ga);
          box-shadow: 0 0 0 3px rgba(58,140,92,0.12);
          background: #fff;
        }
        .sgp-pw-wrap { position: relative; }
        .sgp-pw-wrap .sgp-input { padding-right: 42px; }
        .sgp-toggle-pw {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--tm); padding: 0; display: flex; align-items: center;
        }
        .sgp-toggle-pw:hover { color: var(--gm); }

        /* Error */
        .sgp-error {
          background: #fdf0ee;
          border: 1px solid rgba(192,57,43,0.25);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px; color: #c0392b;
          margin-bottom: 16px;
        }

        /* Submit */
        .sgp-submit {
          width: 100%; height: 44px;
          background: var(--gm); color: #fff;
          border: none; border-radius: 8px;
          font-size: 15px; font-weight: 500; font-family: inherit;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.15s, transform 0.1s;
          margin-top: 20px;
        }
        .sgp-submit:hover:not(:disabled) { background: var(--gd); }
        .sgp-submit:active:not(:disabled) { transform: scale(0.99); }
        .sgp-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Note */
        .sgp-note { font-size: 12px; color: var(--tm); margin-top: 16px; text-align: center; line-height: 1.5; }
        .sgp-note a { color: var(--ga); text-decoration: none; }

        /* Footer */
        .sgp-footer {
          height: 48px; background: var(--gd);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: rgba(255,255,255,0.35); letter-spacing: 0.02em;
          font-family: 'Inter', system-ui, sans-serif;
        }

        @media (max-width: 768px) {
          .sgp-layout { grid-template-columns: 1fr; }
          .sgp-brand  { padding: 2.5rem 1.5rem; min-height: auto; }
          .sgp-headline { font-size: 24px; }
          .sgp-login  { padding: 2rem 1.5rem; }
          .sgp-login-inner { max-width: 100%; }
        }
      `}</style>

      <div className="sgp-page">
        <div className="sgp-layout">

          {/* ── Brand panel ── */}
          <div className="sgp-brand">
            <div className="sgp-logo">
              <Image
                src="/logo.png"
                width={40}
                height={40}
                alt="Picture of the author"
              />
              <div>
                <div className="sgp-logo-text">Super Green</div>
                <div className="sgp-logo-sub">Plantation (Pvt) Ltd</div>
              </div>
            </div>
            <h1 className="sgp-headline">Your company<br />email, one click<br />away.</h1>
            <p className="sgp-sub">Sign in below to open your SGP inbox directly. No technical knowledge needed.</p>
            <div className="sgp-pills">
              <span className="sgp-pill">Roundcube webmail</span>
              <span className="sgp-pill">Peek Hosting</span>
              <span className="sgp-pill">Secure SSL</span>
            </div>
          </div>

          {/* ── Login panel ── */}
          <div className="sgp-login">
            <div className="sgp-login-inner">
              <h2 className="sgp-title">Sign in to your email</h2>
              <p className="sgp-hint">Use your SGP email address and password.</p>

              {/* Employee quick-select chips */}
              <div className="sgp-quick">
                <span className="sgp-quick-label">Quick select — choose your name</span>
                <div className="sgp-emp-grid">
                  {EMPLOYEES.map((emp) => (
                    <button
                      key={emp.email}
                      type="button"
                      className={`sgp-emp-btn${activeEmp === emp.email ? ' active' : ''}`}
                      onClick={() => selectEmployee(emp)}
                    >
                      {emp.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sgp-divider"><span>or type manually</span></div>

              {error && (
                <div className="sgp-error" role="alert">
                  Please enter both your email address and password.
                </div>
              )}

              <div className="sgp-field">
                <label htmlFor="sgp-email">Email address</label>
                <input
                  id="sgp-email"
                  type="email"
                  className="sgp-input"
                  placeholder="you@supergreenplantation.lk"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(false); }}
                />
              </div>

              <div className="sgp-field">
                <label htmlFor="sgp-password">Password</label>
                <div className="sgp-pw-wrap">
                  <input
                    id="sgp-password"
                    ref={passwordRef}
                    type={showPass ? 'text' : 'password'}
                    className="sgp-input"
                    placeholder="Your email password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(false); }}
                    onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                  />
                  <button
                    type="button"
                    className="sgp-toggle-pw"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPass((v) => !v)}
                  >
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="sgp-submit"
                disabled={loading}
                onClick={doLogin}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {loading ? 'Opening your inbox…' : 'Open my inbox'}
              </button>

              <p className="sgp-note">
                Having trouble? Contact IT at{' '}
                <a href="mailto:it@supergreenplantation.lk">it@supergreenplantation.lk</a>
              </p>
            </div>
          </div>
        </div>

        {/* Hidden form — POSTs credentials directly to cPanel webmail login */}
        <form
          ref={formRef}
          method="POST"
          action={CPANEL_LOGIN_URL}
          style={{ display: 'none' }}
        >
          <input ref={formUser} type="hidden" name="user" />
          <input ref={formPass} type="hidden" name="pass" />
          <input type="hidden" name="goto_uri" value={GOTO_URI} />
        </form>

        <footer className="sgp-footer">
          © {new Date().getFullYear()} Super Green Plantation (Pvt) Ltd — Internal use only
        </footer>
      </div>
    </>
  );
}