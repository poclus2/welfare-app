// What we can learn in the browser when a server action call throws instead of answering (shown to the
// customer as "NETWORK"). Next.js hides the HTTP status: "An unexpected response was received from the
// server." covers both an Nginx 413 (photos too big) and a 504 (analysis longer than the proxy timeout).
// The status is read back from the Resource Timing entry of the request (Chrome / Android; Safari may not
// give it), and the elapsed time tells them apart anyway: a 413 comes back at once, a 504 after the timeout.

export type ActionFailureInfo = {
  http_status: number | null;
  elapsed_ms: number;
  error_name: string;
  error_message: string;
  online: boolean | null;
  // our best guess, for PostHog breakdowns
  cause: "too_large" | "gateway_timeout" | "server_error" | "stale_deploy" | "offline" | "connection_lost" | "unknown";
};

function lastActionStatus(startedAt: number): number | null {
  try {
    const page = window.location.href.split("#")[0];
    const entries = performance.getEntriesByType("resource") as (PerformanceResourceTiming & { responseStatus?: number })[];
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i]!;
      // the action is a POST to the page itself; startTime is relative to performance.timeOrigin
      if (e.initiatorType !== "fetch" || e.name.split("#")[0] !== page) continue;
      if (performance.timeOrigin + e.startTime < startedAt - 1000) break;
      return typeof e.responseStatus === "number" && e.responseStatus > 0 ? e.responseStatus : null;
    }
  } catch {}
  return null;
}

export function describeActionFailure(error: unknown, startedAt: number): ActionFailureInfo {
  const err = error as { name?: string; message?: string } | null;
  const name = String(err?.name || "Error");
  const message = String(err?.message || error || "").slice(0, 200);
  const elapsed = Date.now() - startedAt;
  const status = lastActionStatus(startedAt);
  let online: boolean | null = null;
  try {
    online = navigator.onLine;
  } catch {}

  let cause: ActionFailureInfo["cause"] = "unknown";
  if (status === 413) cause = "too_large";
  else if (status === 504 || status === 408) cause = "gateway_timeout";
  else if (status && status >= 500) cause = "server_error";
  else if (name === "UnrecognizedActionError" || /was not found on the server/i.test(message)) cause = "stale_deploy";
  else if (online === false) cause = "offline";
  else if (/unexpected response/i.test(message)) cause = elapsed < 10_000 ? "too_large" : "gateway_timeout";
  else if (/failed to fetch|load failed|network/i.test(message)) cause = "connection_lost";

  return { http_status: status, elapsed_ms: elapsed, error_name: name, error_message: message, online, cause };
}
