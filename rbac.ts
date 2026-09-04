import { Role } from "@prisma/client";
import type { SessionUser } from "./session";

// Role hierarchy for simple "at least this level" checks.
const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  PRO: 1,
  ORG_ADMIN: 2,
  SUPER_ADMIN: 3,
};

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Every protected route/action must call this with the SessionUser derived
 * from the server-verified session (see session.ts) — NEVER with a role or
 * user id read from request body/query/headers, all of which are
 * attacker-controlled.
 */
export function requireRole(user: SessionUser | null, minRole: Role): SessionUser {
  if (!user) throw new UnauthorizedError();
  if (ROLE_RANK[user.role] < ROLE_RANK[minRole]) throw new ForbiddenError();
  return user;
}

export function requireSelfOrAdmin(
  user: SessionUser | null,
  resourceOwnerUserId: string
): SessionUser {
  if (!user) throw new UnauthorizedError();
  if (user.id === resourceOwnerUserId) return user;
  if (ROLE_RANK[user.role] >= ROLE_RANK.SUPER_ADMIN) return user;
  throw new ForbiddenError();
}

/**
 * Org-scoped check: confirms the user has at least `minRole` *within that
 * specific organization*, via a fresh DB read of Membership — never via a
 * role claim passed from the client.
 */
export async function requireOrgRole(
  db: { membership: { findUnique: (args: any) => Promise<{ role: Role } | null> } },
  user: SessionUser | null,
  organizationId: string,
  minRole: Role
): Promise<SessionUser> {
  if (!user) throw new UnauthorizedError();
  if (user.role === "SUPER_ADMIN") return user;

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
  });
  if (!membership || ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw new ForbiddenError();
  }
  return user;
}
