import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    // No code — redirect to sign-in with a generic error flag
    return NextResponse.redirect(`${origin}/auth/signin?error=missing-code`);
  }

  try {
    const supabase = await supabaseServer();
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
