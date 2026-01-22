import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

//create
export async function POST(req: Request) {
  const body = await req.json();

  // Check required fields
  const {applicant} = body.data;
  const {investment} = body.data;
  
  if (!applicant.fullName || !applicant.address || !applicant.branchId ) {
    return new Response(
      JSON.stringify({ message: "Missing required fields: fullName, address, branchId" }),
      { status: 400 }
    );
  }

  try {
    const client = await prisma.$transaction(async (prisma) => {
      // Create Client
      const createdClient = await prisma.client.create({
        data: {
          fullName: applicant.fullName,
          nic: applicant.nic || null,
          drivingLicense: applicant.drivingLicense || null,
          passportNo: applicant.passportNo || null,
          email: applicant.email || null,
          phoneMobile: applicant.phoneMobile || null,
          phoneLand: applicant.phoneLand || null,
          dateOfBirth: applicant.dateOfBirth
            ? new Date(applicant.dateOfBirth)
            : null,
          occupation: applicant.occupation || null,
          address: applicant.address,
          branchId: applicant.branchId,
          investments:{
            create:[{
              planId: investment.planId,
              investmentDate: new Date || "",
              amount: 0,
              rate: 0,
              returnFrequency: "Monthly"
            }]
          }
        },
      });

      // Create Beneficiary if exists
      if (body.beneficiary) {
        await prisma.beneficiary.create({
          data: {
            ...body.beneficiary,
            clientId: createdClient.id,
          },
        });
      }

      // Create Nominee if exists
      if (body.nominee) {
        await prisma.nominee.create({
          data: {
            ...body.nominee,
            clientId: createdClient.id,
          },
        });
      }

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