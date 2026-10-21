import { sdk } from "@/lib/medusa";

// A diagnostic is saved unattached; the customer attaches it to her account once she is logged in
// (POST /store/skin-scans/:id/claim, possible for 2 hours, after which the scan loses its photos).
// The ids are remembered in this browser until then, so the scan is attached wherever she logs in:
// result page, login, sign-up or account page (on 2026-10-12 a customer signed up from the preview
// and landed on her account: the scan was never attached and its photos were purged).
const KEY = "welfare-pending-skin-scans";
const CLAIM_WINDOW_MS = 2 * 60 * 60 * 1000;

type Pending = { id: string; at: number };

function read(): Pending[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list.filter((p) => p?.id && Date.now() - p.at < CLAIM_WINDOW_MS) : [];
  } catch {
    return [];
  }
}

function write(list: Pending[]) {
  try {
    if (list.length) localStorage.setItem(KEY, JSON.stringify(list));
    else localStorage.removeItem(KEY);
  } catch {}
}

export function rememberPendingScan(id: string | undefined) {
  if (!id) return;
  write([...read().filter((p) => p.id !== id), { id, at: Date.now() }]);
}

// Call only when the customer is logged in. A scan that can't be attached (someone else's, too old,
// deleted) is forgotten; a network error keeps it for the next try.
export async function claimPendingScans(): Promise<void> {
  const left: Pending[] = [];
  for (const p of read()) {
    try {
      await sdk.client.fetch(`/store/skin-scans/${p.id}/claim`, { method: "POST" });
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      if (!status || status >= 500 || status === 401) left.push(p);
      else console.error("Skin scan could not be attached", p.id, err);
    }
  }
  write(left);
}

// The last diagnostics made in this browser, kept with no time limit: a new scan goes to the skin advisor of
// the previous one, so a customer who scans again without being logged in keeps the same advisor
// (lib/skin-advisors.ts in the API). Only ids: they say nothing about her.
const HISTORY_KEY = "welfare-skin-scan-history";
const HISTORY_MAX = 5;

export function previousScanIds(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(list) ? list.filter((id) => typeof id === "string").slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
}

export function rememberScanInHistory(id: string | undefined) {
  if (!id) return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([id, ...previousScanIds().filter((p) => p !== id)].slice(0, HISTORY_MAX)));
  } catch {}
}
