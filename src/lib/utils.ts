import { Decimal } from "@prisma/client/runtime/library";

export function formatZAR(amount: number | Decimal | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(num);
}

export function generatePaymentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `TIP-${timestamp}-${random}`.toUpperCase();
}

export function calculateFees(amount: number) {
  const totalFeeCapRate = 0.10;
  // Stitch Express fee: ~2.9% + R1.00 flat
  const gatewayFeeRate = 0.029;
  const gatewayFeeFixed = 1.0;

  const feeGateway = Math.round((amount * gatewayFeeRate + gatewayFeeFixed) * 100) / 100;
  const totalFeeCap = Math.round(amount * totalFeeCapRate * 100) / 100;

  // Platform earns the remainder up to the 10% total cap (gateway fee deducted first)
  const feePlatform = Math.max(0, Math.round((totalFeeCap - feeGateway) * 100) / 100);
  const netAmount = Math.round((amount - feeGateway - feePlatform) * 100) / 100;

  return { feePlatform, feeGateway, netAmount: Math.max(netAmount, 0) };
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export const TIP_AMOUNTS = [15, 20, 50, 100, 200];
export const MIN_TIP = 15;
export const MAX_TIP = 5000;
export const MIN_WITHDRAWAL = 100;
