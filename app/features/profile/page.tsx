// app/profile/page.tsx (NO "use client")
'use server'

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Profile() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/signin")

  return (
    <div>
      Welcome {user.email}
    </div>
  )
}