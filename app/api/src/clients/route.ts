import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Create client with investment, beneficiary, and nominee
export async function POST(req: Request) {
  const body = await req.json();

  const { applicant, investment, beneficiary, nominee } = body.data;

  // Validate required fields
  if (!applicant.fullName || !applicant.address || !applicant.branchId) {
    return new Response(
      JSON.stringify({ message: "Missing required fields: fullName, address, branchId" }),
      { status: 400 }
    );
  }

  try {
    const client = await prisma.$transaction(async (prisma:any) => {
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
          // Nested create for investments, beneficiary, and nominee
          investments: {
            create: [
              {
                planId: investment.planId,
                investmentDate: new Date(),
                amount: 0,
                rate: 0,
                returnFrequency: "Monthly",
              },
            ],
            
          },
          beneficiary: beneficiary
            ? {
                create: {
                  fullName: beneficiary.fullName,
                  nic: beneficiary.nic || null,
                  phone: beneficiary.phone || null,
                  bankName: beneficiary.bankName || null,
                  bankBranch: beneficiary.bankBranch || null,
                  accountNo: beneficiary.accountNo || null,
                  relationship: beneficiary.relationship || null,
                },
              }
            : undefined,
          nominee: nominee
            ? {
                create: {
                  fullName: nominee.fullName,
                  permanentAddress: nominee.permanentAddress || null,
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

    return new Response(JSON.stringify(client), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
  }
}


//get all clients
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include:{
        beneficiary:true,
        nominee:true,
        investments:true,
        branch:true
      }
    });
    return NextResponse.json({clients})
    
  } catch (error) {
    return NextResponse.json({message:"Failed to get clients",error})
  }
}