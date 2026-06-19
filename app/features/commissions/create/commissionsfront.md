app\features\commissions\create\page.tsx
"use server"

import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { generateInvestmentNumber } from "@/lib/investment";
import { logActivity } from "@/lib/logActivity";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { saveClientSchema, updateClientSchema, updateBeneficiarySchema, updateNomineeSchema } from "@/lib/validations/client.schema";
import { ActivityAction, ActivityEntity, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import crypto from "crypto"
import nodemailer from "nodemailer";


export async function getAccessibleClients(page = 1, pageSize = 10, searchText = "") {
  const dbUser = await getCurrentUserWithRole();
  if (!dbUser) throw new Error("User not found");

  let whereCondition: any = {};

  switch (dbUser.role) {
    case "ADMIN":
    case "HR":
    case "DEV":
      whereCondition = {};
      break;

    case "EMPLOYEE": {
      //  ONLY their own clients
      if (!dbUser.member?.id) {
        throw new Error("Member not found for user");
      }

      whereCondition = {
        createdById: dbUser.member.id,
      };
      break;
    }

    case "BRANCH_MANAGER":
    case "REGIONAL_MANAGER":
    case "AGM": {
      const branchIds =
        dbUser.member?.branches?.map((mb) => mb.branchId) ?? [];

      if (branchIds.length === 0) {
        throw new Error("No branches assigned to this user");
      }

      whereCondition = {
        branchId: { in: branchIds },
      };
      break;
    }

    default:
      throw new Error("Unauthorized role");
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where: whereCondition,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        investments: { include: { plan: true } },
        branch: true,
        beneficiaries: true,
        nominees: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.count({ where: whereCondition }),
  ]);

  return serializeData({
    clients,
    total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page,
  });
}

// Get all clients with full details
export async function getClients() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        beneficiaries: true,
        nominees: true,
        investments: true,
        branch: {
          include: {
            members: {
              include: {
                member: { include: { position: true } }

              },
            },
          },
        },
      },
    });
    return { clients };
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw new Error("Failed to fetch clients");
  }
}

