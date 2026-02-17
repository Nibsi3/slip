/**
 * IP Anomaly Detection Module
 * Tracks geolocation, detects VPN/proxy usage, and flags geo-jumps.
 */

import { db } from "@/lib/db";
import {
  GEO_JUMP_THRESHOLD_KM,
  GEO_JUMP_TIME_WINDOW_HOURS,
} from "./constants";

export interface IPAnalysis {
  ipAddress: string;
  isKnownProxy: boolean;
  isKnownVPN: boolean;
  geoCountry?: string;
  geoCity?: string;
  geoLat?: number;
  geoLon?: number;
  geoJumpDetected: boolean;
  geoJumpDistanceKm?: number;
  sameIPAsTipper: boolean;
  riskFactors: string[];
}

/**
 * Known VPN/proxy IP ranges and detection heuristics.
 * In production, integrate with a service like IPQualityScore, MaxMind, or ip-api.com.
 */
const KNOWN_PROXY_HEADERS = [
  "x-forwarded-for",
  "via",
  "x-proxy-id",
  "forwarded",
];

/**
 * Analyze an IP address for risk factors.
 */
export async function analyzeIP(
  ipAddress: string,
  workerId?: string,
  headers?: Headers
): Promise<IPAnalysis> {
  const riskFactors: string[] = [];
  let isKnownProxy = false;
  let isKnownVPN = false;
  let geoJumpDetected = false;
  let geoJumpDistanceKm: number | undefined;
  let sameIPAsTipper = false;

  // Detect proxy indicators from headers
  if (headers) {
    const forwardedFor = headers.get("x-forwarded-for");
    if (forwardedFor && forwardedFor.includes(",")) {
      // Multiple IPs in forwarded chain suggests proxy
      isKnownProxy = true;
      riskFactors.push("Multiple IPs in X-Forwarded-For chain");
    }

    const via = headers.get("via");
    if (via) {
      isKnownProxy = true;
      riskFactors.push("Via header present (proxy detected)");
    }
  }

  // Check for private/reserved IP ranges (shouldn't appear in production)
  if (isPrivateIP(ipAddress)) {
    riskFactors.push("Private/reserved IP address");
  }

  // Check for known datacenter/VPN IP patterns
  if (isDatacenterIP(ipAddress)) {
    isKnownVPN = true;
    riskFactors.push("IP matches known datacenter/VPN range");
  }

  // Geo-jump detection: check if this IP's location is far from the last known location
  if (workerId) {
    const geoJumpResult = await detectGeoJump(ipAddress, workerId);
    if (geoJumpResult.detected) {
      geoJumpDetected = true;
      geoJumpDistanceKm = geoJumpResult.distanceKm;
      riskFactors.push(`Geo-jump detected: ${geoJumpResult.distanceKm?.toFixed(0)}km in ${GEO_JUMP_TIME_WINDOW_HOURS}h`);
    }

    // Check if same IP was used by a tipper targeting this worker
    const tipperMatch = await db.deviceFingerprint.findFirst({
      where: {
        ipAddress,
        workerId: null,
        tipperSessionId: { not: null },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (tipperMatch) {
      sameIPAsTipper = true;
      riskFactors.push("Same IP used by tipper and recipient");
    }
  }

  return {
    ipAddress,
    isKnownProxy,
    isKnownVPN,
    geoJumpDetected,
    geoJumpDistanceKm,
    sameIPAsTipper,
    riskFactors,
  };
}

/**
 * Detect if there's a geographic jump for a worker's IP usage.
 */
async function detectGeoJump(
  currentIP: string,
  workerId: string
): Promise<{ detected: boolean; distanceKm?: number }> {
  const since = new Date(Date.now() - GEO_JUMP_TIME_WINDOW_HOURS * 60 * 60 * 1000);

  // Get the most recent fingerprint with geo data for this worker
  const lastRecord = await db.deviceFingerprint.findFirst({
    where: {
      workerId,
      geoLat: { not: null },
      geoLon: { not: null },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!lastRecord || lastRecord.geoLat === null || lastRecord.geoLon === null) {
    return { detected: false };
  }

  // For current IP, we'd need geo lookup. In production, use MaxMind or ip-api.
  // For now, check if the IP changed significantly (different IP = potential jump)
  const currentGeo = await getIPGeoFromRecent(currentIP);
  if (!currentGeo) {
    return { detected: false };
  }

  const distance = haversineDistance(
    lastRecord.geoLat,
    lastRecord.geoLon,
    currentGeo.lat,
    currentGeo.lon
  );

  if (distance > GEO_JUMP_THRESHOLD_KM) {
    return { detected: true, distanceKm: distance };
  }

  return { detected: false, distanceKm: distance };
}

/**
 * Look up geo data from recent fingerprints for an IP.
 */
async function getIPGeoFromRecent(ipAddress: string): Promise<{ lat: number; lon: number } | null> {
  const record = await db.deviceFingerprint.findFirst({
    where: {
      ipAddress,
      geoLat: { not: null },
      geoLon: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  if (record && record.geoLat !== null && record.geoLon !== null) {
    return { lat: record.geoLat, lon: record.geoLon };
  }

  return null;
}

/**
 * Haversine formula to calculate distance between two coordinates in km.
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if an IP is in a private/reserved range.
 */
function isPrivateIP(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 127) return true;
  return false;
}

/**
 * Basic heuristic for datacenter/VPN IPs.
 * In production, use a proper IP intelligence service.
 */
function isDatacenterIP(ip: string): boolean {
  // Known datacenter ranges (simplified examples)
  const datacenterPrefixes = [
    "104.16.", "104.17.", "104.18.", "104.19.", "104.20.", // Cloudflare
    "34.0.", "34.1.", "35.186.", "35.190.", // GCP
    "52.0.", "54.0.", "18.0.", // AWS
    "40.74.", "40.76.", "40.78.", // Azure
  ];
  return datacenterPrefixes.some((prefix) => ip.startsWith(prefix));
}

/**
 * Check if an IP has been used by multiple workers recently.
 */
export async function countWorkersOnIP(ipAddress: string, hoursBack: number = 24): Promise<number> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const records = await db.deviceFingerprint.findMany({
    where: {
      ipAddress,
      workerId: { not: null },
      createdAt: { gte: since },
    },
    select: { workerId: true },
    distinct: ["workerId"],
  });

  return records.length;
}
