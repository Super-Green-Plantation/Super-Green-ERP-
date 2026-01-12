import { NextResponse } from "next/server";
import { prisma } from "../../utils/prisma";

export async function GET() {
  try {
    const res = await prisma.branch.findMany({
      include: {
        members: true, // <-- include related members
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
