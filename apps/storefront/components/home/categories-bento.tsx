"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Search, PackageSearch } from "lucide-react";
import Link from "next/link";

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
  position = "bottom",
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  position?: "top" | "bottom";
}) {
  return (
    <div
      className={`absolute left-0 right-0 ${
        position === "bottom" ? "bottom-0" : "top-0"
      } p-4 md:p-5 backdrop-blur-md bg-black/25 flex justify-between items-end gap-3`}
    >
      <div className="flex-1 min-w-0">
        {eyebrow && (
          <span className="text-[9px] md:text-[10px] font-semibold tracking-widest text-[#E5B6B9] uppercase mb-1 block">
            {eyebrow}
          </span>
        )}
        <h3 className="text-base md:text-xl lg:text-2xl font-medium text-white leading-tight truncate">
          {title}
        </h3>
        {sub && (
          <p className="text-white/75 text-[10px] md:text-xs mt-0.5 line-clamp-2">
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
   MAIN COMPONENT
───────────────────────────────────────── */
export function CategoriesBento() {
  return (
    <section className="w-full bg-white py-20 md:py-32 flex flex-col items-center overflow-hidden relative">
      {/* Cherry blossom background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none select-none"
        style={{ backgroundImage: "url('/cherry_blossom_bg.png')" }}
        aria-hidden="true"
      />
      <div className="w-full max-w-[1600px] mx-auto px-8 md:px-12 relative z-10">

        {/* ── Section Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <h2 className="text-[2.5rem] md:text-[3.5rem] leading-[1.1] font-medium tracking-tight text-[#2A2424] mb-3">
              Explorez par catégorie
            </h2>
            <p className="text-[#2A2424]/55 text-base md:text-lg">
              Trouvez exactement ce dont votre peau a besoin parmi notre vaste sélection de soins K-Beauty premium.
            </p>
          </div>
          <Link
            href="/shop"
            className="flex items-center gap-2 border border-[#2A2424]/20 text-[#2A2424] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#2A2424] hover:text-white transition-all duration-300 shrink-0"
          >
            Voir les 2 500+ produits
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Bento Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-3 gap-4 md:gap-5 h-auto md:h-[900px] w-full">

          {/* ── ROW 1 ── */}

          {/* [1] Wide — Hydratants */}
          <motion.a
            href="/shop?category=Hydratants"
            custom={0}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="col-span-2 md:col-span-2 row-span-1 rounded-2xl overflow-hidden relative group block min-h-[200px] md:min-h-[0]"
          >
            <img
              src="/im_cat_hydratant.png"
              alt="Hydratants"
              className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300 ease-in-out" />
            <GlassLabel
              title="Hydratants"
              sub="Restaurez et protégez la barrière cutanée avec nos crèmes essentielles."
              position="bottom"
            />
          </motion.a>

          {/* [2] Square — Nettoyants */}
          <motion.a
            href="/shop?category=Nettoyants"
            custom={0.08}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="col-span-1 row-span-1 rounded-2xl overflow-hidden relative group bg-[#E5E9E1] block min-h-[160px] md:min-h-[0]"
          >
            <img
              src="/im_cat_nettoyant.png"
              alt="Nettoyants"
              className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 ease-in-out group-hover:scale-105"
            />
            <GlassLabel title="Nettoyants" position="bottom" />
          </motion.a>

          {/* [3] Tall (row-span-2) — Masques en Tissu */}
          <motion.a
            href="/shop?category=Masques en Tissu"
            custom={0.16}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="col-span-1 row-span-2 rounded-2xl overflow-hidden relative group block min-h-[340px] md:min-h-[0]"
          >
            <img
              src="/im_cat_mask.png"
              alt="Masques en Tissu"
              className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
            <GlassLabel
              eyebrow="Rituels Ciblés"
              title="Masques en Tissu"
              sub="Soins iconiques K-Beauty."
              position="bottom"
            />
          </motion.a>

          {/* ── ROW 2 ── */}

          {/* [4] Square — Sérums & Ampoules */}
          <motion.a
            href="/shop?category=Sérums & Ampoules"
            custom={0.1}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="col-span-1 row-span-1 rounded-2xl overflow-hidden relative group bg-[#EAD4D5] block min-h-[160px] md:min-h-[0]"
          >
            <img
              src="/im_cat_serum.png"
              alt="Sérums & Ampoules"
              className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 ease-in-out group-hover:scale-105"
            />
            <GlassLabel title="Sérums & Ampoules" position="bottom" />
          </motion.a>

          {/* [5] Square — Protections Solaires */}
          <motion.a
            href="/shop?category=Protections Solaires"
            custom={0.18}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="col-span-1 row-span-1 rounded-2xl overflow-hidden relative group block min-h-[160px] md:min-h-[0]"
          >
            <img
              src="/im_cat_sunscreen.png"
              alt="Protections Solaires"
              className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors duration-300 ease-in-out" />
            <GlassLabel title="Protections Solaires" position="bottom" />
          </motion.a>

          {/* [6] Square — Soins Contour des Yeux */}
          <motion.a
            href="/shop?category=Soins Contour des Yeux"
            custom={0.26}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="col-span-1 row-span-1 rounded-2xl overflow-hidden relative group bg-[#DCE4E5] block min-h-[160px] md:min-h-[0]"
          >
            <img
              src="/im_cat_eyecare.png"
              alt="Soins Contour des Yeux"
              className="w-full h-full object-cover mix-blend-multiply opacity-90 transition-transform duration-700 ease-in-out group-hover:scale-105"
            />
            <GlassLabel title="Soins Contour des Yeux" position="bottom" />
          </motion.a>

          {/* ── ROW 3 ── */}

          {/* [7] Promo block — Palette harmonisée #F4EAEB */}
          <motion.div
            custom={0.2}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="col-span-2 md:col-span-2 row-span-1 rounded-2xl bg-[#F4EAEB] p-6 md:p-10 flex flex-col justify-between relative overflow-hidden group min-h-[200px] md:min-h-[0]"
          >
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-[#E5B6B9]/30 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 md:w-32 md:h-32 bg-[#E5B6B9]/20 blur-2xl rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#E5B6B9]/30 backdrop-blur-sm flex items-center justify-center mb-4">
                <PackageSearch className="w-5 h-5 md:w-6 md:h-6 text-[#2A2424]" />
              </div>
              <h3 className="text-2xl md:text-4xl font-medium text-[#2A2424] mb-2">
                2 500+ Produits
              </h3>
              <p className="text-[#2A2424]/65 mb-6 max-w-sm text-sm md:text-base">
                Le plus grand catalogue de soins coréens authentiques et vérifiés.
              </p>
            </div>

            <Link
              href="/shop"
              className="relative z-10 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2A2424] text-white px-6 py-3.5 rounded-full text-sm md:text-base font-medium hover:bg-black/80 transition-all duration-300 ease-in-out"
            >
              <Search className="w-4 h-4" />
              Parcourir le catalogue
            </Link>
          </motion.div>

          {/* [8] Wide — Toners */}
          <motion.a
            href="/shop?category=Toners"
            custom={0.28}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="col-span-2 md:col-span-2 row-span-1 rounded-2xl overflow-hidden relative group block min-h-[200px] md:min-h-[0]"
          >
            <img
              src="/im_cat_toner.png"
              alt="Toners"
              className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300 ease-in-out" />
            <GlassLabel
              title="Toners"
              sub="Préparation essentielle post-nettoyage."
              position="bottom"
            />
          </motion.a>

        </div>
      </div>
    </section>
  );
}
