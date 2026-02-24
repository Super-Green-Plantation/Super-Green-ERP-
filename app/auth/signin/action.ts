'use server'
import { prisma } from "@/lib/prisma"

export const getAuthUser = async (user: any) => {
     const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, status: true }
    })

    return dbUser;
}