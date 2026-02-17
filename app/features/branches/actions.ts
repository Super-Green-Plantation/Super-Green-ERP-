"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { serializeData } from "@/app/utils/serializers";

// Get all branches with full details
export async function getBranches() {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        members: {
          include: {
            position: {
              include: {
                personalCommissionTiers: true,
                orc: true,
              },
            },
          },
        },
      },
    });
    return serializeData(branches);
  } catch (error) {
    console.error("Error fetching branches:", error);
    throw new Error("Failed to fetch branches");
  }
}

// Get single branch by ID
export async function getBranchById(id: number) {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            position: {
              include: {
                personalCommissionTiers: true,
                orc: true,
              },
            },
          },
        },
      },
    });

    if (!branch) {
      throw new Error("Branch not found");
    }

    return serializeData(branch);
  } catch (error) {
    console.error("Error fetching branch:", error);
    throw error;
  }
}

// Create new branch
export async function createBranch(data: { name: string; location: string }) {
  try {
    const newBranch = await prisma.branch.create({
      data: {
        name: data.name,
        location: data.location,
      },
    });

    revalidatePath("/features/branches");
    return { success: true, branch: newBranch };
  } catch (error) {
    console.error("Error creating branch:", error);
    return { success: false, error: "Failed to create branch" };
  }
}

// Update branch
export async function updateBranch(id: number, data: { name: string; location: string }) {
  try {
    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        location: data.location,
      },
    });

    revalidatePath("/features/branches");
    return { success: true, branch: updatedBranch };
  } catch (error) {
    console.error("Error updating branch:", error);
    return { success: false, error: "Failed to update branch" };
  }
}

// Delete branch
export async function deleteBranch(id: number) {
  try {
    await prisma.branch.delete({
      where: { id },
    });

    revalidatePath("/features/branches");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting branch:", error);
    return { success: false, error: error.message || "Failed to delete branch" };
  }
}

// Get all employees for a specific branch
export async function getBranchEmployees(branchId: number) {
  try {
    const employees = await prisma.member.findMany({
      where: { branchId },
      select: {
        id: true,
        empNo: true,
        name: true,
        email: true,
        phone: true,
        totalCommission: true,
        position: true,
      },
      orderBy: { empNo: "asc" },
    });

    return employees;
  } catch (error) {
    console.error("Error fetching branch employees:", error);
    throw new Error("Failed to fetch branch employees");
  }
}
