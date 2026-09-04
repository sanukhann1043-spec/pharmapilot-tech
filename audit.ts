import { db } from "@/lib/db";
import type { AuditAction, SecurityEventType, SecurityEventSeverity } from "@prisma/client";

/** Business-relevant, attributable actions (login, role change, deletion...). */
export async function logAudit(params: {
  action: AuditAction;
  actorUserId?: string;
  targetUserId?: string;
  organizationId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.auditLog.create({
    data: {
      action: params.action,
      actorUserId: params.actorUserId,
      targetUserId: params.targetUserId,
      organizationId: params.organizationId,
      ipAddress: params.ipAddress,
      metadata: params.metadata,
    },
  });
}

/** Suspicious / anomalous events (failed logins, rate limit hits, IDOR attempts...). */
export async function logSecurityEvent(params: {
  type: SecurityEventType;
  severity?: SecurityEventSeverity;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  await db.securityEvent.create({
    data: {
      type: params.type,
      severity: params.severity ?? "LOW",
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      details: params.details,
    },
  });
}

/** Extracts a best-effort client IP from standard proxy headers (Replit/Vercel sit behind one). */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
