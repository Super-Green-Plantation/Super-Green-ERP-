'use server'
import { Role } from "@/app/types/role";
import { prisma } from "@/lib/prisma";

export const getUsers = async () => {
    const users = await prisma.user.findMany({
        include: {
            member: {
                include: {
                    branches: {
                        include:{branch:true}
                    }
                }
            }
        }
    }

    );
    return users;
}

export const updateUserStatus = async (userId: string, newStatus: boolean) => {
    await prisma.user.update({
        where: { id: userId },
        data: { status: newStatus }
    })
}

export const updateUserRole = async (userId: string, newRole: Role) => {
    await prisma.user.update({
        where: { id: userId },
        data: { role: newRole }
    })
}

export const deleteUser = async (userId: string) => {
    await prisma.user.delete({
        where: { id: userId }
    })
}