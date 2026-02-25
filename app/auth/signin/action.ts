'use server'
import { prisma } from "@/lib/prisma"
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type State = {
  error: string | null
}

export const getAuthUser = async (user: any) => {
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, status: true }
    })

    return dbUser;
}

export async function login(
  prevState: State,
  formData: FormData
): Promise<State> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  const dbUser = await getAuthUser(data.user)

  if (!dbUser?.status) {
    return { error: "Your account is suspended. Please contact support." }
  }

  redirect('/features/dashboard')
}