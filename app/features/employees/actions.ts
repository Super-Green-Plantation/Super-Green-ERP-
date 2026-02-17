"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUpperMembers } from "@/lib/member";
import { serializeData } from "@/app/utils/serializers";

// Create new employee/member
export async function createEmployee(data: {
  name: string;
  email: string;
  phone: string;
  empNo: string;
  totalCommission: number;
  branchId: number;
  positionId: number;
}) {
  try {
    const member = await prisma.member.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        empNo: data.empNo,
        totalCommission: Number(data.totalCommission),
        branchId: Number(data.branchId),
        positionId: Number(data.positionId),
      },
    });

    revalidatePath("/features/employees");
    revalidatePath(`/features/branches/employees/${data.branchId}`);
    return { success: true, member };
  } catch (err) {
    console.error("Error creating employee:", err);
    return { success: false, error: "Server error" };
  }
}

// Get employees by branch
export async function getEmployeesByBranch(branchId: number) {
  try {
    const employees = await prisma.member.findMany({
      where: { branchId: Number(branchId) },
      include: {
        position: {
          include: {
            orc: true,
            personalCommissionTiers: true,
          },
        },
      },
    });

    return { emp: serializeData(employees) };
  } catch (err) {
    console.error("Error fetching employees by branch:", err);
    throw new Error("Failed to get employees by branch");
  }
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
export async function updateEmployee(id: number, data: {
  name: string;
  email: string;
  phone: string;
  empNo: string;
  totalCommission: number;
  branchId: number;
  positionId: number;
}) {
  try {
    const updated = await prisma.member.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        empNo: data.empNo,
        totalCommission: Number(data.totalCommission),
        branchId: Number(data.branchId),
        positionId: Number(data.positionId),
      },
    });

    revalidatePath("/features/employees");
    return { success: true, member: updated };
  } catch (error) {
    console.error("Error updating employee:", error);
    return { success: false, error: "Failed to update employee" };
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
export async function deleteEmployee(id: number) {
  try {
    const deleted = await prisma.member.delete({
      where: { id },
    });

    revalidatePath("/features/employees");
    revalidatePath(`/features/branches/employees/${deleted.branchId}`);
    return { success: true, member: deleted };
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return { success: false, error: "Failed to delete employee" };
  }
}
