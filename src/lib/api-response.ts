/**
 * api-response.ts
 *
 * Shared helpers for building consistent JSON responses across all API routes.
 * Every route should use these instead of inlining NextResponse.json().
 */

import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string, details?: unknown): NextResponse {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status: 400 });
}

export function unauthorized(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found"): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function tooManyRequests(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 429 });
}

export function serverError(message = "Internal server error"): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function badGateway(message = "Payment gateway unavailable. Please try again."): NextResponse {
  return NextResponse.json({ error: message }, { status: 502 });
}

/**
 * Wraps an async route handler with standard UNAUTHORIZED / FORBIDDEN error
 * handling so individual routes don't need to repeat this boilerplate.
 */
export async function withErrorHandling(
  handler: () => Promise<NextResponse>,
  context?: string
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") return unauthorized();
      if (err.message === "FORBIDDEN") return forbidden();
    }
    console.error(`[${context ?? "API"}] Unhandled error:`, err);
    return serverError();
  }
}
