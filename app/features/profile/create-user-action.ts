"use server"

import { createClient } from "@supabase/supabase-js"

export async function createERPUser(email: string, password: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data.user
}
