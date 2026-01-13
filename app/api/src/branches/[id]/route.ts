import { prisma } from "../../utils/prisma";

export async function PUT(req:Request, { params }: { params: Promise<{ id: string }> }) {
    const body = await req.json();
    const {id} = await params;

     console.log(body);
     console.log(id);

     const res = await prisma.branch.update({
      where: { id: Number(id) },
      data: {
        name: body.name,
        location: body.location,
      },
     })

     if (res) {
       return new Response(JSON.stringify(res));
     }
    
  // Logic to update a branch by ID
  return new Response(`Update branch with ID:`);
}


export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> } // params is a Promise in Next.js App Router
) {
  const { id } = await params; // unwrap the promise

  try {
    const res = await prisma.branch.delete({
      where: { id: Number(id) },
    });

    return new Response(JSON.stringify(res), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ message: "Failed to delete branch", error: error.message }), { status: 500 });
  }
}
