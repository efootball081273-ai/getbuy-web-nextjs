import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCloudinarySignature, hasSupportedImageSignature } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

const maxImageSize = 4 * 1024 * 1024;
const uploadFolder = "getbuy/products";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
    : new URL(request.url).origin;
  if (!origin || origin !== expectedOrigin) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const admin = await prisma.user.findFirst({
    where: { id: session.user.id, role: "ADMIN", isActive: true },
    select: { id: true },
  });
  if (!admin) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Image storage is not configured" }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "A valid image upload is required" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > maxImageSize) {
    return NextResponse.json({ error: "Choose an image smaller than 4 MB" }, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasSupportedImageSignature(file.type, bytes)) {
    return NextResponse.json({ error: "Only valid JPEG, PNG, and WebP images are supported" }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = randomUUID();
  const parameters = `folder=${uploadFolder}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createCloudinarySignature(parameters, apiSecret);
  const uploadData = new FormData();
  uploadData.append("file", file);
  uploadData.append("api_key", apiKey);
  uploadData.append("folder", uploadFolder);
  uploadData.append("public_id", publicId);
  uploadData.append("timestamp", String(timestamp));
  uploadData.append("signature", signature);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
      { method: "POST", body: uploadData, cache: "no-store" },
    );
    const result = await response.json() as {
      secure_url?: unknown;
      error?: { message?: string };
    };
    if (!response.ok || typeof result.secure_url !== "string") {
      console.error("Cloudinary image upload failed", {
        status: response.status,
        message: result.error?.message,
      });
      return NextResponse.json({ error: "Image upload failed" }, { status: 502 });
    }

    const secureUrl = new URL(result.secure_url);
    if (secureUrl.protocol !== "https:" || secureUrl.hostname !== "res.cloudinary.com") {
      console.error("Cloudinary returned an unexpected image URL");
      return NextResponse.json({ error: "Image storage returned an invalid URL" }, { status: 502 });
    }
    return NextResponse.json({ url: secureUrl.toString() });
  } catch (error) {
    console.error("Cloudinary image upload request failed", error);
    return NextResponse.json({ error: "Image storage is temporarily unavailable" }, { status: 502 });
  }
}
