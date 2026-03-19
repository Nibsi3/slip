import { NextResponse } from "next/server";

let cachedBanks: { name: string; code: string }[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchSABanks(): Promise<{ name: string; code: string }[]> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY not set");
  const res = await fetch("https://api.paystack.co/bank?country=south_africa&perPage=100", {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) throw new Error(`Paystack banks fetch failed: ${res.status}`);
  const json = await res.json();
  return (json.data as { name: string; code: string }[]) || [];
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedBanks && now - cacheTime < CACHE_TTL_MS) {
      return NextResponse.json({ banks: cachedBanks });
    }

    const banks = await fetchSABanks();
    if (banks.length > 0) {
      cachedBanks = banks;
      cacheTime = now;
    }

    return NextResponse.json({ banks: banks.length > 0 ? banks : cachedBanks || [] });
  } catch (err) {
    console.error("List banks error:", err);
    return NextResponse.json({ banks: [] }, { status: 500 });
  }
}
