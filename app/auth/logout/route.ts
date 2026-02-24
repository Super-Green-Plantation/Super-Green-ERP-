import { supabase } from "@/lib/supabase/supabaseClient";
import { NextResponse } from "next/server";

export async function GET() {
  await supabase.auth.signOut();
  return NextResponse.redirect(
    new URL("/auth/signin", process.env.NEXT_PUBLIC_APP_URL!)
  );
}
