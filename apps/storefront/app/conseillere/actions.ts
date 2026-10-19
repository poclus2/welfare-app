"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADVISOR_COOKIE, ADVISOR_SESSION_DAYS, advisorApi } from "@/lib/advisor-api";

// Advisors' space: login with her WhatsApp number and the password set in the admin, logout, review.

export type LoginState = { error?: string };

// only a page of the space, never another site
const safeNext = (v: unknown) => (typeof v === "string" && v.startsWith("/conseillere") && !v.startsWith("//") ? v : "/conseillere");

export async function loginAdvisor(_prev: LoginState, form: FormData): Promise<LoginState> {
  const whatsapp = String(form.get("whatsapp") || "").trim();
  const password = String(form.get("password") || "");
  if (!whatsapp || !password) return { error: "Saisissez votre numéro WhatsApp et votre mot de passe." };

  const res = await advisorApi<{ token: string }>("/advisor/auth/login", { method: "POST", body: { whatsapp, password } });
  if (!res.data?.token) return { error: res.message || "Connexion impossible." };

  (await cookies()).set(ADVISOR_COOKIE, res.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/conseillere",
    maxAge: ADVISOR_SESSION_DAYS * 24 * 60 * 60,
  });
  redirect(safeNext(form.get("next")));
}

export async function logoutAdvisor(): Promise<void> {
  (await cookies()).set(ADVISOR_COOKIE, "", { path: "/conseillere", maxAge: 0 });
  redirect("/conseillere/login");
}

// body as for the admin's review: { status: "validated" } or { status: "corrected", routine, corrections }
export async function reviewScan(scanId: string, body: unknown): Promise<{ error?: string }> {
  const res = await advisorApi(`/advisor/skin-scans/${encodeURIComponent(scanId)}/review`, { method: "POST", body });
  if (res.status === 401) return { error: "Votre session a expiré : reconnectez-vous." };
  if (!res.data) return { error: res.message || "Enregistrement impossible." };
  revalidatePath(`/conseillere/scans/${scanId}`);
  revalidatePath("/conseillere");
  return {};
}
