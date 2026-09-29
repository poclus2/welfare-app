import { redirect } from "next/navigation";

// This page moved to /dashboard/createurs (merged with the former
// Ambassadrices page into a single "Créateurs Partenaires" space).
export default function PromotionsRedirect() {
  redirect("/dashboard/createurs");
}
