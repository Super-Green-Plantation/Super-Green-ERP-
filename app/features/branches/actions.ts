"use server"

import { serializeData } from "@/app/utils/serializers";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { logActivity } from "@/lib/logActivity";
import { prisma } from "@/lib/prisma";
import { ActivityAction, ActivityEntity } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/withPermission";


// Get all branches with full details
export async function getBranches() {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        members: {
          select: {
            member: {
              include: {
                position: {
                  include: {
                    orc: true,
                  },
                },
              }
            }
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
          select: {
            member: {
              include: {
                position: {
                  include: {
                    orc: true,
                  },
                },
              }

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

//get branches by employee
export async function getBranchesByMemberId(memberId: number) {
  try {
    const memberBranches = await prisma.memberBranch.findMany({
      where: { memberId },
      include: {
        branch: {
          include: {
            members: {
              select: {
                member: {
                  include: {
                    position: {
                      include: {
                        orc: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return serializeData(memberBranches.map((mb) => mb.branch));
  } catch (error) {
    console.error("Error fetching branches by member:", error);
    throw new Error("Failed to fetch member branches");
  }
}

// Create new branch
export async function createBranch(data: { name: string; location: string }) {
  try {
    await requirePermission("CREATE_BRANCHES");
    const currentUser = await getCurrentUserWithRole();
    const newBranch = await prisma.branch.create({
      data: {
        name: data.name,
        location: data.location ? data.location : data.name,
      },
    });

    revalidatePath("/features/branches");

    void logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.BRANCH,
      entityId: newBranch.id,
      performedById: currentUser?.member?.id ?? 0,
      branchId: newBranch.id,
      metadata: { after: newBranch },
    });

    return { success: true, branch: newBranch };
  } catch (error) {
    console.error("Error creating branch:", error);
    return { success: false, error: "Failed to create branch" };
  }
}

// Update branch
export async function updateBranch(id: number, data: { name: string; location: string }) {
  try {
    await requirePermission("UPDATE_BRANCHES");
    const [currentUser, oldBranch] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.branch.findUnique({ where: { id } }),
    ]);

    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        location: data.location,
      },
    });

    revalidatePath("/features/branches");

    void logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.BRANCH,
      entityId: id,
      performedById: currentUser?.member?.id ?? 0,
      branchId: id,
      metadata: { before: oldBranch, after: updatedBranch },
    });

    return { success: true, branch: updatedBranch };
  } catch (error) {
    console.error("Error updating branch:", error);
    return { success: false, error: "Failed to update branch" };
  }
}

// Delete branch
export async function deleteBranch(id: number) {
  try {
    await requirePermission("DELETE_BRANCHES");
    const currentUser = await getCurrentUserWithRole();

    await prisma.branch.delete({
      where: { id },
    });

    revalidatePath("/features/branches");

    void logActivity({
      action: ActivityAction.DELETE,
      entity: ActivityEntity.BRANCH,
      entityId: id,
      performedById: currentUser?.member?.id ?? 0,
      metadata: { branchId: id },
    });

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
      where: {
        branches: {
          some: {
            branchId
          }
        }
      },
      select: {
        id: true,
        empNo: true,
        nameWithInitials: true,
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


//search employee

export async function searchEmployees(searchText: string) {
  return prisma.member.findMany({
    where: {
      OR: [
        { nic: { contains: searchText, mode: "insensitive" } },
        { empNo: { contains: searchText, mode: "insensitive" } },
        { nameWithInitials: { contains: searchText, mode: "insensitive" } },
      ],
    },
    include: { 
      position: { include: { orc: true } },
      branches: { include: { branch: true } } },
    take: 10, // ✅ limit for dropdown
  });
}

export async function getBranchThisMonthProposalCount() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [branches, proposalGroups] = await Promise.all([
      prisma.branch.findMany({
        select: { id: true, name: true },
      }),
      prisma.investment.groupBy({
        by: ["branchId"],
        where: {
          proposalFormNo: { not: null },
          investmentDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _count: { proposalFormNo: true },
      }),
    ]);

    const countMap = new Map(
      proposalGroups.map(g => [g.branchId, g._count.proposalFormNo])
    );
    
    return branches.map(branch => ({
      branchId: branch.id,
      branchName: branch.name,
      proposalCount: countMap.get(branch.id) ?? 0,
    }));
  } catch (error) {
    console.error("Error fetching branch proposal counts:", error);
    throw new Error("Failed to fetch branch proposal counts");
  }
}