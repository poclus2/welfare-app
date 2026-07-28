"use server";

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "https://api.thewelfare.store";

export async function loginAdmin(email: string, password: string) {
  const res = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Identifiants incorrects");
  }
  const data = await res.json();
  return data.token as string;
}

export async function fetchAdmin<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${MEDUSA_URL}/admin${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}
