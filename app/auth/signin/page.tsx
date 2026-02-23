"use client";

import { supabase } from "@/lib/supabase/supabaseClient";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // ✅ Prevent default form submit

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("Login error:", error.message);
      alert(error.message);
      return;
    }

    console.log("Logged in user:", data.user);

    // Redirect to dashboard
    router.push("/features/dashboard");
  }

  return (
    <div className="signin-root">
      <form onSubmit={handleLogin}>
        {/* Email */}
        <div className="input-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@supergreen.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Mail size={15} />
        </div>

        {/* Password */}
        <div className="input-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}