import { NextRequest } from "next/server";

// GET ?src=<product image url> — the same image, from this site's own origin. The PDF of the diagnostic is
// drawn in the browser, which may only read images of its own origin (the API's /static files carry no
// CORS header). Only the catalogue images of the store's API are relayed, nothing else.

const API = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://api.thewelfarecm.com").replace(/\/$/, "");
const ALLOWED = [`${API}/static/`, "https://api.thewelfarecm.com/static/"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src") || "";
  if (!ALLOWED.some((prefix) => src.startsWith(prefix)) || src.includes("..")) {
    return new Response("Not allowed", { status: 400 });
  }
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(15_000) });
    const type = res.headers.get("content-type") || "";
    if (!res.ok || !type.startsWith("image/")) return new Response("Not found", { status: 404 });
    const body = Buffer.from(await res.arrayBuffer());
    if (body.length > MAX_BYTES) return new Response("Too large", { status: 413 });
    return new Response(new Uint8Array(body), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return new Response("Unavailable", { status: 502 });
  }
}
