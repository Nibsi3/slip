import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "FATAL: JWT_SECRET environment variable is not set. " +
    "Generate one with: openssl rand -base64 32"
  );
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory session cache to avoid DB hit on every API call
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessionCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL = 30_000; // 30 seconds

export async function createToken(userId: string, role: string) {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function createSession(userId: string, role: string) {
  const token = await createToken(userId, role);
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.session.create({
    data: { userId, token, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // Check in-memory cache first
  const cached = sessionCache.get(token);
  if (cached && cached.expiresAt > Date.now() && cached.data) {
    return cached.data;
  }

  const session = await db.session.findUnique({
    where: { token },
    include: { user: { include: { worker: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.session.delete({ where: { id: session.id } });
    }
    sessionCache.delete(token);
    return null;
  }

  // Cache the result
  sessionCache.set(token, { data: session, expiresAt: Date.now() + CACHE_TTL });

  return session;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (token) {
    await db.session.deleteMany({ where: { token } });
    cookieStore.delete("session");
  }
}

export async function requireAuth(allowedRoles?: string[]) {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
