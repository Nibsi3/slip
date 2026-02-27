import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "FATAL: JWT_SECRET environment variable is not set. " +
    "Generate one with: openssl rand -base64 32"
  );
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const protectedRoutes = ["/dashboard", "/admin"];
const authRoutes = ["/auth/login", "/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;

  let payload: { userId: string; role: string } | null = null;
  if (token) {
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload as { userId: string; role: string };
    } catch {
      payload = null;
    }
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route)) && payload) {
    if (payload.role === "ADMIN" || payload.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !payload) {
    return NextResponse.redirect(
      new URL(`/auth/login?redirect=${pathname}`, request.url)
    );
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!payload) {
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${pathname}`, request.url)
      );
    }
    if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/auth/:path*"],
};
