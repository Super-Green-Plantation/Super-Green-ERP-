// app/api/src/clients/[id]/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { field } = await req.json();
    const { id } =await params;

    //  whitelist allowed fields
    const allowedFields = [
      "idFront",
      "idBack",
      "signature",
      "proposal",
      "agreement",
    ];

    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        { error: "Invalid document field" },
        { status: 400 }
      );
    }

    const updatedClient = await prisma.client.update({
      where: { nic: id },
      data: {
        [field]: null, //  set null
      },
    });

    return NextResponse.json({
      success: true,
      field,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
