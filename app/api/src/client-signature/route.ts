// app/api/upload-signature/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  const { dataUrl } = await req.json();

  if (!dataUrl) {
    return NextResponse.json({ error: "No image" }, { status: 400 });
  }

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: "client-signatures",
    resource_type: "image",
  });

  return NextResponse.json({
    url: result.secure_url,
    public_id: result.public_id,
  });
}
