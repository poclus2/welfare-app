// Only the ESM build exports the encoder (its CommonJS build exports nothing): import it, never require it
import { Mp3Encoder } from "@breezystack/lamejs";

// The Skin Coach's voice, for the questions (scripts/generate-question-audio.ts) and the routine
// (app/api/skin-coach/audio): Gemini TTS through OpenRouter, voice chosen by the owner from a blind test of
// 6 French voices (2026-10-22). Server and scripts only.
// Gemini only answers raw 16-bit mono PCM: made into a light mp3 here (a WAV would weigh ~6 MB for 2 minutes).

export const COACH_VOICE_MODEL = "google/gemini-3.8-flash-tts";
export const COACH_VOICE = "Sulafat";
const MP3_KBPS = 32; // voice only, mono: ~4 KB per second

// Gemini takes 30 to 60+ s for a whole routine message (2026-10-22), but ~20 s for a paragraph: a long text
// is said in pieces of a few sentences, generated together and joined with a short pause.
const CHUNK_CHARS = 450;
const PAUSE_MS = 250;

export class SpeechError extends Error {
  constructor(public status: number, detail: string) {
    super(`OpenRouter ${status}: ${detail}`);
  }
}

// Whole sentences, CHUNK_CHARS at most per piece (a longer sentence stays whole)
export function splitForSpeech(text: string): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]+[»”")]*\s*|[^.!?…]+$/g) || [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && current.length + sentence.length > CHUNK_CHARS) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function speakPcm(text: string, timeoutMs: number): Promise<{ pcm: Buffer; rate: number; generationId: string | null }> {
  const res = await fetch("https://openrouter.ai/api/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: COACH_VOICE_MODEL, input: text, voice: COACH_VOICE, response_format: "pcm" }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new SpeechError(res.status, (await res.text().catch(() => "")).slice(0, 300));
  const rate = Number((res.headers.get("content-type") || "").match(/rate=(\d+)/)?.[1]) || 24000;
  return { pcm: Buffer.from(await res.arrayBuffer()), rate, generationId: res.headers.get("x-generation-id") };
}

export function pcmToMp3(pcm: Buffer, sampleRate: number): Buffer {
  const samples = new Int16Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.length - (pcm.length % 2)));
  const encoder = new Mp3Encoder(1, sampleRate, MP3_KBPS);
  // the encoder hands back Int8Arrays (whatever its types say): viewed as bytes
  const bytes = (a: ArrayBufferView) => Buffer.from(a.buffer, a.byteOffset, a.byteLength);
  const chunks: Buffer[] = [];
  for (let i = 0; i < samples.length; i += 1152) chunks.push(bytes(encoder.encodeBuffer(samples.subarray(i, i + 1152))));
  chunks.push(bytes(encoder.flush()));
  return Buffer.concat(chunks);
}

export async function speak(text: string, timeoutMs: number): Promise<{ mp3: Buffer; generationIds: string }> {
  const parts = await Promise.all(splitForSpeech(text).map((chunk) => speakPcm(chunk, timeoutMs)));
  const rate = parts[0]!.rate;
  const pause = Buffer.alloc(Math.round((rate * PAUSE_MS) / 1000) * 2);
  const pcm = Buffer.concat(parts.flatMap((p, i) => (i ? [pause, p.pcm] : [p.pcm])));
  return { mp3: pcmToMp3(pcm, rate), generationIds: parts.map((p) => p.generationId).join(",") };
}
