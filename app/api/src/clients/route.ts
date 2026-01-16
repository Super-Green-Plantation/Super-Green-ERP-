import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  
  try {
    const client = await prisma.$transaction(async (prisma) => {
      // Create client (Applicant)
      const createdClient = await prisma.client.create({
        data: {
          fullName: body.fullName,
          nic: body.nic,
          drivingLicense: body.drivingLicense,
          passportNo: body.passportNo,
          email: body.email,
          phoneMobile: body.phoneMobile,
          phoneLand: body.phoneLand,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          occupation: body.occupation,
          address: body.address,
          branchId: body.branchId,
        }
      });

      // Beneficiary
      if (body.beneficiary) {
        await prisma.beneficiary.create({
          data: {
            clientId: createdClient.id,
            ...body.beneficiary
          }
        });
      }

      // Nominee
      if (body.nominee) {
        await prisma.nominee.create({
          data: {
            clientId: createdClient.id,
            ...body.nominee
          }
        });
      }

      // Investments
      if (body.investments?.length) {
        await prisma.investment.createMany({
          data: body.investments.map(inv => ({
            clientId: createdClient.id,
            investmentDate: inv.investmentDate ? new Date(inv.investmentDate) : null,   
            amount: inv.amount,
            rate: inv.rate,
            returnFrequency: inv.returnFrequency,
            planId: inv.planId || null,
          }))
        });
      }

      return createdClient;
    });

    return new Response(JSON.stringify(client), { status: 201 });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ message: error.message }), { status: 400 });
  }
}
