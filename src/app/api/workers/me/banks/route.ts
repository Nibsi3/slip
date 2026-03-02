import { NextResponse } from "next/server";
import { listBanks } from "@/lib/paystack";

let cachedBanks: { name: string; code: string }[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    const now = Date.now();
    if (cachedBanks && now - cacheTime < CACHE_TTL_MS) {
      return NextResponse.json({ banks: cachedBanks });
    }

    const banks = await listBanks();
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
