import { supabase } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    // No code — redirect to sign-in with a generic error flag
    return NextResponse.redirect(`${origin}/auth/signin?error=missing-code`);
  }

  try {
    // Exchange the code for a session (access_token + refresh_token)
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(`${origin}/auth/signin?error=link-expired`);
    }

    // Session established — send user to the reset-password page
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  } catch (err) {
    console.error("[auth/callback] Unexpected error:", err);
    return NextResponse.redirect(`${origin}/auth/signin?error=server-error`);
  }
}
