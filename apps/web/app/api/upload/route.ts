import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client } from "@/lib/r2Client";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const uploadRequestSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  size: z.number(),
});

function generateUniqueKey(filename: string): string {
  return `${uuidv4()}-${filename}`;
}

function constructCloudflareR2Url(
  key: string,
  bucketId: string,
  customDomain?: string,
): string {
  // Ensure the key is URL-safe (encodes spaces, special chars)
  const encodedKey = key.split('/').map(part => encodeURIComponent(part)).join('/');
  
  if (customDomain) {
    let domain = customDomain.endsWith("/")
      ? customDomain.slice(0, -1)
      : customDomain;
    
    if (!domain.startsWith("http://") && !domain.startsWith("https://")) {
      domain = `https://${domain}`;
    }
    return `${domain}/${encodedKey}`;
  }

  const cleanBucketId = bucketId.trim();
  return `https://pub-${cleanBucketId}.r2.dev/${encodedKey}`;
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const bucketId = process.env.CLOUDFLARE_R2_BUCKET_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;

    if (!bucketName || !bucketId || !accessKeyId || !secretAccessKey || !endpoint) {
      console.error("Missing required Cloudflare R2 environment variables");
      return NextResponse.json({ error: "R2 storage is not configured" }, { status: 500 });
    }

    const body = await request.json();
    const validation = uploadRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error },
        { status: 400 }
      );
    }

    const { filename, contentType, size } = validation.data;

    // Validate file size (50MB max)
    if (size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 });
    }

    const uniqueKey = generateUniqueKey(filename);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueKey,
      ContentType: contentType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || process.env.CLOUDFLARE_R2_PUBLIC_URL;
    const publicUrl = constructCloudflareR2Url(uniqueKey, bucketId, publicDomain);

    return NextResponse.json({ presignedUrl, key: uniqueKey, publicUrl });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
