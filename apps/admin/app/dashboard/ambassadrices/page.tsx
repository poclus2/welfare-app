import { redirect } from "next/navigation";

// This page moved to /dashboard/createurs (merged with the former
// Promotions page into a single "Créateurs Partenaires" space).
export default function AmbassadricesRedirect() {
  redirect("/dashboard/createurs");
}
