"use server"

import { serializeData } from "@/app/utils/serializers";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { logActivity } from "@/lib/logActivity";
import { prisma } from "@/lib/prisma";
import { ActivityAction, ActivityEntity } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Generate investment reference number
function generateInvestmentNumber() {
  const prefix = "INV";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
}

export async function getInvestments(page = 1, pageSize = 10) {
  const dbUser = await getCurrentUserWithRole();
  if (!dbUser) throw new Error("User not found");

  let whereCondition: any = {};

  switch (dbUser.role) {
    case "ADMIN":
    case "HR":
    case "DEV":
      whereCondition = {};
      break;

    case "BRANCH_MANAGER":
    case "REGIONAL_MANAGER":
    case "AGM":
    case "EMPLOYEE": {
      const branchIds = dbUser.member?.branches?.map(mb => mb.branchId) ?? [];
      if (branchIds.length === 0) throw new Error("No branches assigned to this user");
      whereCondition = { branchId: { in: branchIds } };
      break;
    }

    default:
      throw new Error("Unauthorized role");
  }

  const [investments, total] = await Promise.all([
    prisma.investment.findMany({
      where: whereCondition,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        client: true,
        plan: true,
        advisor: true,
        branch: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.investment.count({ where: whereCondition }),
  ]);

  return serializeData({
    investments,
    total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page,
  });
}

export async function createInvestment(data: {
  clientId: number;
  branchId?: number;
  planId?: number;
  advisorId?: number;
  amount: number;
  proposalFormNo: string;
}) {
  try {
    const currentUser = await getCurrentUserWithRole();
    const refNumber = generateInvestmentNumber();

    const investment = await prisma.investment.create({
      data: {
        refNumber,
        branchId: Number(data.branchId),
        clientId: data.clientId,
        planId: data.planId || null,
        amount: data.amount,
        investmentDate: new Date(),
        proposalFormNo: data.proposalFormNo,
      },
      include: {
        client: true,
        plan: true,
        advisor: true,
      },
    });

    revalidatePath("/features/investments");

    void logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.INVESTMENT,
      entityId: investment.id,
      performedById: currentUser?.member?.id ?? 0,
      branchId: investment.branchId,
      metadata: { after: investment },
    });

    return { success: true, investment: serializeData(investment) };
  } catch (error) {
    console.error("Error creating investment:", error);
    return { success: false, error: "Failed to create investment" };
  }
}

export async function getInvestmentById(id: number) {
  console.log("inv no. ", Number(id));

  try {

    const investment = await prisma.investment.findUnique({
      where: { id: id },
      include: {
        client: {
          include: {
            branch: true,
            beneficiaries: true,   // all client's beneficiaries for the picker
            nominees: true,        // all client's nominees for the picker
          },
        },
        beneficiary: true,
        nominee: true,
        plan: true,
        advisor: {
          include: {
            branches: {
              include: {
                branch: true, member: true
              }
            }
          },
        },
      },
    });
    return investment;
  } catch (error) {
    console.error("Error fetching investment:", error);
    return null;
  }
}

// Get single investment detail by ID
export async function getInvestmentDetailById(id: number) {
  try {
    const investment = await prisma.investment.findUnique({
      where: { id },
      select: {
        id: true,
        amount: true,
        investmentDate: true,
        refNumber: true,
        commissionsProcessed: true,

        client: {
          select: {
            fullName: true,
            nic: true,
            email: true,
            phoneMobile: true,
          },
        },

        plan: {
          select: {
            name: true,
            rate: true,
            duration: true,
          },
        },

        advisor: {
          select: {
            nameWithInitials: true,
            empNo: true,
            branches: {
              select: {
                branch: { select: { name: true } }

              },
            },
          },
        },
      },
    });

    if (!investment) {
      throw new Error("Investment not found");
    }

    return investment;
  } catch (error) {
    console.error("Error fetching investment detail:", error);
    throw error;
  }
}

// Update the advisor for a specific investment
export async function updateAdvisorId(investmentId: number, advisorEmpNo: string) {
  try {
    const [currentUser, oldInvestment] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.investment.findUnique({ where: { id: investmentId }, select: { advisorId: true, branchId: true } }),
    ]);

    const updated = await prisma.investment.update({
      where: { id: investmentId },
      data: {
        advisor: {
          connect: { empNo: advisorEmpNo },
        },
      },
    });

    revalidatePath("/features/commissions");

    void logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.INVESTMENT,
      entityId: investmentId,
      performedById: currentUser?.member?.id ?? 0,
      branchId: oldInvestment?.branchId,
      metadata: { updatedField: "advisorId", before: { advisorId: oldInvestment?.advisorId }, after: { advisorEmpNo } },
    });

    return { success: true, investment: serializeData(updated) };
  } catch (error) {
    console.error("Error updating advisor:", error);
    return { success: false, error: "Failed to update advisor" };
  }
}

