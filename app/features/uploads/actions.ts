"use server"

import { v2 as cloudinary } from "cloudinary";
import { serializeData } from "@/app/utils/serializers";
import { createClient } from "@/lib/supabase/server";



export async function uploadClientSignature(dataUrl: string) {
  if (!dataUrl) throw new Error("No image data provided");

  try {
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");

    const supabase = await createClient();
    const path = `signatures/${Date.now()}-${crypto.randomUUID()}.png`;

    const { error } = await supabase.storage
      .from("kyc-documents")
      .upload(path, buffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw new Error(`Signature upload failed: ${error.message}`);

    const { data } = supabase.storage
      .from("kyc-documents")
      .getPublicUrl(path);

    return { url: data.publicUrl };
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
