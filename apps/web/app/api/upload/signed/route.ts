import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client } from "@/lib/r2Client";

export const dynamic = "force-dynamic";

function extractKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Strip leading slash
    return parsed.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  const key = extractKeyFromUrl(url);
  if (!key) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  if (!bucketName) {
    return NextResponse.json({ error: "R2 not configured" }, { status: 500 });
  }

  try {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 120 });
    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error("Failed to generate signed GET URL:", error);
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}