// Get single client by ID
export async function getClientById(id: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  const privilegedRoles = ["ADMIN", "HR", "DEV"];

  const client = await prisma.client.findFirst({
    where: {
      id,
      ...(privilegedRoles.includes(dbUser!.role)
        ? {}
        : { branchId: Number(dbUser!.branchId) }),
    },
    include: {
      investments: {
        include: {
          client: true,
          plan: true,
          beneficiary: true,
          nominee: true
        }
      },
      branch: true,
      nominees: true,
      beneficiaries: true,
      fa: { include: { position: { include: { salary: true, orc: true } }, branches: { include: { branch: true } } } },
      fm: { include: { position: { include: { salary: true, orc: true } }, branches: { include: { branch: true } } } },
      bm: { include: { position: { include: { salary: true, orc: true } }, branches: { include: { branch: true } } } },
      rm: { include: { position: { include: { salary: true, orc: true } }, branches: { include: { branch: true } } } },
      zm: { include: { position: { include: { salary: true, orc: true } }, branches: { include: { branch: true } } } },
      agm: { include: { position: { include: { salary: true, orc: true } }, branches: { include: { branch: true } } } },
      cco: { include: { position: { include: { salary: true, orc: true } }, branches: { include: { branch: true } } } },
    },
  });

  if (!client) {
    throw new Error("Client not accessible");
  }

  return client;
}
// Get clients by branch
export async function getClientsByBranch(branchId: number) {
  try {
    const clients = await prisma.client.findMany({
      where: { branchId },
      include: {
        investments: true,
        branch: true,
        beneficiaries: true,
        nominees: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { clients };
  } catch (error) {
    console.error("Error fetching clients by branch:", error);
    throw new Error("Failed to fetch clients by branch");
  }
}

export async function getClientsByMember(memberId: number) {
  try {
    const clients = await prisma.client.findMany({
      where: {
        memberId: memberId,
      },
      include: {
        investments: true,
        branch: true,
        beneficiaries: true,
        nominees: true,
      },
    });
    return { clients };
  } catch (error) {
    console.error("Error fetching clients by member:", error);
    throw new Error("Failed to fetch clients by member");
  }
}

const UNIQUE_FIELD_LABELS: Record<string, string> = {
  nic: "NIC",
  drivingLicense: "Driving License",
  passportNo: "Passport Number",
  email: "Email",
  proposalFormNo: "Proposal Form Number",
};

export async function saveClient(
  data: {
    applicant: any;
    investment: any;
    beneficiary?: any;
    nominee?: any;
  },
  email: any
) {
  const { applicant, investment, beneficiary, nominee } = data;

  const parsed = saveClientSchema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    });
    const firstMessage = parsed.error.issues[0]?.message ?? "Validation failed";
    return { success: false, error: firstMessage, fieldErrors };
  }

  try {
    const currentUser = await getCurrentUserWithRole();

    const client = await prisma.$transaction(async (tx: any) => {
      const member = await tx.member.findFirst({
        where: {
          email,
          branches: { some: { branchId: Number(applicant.branchId) } },
        },
      });

      const createClient = await tx.client.create({
        data: {
          fullName: applicant.fullName,
          nic: applicant.nic || null,
          drivingLicense: applicant.drivingLicense || null,
          passportNo: applicant.passportNo || null,
          email: applicant.email || null,
          phoneMobile: applicant.phoneMobile || null,
          phoneLand: applicant.phoneLand || null,
          dateOfBirth: applicant.dateOfBirth ? new Date(applicant.dateOfBirth) : null,
          occupation: applicant.occupation || null,
          address: applicant.address,
          branchId: applicant.branchId,
          signature: applicant.signature,
          idFront: applicant.idFront,
          idBack: applicant.idBack,
          createdById: currentUser?.member?.id ?? null,
          faId: applicant.faId ?? null,
          fmId: applicant.fmId ?? null,
          bmId: applicant.bmId ?? null,
          rmId: applicant.rmId ?? null,
          zmId: applicant.zmId ?? null,
          agmId: applicant.agmId ?? null,
          ccoId: applicant.ccoId ?? null,
        },
      });

      if (member) {
        await tx.member.update({
          where: { id: member.id },
          data: { lastClientRegisteredAt: new Date() },
        });
      }

      let beneficiaryId: number | null = null;
      if (beneficiary?.fullName) {
        const createdBeneficiary = await tx.beneficiary.create({
          data: {
            clientId: createClient.id,
            fullName: beneficiary.fullName,
            nic: beneficiary.nic || null,
            phone: beneficiary.phone || "",
            bankName: beneficiary.bankName || "",
            bankBranch: beneficiary.bankBranch || "",
            accountNo: beneficiary.accountNo || "",
            relationship: beneficiary.relationship || "",
          },
        });
        beneficiaryId = createdBeneficiary.id;
      }

      let nomineeId: number | null = null;
      if (nominee?.fullName) {
        const createdNominee = await tx.nominee.create({
          data: {
            clientId: createClient.id,
            fullName: nominee.fullName,
            nic: nominee.nic || "",
            permanentAddress: nominee.permanentAddress || "",
            postalAddress: nominee.postalAddress || null,
          },
        });
        nomineeId = createdNominee.id;
      }

      const investmentDate = applicant.investmentDate
        ? new Date(applicant.investmentDate)
        : new Date();

      const plan = await tx.financialPlan.findUnique({
        where: { id: Number(investment.planId) },
      });

      const maturityDate = plan
        ? new Date(
          new Date(investmentDate).setMonth(
            new Date(investmentDate).getMonth() + plan.duration
          )
        )
        : null;

      const investmentRates: number[] =
        Array.isArray(investment.investmentRates) &&
          investment.investmentRates.length > 0
          ? investment.investmentRates.map((r: any) => parseFloat(r))
          : Array.isArray(plan?.rate) && plan.rate.length > 0
            ? plan.rate
            : [];

      const amount = Number(applicant.investmentAmount);
      const months = plan?.duration ?? 0;
      const years = investmentRates.length;
      const monthsPerYear = years > 0 ? months / years : 0;

      const totalHarvest =
        investmentRates.length && months
          ? Math.round(
            investmentRates.reduce(
              (sum, rate) =>
                sum + amount * (rate / 100) * (monthsPerYear / 12),
              0
            )
          )
          : 0;

      const monthlyHarvest = months > 0 ? Math.round(totalHarvest / months) : 0;

      const createInvestment = await tx.investment.create({
        data: {
          clientId: createClient.id,
          refNumber: generateInvestmentNumber(),
          branchId: applicant.branchId,
          planId: Number(investment.planId),
          investmentDate,
          maturityDate,
          amount,
          beneficiaryId,
          nomineeId,
          investmentRates,
          totalHarvest,
          monthlyHarvest,
          proposalFormNo: applicant.proposalFormNo || null,
          proposal: applicant.proposal,
          paymentSlip: applicant.paymentSlip,
          agreement: applicant.agreement,
        },
      });

      // Volume tracking across hierarchy
      const hierarchyMemberIds = [
        applicant.faId ?? null,
        applicant.fmId ?? null,
        applicant.bmId ?? null,
        applicant.rmId ?? null,
        applicant.zmId ?? null,
        applicant.agmId ?? null,
        applicant.ccoId ?? null,
      ].filter((id): id is number => id !== null);

      const uniqueHierarchyIds = [...new Set(hierarchyMemberIds)];
      const year = investmentDate.getFullYear();
      const month = investmentDate.getMonth() + 1;

      await Promise.all(
        uniqueHierarchyIds.map((memberId) =>
          tx.monthlyPayroll.upsert({
            where: { memberId_year_month: { memberId, year, month } },
            update: { volumeAchieved: { increment: amount } },
            create: {
              memberId,
              year,
              month,
              basicSalaryPermanent: 0,
              monthlyTarget: 0,
              volumeAchieved: amount,
            },
          })
        )
      );

      await upsertActivationsForInvestment(
        tx,
        {
          fmId: applicant.fmId ?? null,
          bmId: applicant.bmId ?? null,
          rmId: applicant.rmId ?? null,
          zmId: applicant.zmId ?? null,
          agmId: applicant.agmId ?? null,
          ccoId: applicant.ccoId ?? null,
        },
        year,
        month,
      );

      return { ...createClient, investments: [createInvestment] };
    });

    revalidatePath("/features/clients");

    void logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.CLIENT,
      entityId: client.id,
      performedById: currentUser?.member?.id ?? 0,
      branchId: applicant.branchId,
      metadata: { after: client },
    });

    return serializeData({ success: true, client });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      console.error("P2002 meta:", JSON.stringify(err.meta, null, 2));

      const driverError = err.meta?.driverAdapterError as any;
      const fields: string[] =
        driverError?.cause?.constraint?.fields ??
        (err.meta?.target as string[]) ??
        [];

      const label = fields
        .map((f) => UNIQUE_FIELD_LABELS[f] ?? f)
        .join(", ");

      return {
        success: false,
        error: label
          ? `A client with this ${label} already exists.`
          : "A duplicate value was found. Please check your entries.",
      };
    }

    console.error("Error creating client:", err);
    return { success: false, error: "Server error" };
  }
}

