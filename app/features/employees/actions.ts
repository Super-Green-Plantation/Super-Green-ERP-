"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUpperMembers } from "@/lib/member";
import { serializeData } from "@/app/utils/serializers";
import { generateTempPassword, sendWelcomeEmail } from "@/lib/email";
import { supabaseAdmin } from "@/prisma/seed";
import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

interface EmpData {
  name: string;
  empNo: string;
  positionId: number;

  // Replaces branchId — always at least one entry (the current branch)
  branchIds: number[];

  // Basic contact
  email?: string;
  phone?: string;
  phone2?: string;
  totalCommission: number;

  // Name variants
  nameWithInitials?: string;

  // Personal
  nic?: string;
  dob?: string;
  birthday?: string;
  gender?: string;
  civilStatus?: string;
  address?: string;

  // Employment
  reportingPerson?: string;
  dateOfJoin?: string;
  appointmentLetter?: string;
  confirmation?: string;
  remark?: string;

  // Banking
  accNo?: string;
  bank?: string;
  bankBranch?: string;
}
export async function createEmployee(data: EmpData) {
  const tempPassword = generateTempPassword();
  let supabaseUserId: string | null = null;

  try {
    if (!data.email) throw new Error("Email is required");

    // 1️⃣ Create Supabase user FIRST (external service)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        phone: data.phone || "",
        password: tempPassword,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Auth user creation failed");
    }

    supabaseUserId = authData.user.id;

    // 2️⃣ Wrap ALL Prisma DB operations in ONE transaction
    const member = await prisma.$transaction(async (tx) => {
      // Create User
      // Create User — branchId is a single Int, use the first branch (primary)
      await tx.user.create({
        data: {
          id: supabaseUserId!,
          name: data.name,
          email: data.email,
          role: "EMPLOYEE",
          branchId: data.branchIds[0], // primary branch only
        },
      });

      // Create Member — map branchIds array into multiple MemberBranch records
      const member = await tx.member.create({
        data: {
          userId: supabaseUserId!,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          empNo: data.empNo,
          totalCommission: data.totalCommission,
          positionId: data.positionId,
          branches: {
            create: data.branchIds.map((branchId) => ({ branchId })),
          },
        },
      });

      return member;
    });

    // 3️⃣ Send email (non-fatal)
    try {
      await sendWelcomeEmail({
        to: data.email,
        name: data.name,
        empNo: data.empNo,
        tempPassword,
      });
    } catch (emailErr) {
      console.warn("Welcome email failed:", emailErr);
    }

    revalidatePath("/features/employees");
    revalidatePath(`/features/branches/employees/${data.branchIds}`);

    return { success: true, member };

  } catch (err) {
    console.error("Error creating employee:", err);

    // 🔁 Rollback Supabase user if DB failed
    if (supabaseUserId) {
      await supabaseAdmin.auth.admin
        .deleteUser(supabaseUserId)
        .catch((e) => console.error("Rollback failed:", e));
    }

    return {
      success: false,
      error: "Server error — employee creation failed",
    };
  }
}

// Get employees by branch
export async function getEmployeesByBranch(
  branchId: number,
  cursor?: number,
  limit = 10
) {
  const employees = await prisma.member.findMany({
    where: {
      branches: {
        some: {
          branchId
        }
      }
    },
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
export async function updateEmployee(memberId: number, data: EmpData) {
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
             branchId: data.branchIds[0],
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
          data: {
            email: data.email,
            name: data.name,
          },
        });
      }
    }

    // Update member
    await prisma.memberBranch.deleteMany({
      where: { memberId },
    });

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: {
        ...(userId && !existing.userId && { userId }),
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        empNo: data.empNo,
        totalCommission: Number(data.totalCommission),
        positionId: Number(data.positionId),
        branches: {
          create: data.branchIds.map((branchId) => ({ branchId })),
        },
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
        branches: true,
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
    // revalidatePath(`/features/branches/employees/${deleted.branchId}`);
    return { success: true, member: deleted };
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return { success: false, error: "Failed to delete employee" };
  }
}


