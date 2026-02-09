// app/api/src/clients/[id]/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;
    const clientId = Number(id);
    const data = await req.json();
    console.log(clientId);

    // Only update document fields
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        idFront: data.idFront ?? undefined,
        idBack: data.idBack ?? undefined,
        proposal: data.proposal ?? undefined,
        agreement: data.agreement ?? undefined,
      },
    });

    return NextResponse.json({
      message: "Documents updated successfully",
      client: updatedClient,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update documents" },
      { status: 500 },
    );
  }
}
