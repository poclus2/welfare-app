"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Check } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n-context";

// Creator programme teaser. Only the programme's real conditions (same as /ambassadrices: commission
// tiers 3 / 4 / 6 %, -15 % on personal purchases, monthly payment): no follower counts, earnings or
// creator pictures until real partner creators have agreed to appear here.
export function LoyaltyProgram() {
  const { t } = useI18n();

  const conditions = [
    t("De 3 à 6 % de commission sur chaque vente faite avec votre lien ou votre code, selon vos ventes du mois"),
    t("15 % de réduction sur vos achats personnels"),
    t("Paiement mensuel par Mobile Money ou virement bancaire"),
    t("Un espace personnel pour suivre vos clics, vos ventes et vos commissions"),
    t("Gratuit et sans engagement, réponse sous 48 h sur WhatsApp"),
  ];

  return (
    <section className="w-full bg-[#FAF8F6] py-20 md:py-28 overflow-hidden">
      <div className="w-full max-w-[1400px] mx-auto px-5 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#2A2424]/50 mb-4">
              {t("Programme créateurs partenaires")}
            </p>
            <h2 className="text-[2.3rem] md:text-[3.3rem] leading-[1.1] font-medium tracking-tight text-[#2A2424] mb-5">
              {t("Partagez ce que vous aimez,")}{" "}
              <em className="font-serif not-italic text-[#E5B6B9]">{t("devenez créateur partenaire")}</em>
            </h2>
            <p className="text-[#2A2424]/65 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
              {t("Vous aimez les soins de la peau et partager vos découvertes ? Découvrez notre programme de collaboration avec les créateurs de contenu.")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/ambassadrices#postuler"
                className="inline-flex items-center justify-center gap-2 bg-[#2A2424] text-white px-7 py-4 rounded-full text-sm font-semibold hover:bg-black transition-colors"
              >
                {t("Rejoindre le programme")} <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/ambassadrices#comment"
                className="inline-flex items-center justify-center gap-2 border border-[#2A2424]/20 text-[#2A2424] px-7 py-4 rounded-full text-sm font-semibold hover:bg-black/5 transition-colors"
              >
                {t("Comment ça marche")}
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-[1.75rem] border border-[#2A2424]/[0.06] p-6 md:p-9 shadow-[0_30px_60px_-40px_rgba(42,36,36,0.25)]">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#2A2424]/50 mb-5">
              {t("Les conditions du programme")}
            </p>
            <ul className="flex flex-col gap-4">
              {conditions.map((c) => (
                <li key={c} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-[#F4EAEB] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#2A2424]" weight="bold" />
                  </span>
                  <span className="text-[15px] text-[#2A2424]/80 leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
