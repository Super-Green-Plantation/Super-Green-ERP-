"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUpperMembers } from "@/lib/member";
import { serializeData } from "@/app/utils/serializers";
import { generateTempPassword, sendWelcomeEmail } from "@/lib/email";
import { supabaseAdmin } from "@/prisma/seed";

interface EmpData {
  name: string;
  email?: string;
  phone?: string;
  empNo: string;
  totalCommission: number;
  branchId: number;
  positionId: number;
}
export async function createEmployee(data: EmpData) {
  const tempPassword = generateTempPassword();
  let supabaseUserId: string | null = null;

  try {
    let userId: string | undefined = undefined;

    // Only create auth user + prisma user if email provided
    if (data.email) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        phone: data.phone,
        password: tempPassword,
        email_confirm: true,
        
      });

      if (authError || !authData.user) throw new Error(authError?.message ?? 'Auth user creation failed');

      supabaseUserId = authData.user.id; // store for rollback

      await prisma.user.create({
        data: {
          id: authData.user.id,
          name: data.name,
          email: data.email,
          role: 'EMPLOYEE',
          branchId: data.branchId,
        },
      });

      userId = authData.user.id;
    }

    // Create member — userId is optional (nullable foreign key)
    const member = await prisma.member.create({
      data: {
        ...(userId && { userId }),         // only set if exists
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        empNo: data.empNo,
        totalCommission: data.totalCommission,
        branchId: data.branchId,
        positionId: data.positionId,
      },
    });

    // Send welcome email (non-fatal)
    if (data.email) {
      try {
        await sendWelcomeEmail({ to: data.email, name: data.name, empNo: data.empNo, tempPassword });
      } catch (emailErr) {
        console.warn('Welcome email failed (employee still created):', emailErr);
      }
    }

    revalidatePath('/features/employees');
    revalidatePath(`/features/branches/employees/${data.branchId}`);
    return { success: true, member };

  } catch (err) {
    console.error('Error creating employee:', err);

    // Rollback Supabase auth user if it was created
    if (supabaseUserId) {
      await supabaseAdmin.auth.admin.deleteUser(supabaseUserId).catch((e) =>
        console.error('Rollback failed:', e)
      );
    }

    return { success: false, error: 'Server error — employee creation failed' };
  }
}

// Get employees by branch
export async function getEmployeesByBranch(
  branchId: number,
  cursor?: number,
  limit = 10
) {
  const employees = await prisma.member.findMany({
    where: { branchId },
    orderBy: { id: "asc" }, // REQUIRED for cursor pagination

    take: limit + 1,       // fetch extra record
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,

    include: {
      position: {
        include: {
          orc: true,
          personalCommissionTiers: true,
        },
      },
    },
  });

  const hasNextPage = employees.length > limit;
  const data = hasNextPage ? employees.slice(0, -1) : employees;

  return {
    emp: serializeData(data),
    nextCursor: hasNextPage ? data[data.length - 1].id : null,
  };
}

// Get employee by code
export async function getEmployeeByCode(empCode: string) {
  try {
    const employee = await prisma.member.findUnique({
      where: { empNo: empCode },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    return { employee };
  } catch (error) {
    console.error("Error fetching employee:", error);
    throw error;
  }
}

// Get employee by ID (with upper members hierarchy)
export async function getEmployeeById(empNo: string) {
  try {
    const upperMembers = await getUpperMembers(empNo);
    return { upperMembers: serializeData(upperMembers) };
  } catch (error) {
    console.error("Error fetching employee hierarchy:", error);
    throw error;
  }
}

// Update employee commission
export async function updateEmployeeCommission(empNo: string, commission: number) {
  try {
    const member = await prisma.member.findUnique({
      where: { empNo },
      select: { totalCommission: true },
    });

    if (!member) {
      return { success: false, error: "Member not found" };
    }

    const updated = await prisma.member.update({
      where: { empNo },
      data: {
        totalCommission: member.totalCommission + Number(commission),
      },
    });

    revalidatePath("/features/employees");
    return { success: true, member: updated };
  } catch (err) {
    console.error("Error updating commission:", err);
    return { success: false, error: "Failed to update commission" };
  }
}

// Update employee details
export async function updateEmployee(memberId: number, data: {
  name: string | undefined;
  email: string;
  phone: string;
  empNo: string;
  totalCommission: number;
  branchId: number;
  positionId: number;
}) {
  let supabaseUserId: string | null = null;

  try {
    // Fetch current member to compare email and check if user exists
    const existing = await prisma.member.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!existing) return { success: false, error: 'Member not found' };

    const emailChanged = data.email && data.email !== existing.email;
    const hadNoEmail = !existing.userId; // member had no linked user before

    let userId = existing.userId;

    if (data.email) {
      if (hadNoEmail) {
        // No user existed — create one now
        const tempPassword = generateTempPassword();

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          password: tempPassword,
          email_confirm: true,
        });

        if (authError || !authData.user) throw new Error(authError?.message ?? 'Auth user creation failed');

        supabaseUserId = authData.user.id;

        await prisma.user.create({
          data: {
            id: authData.user.id,
            name: data.name,
            email: data.email,
            role: 'EMPLOYEE',
            branchId: data.branchId,
          },
        });

        userId = authData.user.id;

        // Send welcome email (non-fatal)
        try {
          await sendWelcomeEmail({ to: data.email, name: data.name ?? '', empNo: data.empNo, tempPassword });
        } catch (e) {
          console.warn('Welcome email failed:', e);
        }

      } else if (emailChanged && existing.user?.id) {
        // User exists — update email in both Supabase and Prisma
        const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.user.id, {
          email: data.email,
        });

        if (error) throw new Error(`Supabase email update failed: ${error.message}`);

        await prisma.user.update({
          where: { id: existing.user.id },
          data: { email: data.email,
              name: data.name,
           },
        });
      }
    }

    // Update member
    const updated = await prisma.member.update({
      where: { id: memberId },
      data: {
        ...(userId && !existing.userId && { userId }), // link user if newly created
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        empNo: data.empNo,
        totalCommission: Number(data.totalCommission),
        branchId: Number(data.branchId),
        positionId: Number(data.positionId),
      },
    });

    revalidatePath('/features/employees');
    return { success: true, member: updated };

  } catch (error) {
    console.error('Error updating employee:', error);

    // Rollback newly created Supabase user if member update failed
    if (supabaseUserId) {
      await supabaseAdmin.auth.admin.deleteUser(supabaseUserId).catch((e) =>
        console.error('Rollback failed:', e)
      );
    }

    return { success: false, error: 'Failed to update employee' };
  }
}
// Get member details for profile page
export async function getMemberDetails(id: number) {
  try {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        branch: true,
        position: {
          include: {
            orc: true,
            personalCommissionTiers: true,
          },
        },
      },
    });

    if (!member) {
      throw new Error("Member not found");
    }

    return { res: serializeData(member) };
  } catch (error) {
    console.error("Error fetching member details:", error);
    throw error;
  }
}

export async function deleteEmployee(id: string) {
  console.log(id);
  try {
    const deleted = await prisma.member.delete({
      where: { userId: id },
    });

    await prisma.user.delete({
      where: { id },
    });

    await supabaseAdmin.auth.admin.deleteUser(String(id));

    revalidatePath("/features/employees");
    revalidatePath(`/features/branches/employees/${deleted.branchId}`);
    return { success: true, member: deleted };
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return { success: false, error: "Failed to delete employee" };
  }
}
