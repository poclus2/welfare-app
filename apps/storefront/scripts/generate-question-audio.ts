// Records the Skin Coach questions read aloud (lib/question-audio.ts), once, with the voice the owner chose,
// into public/audio/skin-coach/fr/ and lib/question-audio-manifest.json. Only new or changed texts are
// recorded (the file name carries the hash of what it says); files no longer used are deleted.
// Run locally, never on the server; then listen to the new files and commit them.
//
//   npx tsx --env-file=<file with OPENROUTER_API_KEY> scripts/generate-question-audio.ts [--redo q_budget,q_makeup]
//
// --redo records those questions again (a take that doesn't sound right). Cost: a few cents for everything.
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { COACH_VOICE, COACH_VOICE_MODEL, speak } from "../lib/coach-voice";
import { FOLLOWUP_QUESTIONS } from "../lib/skin-profile";
import { ANALYSIS_START_MESSAGE, DECISION_TREE } from "../lib/skin-question-tree";
import { QUESTION_AUDIO_DIR, spokenText, textHash, type QuestionAudioManifest, type QuestionClip } from "../lib/question-audio";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT_DIR = path.join(ROOT, "public", QUESTION_AUDIO_DIR);
const MANIFEST = path.join(ROOT, "lib", "question-audio-manifest.json");

// Every message of the coach that is read: the questions in order, the follow-ups, the "analysing" message
const MESSAGES = [
  ...DECISION_TREE.map((n) => ({ id: n.id, text: n.text })),
  ...FOLLOWUP_QUESTIONS.map((q) => ({ id: q.id, text: q.text })),
  { id: "analysis_start", text: ANALYSIS_START_MESSAGE },
];

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("usage: npx tsx --env-file=<file with OPENROUTER_API_KEY> scripts/generate-question-audio.ts [--redo id1,id2]");
    process.exit(1);
  }
  const redoArg = process.argv.indexOf("--redo");
  const redo = new Set(redoArg > 0 ? (process.argv[redoArg + 1] || "").split(",") : []);
  const previous: QuestionAudioManifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const sameVoice = previous.model === COACH_VOICE_MODEL && previous.voice === COACH_VOICE;
  mkdirSync(OUT_DIR, { recursive: true });

  const clips: QuestionClip[] = [];
  let chars = 0;
  for (const m of MESSAGES) {
    const text = spokenText(m.text);
    const hash = textHash(text);
    const file = `${m.id}.${hash}.mp3`;
    clips.push({ id: m.id, hash, file });
    if (sameVoice && !redo.has(m.id) && existsSync(path.join(OUT_DIR, file))) continue;
    const { mp3 } = await speak(text, 90_000);
    writeFileSync(path.join(OUT_DIR, file), mp3);
    chars += text.length;
    console.log(`${file}: ${text.length} chars → ${mp3.length} bytes`);
  }

  const used = new Set(clips.map((c) => c.file));
  for (const f of readdirSync(OUT_DIR)) {
    if (f.endsWith(".mp3") && !used.has(f)) {
      unlinkSync(path.join(OUT_DIR, f));
      console.log(`${f}: deleted (no longer used)`);
    }
  }
  const manifest: QuestionAudioManifest = { model: COACH_VOICE_MODEL, voice: COACH_VOICE, clips };
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`${clips.length} questions, ${chars} characters recorded this run`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
