"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializeData } from "@/app/utils/serializers";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Generate investment reference number
function generateInvestmentNumber() {
  const prefix = "INV";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
}

export async function getInvestments() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => { },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get internal user (Prisma user)
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  let whereClause = {};

  // 🔥 Role-based filtering
  if (dbUser.role !== "ADMIN") {
    whereClause = {
      branchId: dbUser.branchId,
    };
  }

  const investments = await prisma.investment.findMany({
    where: whereClause,
    include: {
      client: true,
      plan: true,
      advisor: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return serializeData(investments);
}

export async function createInvestment(data: {
  clientId: number;
  planId?: number;
  advisorId?: number;
  amount: number;
}) {
  try {
    const refNumber = generateInvestmentNumber();

    const investment = await prisma.investment.create({
      data: {
        refNumber,
        clientId: data.clientId,
        planId: data.planId || null,
        advisorId: data.advisorId || null,
        amount: data.amount,
        investmentDate: new Date(),
      },
      include: {
        client: true,
        plan: true,
        advisor: true,
      },
    });

    revalidatePath("/features/investments");
    return { success: true, investment: serializeData(investment) };
  } catch (error) {
    console.error("Error creating investment:", error);
    return { success: false, error: "Failed to create investment" };
  }
}

export async function getInvestmentById(id: number) {
  try {
    const investment = await prisma.investment.findUnique({
      where: { id },
      include: {
        client: true,
        plan: true,
        advisor: {
          include: {
            branch: true,
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

// Get investment details (summary view)
export async function getInvestmentDetails() {
  try {
    const investments = await prisma.investment.findMany({
      select: {
        id: true,
        amount: true,
        investmentDate: true,

        client: {
          select: {
            fullName: true,
          },
        },

        plan: {
          select: {
            name: true,
          },
        },

        advisor: {
          select: {
            name: true,
            branch: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return serializeData(investments);
  } catch (error) {
    console.error("Error fetching investment details:", error);
    throw new Error("Failed to fetch investment details");
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
            name: true,
            empNo: true,
            branch: {
              select: {
                name: true,
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
    const updated = await prisma.investment.update({
      where: { id: investmentId },
      data: {
        advisor: {
          connect: { empNo: advisorEmpNo },
        },
      },
    });

    revalidatePath("/features/commissions");
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
    await prisma.investment.delete({
      where: { id },
    });
    revalidatePath("/features/commissions");
    return { success: true };
  } catch (error) {
    console.error("Error deleting investment:", error);
    throw new Error("Failed to delete investment");
  }
}
