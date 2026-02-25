'use server'
import { Role } from "@/app/types/role";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/client";

export const getUsers = async () => {
    const users = await prisma.user.findMany({
        include: {
            member: {
                include: {
                    branch: true
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

export const sendPasswordReset = async (email: string) => {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
        console.error("Failed to send password reset email:", error.message);
        return { success: false, error: error.message };
    }

    console.log("Password reset email sent:", data);
    return { success: true };
}