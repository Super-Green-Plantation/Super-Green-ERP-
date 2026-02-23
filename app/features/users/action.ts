'use server'
import { prisma } from "@/lib/prisma";

export const getUsers = async () => {
    const users = await prisma.user.findMany({ 
        include: { 
            member: {
                include:{
                    branch: true
                }
            }
         } }
    );
    return users;
}

export const updateUserStatus = async (userId: string, newStatus: boolean) => {
    await prisma.user.update({
        where: { id: userId },
        data: { status: newStatus }
    })
}