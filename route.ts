import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { logAudit, getClientIp } from "@/lib/security/audit";
import { randomBytes, createHash } from "crypto";

// Always returns the same generic response whether or not the email exists —
// this is the standard mitigation for account-enumeration via password reset.
const GENERIC_RESPONSE = NextResponse.json({
  message: "If an account exists for that email, a reset link has been sent.",
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await rateLimit(`forgot-password:${ip}`, RATE_LIMITS.forgotPassword.limit, RATE_LIMITS.forgotPassword.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return GENERIC_RESPONSE;
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return GENERIC_RESPONSE;

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const rawToken = randomBytes(32).toString("base64url");
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash("sha256").update(rawToken).digest("hex"),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });
    // TODO(email-provider): email a link containing rawToken. Never log it.
    await logAudit({ action: "PASSWORD_RESET_REQUEST", actorUserId: user.id, ipAddress: ip });
  }

  return GENERIC_RESPONSE;
}
