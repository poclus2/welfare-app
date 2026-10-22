import { NextRequest } from "next/server";
import { SpeechError, speak } from "@/lib/coach-voice";
import { MAX_SCRIPT_CHARS, scriptIsAuthentic } from "@/lib/routine-audio";

// POST { script, sig } → the routine read aloud (mp3) in the coach's voice, through OpenRouter's speech endpoint.
// Only scripts signed by the analysis are read; each one is generated once and kept in memory, so
// listening again (or another tap) costs nothing.

const CACHE_MAX = 40; // ~0.5 MB each
const cache = new Map<string, Buffer>();
const inflight = new Map<string, Promise<Buffer | { error: string; status: number }>>();

// at most a few new generations per visitor and hour (cached ones don't count)
const RATE_MAX = 6;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

async function generate(script: string): Promise<Buffer | { error: string; status: number }> {
  const started = Date.now();
  try {
    // Gemini answers in 15 to 80 s for a whole message (measured 2026-10-22): a short timeout failed real ones
    const { mp3, generationIds } = await speak(script, 120_000);
    console.log(`[RoutineAudio] ${script.length} chars → ${mp3.length} bytes in ${Date.now() - started} ms (${generationIds})`);
    return mp3;
  } catch (e: any) {
    if (e instanceof SpeechError) {
      console.error(`[RoutineAudio] ${e.message}`);
      return { error: e.status === 402 ? "credits" : "provider", status: 502 };
    }
    console.error("[RoutineAudio] generation failed:", e?.message || e);
    return { error: "timeout", status: 504 };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const script = typeof body?.script === "string" ? body.script : "";
  const sig = typeof body?.sig === "string" ? body.sig : "";
  if (!script || script.length > MAX_SCRIPT_CHARS + 10 || !scriptIsAuthentic(script, sig)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  let audio = cache.get(sig);
  if (!audio) {
    let pending = inflight.get(sig);
    if (!pending) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      if (rateLimited(ip)) return Response.json({ error: "rate" }, { status: 429 });
      pending = generate(script).finally(() => inflight.delete(sig));
      inflight.set(sig, pending);
    }
    const result = await pending;
    if (!Buffer.isBuffer(result)) return Response.json({ error: result.error }, { status: result.status });
    audio = result;
    cache.set(sig, audio);
    if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
  }

  return new Response(new Uint8Array(audio), {
    headers: { "Content-Type": "audio/mpeg", "Content-Length": String(audio.length), "Cache-Control": "private, max-age=3600" },
  });
}
