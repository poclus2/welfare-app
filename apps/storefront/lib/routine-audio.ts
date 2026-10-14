import { createHmac, timingSafeEqual } from "crypto";

// Audio version of the routine (ElevenLabs through OpenRouter, generated only when she taps "Écouter").
// The script is written by the server at the end of the analysis and signed with the server secret: the
// audio route reads nothing else, so nobody can have arbitrary text read at our expense.

export const ROUTINE_VOICE_MODEL = "elevenlabs/eleven-multilingual-v2";
export const ROUTINE_VOICE = "lily"; // chosen by the owner from samples, 2026-10-14
export const MAX_SCRIPT_CHARS = 2200; // about 2 minutes of speech, ~0.05 $ per generation

type ScriptInput = {
  final_skin_type: string;
  empathetic_message: string;
  kbeauty_routine: { step_name?: string; product_name?: string; explanation_for_client?: string; explanation?: string }[];
  notices?: { kind: string; text: string }[];
};

const clean = (s: string | undefined) =>
  (s || "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "") // emojis are read aloud otherwise
    .replace(/\s+/g, " ")
    .replace(/ ([.,])/g, "$1") // "d'eau ✨." once the emoji is gone
    .trim();

// first sentences of a text, up to max characters
function shorten(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > max * 0.4 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export function buildRoutineScript(r: ScriptInput): string {
  const steps = r.kbeauty_routine.map((s, i) => {
    const why = shorten(clean(s.explanation_for_client || s.explanation), 220);
    return `Étape ${i + 1}, ${clean(s.step_name).toLowerCase()} : ${clean(s.product_name)}. ${why}`;
  });
  const referral = (r.notices || []).find((n) => n.kind === "referral");
  const parts = [
    `Votre diagnostic : ${clean(r.final_skin_type).toLowerCase()}.`,
    shorten(clean(r.empathetic_message), 600),
    steps.length ? `Voici votre routine, en ${steps.length} étape${steps.length > 1 ? "s" : ""}.` : "",
    ...steps,
    referral ? shorten(clean(referral.text), 300) : "",
    "Ces conseils cosmétiques ne remplacent pas l'avis d'un professionnel de santé.",
  ].filter(Boolean);
  return shorten(parts.join(" "), MAX_SCRIPT_CHARS);
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
