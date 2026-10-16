"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n-context";

// Who The Welfare Shop is for. Mostly women, but not only: the copy stays inclusive, and the pictures
// show varied skin tones, ages and skin types.
type Audience = { title: string; text: string; image?: string; tint: string };

const AUDIENCES: Audience[] = [
  {
    title: "Les peaux sensibles ou fragilisées",
    text: "Pour les personnes qui recherchent des soins doux, adaptés aux sensations d'inconfort et au maintien de la barrière cutanée.",
    tint: "#EAD4D5",
  },
  {
    title: "Les imperfections et les marques",
    text: "Pour celles et ceux qui souhaitent construire une routine adaptée aux imperfections légères, aux taches post-inflammatoires et à l'apparence irrégulière du teint.",
    tint: "#E5E9E1",
  },
  {
    title: "Arrêter la dépigmentation",
    text: "Pour accompagner celles et ceux qui veulent abandonner les pratiques éclaircissantes agressives et revenir à des soins respectueux de leur carnation naturelle.",
    tint: "#F1E2D3",
  },
  {
    title: "La prévention avant tout",
    text: "Pour celles et ceux qui souhaitent préserver leur peau, la protéger du soleil, maintenir son hydratation et prendre soin d'elle durablement.",
    tint: "#DCE4E5",
  },
  {
    title: "Les amateurs de skincare exigeants",
    text: "Pour les personnes qui recherchent des produits authentiques, des formules de qualité et des recommandations adaptées, plutôt que de multiplier les produits sans comprendre leur utilité.",
    tint: "#F4EAEB",
  },
];

export function Audiences() {
  const { t } = useI18n();
  return (
    <section className="w-full bg-white py-20 md:py-32 overflow-hidden">
      <div className="w-full max-w-[1600px] mx-auto px-5 md:px-12">
        <div className="max-w-3xl mb-12 md:mb-16">
          <h2 className="text-[2.3rem] md:text-[3.3rem] leading-[1.1] font-medium tracking-tight text-[#2A2424] mb-4">
            {t("The Welfare, pour celles et ceux qui")}{" "}
            <em className="font-serif not-italic text-[#E5B6B9]">{t("choisissent de prendre soin de leur peau")}</em>
          </h2>
          <p className="text-[#2A2424]/60 text-base md:text-lg leading-relaxed">
            {t("Nos soins et nos conseils s'adressent à toutes et à tous, quels que soient votre carnation, votre âge et votre type de peau.")}
          </p>
        </div>

        {/* Swipe on a phone, five columns on a computer */}
        <ul className="-mx-5 px-5 md:mx-0 md:px-0 flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
          {AUDIENCES.map((a, i) => (
            <motion.li
              key={a.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: 0.07 * i, ease: [0.22, 1, 0.36, 1] }}
              className="snap-start shrink-0 w-[78%] sm:w-[45%] md:w-auto flex flex-col"
            >
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-4" style={{ background: a.tint }}>
                {a.image ? (
                  <img src={a.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span className="absolute bottom-4 left-5 font-serif text-[4.5rem] leading-none text-[#2A2424]/15" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-[#2A2424] leading-snug mb-2">{t(a.title)}</h3>
              <p className="text-sm text-[#2A2424]/60 leading-relaxed">{t(a.text)}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
