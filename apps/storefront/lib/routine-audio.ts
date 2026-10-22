import { createHmac, timingSafeEqual } from "crypto";

// Audio version of the Skin Coach's message, in the coach's voice (lib/coach-voice.ts, the same as the
// questions since 2026-10-22), generated only when she taps "Écouter". Only the message frame is read
// (owner's request, 2026-10-14), not the routine steps.
// The script is written by the server at the end of the analysis and signed with the server secret: the
// audio route reads nothing else, so nobody can have arbitrary text read at our expense.

export const MAX_SCRIPT_CHARS = 2200; // about 2 minutes of speech

const clean = (s: string | undefined) =>
  (s || "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "") // emojis are read aloud otherwise
    .replace(/\s+/g, " ")
    .replace(/ ([.,])/g, "$1") // "d'eau ✨." once the emoji is gone
    .trim();

export function buildRoutineScript(r: { empathetic_message: string }): string {
  const text = clean(r.empathetic_message);
  if (text.length <= MAX_SCRIPT_CHARS) return text;
  const cut = text.slice(0, MAX_SCRIPT_CHARS);
  return cut.slice(0, Math.max(cut.lastIndexOf(". ") + 1, cut.lastIndexOf(" ")));
}

export function signScript(script: string): string | null {
  const secret = process.env.SKIN_SCAN_TOKEN;
  if (!secret) return null;
  return createHmac("sha256", secret).update("routine-audio|").update(script).digest("hex");
}

export function scriptIsAuthentic(script: string, sig: string): boolean {
  const expected = signScript(script);
  if (!expected || typeof sig !== "string" || sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}
