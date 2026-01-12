import { NextResponse } from "next/server";
import { prisma } from "../../utils/prisma";

export async function GET() {
  try {
    const res = await prisma.branch.findMany({
      include: {
        members: true, // <-- include related members foregin key data
      },
    });

    return NextResponse.json({ message: "Branch fetch success", res });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    
    const data = await request.json();
    const newBranch = await prisma.branch.create({
      data: {
        name: data.name,
        location: data.location,
      },
    })

    return NextResponse.json({message: "Branch created successfully", newBranch});
  } catch (error) {
    return NextResponse.json({error})
  }
}