// Helper — already in your codebase, duplicated here for reference
function serializeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
// Update client
export async function updateClient(id: number, formData: any) {
  const clientId = id;

  const parsed = updateClientSchema.safeParse(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    });
    const firstMessage = parsed.error.issues[0]?.message ?? "Validation failed";
    return { success: false, error: firstMessage, fieldErrors };
  }

  try {
    const [currentUser, oldClient] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.client.findUnique({ where: { id: clientId } }),
    ]);

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        fullName: formData.applicant.fullName,
        nic: formData.applicant.nic || null,
        email: formData.applicant.email || null,
        phoneMobile: formData.applicant.phoneMobile || null,
        occupation: formData.applicant.occupation || null,
        address: formData.applicant.address || null,
        drivingLicense: formData.applicant.drivingLicense || null,
        passportNo: formData.applicant.passportNo || null,
        phoneLand: formData.applicant.phoneLand || null,
        idFront: formData.applicant.idFront || null,
        idBack: formData.applicant.idBack || null,
        dateOfBirth: formData.applicant.dateOfBirth
          ? new Date(formData.applicant.dateOfBirth)
          : undefined,
        branchId: formData.applicant.branchId
          ? Number(formData.applicant.branchId)
          : undefined,
      },
    });

    revalidatePath("/features/clients");

    void logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.CLIENT,
      entityId: clientId,
      performedById: currentUser?.member?.id ?? 0,
      branchId: updatedClient.branchId,
      metadata: { before: oldClient, after: updatedClient },
    });

    return serializeData({ success: true, client: updatedClient, error: "Failed to update client" });
  } catch (error) {
    console.error("Error updating client:", error);
    return { success: false, error: "Failed to update client" };
  }
}

