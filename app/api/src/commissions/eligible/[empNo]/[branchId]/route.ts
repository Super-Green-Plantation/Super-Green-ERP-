import { getUpperMembers } from "@/app/api/src/utils/member";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ empNo: string; branchId: string }> },
) {
  const empNo = (await params).empNo;
  const branchId = Number((await params).branchId);

  try {
    const upperMember = await getUpperMembers(empNo, branchId);

    return NextResponse.json({ upperMember });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to get employees by branch" },
      { status: 500 },
    );
  }
}
