import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "FATAL: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY must be set for document storage."
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("FATAL: R2_BUCKET_NAME environment variable is not set.");
  return bucket;
}

export interface UploadResult {
  key: string;
}

/**
 * Upload a document Buffer to Cloudflare R2.
 * Returns the object key (not a public URL).
 */
export async function uploadDocument(
  workerId: string,
  prefix: string,
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  const client = getR2Client();
  const bucket = getBucket();
  const ext = filename.split(".").pop()?.toLowerCase() || "bin";
  const key = `documents/${workerId}/${prefix}-${randomUUID()}.${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: "AES256",
      Metadata: {
        workerId,
        uploadedAt: new Date().toISOString(),
      },
    })
  );

  return { key };
}

/**
 * Generate a pre-signed URL for a private document (15-minute expiry).
 * Use this to serve documents to authenticated users only.
 */
export async function getSignedDocumentUrl(key: string, expiresInSeconds = 900): Promise<string> {
  const client = getR2Client();
  const bucket = getBucket();

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Delete a document from R2 by its key.
 */
export async function deleteDocument(key: string): Promise<void> {
  const client = getR2Client();
  const bucket = getBucket();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/**
 * Detect MIME type from file extension.
 */
export function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    pdf: "application/pdf",
    webp: "image/webp",
    heic: "image/heic",
  };
  return map[ext || ""] || "application/octet-stream";
}
