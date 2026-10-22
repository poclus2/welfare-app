import { SpeechError, speak } from "./coach-voice";

// The routine read aloud (app/api/skin-coach/audio), generated once per signed script and kept in memory.
// Started as soon as the analysis ends (owner's decision, 2026-10-22): Gemini takes 15 to 80 s, and she
// reads her results meanwhile, so it is usually ready when she taps "Écouter" (~0.02 $ per scan, listened
// to or not). If it is gone from memory, her tap generates it again.
// Kept on globalThis: the analysis (server action) and the audio route are separate Next bundles, each
// with its own copy of this module, in the same Node process.

export type RoutineAudioResult = Buffer | { error: string; status: number };

const CACHE_MAX = 40; // ~0.4 MB each
type Store = { cache: Map<string, Buffer>; inflight: Map<string, Promise<RoutineAudioResult>> };
const store: Store = ((globalThis as { __routineAudio?: Store }).__routineAudio ??= { cache: new Map(), inflight: new Map() });

async function generate(script: string): Promise<RoutineAudioResult> {
  const started = Date.now();
  try {
    // Gemini answers in 15 to 80 s for a whole message (measured 2026-10-22): a short timeout failed real ones
    const { mp3, generationIds } = await speak(script, 120_000);
    console.log(`[RoutineAudio] ${script.length} chars → ${mp3.length} bytes in ${Date.now() - started} ms (${generationIds})`);
    return mp3;
  } catch (e) {
    if (e instanceof SpeechError) {
      console.error(`[RoutineAudio] ${e.message}`);
      return { error: e.status === 402 ? "credits" : "provider", status: 502 };
    }
    console.error("[RoutineAudio] generation failed:", e instanceof Error ? e.message : e);
    return { error: "timeout", status: 504 };
  }
}

// Ready, being generated, or null when nothing was started for this script
export function routineAudioFor(sig: string): Buffer | Promise<RoutineAudioResult> | null {
  return store.cache.get(sig) || store.inflight.get(sig) || null;
}

// Only for a script signed by the server (the caller checks it). A failure is not kept: the next tap retries.
export function startRoutineAudio(script: string, sig: string): Promise<RoutineAudioResult> {
  const existing = store.inflight.get(sig);
  if (existing) return existing;
  const pending = generate(script)
    .then((result) => {
      if (Buffer.isBuffer(result)) {
        store.cache.set(sig, result);
        if (store.cache.size > CACHE_MAX) store.cache.delete(store.cache.keys().next().value!);
      }
      return result;
    })
    .finally(() => store.inflight.delete(sig));
  store.inflight.set(sig, pending);
  return pending;
}
