const COOKIE_NAME = "creator_code";
const MAX_AGE_DAYS = 30;

export function setCreatorCodeCookie(code: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(code)}; path=/; max-age=${MAX_AGE_DAYS * 24 * 60 * 60}; SameSite=Lax`;
}

export function getCreatorCodeCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function clearCreatorCodeCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
