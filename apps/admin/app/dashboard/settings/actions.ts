"use server";

import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";

export async function createShippingOptionAction(name: string, price: number, isPickup: boolean) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) throw new Error("Unauthorized");

  return fetchAdmin("/welfare-shipping", token, {
    method: "POST",
    body: JSON.stringify({ name, price, isPickup }),
  });
}

export async function deleteShippingOptionAction(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) throw new Error("Unauthorized");

  return fetchAdmin(`/welfare-shipping/${id}`, token, {
    method: "DELETE",
  });
}

export async function updateShippingOptionAction(id: string, price: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) throw new Error("Unauthorized");

  return fetchAdmin(`/welfare-shipping/${id}`, token, {
    method: "POST",
    body: JSON.stringify({ price }),
  });
}
