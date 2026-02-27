import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";

/**
 * GET /api/auth/csrf — Generate a CSRF token.
 * Sets the token as an httpOnly cookie and returns it in the response
 * so the client can include it as x-csrf-token header on mutations.
 */
export async function GET() {
  try {
    const token = await generateCsrfToken();
    return NextResponse.json({ csrfToken: token });
  } catch (err) {
    console.error("CSRF token generation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
