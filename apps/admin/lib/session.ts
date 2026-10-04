// Edge-safe helpers (no Node APIs): used by middleware and the auth routes.

/** Reads the `exp` claim (seconds since epoch) of a JWT without verifying it. */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = JSON.parse(json).exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

/** True when the token is malformed or its expiry has passed. The backend still has the final say. */
export function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiry(token);
  return exp === null || exp * 1000 <= Date.now();
}
