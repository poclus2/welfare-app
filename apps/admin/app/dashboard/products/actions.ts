"use server";

import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import { revalidatePath, revalidateTag } from "next/cache";

const SHOP_FLAGS = ["is_flash_sale", "is_bestseller"] as const;
type ShopFlag = (typeof SHOP_FLAGS)[number];

// Turns one "Page Shop" selection on or off. The rest of the metadata (INCI, AI sheet, Skin Coach
// function…) is read here, on the server, and kept as is: the Shop tab no longer downloads it.
export async function setProductShopFlag(productId: string, flag: ShopFlag, value: boolean) {
  if (!SHOP_FLAGS.includes(flag)) throw new Error("Unknown flag");
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) throw new Error("Unauthorized");

  const { product } = await fetchAdmin<{ product: { metadata?: Record<string, unknown> | null } }>(
    `/products/${productId}?fields=id,metadata`,
    token
  );
  await fetchAdmin(`/products/${productId}`, token, {
    method: "POST",
    body: JSON.stringify({ metadata: { ...(product.metadata || {}), [flag]: !!value } }),
  });

  revalidateTag("admin-products");
  revalidatePath("/dashboard/products");
}
