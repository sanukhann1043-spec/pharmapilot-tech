import { NextRequest, NextResponse } from "next/server";

// Middleware runs on the Edge runtime, where Prisma cannot run directly.
// So this layer does a *cheap* presence-of-cookie check only, as a first
// line of defense (fast redirect for the common case). The REAL
// authorization check — validating the session against the database and
// checking role/ownership — happens in every API route and server
// component via getCurrentSession()/requireRole(). Never rely on
// middleware alone for authorization decisions.

const PROTECTED_PREFIXES = ["/dashboard", "/ai-tools", "/settings", "/billing"];
const ADMIN_PREFIX = "/admin";
const SESSION_COOKIE_NAME = "pp_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSessionCookie = req.cookies.has(SESSION_COOKIE_NAME);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdmin = pathname.startsWith(ADMIN_PREFIX);

  if ((isProtected || isAdmin) && !hasSessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin role itself is verified server-side in the /admin layout via
  // requireRole(session, "SUPER_ADMIN") — middleware cannot see the role
  // without a DB call, and we deliberately don't put role claims in the
  // cookie payload to avoid ever trusting a client-readable role.

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/ai-tools/:path*", "/settings/:path*", "/billing/:path*", "/admin/:path*"],
};
