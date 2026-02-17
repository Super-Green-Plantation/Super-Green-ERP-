"use server"

import { v2 as cloudinary } from "cloudinary";
import { serializeData } from "@/app/utils/serializers";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getCloudinarySignature() {
  try {
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: "compliance-docs",
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return {
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    };
  } catch (err) {
    console.error("Cloudinary signature failed:", err);
    throw new Error("Failed to generate upload signature");
  }
}

export async function uploadClientSignature(dataUrl: string) {
  if (!dataUrl) {
    throw new Error("No image data provided");
  }

  try {
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: "client-signatures",
      resource_type: "image",
    });

    return serializeData({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error("Signature upload failed:", err);
    throw new Error("Failed to upload signature");
  }
}

export async function uploadDocument(formData: FormData) {
  const file = formData.get("file") as Blob;
  if (!file) {
    throw new Error("No file provided");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "compliance-docs" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    return serializeData(result);
  } catch (err) {
    console.error("Document upload failed:", err);
    throw new Error("Failed to upload document");
  }
}
