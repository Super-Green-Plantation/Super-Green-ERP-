"use server"

import { serializeData } from "@/app/utils/serializers";
import { generateTempPassword, sendWelcomeEmail } from "@/lib/email";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { logActivity } from "@/lib/logActivity";
import { getUpperMembers } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { ActivityAction, ActivityEntity, Prisma } from "@prisma/client";
import { supabaseAdmin } from "@/prisma/seed";
import { revalidatePath } from "next/cache";
import { EmpData } from "@/app/types/member";
import { requirePermission } from "@/lib/auth/withPermission";


const generateEmpNo = async (tx: any) => {
  const lastEmp = await tx.member.findFirst({
    orderBy: { id: "desc" },
    select: { empNo: true },
  });

  if (!lastEmp || !lastEmp.empNo) {
    return "EMP001";
  }

  const match = lastEmp.empNo.match(/\d+$/);

  if (!match) {
    return "EMP001";
  }

  const newEmpNo = lastEmp.empNo.replace(
    /\d+$/,
    (m: string) => String(Number(m) + 1).padStart(m.length, "0")
  );

  return newEmpNo;
};

export async function createEmployee(data: EmpData) {
  let supabaseUserId: string | null = null;
  let tempPassword: string | null = null;

  try {
    await requirePermission("CREATE_EMPLOYEES");

    const currentUser = await getCurrentUserWithRole();

    // ── STEP 1: Create Supabase user (ONLY if email exists) ──────────────
    if (data.email && data.email.trim() !== "") {
      tempPassword = generateTempPassword();

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
    }

    // ── STEP 2: DB Transaction ───────────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      const genEmpNo = await generateEmpNo(tx);

      const empNo =
        data.empNo && data.empNo.trim() !== ""
          ? data.empNo
          : genEmpNo;

      // Create user record ONLY if Supabase user exists
      if (supabaseUserId) {

        await tx.user.create({
          data: {
            id: supabaseUserId,
            name: data.nameWithInitials,
            email: data.email!,
            role: "EMPLOYEE",
            branchId: data.branchIds[0],
          },
        });
      }
      const member = await tx.member.create({
        data: {
          userId: supabaseUserId,
          empNo,
          email: data.email || null,
          phone: data.phone || null,
          phone2: data.phone2 || null,
          epfNo: data.epfNo || null,
          totalCommission: data.totalCommission,
          positionId: data.positionId,
          nameWithInitials: data.nameWithInitials || null,
          nic: data.nic || null,
          dob: data.dob ? new Date(data.dob) : null,
          gender: data.gender || null,
          civilStatus: data.civilStatus || null,
          address: data.address || null,
          reportingPersons: data.reportingPersons ?? [],
          dateOfJoin: data.dateOfJoin ? new Date(data.dateOfJoin) : null,
          appointmentLetter: data.appointmentLetter || null,
          confirmation: data.confirmation || null,
          remark: data.remark || null,
          accNo: data.accNo || null,
          bank: data.bank || null,
          bankBranch: data.bankBranch || null,
          status: data.status,
          branches: {
            create: data.branchIds.map((branchId) => ({ branchId })),
          },
          probationStartDate: data.probationStartDate,

          profilePic: data.profilePic,
        },
      });




      return member;
    });

    // ── STEP 3: Send email (non-blocking) ────────────────────────────────
    if (data.email && tempPassword) {
      try {
        await sendWelcomeEmail({
          to: data.email,
          name: data.nameWithInitials,
          empNo: result.empNo,
          tempPassword,
        });
      } catch (e) {
        console.warn("Welcome email failed:", e);
      }
    }

    // ── STEP 4: Revalidate + log ─────────────────────────────────────────
    revalidatePath(`/features/branches/employees/${data.branchIds[0]}`);


    void logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.MEMBER,
      entityId: result.id,
      performedById: currentUser?.member?.id ?? 0,
      branchId: data.branchIds[0],
      metadata: { empNo: result.empNo, name: result.nameWithInitials },
    });


    return { success: true, member: result };

  } catch (err) {
    console.error("Error creating employee:", err);

    // ── Rollback Supabase user if DB failed ──────────────────────────────
    if (supabaseUserId) {
      await supabaseAdmin.auth.admin
        .deleteUser(supabaseUserId)
        .catch((e) => console.error("Rollback failed:", e));
    }

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Server error — employee creation failed",
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
        some: { branchId },
      },

    },

    orderBy: { id: "asc" },
    take: limit + 1, // fetch one extra to determine if there's a next page
    ...(cursor
      ? {
        cursor: { id: cursor },
        skip: 1, // skip the cursor record itself
      }
      : {}),
    include: {
      position: {
        include: {
          orc: true,
          salary: true,
        },
      },
      branches: true,
    },
  });

  const hasNextPage = employees.length > limit;
  const data = hasNextPage ? employees.slice(0, -1) : employees; // drop the extra record

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

