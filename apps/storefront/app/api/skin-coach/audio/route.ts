import { NextRequest } from "next/server";
import { MAX_SCRIPT_CHARS, scriptIsAuthentic } from "@/lib/routine-audio";
import { routineAudioFor, startRoutineAudio } from "@/lib/routine-audio-store";

// POST { script, sig } → the routine read aloud (mp3) in the coach's voice. Only scripts signed by the analysis
// are read. The analysis already started it (lib/routine-audio-store.ts): her tap gets it when ready, or
// waits for the end; listening again (or another tap) costs nothing.

// at most a few new generations per visitor and hour (ready or started ones don't count)
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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const script = typeof body?.script === "string" ? body.script : "";
  const sig = typeof body?.sig === "string" ? body.sig : "";
  if (!script || script.length > MAX_SCRIPT_CHARS + 10 || !scriptIsAuthentic(script, sig)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  let found = routineAudioFor(sig);
  if (!found) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (rateLimited(ip)) return Response.json({ error: "rate" }, { status: 429 });
    found = startRoutineAudio(script, sig);
  }
  const audio = await found;
  if (!Buffer.isBuffer(audio)) return Response.json({ error: audio.error }, { status: audio.status });

  return new Response(new Uint8Array(audio), {
    headers: { "Content-Type": "audio/mpeg", "Content-Length": String(audio.length), "Cache-Control": "private, max-age=3600" },
  });
}
