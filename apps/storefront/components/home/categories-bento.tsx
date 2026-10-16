"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

/* ─────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────── */
const cardVariants: any = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as any, delay },
  }),
};

/* ─────────────────────────────────────────
   REUSABLE GLASS LABEL (bottom of photo cards)
───────────────────────────────────────── */
function GlassLabel({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="absolute left-0 right-0 bottom-0 p-3.5 md:p-5 backdrop-blur-md bg-black/25 flex justify-between items-end gap-3">
      <div className="flex-1 min-w-0">
        {eyebrow && (
          <span className="text-[9px] md:text-[10px] font-semibold tracking-widest text-[#E5B6B9] uppercase mb-1 block">
            {eyebrow}
          </span>
        )}
        {/* No truncate: the full name must show on a phone ("Protections solaires", not "Protections…") */}
        <h3 className="text-[15px] md:text-xl lg:text-2xl font-medium text-white leading-tight text-balance">
          {title}
        </h3>
        {sub && (
          <p className="hidden sm:block text-white/75 text-[10px] md:text-xs mt-0.5 line-clamp-2">
            {sub}
          </p>
        )}
      </div>
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 transform group-hover:rotate-45 transition-transform duration-300 ease-in-out shrink-0">
        <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CATEGORIES — in the order of a skincare routine, then the complementary ones
───────────────────────────────────────── */
type PhotoCategory = {
  href: string;
  label: string;
  eyebrow: string;
  sub?: string;
  image: string;
  className: string;
  imageClassName?: string;
  overlay?: string;
};

// Read left to right, top to bottom on both layouts (2 columns on a phone, 4 on a computer)
const ROUTINE: PhotoCategory[] = [
  {
    href: "/shop/nettoyants",
    label: "Nettoyants",
    eyebrow: "Étape 1",
    sub: "Huiles, baumes et gels pour un nettoyage doux.",
    image: "/im_cat_nettoyant.webp",
    className: "col-span-2 bg-[#E5E9E1] min-h-[200px]",
    imageClassName: "mix-blend-multiply",
  },
  {
    href: "/shop/toners-essences",
    label: "Toners et essences",
    eyebrow: "Étape 2",
    image: "/im_cat_toner.webp",
    className: "col-span-1 min-h-[190px]",
    overlay: "bg-black/10 group-hover:bg-black/20",
  },
  {
    href: "/shop/serums",
    label: "Sérums et ampoules",
    eyebrow: "Étape 3",
    image: "/im_cat_serum.webp",
    className: "col-span-1 bg-[#EAD4D5] min-h-[190px]",
    imageClassName: "mix-blend-multiply",
  },
  {
    href: "/shop/hydratants",
    label: "Hydratants",
    eyebrow: "Étape 4",
    image: "/im_cat_hydratant.webp",
    className: "col-span-1 min-h-[190px]",
    overlay: "bg-black/10 group-hover:bg-black/20",
  },
  {
    href: "/shop/soins-contour-des-yeux",
    label: "Contours des yeux",
    eyebrow: "Étape 5",
    image: "/im_cat_eyecare.webp",
    className: "col-span-1 bg-[#DCE4E5] min-h-[190px]",
    imageClassName: "mix-blend-multiply opacity-90",
  },
  {
    href: "/shop/solaires",
    label: "Protections solaires",
    eyebrow: "Étape 6",
    sub: "Le dernier geste du matin, tous les jours.",
    image: "/im_cat_sunscreen.webp",
    className: "col-span-2 min-h-[200px]",
    overlay: "bg-black/15 group-hover:bg-black/25",
  },
  {
    href: "/shop/masques",
    label: "Masques",
    eyebrow: "Soin ciblé",
    sub: "En tissu, hydrogel, à rincer ou de nuit.",
    image: "/im_cat_mask.webp",
    className: "col-span-2 min-h-[200px]",
    overlay: "bg-gradient-to-t from-black/50 via-black/5 to-transparent",
  },
];

const COMPLEMENTARY = [
  { href: "/shop/exfoliants", label: "Exfoliants" },
  { href: "/shop/soins-levres", label: "Soins des lèvres" },
  { href: "/shop/soins-corps", label: "Soins du corps" },
  { href: "/shop/hair-care", label: "Soins des cheveux" },
];

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export function CategoriesBento() {
  const { t } = useI18n();
  return (
    <section className="w-full bg-white py-20 md:py-32 flex flex-col items-center overflow-hidden relative">
      {/* Cherry blossom background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none select-none"
        style={{ backgroundImage: "url('/cherry_blossom_bg.webp')" }}
        aria-hidden="true"
      />
      <div className="w-full max-w-[1600px] mx-auto px-5 md:px-12 relative z-10">

        {/* ── Section Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <h2 className="text-[2.5rem] md:text-[3.5rem] leading-[1.1] font-medium tracking-tight text-[#2A2424] mb-3">
              {t("Explorez par catégorie")}
            </h2>
            <p className="text-[#2A2424]/55 text-base md:text-lg">
              {t("Suivez les étapes d'une routine de soins, du nettoyage à la protection solaire, puis complétez-la selon vos besoins.")}
            </p>
          </div>
          <Link
            href="/shop/all"
            className="flex items-center gap-2 border border-[#2A2424]/20 text-[#2A2424] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#2A2424] hover:text-white transition-all duration-300 shrink-0 self-start md:self-auto"
          >
            {t("Voir tout le catalogue")}
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Bento Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-3 gap-3 md:gap-5 h-auto md:h-[900px] w-full">
          {ROUTINE.map((cat, i) => (
            <motion.a
              key={cat.href}
              href={cat.href}
              custom={0.06 * (i % 4)}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className={`${cat.className} md:min-h-0 rounded-2xl overflow-hidden relative group block`}
            >
              <img
                src={cat.image}
                alt=""
                loading="lazy"
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105 ${cat.imageClassName || ""}`}
              />
              {cat.overlay && <div className={`absolute inset-0 transition-colors duration-300 ease-in-out ${cat.overlay}`} />}
              <GlassLabel eyebrow={t(cat.eyebrow)} title={t(cat.label)} sub={cat.sub ? t(cat.sub) : undefined} />
            </motion.a>
          ))}

          {/* Complementary categories + whole catalogue */}
          <motion.div
            custom={0.2}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="col-span-2 rounded-2xl bg-[#F4EAEB] p-5 md:p-8 flex flex-col justify-between gap-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-[#E5B6B9]/30 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="relative z-10">
              <span className="text-[10px] font-semibold tracking-widest text-[#2A2424]/50 uppercase mb-3 block">
                {t("Pour compléter votre routine")}
              </span>
              <ul className="grid grid-cols-2 gap-2.5">
                {COMPLEMENTARY.map((c) => (
                  <li key={c.href}>
                    <Link
                      href={c.href}
                      className="group flex h-full items-center justify-between gap-2 bg-white/70 hover:bg-white rounded-xl px-3.5 py-3 text-sm md:text-base font-medium text-[#2A2424] transition-colors"
                    >
                      <span>{t(c.label)}</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0 text-[#2A2424]/40 group-hover:text-[#2A2424] transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/shop/all"
              className="relative z-10 w-full sm:w-auto sm:self-start inline-flex items-center justify-center gap-2 bg-[#2A2424] text-white px-6 py-3.5 rounded-full text-sm md:text-base font-medium hover:bg-black/80 transition-all duration-300 ease-in-out"
            >
              {t("Parcourir tout le catalogue")}
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
