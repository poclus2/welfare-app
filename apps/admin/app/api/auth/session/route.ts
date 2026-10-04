import { NextRequest, NextResponse } from "next/server";
import { isTokenExpired } from "@/lib/session";

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "https://api.thewelfarecm.com";

// Polled by the dashboard shell: 200 while the admin session is usable, 401 once it isn't
// (cookie missing, JWT past its expiry, or the backend no longer accepts the token).
export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;

  const reject = () => {
    const res = NextResponse.json({ authenticated: false }, { status: 401 });
    res.cookies.delete("admin_token");
    return res;
  };

  if (!token || isTokenExpired(token)) return reject();

  try {
    const probe = await fetch(`${MEDUSA_URL}/admin/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (probe.status === 401) return reject();
  } catch {
    // Backend unreachable: that's not a session problem, don't log the admin out for it
  }

  return NextResponse.json({ authenticated: true });
}
