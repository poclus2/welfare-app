"use server";

import { cookies } from "next/headers";
import { fetchAdmin } from "@/lib/medusa-admin";
import { revalidatePath } from "next/cache";

export async function updateProductMetadata(productId: string, metadata: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) throw new Error("Unauthorized");

  await fetchAdmin(`/products/${productId}`, token, {
    method: "POST",
    body: JSON.stringify({ metadata }),
  });

  revalidatePath("/dashboard/products");
}
