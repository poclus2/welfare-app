import { CollectionsClient } from "./CollectionsClient";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function CollectionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("medusa_admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return <CollectionsClient token={token} />;
}
