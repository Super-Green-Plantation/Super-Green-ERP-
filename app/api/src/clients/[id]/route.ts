import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

//get [id] client
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const client = await prisma.client.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        investments: { include: { plan: true } },
        branch: true,
        nominee: true,
        beneficiary: true,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ messsage: "Failed to get client" });
  }
}

//update [id] client
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const data = await req.json();
  const { id } = await params;
  const clientId = Number(id);

  console.log(data);

  // 1️⃣ Update applicant info
  const updatedClient = await prisma.client.update({
    where: { id: clientId },
    data: {
      fullName: data.formData.applicant.fullName,
      nic: data.formData.applicant.nic || null,
      email: data.formData.applicant.email || null,
      phoneMobile: data.formData.applicant.phoneMobile || null,
      occupation: data.formData.applicant.occupation || null,
      address: data.formData.applicant.address || null,
      drivingLicense: data.formData.applicant.drivingLicense || null,
      passportNo: data.formData.applicant.passportNo || null,
      phoneLand: data.formData.applicant.phoneLand || null,
      investmentAmount:
        Number(data.formData.applicant.investmentAmount) || undefined,
      dateOfBirth: data.formData.applicant.dateOfBirth || null,
      branchId: Number(data.formData.applicant.branchId) || undefined,
    },
  });

  // 2️⃣ Upsert investment info
  const existingInvestment = await prisma.investment.findFirst({
    where: { clientId },
  });

  if (existingInvestment) {
    await prisma.investment.update({
      where: { id: existingInvestment.id },
      data: {
        planId: data.formData.investment?.planId
          ? Number(data.formData.investment.planId)
          : existingInvestment.planId,
        amount:
          Number(data.formData.applicant.investmentAmount) ??
          Number(existingInvestment.amount),
      },
    });
  } else if (data.formData.investment?.planId) {
    await prisma.investment.create({
      data: {
        clientId,
        planId: Number(data.formData.investment.planId),
        investmentDate: new Date(), // required
        amount: data.formData.applicant.investmentAmount, // required
      },
    });
  }

  // 3️⃣ Upsert beneficiary info
  if (data.formData.beneficiary?.fullName) {
    await prisma.beneficiary.upsert({
      where: { clientId },
      update: {
        fullName: data.formData.beneficiary.fullName,
        relationship: data.formData.beneficiary.relationship || null,
        bankName: data.formData.beneficiary.bankName || null,
        accountNo: data.formData.beneficiary.accountNo || null,
        bankBranch: data.formData.beneficiary.bankBranch || null,
        nic: data.formData.beneficiary.nic || null,
        phone: data.formData.beneficiary.phone || null,
      },
      create: {
        clientId,
        fullName: data.formData.beneficiary.fullName,
        relationship: data.formData.beneficiary.relationship || null,
        bankName: data.formData.beneficiary.bankName || null,
        accountNo: data.formData.beneficiary.accountNo || null,
        bankBranch: data.formData.beneficiary.bankBranch || null,
        nic: data.formData.beneficiary.nic || null,
        phone: data.formData.beneficiary.phone || null,
      },
    });
  }

  // 4️⃣ Upsert nominee info
  if (data.formData.nominee?.fullName) {
    await prisma.nominee.upsert({
      where: { clientId },
      update: {
        fullName: data.formData.nominee.fullName,
        permanentAddress: data.formData.nominee.permanentAddress || null,
        postalAddress: data.formData.nominee.postalAddress || null,
      },
      create: {
        clientId,
        fullName: data.formData.nominee.fullName,
        permanentAddress: data.formData.nominee.permanentAddress || null,
        postalAddress: data.formData.nominee.postalAddress || null,
      },
    });
  }

  return NextResponse.json({
    message: "Client data updated successfully",
    client: updatedClient,
  });
}

//delete [id] client
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const nic = id;
  console.log(id);
  const res = await prisma.client.delete({
    where: { nic: nic },
  });
  return NextResponse.json(res);
}
