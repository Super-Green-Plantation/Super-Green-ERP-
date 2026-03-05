"use server"

import { serializeData } from "@/app/utils/serializers";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { generateInvestmentNumber } from "@/lib/investment";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto"
import nodemailer from "nodemailer";


const BUCKET = "kyc-documents";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!; // e.g. https://yourapp.com



export async function getAccessibleClients() {
  const dbUser = await getCurrentUserWithRole();

  if (!dbUser) throw new Error("User not found");

  let whereCondition: any = {};

  switch (dbUser.role) {
    case "ADMIN":
    case "HR":
    case "DEV":
      // see all clients
      whereCondition = {};
      break;

    case "BRANCH_MANAGER":
      // branch clients
      whereCondition = {
        branchId: Number(dbUser.branchId),
      };
      break;

    case "EMPLOYEE":
      // own clients only
      whereCondition = {
        memberId: Number(dbUser?.member?.id),
      };
      break;

    default:
      throw new Error("Unauthorized role");
  }

  const clients = await prisma.client.findMany({
    where: whereCondition,
    include: {
      investments: true,
      branch: true,
      beneficiary: true,
      nominee: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return serializeData(clients);
}

// Get all clients with full details
export async function getClients() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        beneficiary: true,
        nominee: true,
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
      investments: { include: { plan: true } },
      branch: true,
      nominee: true,
      beneficiary: true,

    },
  });

  if (!client) {
    throw new Error("Client not accessible");
  }

  return serializeData(client);
}
// Get clients by branch
export async function getClientsByBranch(branchId: number) {
  try {
    const clients = await prisma.client.findMany({
      where: { branchId },
      include: {
        investments: true,
        branch: true,
        beneficiary: true,
        nominee: true,
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
        beneficiary: true,
        nominee: true,
      },
    });
    return { clients };
  } catch (error) {
    console.error("Error fetching clients by member:", error);
    throw new Error("Failed to fetch clients by member");
  }
}
// Create client with investment, beneficiary, and nominee
export async function saveClient(data: {
  applicant: any;
  investment: any;
  beneficiary?: any;
  nominee?: any;
}, email: any) {
  const { applicant, investment, beneficiary, nominee } = data;

  // Validate required fields
  if (!applicant.fullName || !applicant.address || !applicant.branchId) {
    return { success: false, error: "Missing required fields: fullName, address, branchId" };
  }

  const investmentNumber = generateInvestmentNumber();

  try {
    const client = await prisma.$transaction(async (prisma: any) => {

      const member = await prisma.member.findFirst({
        where: {
          email,
          branches: {
            some: {
              branchId: Number(applicant.branchId),
            }
          }

        },
      });

      const createdClient = await prisma.client.create({
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
          investmentAmount: Number(applicant.investmentAmount),
          branchId: applicant.branchId,
          signature: applicant.signature,
          idFront: applicant.idFront,
          idBack: applicant.idBack,
          paymentSlip: applicant.paymentSlip,
          proposal: applicant.proposal,
          agreement: applicant.agreement,
          memberId: member ? member.id : null,

          investments: {
            create: [
              {
                refNumber: investmentNumber,
                branchId: applicant.branchId,
                planId: Number(investment.planId),
                investmentDate: new Date(),
                amount: Number(applicant.investmentAmount),
              },
            ],
          },
          beneficiary: beneficiary
            ? {
              create: {
                fullName: beneficiary.fullName,
                nic: beneficiary.nic || null,
                phone: beneficiary.phone || "",
                bankName: beneficiary.bankName || "",
                bankBranch: beneficiary.bankBranch || "",
                accountNo: beneficiary.accountNo || "",
                relationship: beneficiary.relationship || "",
              },
            }
            : undefined,
          nominee: nominee
            ? {
              create: {
                fullName: nominee.fullName,
                permanentAddress: nominee.permanentAddress || "",
                postalAddress: nominee.postalAddress || null,
              },
            }
            : undefined,
        },
        include: {
          investments: true,
          beneficiary: true,
          nominee: true,
        },
      });

      return createdClient;
    });

    revalidatePath("/features/clients");
    return serializeData({ success: true, client });
  } catch (err) {
    console.error("Error creating client:", err);
    return { success: false, error: "Server error" };
  }
}

