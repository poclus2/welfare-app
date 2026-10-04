import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isTokenExpired } from "@/lib/session";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  const { pathname } = request.nextUrl;

  // Allow login page, static assets and the auth routes (login/logout/session) always
  if (pathname === "/login" || pathname.startsWith("/_next") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api");
  const expired = !!token && isTokenExpired(token);

  // No session, or the session has expired: drop the stale cookie and send the admin back to login
  if (!token || expired) {
    if (isApi) {
      const res = NextResponse.json({ error: "Session expirée" }, { status: 401 });
      if (expired) res.cookies.delete("admin_token");
      return res;
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    if (expired) loginUrl.searchParams.set("expired", "1");
    const res = NextResponse.redirect(loginUrl);
    if (expired) res.cookies.delete("admin_token");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
