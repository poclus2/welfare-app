// Medusa Admin API client — server-side utility (NO "use server" directive)

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "https://api.thewelfare.store";

export async function loginAdmin(email: string, password: string): Promise<string> {
  const res = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message || "Identifiants incorrects");
  }

  const data = await res.json();
  return data.token as string;
}

export async function fetchAdmin<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${MEDUSA_URL}/admin${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let errorMsg = `Admin API error: ${res.status} ${path}`;
    try {
      const err = await res.json();
      errorMsg = err.message || JSON.stringify(err);
    } catch (e) {}
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}
