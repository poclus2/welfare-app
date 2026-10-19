// Server-side only (pages and server actions of /conseillere): the advisors' space talks to the API's
// /advisor routes from this server, with the advisor's session kept in an httpOnly cookie. Nothing of it
// reaches the browser's JavaScript, and the API never needs to open these routes to other sites.
import { cookies } from "next/headers";

export const ADVISOR_COOKIE = "advisor_token";
export const ADVISOR_SESSION_DAYS = 30; // as long as the API's token (lib/skin-advisors.ts)

const API_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

export type AdvisorApiResult<T> = { status: number; data: T | null; message?: string };

export async function advisorApi<T>(path: string, init?: { method?: string; body?: unknown }): Promise<AdvisorApiResult<T>> {
  const token = (await cookies()).get(ADVISOR_COOKIE)?.value;
  if (!token && !path.startsWith("/advisor/auth/")) return { status: 401, data: null };
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: init?.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { status: res.status, data: null, message: data?.message };
    return { status: res.status, data: data as T };
  } catch {
    return { status: 503, data: null, message: "Serveur injoignable, réessayez dans un instant" };
  }
}

// One scan as the advisor sees it (GET /advisor/skin-scans/:id)
export type AdvisorScan = {
  id: string;
  created_at: string;
  final_skin_type: string;
  melanin_phototype: string | null;
  concerns: string[] | null;
  metrics: any;
  routine: any[] | null;
  images: { front?: string; left?: string; right?: string; front_map?: any } | null;
  qwen_raw_summary: string | null;
  claude_raw_summary: string | null;
  responses: { questionId: string; answer: string }[] | null;
  notices: { kind: string; text: string }[] | null;
  review_status: "validated" | "corrected" | null;
  reviewed_routine: any[] | null;
  review_corrections: { step_name: string; from: string; to: string; reason: string }[] | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  has_account: boolean;
  review_flags: string[]; // why the Skin Coach asks for a human review (empty: nothing flagged)
  customer: { first_name: string | null; last_name: string | null } | null;
};

export type AdvisorScanRow = {
  id: string;
  created_at: string;
  final_skin_type: string;
  review_status: "validated" | "corrected" | null;
  reviewed_at: string | null;
  customer_name: string | null;
  has_photos: boolean;
  review_flags: string[];
};
