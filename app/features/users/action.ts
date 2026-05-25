'use server'
import { Role } from "@/app/types/role";
import { generateTempPassword, sendWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const getUsers = async () => {
    const users = await prisma.user.findMany({
        include: {
            member: {
                include: {
                    branches: {
                        include: { branch: true }
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

export const resendWelcomeEmail = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { member: true },
    });

    if (!user || !user.email) throw new Error("User not found");

    const tempPassword = generateTempPassword();

    // Update Supabase auth password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: tempPassword,
        user_metadata: { must_change_password: true },
    });

    if (error) throw new Error(`Failed to reset password: ${error.message}`);

    // Send welcome email with new temp password
    await sendWelcomeEmail({
        to: user.email,
        name: user.member?.nameWithInitials ?? undefined,
        empNo: user.member?.empNo ?? "N/A",
        tempPassword,
    });
};