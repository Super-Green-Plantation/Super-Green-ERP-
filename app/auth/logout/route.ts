import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(
    new URL("/auth/signin", process.env.NEXT_PUBLIC_APP_URL!)
  );
}