// Delete client
export async function deleteClient(id: number) {
  try {
    const [currentUser, existingClient] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.client.findUnique({ where: { id } }),
    ]);

    const res = await prisma.client.delete({
      where: { id },
    });

    revalidatePath("/features/clients");

    void logActivity({
      action: ActivityAction.DELETE,
      entity: ActivityEntity.CLIENT,
      entityId: existingClient?.id,
      performedById: currentUser?.member?.id ?? 0,
      branchId: existingClient?.branchId,
      metadata: { deleted: existingClient },
    });

    return serializeData({ success: true, client: res });
  } catch (error) {
    console.error("Error deleting client:", error);
    return { success: false, error: "Failed to delete client" };
  }
}

// Update client documents
export async function updateClientDocuments(
  clientId: number,
  data: {
    idFront?: string;
    idBack?: string;

  }
) {
  if (!clientId) return { success: false, error: "Client ID is required" };

  try {
    const [currentUser, client] = await Promise.all([
      getCurrentUserWithRole(),
      prisma.client.findUnique({ where: { id: clientId }, select: { branchId: true } }),
    ]);

    await prisma.client.update({
      where: { id: clientId },
      data: {
        idFront: data.idFront ?? undefined,
        idBack: data.idBack ?? undefined,

      },
    });

    revalidatePath("/features/clients");
    revalidatePath(`/features/clients/${clientId}`);

    void logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.CLIENT,
      entityId: clientId,
      performedById: currentUser?.member?.id ?? 0,
      branchId: client?.branchId,
      metadata: { updatedFields: Object.keys(data) },
    });

    return { success: true };
  } catch (err) {
    console.error("Error updating documents:", err);
    return { success: false, error: "Failed to update documents" };
  }
}

// Delete client document field
export async function deleteClientDocument(nic: string, field: string) {
  const allowedFields = ["idFront", "idBack", "paymentSlip", "signature", "proposal", "agreement"];

  if (!allowedFields.includes(field)) {
    return { success: false, error: "Invalid document field" };
  }

  try {
    await prisma.client.update({
      where: { nic },
      data: {
        [field]: null,
      },
    });

    const currentUser = await getCurrentUserWithRole().catch(() => null);

    revalidatePath("/features/clients");

    logActivity({
      action: ActivityAction.DELETE,
      entity: ActivityEntity.CLIENT,
      performedById: currentUser?.member?.id ?? 0,
      metadata: { deletedFieldValue: field, clientNic: nic },
    });

    return { success: true, field };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Failed to delete document" };
  }
}

export async function generateUploadUrl(clientId: number) {
  const token = crypto.randomBytes(32).toString("hex");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { email: true, fullName: true },
  });

  if (!client) throw new Error("Client not found");

  await prisma.clientDocumentRequest.create({
    data: {
      clientId,
      token,
      createdById: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days
    },
  });

  const uploadLink = `${process.env.NEXT_PUBLIC_APP_URL}/upload/${token}`;

  // Only send email if client has one — otherwise just return the link to copy
  if (client.email) {
    try {
      await sendDocumentRequestEmail({
        to: client.email,
        clientName: client.fullName,
        uploadLink,
      });
    } catch (err) {
      // Don't block link generation if email fails
      console.error("Email send failed:", err);
    }
  }

  return {
    uploadLink,
    emailSent: !!client.email,
  };
}

