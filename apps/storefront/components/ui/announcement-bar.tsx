"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { useI18n } from "@/lib/i18n-context";

export function AnnouncementBar() {
  const { t } = useI18n();

  return (
    <div className="w-full bg-[#2A2424] text-white px-4 py-2.5 flex items-center justify-center gap-3 text-xs md:text-sm font-medium tracking-wide z-50 relative">
      <span>{t("Livraison gratuite partout au Cameroun dès 50 000 FCFA d'achats")}</span>
      <Link href="/shop" className="underline hover:text-[#E5B6B9] transition-colors inline-flex items-center gap-1 opacity-80 hover:opacity-100">
        {t("Acheter")} <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
