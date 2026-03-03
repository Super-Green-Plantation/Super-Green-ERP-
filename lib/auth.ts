import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/signin")
    }

    // If you store users in Prisma
    const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
        include: {
            member: {
                include: {
                    position: true,
                    branches: { include: { branch: true } },

                }
            }
        }
    })



    if (!dbUser) {
        redirect("/auth/signin")
        // throw new Error("User not found in DB")
    }

    return dbUser
}