export async function getReportingPersons(empCodes: string[]) {
  try {
    const employees = await prisma.member.findMany({
      where: {
        empNo: { in: empCodes },

      },
      include: { branches: true, position: true }
    });

    return { employees };
  } catch (error) {
    console.error("Error fetching employees:", error);
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
    await requirePermission("UPDATE_EMPLOYEES");
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
    await requirePermission("UPDATE_EMPLOYEES");
    const [currentUser, existing] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.member.findUnique({
        where: { id: memberId },
        include: { user: true },
      }),
    ]);

    if (!existing) return { success: false, error: "Member not found" };

    const emailChanged = data.email && data.email !== existing.email;
    const hadNoEmail = !existing.userId;

    let userId = existing.userId;

    if (data.email) {
      if (hadNoEmail) {
        const tempPassword = generateTempPassword();

        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: tempPassword,
            email_confirm: true,
          });

        if (authError || !authData.user)
          throw new Error(authError?.message ?? "Auth user creation failed");

        supabaseUserId = authData.user.id;

        await prisma.user.create({
          data: {
            id: authData.user.id,
            name: data.nameWithInitials,
            email: data.email,
            role: "EMPLOYEE",
            branchId: data.branchIds[0],
          },
        });

        userId = authData.user.id;

        try {
          await sendWelcomeEmail({
            to: data.email,
            name: data.nameWithInitials ?? "",
            empNo: data.empNo,
            tempPassword,
          });
        } catch (e) {
          console.warn("Welcome email failed:", e);
        }
      } else if (emailChanged && existing.user?.id) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          existing.user.id,
          { email: data.email }
        );

        if (error)
          throw new Error(`Supabase email update failed: ${error.message}`);

        await prisma.user.update({
          where: { id: existing.user.id },
          data: { email: data.email, name: data.nameWithInitials },
        });
      }
    }

    // Rebuild branches
    await prisma.memberBranch.deleteMany({ where: { memberId } });

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: {
        // Link user if newly created
        ...(userId && !existing.userId && { userId }),

        // Core
        nameWithInitials: data.nameWithInitials,
        status: data.status,
        empNo: data.empNo,
        epfNo: data.epfNo,
        email: data.email || null,
        phone: data.phone || null,
        phone2: data.phone2 || null,
        totalCommission: Number(data.totalCommission),
        positionId: Number(data.positionId),

        // Branches
        branches: {
          create: data.branchIds.map((branchId) => ({ branchId })),
        },
        // Personal
        nic: data.nic || null,
        dob: data.dob ? new Date(data.dob) : null,
        gender: data.gender || null,
        civilStatus: data.civilStatus || null,
        address: data.address || null,
        profilePic: data.profilePic,

        // Employment
        reportingPersons: data.reportingPersons?.map((name) => name) ?? [],
        dateOfJoin: data.dateOfJoin ? new Date(data.dateOfJoin) : null,
        appointmentLetter: data.appointmentLetter || null,
        confirmation: data.confirmation || null,
        remark: data.remark || null,
        probationStartDate: data.probationStartDate || null,
        isActive: data.isActive,

        // Banking
        accNo: data.accNo || null,
        bank: data.bank || null,
        bankBranch: data.bankBranch || null,
      },
    });


    void logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.MEMBER,
      entityId: memberId,
      performedById: currentUser?.member?.id ?? 0,
      branchId: data.branchIds[0],
      metadata: {
        before: {
          empNo: existing.empNo,
          nameWithInitials: existing.nameWithInitials,
          status: existing.status,
          email: existing.email,
        },
        after: {
          empNo: updated.empNo,
          nameWithInitials: updated.nameWithInitials,
          status: updated.status,
          email: updated.email,
        },
      },
    });

    return { success: true, member: updated };
  } catch (err) {
    console.error("Error updating employee:", err);

    let message = "Failed to update employee";

    // ✅ 1. Handle Supabase Auth errors
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();

      if (msg.includes("already been registered")) {
        message = "Email already exists";
      } else if (msg.includes("invalid email")) {
        message = "Invalid email address";
      }
    }

    // ✅ 2. Handle Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        const rawMessage =
          (err.meta as any)?.driverAdapterError?.cause?.originalMessage || "";

        const msg = rawMessage.toLowerCase();

        if (msg.includes("empno")) {
          message = "Employee ID already exists";
        } else if (msg.includes("email")) {
          message = "Email already exists";
        } else {
          message = "Duplicate value detected";
        }
      }
    }

    // ✅ rollback if needed
    if (supabaseUserId) {
      await supabaseAdmin.auth.admin
        .deleteUser(supabaseUserId)
        .catch((e) => console.error("Rollback failed:", e));
    }

    return { success: false, error: message };
  }

}
// Get member details for profile page
export async function getMemberDetails(id: number) {
  try {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        branches: { include: { branch: true } },
        position: {
          include: {
            orc: true,
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

export async function deleteEmployee(id: number) {
  try {
    await requirePermission("DELETE_EMPLOYEES");
    const currentUser = await getCurrentUserWithRole();

    // Fetch first to get userId before deleting
    const member = await prisma.member.findUnique({
      where: { id },
      select: { userId: true, empNo: true, nameWithInitials: true, branches: { select: { branchId: true } } },
    });

    if (!member) return { success: false, error: "Member not found" };

    // Delete member — cascades to MemberBranch, Commission, etc.
    await prisma.member.delete({ where: { id } });

    // Delete User record and Supabase auth user only if linked
    if (member.userId) {
      await prisma.user.delete({ where: { id: member.userId } }).catch(() => { });
      await supabaseAdmin.auth.admin.deleteUser(member.userId).catch(() => { });
    }

    revalidatePath("/features/employees");

    void logActivity({
      action: ActivityAction.DELETE,
      entity: ActivityEntity.MEMBER,
      entityId: id,
      performedById: currentUser?.member?.id ?? 0,
      branchId: member.branches[0]?.branchId,
      metadata: { empNo: member.empNo, name: member.nameWithInitials },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return { success: false, error: "Failed to delete employee" };
  }
}

export async function toggleEmployeeStatus(id: number, currentStatus: "PROBATION" | "PERMANENT" | "MANAGEMENT") {

  await requirePermission("UPDATE_EMPLOYEES");

  const newStatus = currentStatus === "PROBATION" ? "PERMANENT" : "PROBATION";
  const currentUser = await getCurrentUserWithRole();

  await prisma.member.update({
    where: { id },
    data: { status: newStatus },
  });

  revalidatePath("/features/employees");

  void logActivity({
    action: ActivityAction.UPDATE,
    entity: ActivityEntity.MEMBER,
    entityId: id,
    performedById: currentUser?.member?.id ?? 0,
    metadata: { before: { status: currentStatus }, after: { status: newStatus } },
  });

  return { success: true, newStatus: newStatus as "PROBATION" | "PERMANENT" };
}


export async function uploadProfilePic(file: File, empNo: string) {
  try {
    await requirePermission("UPDATE_EMPLOYEES");
    const ext = file.name.split(".").pop();
    const path = `profile-pictures/${empNo}-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabaseAdmin.storage
      .from("employee-assets")        // your bucket name
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) throw error;

    const { data } = supabaseAdmin.storage
      .from("employee-assets")
      .getPublicUrl(path);

    const currentUser = await getCurrentUserWithRole().catch(() => null);

    logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.MEMBER,
      performedById: currentUser?.member?.id ?? 0,
      metadata: { action: "profile_pic_uploaded", empNo },
    });

    return { success: true, url: data.publicUrl };
  } catch (err: any) {
    console.error("uploadProfilePic error:", err);
    return { success: false, error: err.message ?? "Upload failed" };
  }
}

// server action
export async function getPositions() {
  return prisma.position.findMany({
    orderBy: { rank: "desc" },
    select: { id: true, title: true, rank: true, type: true, isProbation: true },
  });
}

export async function getUplineMembers(positionId: number, branchIds: number[]) {
  if (!positionId) return [];

  const selectedPosition = await prisma.position.findUnique({
    where: { id: positionId },
    select: { rank: true },
  });

  if (!selectedPosition) return [];

  return prisma.member.findMany({
    where: {
      position: {
        rank: { gt: selectedPosition.rank }, // higher rank = higher up
      },
      branches: {
        some: {
          branchId: { in: branchIds }, // shares at least one branch
        },
      },
    },
    select: {
      id: true,
      nameWithInitials: true,
      empNo: true,
      position: { select: { title: true } },
    },
    orderBy: {
      position: { rank: "desc" },
    },
  });
}