// Get all plans associated with a client's investments
export async function getPlansByClient(clientId: number) {
  try {
    const investments = await prisma.investment.findMany({
      where: { clientId },
      include: {
        plan: true,
      },
    });

    const plans = investments.map((inv) => inv.plan);
    // Remove duplicates
    const uniquePlans = Array.from(new Set(plans.filter(p => p !== null).map((p) => p!.id))).map((id) =>
      plans.find((p) => p?.id === id)
    );

    return serializeData(uniquePlans);
  } catch (error) {
    console.error("Error fetching plans by client:", error);
    throw new Error("Failed to fetch plans by client");
  }
}

export async function deleteInvestment(id: number) {
  try {
    const [currentUser, existing] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.investment.findUnique({ where: { id }, select: { branchId: true, clientId: true } }),
    ]);

    await prisma.investment.delete({
      where: { id },
    });
    revalidatePath("/features/commissions");

    void logActivity({
      action: ActivityAction.DELETE,
      entity: ActivityEntity.INVESTMENT,
      entityId: id,
      performedById: currentUser?.member?.id ?? 0,
      branchId: existing?.branchId,
      metadata: { investmentId: id, clientId: existing?.clientId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting investment:", error);
    throw new Error("Failed to delete investment");
  }
}

export async function createInvestmentForExistingClient(data: {
  clientId: number;
  branchId: number;
  planId?: number;
  amount: number;
  investmentDate?: Date;
  investmentRates?: number[];
  beneficiaryId?: number | null;
  nomineeId?: number | null;
  newBeneficiary?: {
    fullName: string;
    nic?: string;
    phone: string;
    bankName: string;
    bankBranch: string;
    accountNo: string;
    relationship: string;
  } | null;
  newNominee?: {
    fullName: string;
    nic?: string;
    permanentAddress: string;
    postalAddress?: string;
  } | null;
}) {
  try {
    const currentUser = await getCurrentUserWithRole();

    const result = await prisma.$transaction(async (tx) => {
      let beneficiaryId = data.beneficiaryId ?? null;
      let nomineeId = data.nomineeId ?? null;

      if (data.newBeneficiary?.fullName) {
        const b = await tx.beneficiary.create({
          data: {
            clientId: data.clientId,
            ...data.newBeneficiary,
            nic: data.newBeneficiary.nic || null,
          },
        });
        beneficiaryId = b.id;
      }

      if (data.newNominee?.fullName) {
        const n = await tx.nominee.create({
          data: {
            clientId: data.clientId,
            fullName: data.newNominee.fullName,
            nic: data.newNominee.nic || "",
            permanentAddress: data.newNominee.permanentAddress,
            postalAddress: data.newNominee.postalAddress || null,
          },
        });
        nomineeId = n.id;
      }

      const investmentDate = data.investmentDate ?? new Date();

      const plan = data.planId
        ? await tx.financialPlan.findUnique({ where: { id: data.planId } })
        : null;

      const maturityDate = plan
        ? new Date(
          new Date(investmentDate).setMonth(
            new Date(investmentDate).getMonth() + plan.duration
          )
        )
        : null;



      const investmentRates: number[] =
        data.investmentRates?.length
          ? data.investmentRates
          : plan?.rate ?? [];

      const months = plan?.duration ?? 0;
      const years = investmentRates.length;
      const monthsPerYear = years > 0 ? months / years : 0;

      const totalHarvest =
        investmentRates.length && months
          ? investmentRates.reduce(
            (sum, rate) => sum + data.amount * (rate / 100) * (monthsPerYear / 12),
            0
          )
          : null;
      const monthlyHarvest = totalHarvest && months ? totalHarvest / months : null;

      return tx.investment.create({
        data: {
          clientId: data.clientId,
          branchId: data.branchId,
          planId: data.planId ?? null,
          investmentDate,
          maturityDate,
          amount: data.amount,
          refNumber: generateInvestmentNumber(),
          investmentRates: data.investmentRates,
          totalHarvest,
          monthlyHarvest,
          beneficiaryId,
          nomineeId,
        },
      });
    });

    revalidatePath("/features/investments");

    void logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.INVESTMENT,
      entityId: result.id,
      performedById: currentUser?.member?.id ?? 0,
      branchId: data.branchId,
      metadata: { after: result },
    });

    return serializeData({ success: true, investment: result });
  } catch (err) {
    console.error("createInvestmentForExistingClient error:", err);
    return { success: false, error: "Failed to create investment" };
  }
}


