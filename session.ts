import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

// Design notes:
// - The cookie holds an opaque, high-entropy random token. We never store
//   that raw token server-side — only its SHA-256 hash — so a DB read
//   (backup leak, replica dump, etc.) cannot be replayed as a live session.
// - Sessions are server-side records, so "log out everywhere" and admin-
//   forced revocation are real operations, not just "delete the cookie".
// - Cookie is HttpOnly (no JS access -> mitigates XSS token theft),
//   SameSite=Lax (CSRF mitigation for top-level navigation), Secure in prod.

const SESSION_COOKIE_NAME = "pp_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_ABSOLUTE_MAX_MS = 90 * 24 * 60 * 60 * 1000; // hard cap even with activity

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  sessionId: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(params: {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.session.create({
    data: {
      userId: params.userId,
      tokenHash,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      expiresAt,
    },
  });

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Reads and validates the current session. Returns null for any invalid,
 * expired, or revoked session — callers must treat null as "unauthenticated"
 * and never assume presence of a cookie implies a valid session.
 */
export async function getCurrentSession(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await db.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.revokedAt) return null;
  if (session.expiresAt < new Date()) return null;
  if (
    session.createdAt.getTime() + SESSION_ABSOLUTE_MAX_MS <
    Date.now()
  ) {
    return null;
  }
  if (session.user.isSuspended) return null;

  // Sliding activity timestamp — cheap enough at session-read time; consider
  // debouncing (e.g. only update if >5 min stale) under real load.
  if (Date.now() - session.lastActiveAt.getTime() > 5 * 60 * 1000) {
    await db.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    sessionId: session.id,
  };
}

export async function revokeCurrentSession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await db.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  cookies().delete(SESSION_COOKIE_NAME);
}

/** Revoke every session for a user — "log out all devices" and admin force-logout. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
