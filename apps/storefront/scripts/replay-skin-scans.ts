// Replays past Skin Coach scans through today's pipeline with a chosen routine model, to compare models
// (quality and real OpenRouter cost) before switching. Nothing is saved: run with SKIN_COACH_DRY_RUN=1.
// The photo analysis is NOT redone: each scan's stored visual result is reused (signed here with the
// local SKIN_SCAN_TOKEN), so both models get exactly the same input.
//
//   SKIN_COACH_DRY_RUN=1 SKIN_SCAN_TOKEN=<any local secret> SKIN_COACH_ROUTINE_MODEL=<model> \
//   OPENROUTER_API_KEY=... NEXT_PUBLIC_MEDUSA_BACKEND_URL=... NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=... \
//   MEILISEARCH_HOST=... MEILISEARCH_SEARCH_KEY=... \
//   npx tsx scripts/replay-skin-scans.ts <scans.json> <out.json>
//
// scans.json: [{ id, images: { front, left, right }, responses, visual }] exported from the skin_scan table.
import { createHash, createHmac } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { analyzeSkin } from "../app/actions/analyze-skin";

type Scan = { id: string; images: { front: string; left: string; right: string }; responses: any[]; visual: any };

function sign(images: Scan["images"], result: unknown): string {
  const secret = process.env.SKIN_SCAN_TOKEN!;
  const photos = createHash("sha256").update(images.front).update("|").update(images.left).update("|").update(images.right).digest("hex");
  return createHmac("sha256", secret).update(photos).update(JSON.stringify(result)).digest("hex");
}

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || process.env.SKIN_COACH_DRY_RUN !== "1" || !process.env.SKIN_SCAN_TOKEN) {
    console.error("usage: SKIN_COACH_DRY_RUN=1 SKIN_SCAN_TOKEN=... npx tsx scripts/replay-skin-scans.ts <scans.json> <out.json>");
    process.exit(1);
  }
  const scans: Scan[] = JSON.parse(readFileSync(input, "utf8"));
  const results: any[] = [];
  for (const scan of scans) {
    const started = Date.now();
    const res = await analyzeSkin(scan.images, scan.responses, true, { result: scan.visual, signature: sign(scan.images, scan.visual) });
    if (!res.success) {
      results.push({ id: scan.id, error: res.code });
      console.log(`${scan.id}: ÉCHEC ${res.code}`);
      continue;
    }
    const data: any = res.data;
    const log = data.__replay_log || {};
    results.push({
      id: scan.id,
      model: log.models?.routine,
      seconds: Math.round((Date.now() - started) / 1000),
      cost: log.ai_cost,
      usage: (log.ai_usage || []).filter((u: any) => u.label !== "visual"),
      candidates: (log.catalog?.products || []).length,
      corrected: !!log.correction,
      message: data.empathetic_message,
      routine: (data.kbeauty_routine || data.routine_steps || []).map((s: any) => ({
        step: s.step_name,
        product: s.product_name,
        why: s.explanation_for_client,
      })),
    });
    console.log(`${scan.id}: ${log.models?.routine} ${(log.ai_cost || 0).toFixed(4)} $, ${results.at(-1).routine.length} étapes`);
  }
  writeFileSync(output, JSON.stringify(results, null, 2));
}

main();
