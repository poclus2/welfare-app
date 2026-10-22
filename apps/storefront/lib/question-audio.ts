import manifest from "./question-audio-manifest.json";

// Each Skin Coach question read aloud when it appears (owner's request, 2026-10-22): only the question, not
// the choices, in French. Recorded once by scripts/generate-question-audio.ts with the voice the owner chose
// from 6 samples, served from public/ and preloaded while she takes her photos.
// Web Audio rather than an <audio> element: once unlocked by her tap on "Commencer le scan" it plays every
// question without another tap (iOS), and on an iPhone in silent mode it stays silent.
// The voice is on by default; she can turn it off, remembered on her phone.

export const QUESTION_VOICE_MODEL = "google/gemini-3.8-flash-tts";
export const QUESTION_VOICE = "Sulafat"; // voice B of the blind test, 2026-10-22
export const QUESTION_AUDIO_DIR = "/audio/skin-coach/fr";

export type QuestionClip = { id: string; hash: string; file: string };
export type QuestionAudioManifest = { model: string; voice: string; clips: QuestionClip[] };

// What is said: the message without its emojis
export function spokenText(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// FNV-1a of the spoken text, in the file names: a changed question has no recording until it is recorded
// again, and stays silent rather than reading the old text
export function textHash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

const clips = (manifest as QuestionAudioManifest).clips;
const byHash = new Map(clips.map((c) => [c.hash, c]));

// A recording not ready by then is skipped: a late voice would talk over her next answer
const WAIT_MS = 1500;
const PREF_KEY = "skin-coach-voice";

let ctx: AudioContext | null = null;
let preloading = false;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
let current: AudioBufferSourceNode | null = null;
let playToken = 0;

export function questionVoiceOn(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setQuestionVoiceOn(on: boolean) {
  try {
    localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {
    // private browsing: the choice holds for this visit only
  }
  if (!on) stopQuestionAudio();
}

// On each of her taps (start of the scan, every answer): creates or wakes the audio context. iOS only lets it
// start from a tap, and suspends it again when the page goes to the background.
export function primeQuestionAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
    } catch {
      return;
    }
    // older iOS only unlocks the context once something has played during the tap
    const silence = ctx.createBufferSource();
    silence.buffer = ctx.createBuffer(1, 1, 22050);
    silence.connect(ctx.destination);
    silence.start();
  }
  if (ctx.state !== "running") ctx.resume().catch(() => {});
}

function load(clip: QuestionClip): Promise<AudioBuffer | null> {
  let pending = buffers.get(clip.file);
  if (!pending) {
    const audio = ctx;
    pending = audio
      ? fetch(`${QUESTION_AUDIO_DIR}/${clip.file}`)
          .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
          .then((data) => audio.decodeAudioData(data))
          .catch(() => null)
      : Promise.resolve(null);
    if (audio) buffers.set(clip.file, pending);
  }
  return pending;
}

// All the recordings, in questionnaire order, two at a time (~30 KB each). Not with the data saver on:
// each question is then fetched when it appears.
export function preloadQuestionAudio() {
  if (!ctx || preloading || !questionVoiceOn()) return;
  preloading = true;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
  let i = 0;
  const next = (): Promise<void> => (i < clips.length ? load(clips[i++]!).then(next) : Promise.resolve());
  next();
  next();
}

export function stopQuestionAudio() {
  playToken++;
  try {
    current?.stop();
  } catch {
    // already ended
  }
  current = null;
}

// Reads the message aloud when it has a recording (the questions; not her answers nor the error messages)
export async function playQuestionAudio(text: string) {
  stopQuestionAudio();
  const token = playToken;
  const clip = byHash.get(textHash(spokenText(text)));
  if (!clip || !ctx || !questionVoiceOn()) return;
  const audio = ctx;
  const buffer = await Promise.race([load(clip), new Promise<null>((r) => setTimeout(() => r(null), WAIT_MS))]);
  if (!buffer || token !== playToken) return;
  if (audio.state !== "running") {
    await Promise.race([audio.resume().catch(() => {}), new Promise((r) => setTimeout(r, 300))]);
    if ((audio.state as AudioContextState) !== "running" || token !== playToken) return; // still asleep: skipped
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.connect(audio.destination);
  source.onended = () => {
    if (current === source) current = null;
  };
  source.start();
  current = source;
}
