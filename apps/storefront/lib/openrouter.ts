// One place to call OpenRouter for the Skin Coach: retries what is worth retrying, and turns every failure
// into an error code that is logged and shown to the customer, instead of a generic "something went wrong".
//   AI_CREDITS  the OpenRouter account has no credit left: every scan fails until it is topped up
//   AI_BUSY     rate limit / too many requests in flight: retried, then the customer is asked to retry
//   AI_TIMEOUT  no answer in time
//   AI_ERROR    any other error from OpenRouter or the model provider
//   AI_FORMAT   an answer came back but it is not usable JSON

export type AiErrorCode = "AI_CREDITS" | "AI_BUSY" | "AI_TIMEOUT" | "AI_ERROR" | "AI_FORMAT";
// What a call really cost, as OpenRouter bills it (usage accounting), saved with the scan
export type AiUsage = { label: string; model: string; prompt_tokens: number; completion_tokens: number; cost: number };
export type AiCallResult =
  | { ok: true; content: string; usage?: AiUsage }
  | { ok: false; code: AiErrorCode; status?: number; detail: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function callOpenRouter(
  label: string,
  body: Record<string, unknown>,
  opts: { timeoutMs?: number; attempts?: number } = {}
): Promise<AiCallResult> {
  const attempts = opts.attempts ?? 3;
  const timeoutMs = opts.timeoutMs ?? 120_000;
  let last: AiCallResult = { ok: false, code: "AI_ERROR", detail: "not called" };

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let retryAfterMs = 0;
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://thewelfare.com",
          "X-Title": "The Welfare Skin Coach",
        },
        body: JSON.stringify({ ...body, usage: { include: true } }),
        signal: controller.signal,
      });
      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { /* handled below */ }
      // OpenRouter can also answer 200 with an error object (provider failure mid-way)
      const err = !res.ok ? data?.error || { message: text.slice(0, 300) } : data?.error;

      if (!err) {
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content === "string" && content.trim()) {
          const u = data?.usage || {};
          const usage: AiUsage = {
            label,
            model: String(data?.model || body.model || ""),
            prompt_tokens: Number(u.prompt_tokens) || 0,
            completion_tokens: Number(u.completion_tokens) || 0,
            cost: Number(u.cost) || 0,
          };
          console.log(`[OpenRouter] ${label} ${usage.model}: ${usage.prompt_tokens} in / ${usage.completion_tokens} out, ${usage.cost.toFixed(4)} $`);
          return { ok: true, content, usage };
        }
        last = { ok: false, code: "AI_FORMAT", status: res.status, detail: "empty answer" };
        retryAfterMs = 1000; // an empty answer is usually a one-off
      } else {
        const status = Number(err.code) || res.status;
        const reason = String(err.metadata?.reason || "");
        const message = String(err.message || "").slice(0, 300);
        const header = Number(res.headers.get("retry-after"));
        if (status === 402 && reason !== "in_flight_budget_exhausted") {
          // no credit left: retrying won't help, and the owner must be told
          console.error(`[OpenRouter] ALERT ${label}: account out of credit (${reason || message}). Every Skin Coach scan fails until it is topped up.`);
          return { ok: false, code: "AI_CREDITS", status, detail: message };
        }
        if (status === 402 || status === 429) {
          last = { ok: false, code: "AI_BUSY", status, detail: message };
          retryAfterMs = Math.min(Number.isFinite(header) && header > 0 ? header * 1000 : 4000, 10_000);
        } else if (status >= 500 || status === 408) {
          last = { ok: false, code: "AI_ERROR", status, detail: message };
          retryAfterMs = 2000;
        } else {
          console.error(`[OpenRouter] ${label} failed (${status}): ${message}`);
          return { ok: false, code: "AI_ERROR", status, detail: message };
        }
      }
    } catch (e: any) {
      if (e?.name === "AbortError") {
        console.error(`[OpenRouter] ${label}: no answer after ${timeoutMs / 1000}s`);
        return { ok: false, code: "AI_TIMEOUT", detail: `timeout ${timeoutMs}ms` }; // not retried: the customer already waited
      }
      last = { ok: false, code: "AI_ERROR", detail: String(e?.message || e).slice(0, 300) };
      retryAfterMs = 2000;
    } finally {
      clearTimeout(timer);
    }
    if (!last.ok) console.warn(`[OpenRouter] ${label} attempt ${attempt}/${attempts} failed: ${last.code} ${last.status ?? ""} ${last.detail}`);
    if (attempt < attempts) await sleep(retryAfterMs);
  }
  return last;
}

// The JSON object in a model answer (some models wrap it in ```json fences)
export function parseJsonAnswer(content: string): any | null {
  const cleaned = content.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
    }
    return null;
  }
}
