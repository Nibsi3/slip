/**
 * CSRF protection using the double-submit cookie pattern.
 *
 * How it works:
 * 1. GET /api/auth/csrf → generates a random token, sets it as an httpOnly cookie
 *    AND returns it in the JSON response.
 * 2. Client stores the token and sends it as `x-csrf-token` header on POST/PATCH/DELETE.
 * 3. Server middleware compares the header value to the cookie value.
 *
 * Combined with sameSite: lax cookies, this provides robust CSRF protection.
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";
const TOKEN_LENGTH = 32;

/**
 * Generate a new CSRF token and set it as a cookie.
 */
export async function generateCsrfToken(): Promise<string> {
  const token = crypto.randomBytes(TOKEN_LENGTH).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return token;
}

/**
 * Validate the CSRF token from the request header against the cookie.
 * Returns null if valid, or a NextResponse with an error if invalid.
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) {
    return NextResponse.json(
      { error: "CSRF token missing. Please refresh the page and try again." },
      { status: 403 }
    );
  }

  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    return NextResponse.json(
      { error: "CSRF token mismatch. Please refresh the page and try again." },
      { status: 403 }
    );
  }

  return null; // valid
}
