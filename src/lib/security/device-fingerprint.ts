/**
 * Device Fingerprinting Module
 * Collects and analyzes device fingerprints to detect fraud patterns.
 */

import crypto from "crypto";
import { db } from "@/lib/db";
import {
  SAME_DEVICE_WINDOW_HOURS,
  SAME_IP_WINDOW_HOURS,
} from "./constants";

export interface DeviceFingerprintData {
  userAgent?: string;
  platform?: string;
  screenRes?: string;
  timezone?: string;
  language?: string;
  ipAddress?: string;
  workerId?: string;
  tipperSessionId?: string;
}

/**
 * Generate a deterministic hash from device characteristics.
 */
export function generateFingerprintHash(data: DeviceFingerprintData): string {
  const raw = [
    data.userAgent || "",
    data.platform || "",
    data.screenRes || "",
    data.timezone || "",
    data.language || "",
  ].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Record a device fingerprint in the database.
 */
export async function recordFingerprint(data: DeviceFingerprintData): Promise<string> {
  const fingerprintHash = generateFingerprintHash(data);

  await db.deviceFingerprint.create({
    data: {
      fingerprintHash,
      userAgent: data.userAgent,
      platform: data.platform,
      screenRes: data.screenRes,
      timezone: data.timezone,
      language: data.language,
      ipAddress: data.ipAddress,
      workerId: data.workerId,
      tipperSessionId: data.tipperSessionId,
    },
  });

  return fingerprintHash;
}

/**
 * Extract device fingerprint data from a request's headers and body.
 */
export function extractFingerprintFromRequest(
  headers: Headers,
  body?: Record<string, unknown>
): DeviceFingerprintData {
  return {
    userAgent: headers.get("user-agent") || undefined,
    platform: (body?.platform as string) || undefined,
    screenRes: (body?.screenRes as string) || undefined,
    timezone: (body?.timezone as string) || undefined,
    language: headers.get("accept-language")?.split(",")[0] || undefined,
    ipAddress: headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               headers.get("x-real-ip") || undefined,
  };
}

/**
 * Detect if the same device fingerprint has been used by a different worker (recipient).
 * Returns the list of other worker IDs sharing the same device.
 */
export async function detectSameDeviceWorkers(
  fingerprintHash: string,
  currentWorkerId?: string
): Promise<string[]> {
  const since = new Date(Date.now() - SAME_DEVICE_WINDOW_HOURS * 60 * 60 * 1000);

  const records = await db.deviceFingerprint.findMany({
    where: {
      fingerprintHash,
      createdAt: { gte: since },
      workerId: { not: null },
    },
    select: { workerId: true },
    distinct: ["workerId"],
  });

  return records
    .map((r) => r.workerId!)
    .filter((id) => id !== currentWorkerId);
}

/**
 * Detect if the same IP address has been used by both a tipper and a recipient.
 * This is a strong fraud signal (self-tipping).
 */
export async function detectSameIPTipperRecipient(
  ipAddress: string,
  workerId: string
): Promise<boolean> {
  const since = new Date(Date.now() - SAME_IP_WINDOW_HOURS * 60 * 60 * 1000);

  // Check if this IP was used by the worker (recipient) in any fingerprint
  const workerUsedIP = await db.deviceFingerprint.findFirst({
    where: {
      ipAddress,
      workerId,
      createdAt: { gte: since },
    },
  });

  // Check if this IP was used by a tipper (no workerId, has tipperSessionId)
  const tipperUsedIP = await db.deviceFingerprint.findFirst({
    where: {
      ipAddress,
      workerId: null,
      tipperSessionId: { not: null },
      createdAt: { gte: since },
    },
  });

  return !!(workerUsedIP && tipperUsedIP);
}

/**
 * Count how many distinct accounts have used the same device.
 */
export async function countAccountsOnDevice(fingerprintHash: string): Promise<number> {
  const records = await db.deviceFingerprint.findMany({
    where: {
      fingerprintHash,
      workerId: { not: null },
    },
    select: { workerId: true },
    distinct: ["workerId"],
  });

  return records.length;
}