async function sendDocumentRequestEmail({
  to,
  clientName,
  uploadLink,
}: {
  to: string;
  clientName: string;
  uploadLink: string;
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Document Request" <${process.env.SMTP_FROM}>`,
    to,
    subject: "Action Required: Please Upload Your Documents",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Hi ${clientName},</h2>
        <p style="color: #475569; line-height: 1.6;">
          We need you to upload the following documents to complete your application:
        </p>
        <ul style="color: #475569; line-height: 2;">
          <li>National ID / NIC — Front</li>
          <li>National ID / NIC — Back</li>
          <li>Payment Slip</li>
        </ul>
        <a href="${uploadLink}" style="
          display: inline-block;
          margin-top: 24px;
          padding: 14px 28px;
          background: #1e293b;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          font-size: 14px;
        ">
          Upload Documents
        </a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
          This link expires in 48 hours. Do not share it with anyone.
        </p>
      </div>
    `,
  });
}

export async function validateUploadToken(token: string) {
  const request = await prisma.clientDocumentRequest.findUnique({
    where: { token },
    include: {
      client: { select: { id: true, fullName: true, email: true } },
    },
  });

  if (!request) return { valid: false, error: "Invalid link." };
  if (request.used) return { valid: false, error: "This link has already been used." };
  if (new Date() > request.expiresAt) return { valid: false, error: "This link has expired." };

  return { valid: true, request };
}

export async function saveUploadedDocuments(
  token: string,
  urls: {
    idFront?: string;
    idBack?: string;
    // paymentSlip?: string;
    signature?: string; // ← optional, not required
  }
) {
  const request = await prisma.clientDocumentRequest.findUnique({
    where: { token },
  });

  if (!request) return { success: false, error: "Invalid token" };
  if (request.used) return { success: false, error: "Link already used" };
  if (new Date() > request.expiresAt) return { success: false, error: "Link expired" };

  await prisma.$transaction([
    prisma.client.update({
      where: { id: request.clientId },
      data: {
        idFront: urls.idFront ?? undefined,
        idBack: urls.idBack ?? undefined,
        // paymentSlip: urls.paymentSlip ?? undefined,
        signature: urls.signature ?? undefined,
      },
    }),
    prisma.clientDocumentRequest.update({
      where: { token },
      data: { used: true },
    }),
  ]);

  logActivity({
    action: ActivityAction.UPDATE,
    entity: ActivityEntity.CLIENT,
    entityId: request.clientId,
    performedById: undefined, // Internal/Guest Action
    metadata: { action: "documents_uploaded_via_token", token },
  });

  return { success: true };
}

export async function searchClients(query: string) {
  if (!query || query.trim().length < 2) return null;

  const client = await prisma.client.findFirst({
    where: {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { nic: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      fullName: true,
      nic: true,
      branchId: true,
      branch: { select: { name: true } },
      investments: { select: { id: true } },
      // ── NEW: include beneficiaries and nominees for the picker ──
      beneficiaries: {
        select: {
          id: true,
          fullName: true,
          nic: true,
          phone: true,
          bankName: true,
          bankBranch: true,
          accountNo: true,
          relationship: true,
        },
      },
      nominees: {
        select: {
          id: true,
          fullName: true,
          nic: true,
          permanentAddress: true,
          postalAddress: true,
        },
      },
    },
  });

  return client;
}

export async function updateBeneficiary(data: any) {
  try {
    console.log(data);

    const updatedBeneficiary = await prisma.beneficiary.update({
      where: { id: data.id },
      data: {
        fullName: data.fullName,
        relationship: data.relationship || "",
        bankName: data.bankName || "",
        bankBranch: data.bankBranch || "",
        accountNo: data.accountNo || "",
        nic: data.nic || null,
        phone: data.phone || "",
      },
    })

    return updatedBeneficiary;

  } catch (err) {
    console.error("Error updating beneficiary:", err);
    return { success: false, error: "Failed to update beneficiary" };
  }
}

export async function updateNominee(data: any) {

  try {
    const updatedNominee = await prisma.nominee.update({
      where: { id: data.id },
      data: {
        fullName: data.fullName,
        permanentAddress: data.permanentAddress || "",
        postalAddress: data.postalAddress || null,
      },
    });

    return updatedNominee;

  } catch (err) {
    console.error("Error updating nominee:", err);
    return { success: false, error: "Failed to update nominee" };
  }
}

export async function deleteBeneficiaryAction(id: number) {
  try {
    await prisma.beneficiary.delete({
      where: { id },
    })
  } catch (err) {
    console.error("Error deleting beneficiary:", err);
    return { success: false, error: "Failed to delete beneficiary" };
  }
}

export async function deleteNomineeAction(id: number) {
  try {
    await prisma.nominee.delete({
      where: { id },
    })
  } catch (err) {
    console.error("Error deleting nominee:", err);
    return { success: false, error: "Failed to delete nominee" };
  }
}


export async function searchMembersByName(query: string) {
  const terms = query.trim().split(/\s+/).filter(Boolean);

  return prisma.member.findMany({
    where: {
      isActive: true,
      AND: terms.map((term) => ({
        nameWithInitials: { contains: term, mode: "insensitive" },
      })),
    },
    select: {
      id: true,
      nameWithInitials: true,
      empNo: true,
      position: { select: { title: true } },
    },
    take: 8,
  });
}


-------------------------------------------------------
app\features\commissions\create\components

import { Branch } from "@/app/types/branch";

interface Props {
  branches: Branch[];
  branch: Branch | null;
  selectedBranchId: number | null;
  selectedEmpNo: string;
  onBranchChange: (id: number | null) => void;
  onEmployeeChange: (empNo: string) => void;
}

export default function BranchStaffPanel({
  branches,
  branch,
  selectedEmpNo,
  onBranchChange,
  onEmployeeChange,
}: Props) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
          Branch & Staff
        </h2>
      </div>

      <div className="relative space-y-6">
        {/* Connector Line */}
        <div className="absolute left-2.75 top-6 bottom-6 w-0.5 bg-muted" />

        {/* Branch Selection */}
        <div className="relative pl-8">
          <div className="absolute left-0 top-2 h-6 w-6 rounded-full border-2 border-card bg-primary/100 ring-2 ring-primary/20" />
          <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            1. Select Location
          </label>
          <select
            className="w-full appearance-none rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-semibold text-foreground outline-none transition-all focus:border-blue-500 focus:bg-card focus:ring-4 focus:ring-primary/10 cursor-pointer"
            onChange={(e) =>
              onBranchChange(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Select a Branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Employee Selection */}
        <div className="relative pl-8">
          <div
            className={`absolute left-0 top-2 h-6 w-6 rounded-full border-2 border-card ring-2 transition-all ${branch ? "bg-primary/100 ring-primary/20" : "bg-muted ring-border/50"}`}
          />
          <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            2. Assign Employee
          </label>
          <select
            disabled={!branch}
            className="w-full appearance-none rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-semibold text-foreground outline-none transition-all focus:border-blue-500 focus:bg-card focus:ring-4 focus:ring-primary/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            value={selectedEmpNo}
            onChange={(e) => onEmployeeChange(e.target.value)}
          >
            <option value="">
              {branch ? "All Employees" : "Select a branch first"}
            </option>
            {/* {branch?.members?.map((mb:any, index) => (
              <option key={index} value={mb.member.empNo}>
                {mb.member.nameWithInitials} ({mb.member.empNo})
              </option>
            ))} */}

            {/* display only active member for commission */}

            {branch?.members?.filter((m: any) => m.member && m.member.isActive).map((mb: any, index) => (
              <option key={index} value={mb.member.empNo}>
                {mb.member.nameWithInitials} ({mb.member.empNo})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}


import PlanSelector from "./PlanSelector";

export const ClientDetailsCard = ({ client, selectedInvestmentId, onInvestmentChange }: any) => {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[10px] font-black text-primary uppercase tracking-wider mb-1 block">Account Holder</span>
            <h2 className="text-2xl font-bold text-foreground">{client.fullName}</h2>
          </div>
          <div className="flex flex-col items-end">
             <span className="px-2.5 py-1 bg-slate-100 text-muted-foreground rounded-md text-[10px] font-bold uppercase">
               Active Client
             </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <DetailItem label="NIC Number" value={client.nic} />
          <DetailItem label="Primary Mobile" value={client.phoneMobile} />
          <DetailItem label="Home Branch" value={client.branch?.name} />
        </div>

        <div className="bg-muted/30 rounded-xl p-4 border border-border">
          <PlanSelector
            investments={client.investments}
            selectedInvestmentId={selectedInvestmentId}
            onChange={onInvestmentChange}
          />
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
    <p className="text-sm font-semibold text-muted-foreground">{value || "—"}</p>
  </div>
);

import { useState, useMemo } from "react";

interface ClientSelectorProps {
  clients: any[];
  selectedClientId: number | null;
  onChange: (id: number | null) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ClientSelector = ({
  clients,
  selectedClientId,
  onChange,
}: ClientSelectorProps) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Derive available years from client data
  const availableYears = useMemo(() => {
    const years = new Set(
      clients.map((c) => new Date(c.createdAt).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [clients]);

  // Filter clients by selected month + year
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const d = new Date(c.createdAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [clients, selectedMonth, selectedYear]);

  // Reset client selection if it's no longer in the filtered list
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    const stillVisible = filteredClients.some((c) => c.id === selectedClientId);
    if (!stillVisible) onChange(null);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    onChange(null);
  };

  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm transition-all hover:shadow-md">
      {/* Header with Icon */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
          Client Details
        </h2>
      </div>

      <div className="relative">
        <div className="relative pl-8 space-y-4">
          <div className="absolute left-0 top-2 h-6 w-6 rounded-full border-2 border-card bg-primary/100 ring-2 ring-primary/20" />

          {/* Month + Year Filter */}
          <div>
            <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Registration Period
            </label>
            <div className="flex gap-2">
              {/* Month Select */}
              <div className="relative group flex-1">
                <select
                  className="w-full appearance-none rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-semibold text-foreground outline-none transition-all focus:border-blue-500 focus:bg-card focus:ring-4 focus:ring-primary/10 cursor-pointer"
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                >
                  {MONTHS.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground/70 group-focus-within:text-primary">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>

              {/* Year Select */}
              <div className="relative group w-28">
                <select
                  className="w-full appearance-none rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-semibold text-foreground outline-none transition-all focus:border-blue-500 focus:bg-card focus:ring-4 focus:ring-primary/10 cursor-pointer"
                  value={selectedYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground/70 group-focus-within:text-primary">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Client Select */}
          <div>
            <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Primary Contact
              <span className="ml-2 normal-case font-medium text-muted-foreground/50">
                ({filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""})
              </span>
            </label>
            <div className="relative group">
              <select
                className="w-full appearance-none rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-semibold text-foreground outline-none transition-all focus:border-blue-500 focus:bg-card focus:ring-4 focus:ring-primary/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                value={selectedClientId ?? ""}
                onChange={(e) =>
                  onChange(e.target.value ? Number(e.target.value) : null)
                }
                disabled={filteredClients.length === 0}
              >
                <option value="">
                  {filteredClients.length === 0
                    ? "No clients this month"
                    : "Choose a client"}
                </option>
                {filteredClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground/70 group-focus-within:text-primary">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ClientSelector;


"use client";

import { Member } from "@/app/types/member";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  member: Member;
  investmentAmount?: number | null;
  isEnabled?: boolean;
  onToggle?: (empNo: string) => void;
}

export default function MemberCard({
  member,
  investmentAmount,
  isEnabled = true,
  onToggle,
}: Props) {
  const orcRate = member.position?.orc
    ? Number(
        member.status === "PERMANENT"
          ? member.position.orc.ratePermanent
          : member.position.orc.rateNonPermanent
      )
    : null;

  const estimatedCommission =
    isEnabled && orcRate != null && investmentAmount
      ? investmentAmount * orcRate
      : null;

  return (
    <div
      className={`group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all ${
        isEnabled
          ? "border-border hover:shadow-md"
          : "border-border opacity-40 grayscale"
      }`}
    >
      {/* Header Section */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-foreground tracking-tight leading-none mb-1 truncate">
              {member.nameWithInitials}
            </p>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-primary">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary/100" />
              {member.position?.title}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-2">
            {/* Earnings Badge */}
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tighter">
                Total Earned
              </p>
              <p className="text-sm font-bold text-primary">
                Rs. {member.totalCommission?.toLocaleString()}
              </p>
            </div>

            {/* Toggle Button */}
            {onToggle && (
              <button
                onClick={() => onToggle(member.empNo)}
                title={isEnabled ? "Disable member" : "Enable member"}
                className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                  isEnabled
                    ? "text-primary hover:bg-primary/10"
                    : "text-muted-foreground/70 hover:bg-muted"
                }`}
              >
                {isEnabled ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rates + Status Section */}
      <div className="grid grid-cols-3 divide-x divide-gray-50/30 border-t border-border bg-muted/10">
        <div className="p-3 text-center">
          <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">
            ORC Rate
          </p>
          <p className="text-base font-bold text-foreground">
            {orcRate != null ? `${(orcRate * 100).toFixed(2)}%` : "0%"}
          </p>
        </div>

        <div className="p-3 text-center">
          <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">
            Status
          </p>
          <p className="text-base font-bold text-foreground">
            {member.status ?? "—"}
          </p>
        </div>

        <div className="p-3 text-center">
          <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">
            Est. ORC
          </p>
          {!isEnabled ? (
            <p className="text-base font-bold text-muted-foreground/70">—</p>
          ) : estimatedCommission != null ? (
            <p className="text-[11px] font-bold text-primary leading-tight">
              Rs.{" "}
              {estimatedCommission.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          ) : (
            <p className="text-[9px] font-medium text-muted-foreground/70 leading-tight">
              Select investment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


"use client";

import { Member } from "@/app/types/member";
import MemberCard from "./MemberCard";

interface Props {
  members?: Member[];
  manualMembers?: Member[];
  loading: boolean;
  selectedEmpNo: string;
  investmentAmount?: number | null;
  disabledEmpNos: Set<string>;
  onToggle: (empNo: string) => void;
}

export default function MemberList({
  members,
  manualMembers = [],
  loading,
  selectedEmpNo,
  investmentAmount,
  disabledEmpNos,
  onToggle,
}: Props) {
  if (loading) {
    return (
      <p className="text-sm text-muted-foreground/70 italic">Loading eligible members…</p>
    );
  }

  const hasEligible = members && members.length > 0;
  const hasManual = manualMembers.length > 0;

  if (selectedEmpNo && !hasEligible && !hasManual) {
    return (
      <p className="text-sm text-red-500 italic">No eligible members found</p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Eligible / hierarchy members */}
      {members?.map((m, index) => (
        <MemberCard
          key={index}
          member={m}
          investmentAmount={investmentAmount}
          isEnabled={!disabledEmpNos.has(m.empNo)}
          onToggle={onToggle}
        />
      ))}

      {/* Manually added members */}
      {hasManual && (
        <>
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Manually Added
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {manualMembers.map((m,index) => (
            <MemberCard
              key={index}
              member={m}
              investmentAmount={investmentAmount}
              isEnabled={!disabledEmpNos.has(m.empNo)}
              onToggle={onToggle}
            />
          ))}
        </>
      )}
    </div>
  );
}


import React from "react";

const PlanCard = ({ plans }: { plans: any[] }) => {
  return (
    <div className="space-y-6">
  <div className="flex items-center gap-2 px-1">
    <div className="h-4 w-1 bg-blue-600 rounded-full" />
    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
      Active Plan
    </h2>
  </div>

  {!plans || plans.length === 0 ? (
    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl text-muted-foreground/70 bg-muted/30">
      <span className="text-sm font-medium">No active investment plans</span>
    </div>
  ) : (
    plans.map((p: any) => (
      <div
        key={p.id}
        className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
      >
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="uppercase text-lg font-bold text-foreground tracking-tight">
                {p.name}
              </h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter italic">
                {p.description}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
              {p.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground/70 uppercase font-bold tracking-wider">
                Investment Value
              </p>
              <p className="text-xl font-extrabold text-blue-900">
                <span className="text-sm font-semibold mr-1 text-primary/60">Rs.</span>
                {p.investment?.toLocaleString() ?? "0"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground/70 uppercase font-bold tracking-wider">
                Returns
              </p>
              <p className="text-xl font-extrabold text-primary">
                {p.rate}% <span className="text-[10px] font-medium text-muted-foreground/70 ml-1">p.a</span>
              </p>
            </div>

            <div className="pt-4 border-t border-border/50 col-span-2 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-muted-foreground/70 uppercase font-bold tracking-wider">
                  Maturity Period
                </p>
                <p className="text-sm font-bold text-foreground">
                  {p.duration} <span className="font-normal text-muted-foreground">Months</span>
                </p>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    ))
  )}
</div>
  );
};

export default PlanCard;


interface PlanSelectorProps {
  investments: any[];
  selectedInvestmentId: number | null;
  onChange: (id: number | null) => void;
}

const PlanSelector = ({
  investments,
  selectedInvestmentId,
  onChange,
}: PlanSelectorProps) => {

  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground/70 mb-1">
        Select Plan
      </label>

      <select
        className="w-full rounded-lg border px-3 py-2 bg-muted/30 text-foreground"
        value={selectedInvestmentId ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">Choose a plan</option>

        {investments?.map((inv) => (
          <option key={inv.id} value={inv.id} className="py-2">
            {`${inv.plan?.name ?? "Plan"}  |  Rs. ${inv.amount.toLocaleString()}  |  Prop: ${inv.proposalFormNo ?? 'N/A'}`}
          </option>
        ))}
      </select>

      {investments?.length === 0 && (
        <p className="text-xs text-red-500 mt-1 italic">
          No investments found
        </p>
      )}
    </div>
  );
};

export default PlanSelector;