// Update client
export async function updateClient(id: number, formData: any) {
  const clientId = id;

  try {
    // Update applicant info
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
        paymentSlip: formData.applicant.paymentSlip || null,
        proposal: formData.applicant.proposal || null,
        agreement: formData.applicant.agreement || null,
        investmentAmount: Number(formData.applicant.investmentAmount) || undefined,
        dateOfBirth: formData.applicant.dateOfBirth ? new Date(formData.applicant.dateOfBirth) : undefined,
        branchId: formData.applicant.branchId ? Number(formData.applicant.branchId) : undefined,
      },
    });

    // Upsert investment info
    const existingInvestment = await prisma.investment.findFirst({
      where: { clientId },
    });

    if (existingInvestment) {
      await prisma.investment.update({
        where: { id: existingInvestment.id },
        data: {
          planId: formData.investment?.planId
            ? Number(formData.investment.planId)
            : existingInvestment.planId,
          amount:
            Number(formData.applicant.investmentAmount) ?? Number(existingInvestment.amount),
        },
      });
    } else if (formData.investment?.planId) {
      await prisma.investment.create({
        data: {
          clientId,
          branchId: formData.applicant.branchId,
          planId: Number(formData.investment.planId),
          investmentDate: new Date(),
          amount: formData.applicant.investmentAmount,
          refNumber: generateInvestmentNumber(),
        },
      });
    }

    // Upsert beneficiary info
    if (formData.beneficiary?.fullName) {
      await prisma.beneficiary.upsert({
        where: { clientId },
        update: {
          fullName: formData.beneficiary.fullName,
          relationship: formData.beneficiary.relationship || "",
          bankName: formData.beneficiary.bankName || "",
          accountNo: formData.beneficiary.accountNo || "",
          bankBranch: formData.beneficiary.bankBranch || "",
          nic: formData.beneficiary.nic || null,
          phone: formData.beneficiary.phone || "",
        },
        create: {
          clientId,
          fullName: formData.beneficiary.fullName,
          relationship: formData.beneficiary.relationship || "",
          bankName: formData.beneficiary.bankName || "",
          accountNo: formData.beneficiary.accountNo || "",
          bankBranch: formData.beneficiary.bankBranch || "",
          nic: formData.beneficiary.nic || null,
          phone: formData.beneficiary.phone || "",
        },
      });
    }

    // Upsert nominee info
    if (formData.nominee?.fullName) {
      await prisma.nominee.upsert({
        where: { clientId },
        update: {
          fullName: formData.nominee.fullName,
          permanentAddress: formData.nominee.permanentAddress || "",
          postalAddress: formData.nominee.postalAddress || null,
        },
        create: {
          clientId,
          fullName: formData.nominee.fullName,
          permanentAddress: formData.nominee.permanentAddress || "",
          postalAddress: formData.nominee.postalAddress || null,
        },
      });
    }

    revalidatePath("/features/clients");
    return serializeData({ success: true, client: updatedClient });
  } catch (error) {
    console.error("Error updating client:", error);
    return { success: false, error: "Failed to update client" };
  }
}

// Delete client
export async function deleteClient(nic: string) {
  try {
    const res = await prisma.client.delete({
      where: { nic },
    });

    revalidatePath("/features/clients");
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
    paymentSlip?: string;
    proposal?: string;
    agreement?: string;
  }
) {
  if (!clientId) return { success: false, error: "Client ID is required" };

  try {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        idFront: data.idFront ?? undefined,
        idBack: data.idBack ?? undefined,
        paymentSlip: data.paymentSlip ?? undefined,
        proposal: data.proposal ?? undefined,
        agreement: data.agreement ?? undefined,
      },
    });

    revalidatePath("/features/clients");
    revalidatePath(`/features/clients/${clientId}`);
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

    revalidatePath("/features/clients");
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
    paymentSlip?: string;
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
        paymentSlip: urls.paymentSlip ?? undefined,
        signature: urls.signature ?? undefined,
      },
    }),
    prisma.clientDocumentRequest.update({
      where: { token },
      data: { used: true },
    }),
  ]);

  return { success: true };
}