export async function updateInvestment({
  investmentId, planId, amount, investmentDate, investmentRates,
  beneficiaryId, nomineeId, newBeneficiary, newNominee,
}: {
  investmentId: number;
  planId?: number;
  amount: number;
  investmentDate: Date;
  investmentRates?: number[];
  beneficiaryId: number | null;
  nomineeId: number | null;
  newBeneficiary: any | null;
  newNominee: any | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    return await prisma.$transaction(async (tx) => {

      const clientId = await tx.investment.findUnique({
        where: { id: investmentId },
        select: { clientId: true }
      }).then(inv => inv?.clientId);

      // Create new beneficiary/nominee records if payload provided
      let resolvedBeneficiaryId = beneficiaryId;
      if (newBeneficiary?.fullName) {
        const b = await tx.beneficiary.create({ data: { ...newBeneficiary, clientId: clientId } });
        resolvedBeneficiaryId = b.id;
      }
      let resolvedNomineeId = nomineeId;
      if (newNominee?.fullName) {
        const n = await tx.nominee.create({ data: { ...newNominee, clientId: clientId } });
        resolvedNomineeId = n.id;
      }

      const plan = planId
        ? await tx.financialPlan.findUnique({ where: { id: planId } })
        : null;

      const rates = investmentRates?.length ? investmentRates : (plan?.rate ?? []);
      const months = plan?.duration ?? 0;
      const years = rates.length;
      const monthsPerYear = years > 0 ? months / years : 0;

      const totalHarvest =
        rates.length && months
          ? rates.reduce(
            (sum, rate) => sum + amount * (rate / 100) * (monthsPerYear / 12),
            0
          )
          : null;

      await tx.investment.update({
        where: { id: investmentId },
        data: {
          planId, amount, investmentDate,
          investmentRates: rates,
          totalHarvest,
          monthlyHarvest: totalHarvest && months ? totalHarvest / months : null,
          beneficiaryId: resolvedBeneficiaryId,
          nomineeId: resolvedNomineeId,
        },
      });

      return { success: true };
    });
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// actions/investment.ts
export async function getInvestmentCountsPerAdvisor(advisorIds: number[]): Promise<Record<number, number>> {
  const results = await prisma.investment.groupBy({
    by: ['advisorId'],
    where: {
      advisorId: { in: advisorIds },
    },
    _count: {
      id: true,
    },
  });

  // Build a map: { memberId: count }
  const countMap: Record<number, number> = {};

  // Initialize all to 0 first
  advisorIds.forEach(id => (countMap[id] = 0));

  results.forEach(r => {
    if (r.advisorId) countMap[r.advisorId] = r._count.id;
  });

  return countMap;
}


export type BranchReportRow = {
  branchId: number;
  branchName: string;
  employees: {
    memberId: number;
    name: string;
    position: string;
    proposalCount: number;
  }[];
};

export async function getProposalReportByBranch(
  from: Date,
  to: Date
): Promise<BranchReportRow[]> {
  // Get all branches with their members and investment counts
  const branches = await prisma.branch.findMany({
    orderBy: { id: "asc" },
    include: {
      members: {
        include: {
          member: {
            include: {
              position: true,
              advisorInvestments: {
                where: {
                  createdAt: {
                    gte: from,
                    lte: to,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return branches.map((branch) => ({
    branchId: branch.id,
    branchName: branch.name,
    employees: branch.members.map(({ member }) => ({
      memberId: member.id,
      name: member.nameWithInitials || "",
      position: member.position?.title ?? "—",
      proposalCount: member.advisorInvestments.length,
    })),
  }));
}

export async function updateInvestmentDocuments(
  investmentId: number,
  data: { paymentSlip?: string; proposal?: string; agreement?: string }
) {
  if (!investmentId) return { success: false, error: "Investment ID is required" };

  try {
    const [currentUser, investment] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.investment.findUnique({
        where: { id: investmentId },
        select: { clientId: true, client: { select: { branchId: true } } },
      }),
    ]);

    if (!investment) return { success: false, error: "Investment not found" };

    await prisma.investment.update({
      where: { id: investmentId },
      data: {
        paymentSlip: data.paymentSlip === "" ? null : (data.paymentSlip ?? undefined),
        proposal: data.proposal === "" ? null : (data.proposal ?? undefined),
        agreement: data.agreement === "" ? null : (data.agreement ?? undefined),
      },
    });

    revalidatePath("/features/clients");
    revalidatePath(`/features/clients/${investment.clientId}`);

    void logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.CLIENT,        // or add INVESTMENT to your enum
      entityId: investment.clientId,
      performedById: currentUser?.member?.id ?? 0,
      branchId: investment.client?.branchId,
      metadata: { investmentId, updatedFields: Object.keys(data) },
    });

    return { success: true };
  } catch (err) {
    console.error("Error updating investment documents:", err);
    return { success: false, error: "Failed to update investment documents" };
  }
}