"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ShieldCheck, Truck, Sparkles, ChevronDown,
  ArrowLeft, Star, Heart, Share2, Check, Package, Leaf, Zap,
  ShoppingBag, Plus, Minus, Droplets, Wind, Sun, Moon,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Footer } from "@/components/home/footer";

/* ─── MOCK DATA ───────────────────────────────────────────────── */
const mockProduct = {
  brand: "COSRX",
  title: "Advanced Snail 96 Mucin Power Essence",
  price: "18 500",
  currency: "FCFA",
  rating: 4.9,
  reviewCount: 284,
  badge: "Best-seller",
  images: [
    "https://placehold.co/900x900/F4EAEB/2A2424?text=Produit",
    "https://placehold.co/900x900/FDFBF7/2A2424?text=Texture",
    "https://placehold.co/900x900/F0E8E8/2A2424?text=Application",
  ],
  commercial_description:
    "Une essence légère et apaisante qui pénètre instantanément pour offrir un Glow naturel durable. Sa texture signature répare la barrière cutanée en profondeur et laisse la peau rebondie.",
  benefits: [
    { label: "Hydratation intense", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { label: "Réparation", icon: <Leaf className="w-3.5 h-3.5" /> },
    { label: "Effet Glow", icon: <Zap className="w-3.5 h-3.5" /> },
    { label: "Barrière cutanée", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ],
  layering_steps: [
    {
      step: 1,
      label: "Nettoyage",
      description: "Commencez sur une peau propre et légèrement humide après le double nettoyage.",
      tip: "Peau humide = meilleure absorption",
      icon: "droplets",
      timing: "Matin & Soir",
    },
    {
      step: 2,
      label: "Toner",
      description: "Appliquez votre toner habituel. Attendez 30 secondes qu'il soit absorbé avant de passer à l'étape suivante.",
      tip: "Le toner prépare la peau à recevoir l'essence",
      icon: "wind",
      timing: "Matin & Soir",
    },
    {
      step: 3,
      label: "Cette essence",
      description: "Prélevez 2 à 3 pompes et tapotez délicatement sur l'ensemble du visage du bout des doigts. Évitez le contour des yeux.",
      tip: "Technique du tapotement pour maximiser l'absorption",
      icon: "star",
      timing: "Matin & Soir",
      highlight: true,
    },
    {
      step: 4,
      label: "Crème hydratante",
      description: "Scellez immédiatement avec votre crème pour verrouiller l'hydratation apportée par l'essence.",
      tip: "Ne laissez pas sécher entre les étapes",
      icon: "sun",
      timing: "Matin",
    },
    {
      step: 5,
      label: "Soin de nuit",
      description: "Le soir, remplacez la crème de jour par votre soin de nuit ou sleeping mask pour une réparation intensive.",
      tip: "La nuit, la peau absorbe 2× mieux les actifs",
      icon: "moon",
      timing: "Soir",
    },
  ],
  inci_markdown:
    "### Ingrédients clés\n- **Filtrat de sécrétion d'escargot (96%)** : Répare et hydrate en profondeur.\n- **Hyaluronate de sodium** : Accroche et retient l'hydratation.\n- **Allantoïne** : Apaise et adoucit la peau irritée.\n\n### Liste complète INCI\nSnail Secretion Filtrate, Betaine, Butylene Glycol, 1,2-Hexanediol, Sodium Polyacrylate, Phenoxyethanol, Sodium Hyaluronate, Allantoin, Ethyl Hexanediol, Carbomer, Panthenol, Arginine.",
};

const crossSellMock = [
  { brand: "COSRX", title: "Low pH Good Morning Gel Cleanser", price: "12 000 FCFA", img: "https://placehold.co/400x400/F4EAEB/2A2424?text=Gel" },
  { brand: "Beauty of Joseon", title: "Relief Sun Rice + Probiotics SPF 50+", price: "15 000 FCFA", img: "https://placehold.co/400x400/FDFBF7/2A2424?text=Sun" },
  { brand: "ISNTREE", title: "Hyaluronic Acid Aqua Gel Cream", price: "14 500 FCFA", img: "https://placehold.co/400x400/F0E8E8/2A2424?text=Aqua" },
  { brand: "Dr. Althea", title: "345 Relief Cream Barrier Recovery", price: "22 000 FCFA", img: "https://placehold.co/400x400/F4EAEB/2A2424?text=Cream" },
];

/* ─── UTILS ───────────────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any, delay: i * 0.07 },
  }),
};

/* ─── ACCORDION ───────────────────────────────────────────────── */
function Accordion({
  title,
  children,
  defaultOpen = false,
  accent = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#EDE0E0]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span
          className={`text-sm font-semibold tracking-wide transition-colors ${
            accent
              ? "text-[#C08A8E]"
              : "text-[#2A2424] group-hover:text-[#C08A8E]"
          }`}
        >
          {title}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-4 h-4 text-[#2A2424]/40" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── IMAGE GALLERY ───────────────────────────────────────────── */
function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Main image */}
      <div className="relative w-full aspect-square bg-[#F4EAEB]/40 rounded-none md:rounded-3xl overflow-hidden">
        {/* Top actions */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsWishlisted((w) => !w)}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${
              isWishlisted
                ? "bg-[#E5B6B9] text-white"
                : "bg-white/80 backdrop-blur-sm text-[#2A2424]"
            }`}
          >
            <Heart className="w-4 h-4" fill={isWishlisted ? "currentColor" : "none"} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#2A2424] shadow-md"
          >
            <Share2 className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest bg-[#2A2424] text-white px-2.5 py-1 rounded-full">
            Best-seller
          </span>
        </div>

        {/* Image */}
        <AnimatePresence mode="wait">
          <motion.img
            key={active}
            src={images[active]}
            alt={`${title} — vue ${active + 1}`}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`transition-all duration-300 rounded-full ${
                active === i ? "w-5 h-1.5 bg-[#2A2424]" : "w-1.5 h-1.5 bg-[#2A2424]/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 px-4 md:px-0 overflow-x-auto hide-scrollbar">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
              active === i
                ? "border-[#2A2424] scale-95"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── STAR RATING ─────────────────────────────────────────────── */
function Stars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className="w-3.5 h-3.5"
            fill={s <= Math.round(rating) ? "#E5B6B9" : "none"}
            stroke={s <= Math.round(rating) ? "#E5B6B9" : "#D1C0C0"}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-[#2A2424]">{rating}</span>
      <span className="text-xs text-[#2A2424]/40">({count} avis)</span>
    </div>
  );
}

/* ─── TRUST BADGE ─────────────────────────────────────────────── */
function TrustBadge({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-1 flex-1">
      <div className="w-10 h-10 rounded-2xl bg-[#F4EAEB]/60 flex items-center justify-center text-[#C08A8E]">
        {icon}
      </div>
      <span className="text-[11px] font-semibold text-[#2A2424] leading-tight">{label}</span>
      <span className="text-[10px] text-[#2A2424]/40 leading-tight">{sub}</span>
    </div>
  );
}

/* ─── MAIN COMPONENT ──────────────────────────────────────────── */
export function ProductDetailClient({ product: _product, recommendedProducts = [] }: { product?: any; recommendedProducts?: any[] }) {
  const meta = _product?.metadata || {};
  
  // Extraire le prix réel (premier variant, premier prix)
  let priceStr = mockProduct.price;
  let currencyStr = mockProduct.currency;
  if (_product?.variants?.[0]?.calculated_price) {
    priceStr = new Intl.NumberFormat('fr-FR').format(_product.variants[0].calculated_price.calculated_amount);
    currencyStr = "FCFA";
  } else if (_product?.variants?.[0]?.prices?.[0]) {
    const p = _product.variants[0].prices[0];
    priceStr = new Intl.NumberFormat('fr-FR').format(p.amount);
    currencyStr = p.currency_code?.toUpperCase() || "FCFA";
  }

  // Nettoyer le markdown de l'IA pour enlever la fausse liste INCI
  let cleanInciMarkdown = meta.inci_markdown || mockProduct.inci_markdown;
  const splitIndex = cleanInciMarkdown.indexOf("### Liste complète INCI");
  if (splitIndex !== -1) {
    cleanInciMarkdown = cleanInciMarkdown.substring(0, splitIndex).trim();
  }

  const formattedRecommended = recommendedProducts?.length ? recommendedProducts.map((p: any) => {
    let recPriceStr = mockProduct.price;
    let recCurrencyStr = mockProduct.currency;
    if (p.variants?.[0]?.calculated_price) {
      recPriceStr = new Intl.NumberFormat('fr-FR').format(p.variants[0].calculated_price.calculated_amount);
      recCurrencyStr = "FCFA";
    } else if (p.variants?.[0]?.prices?.[0]) {
      const pr = p.variants[0].prices[0];
      recPriceStr = new Intl.NumberFormat('fr-FR').format(pr.amount);
      recCurrencyStr = pr.currency_code?.toUpperCase() || "FCFA";
    }
    return {
      id: p.id,
      brand: p.collection?.title || "Marque",
      title: p.title,
      price: `${recPriceStr} ${recCurrencyStr}`,
      img: p.images?.[0]?.url || "https://placehold.co/400x400/F4EAEB/2A2424?text=Produit"
    }
  }) : crossSellMock;

  const data = {
    ...mockProduct,
    brand: _product?.collection?.title || mockProduct.brand,
    title: _product?.title || mockProduct.title,
    price: priceStr,
    currency: currencyStr,
    images: _product?.images?.length ? _product.images.map((i: any) => i.url) : mockProduct.images,
    commercial_description: meta.commercial_description || mockProduct.commercial_description,
    layering_steps: meta.layering_steps || mockProduct.layering_steps,
    inci_markdown: cleanInciMarkdown,
    raw_inci: meta.raw_inci || "",
    skin_types: Array.isArray(meta.skin_types) ? meta.skin_types : [],
    skin_concerns: Array.isArray(meta.skin_concerns) ? meta.skin_concerns : [],
  };
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Sticky CTA logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsStickyVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    if (ctaRef.current) observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  const handleAddToCart = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <main className="flex flex-col w-full min-h-screen bg-[#FDFBF7] text-[#2A2424]">

      {/* ══ BREADCRUMB ══════════════════════════════════════════ */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[1160px] mx-auto px-5 md:px-8 pt-5 pb-0"
      >
        <div className="flex items-center gap-2 text-[11px] text-[#2A2424]/40 font-medium">
          <Link href="/" className="hover:text-[#C08A8E] transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#C08A8E] transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Boutique
          </Link>
          <span>/</span>
          <span className="text-[#2A2424] truncate max-w-[160px]">{data.title}</span>
        </div>
      </motion.nav>

      {/* ══ HERO : GALLERY + INFO ════════════════════════════════ */}
      <div ref={heroRef} className="w-full max-w-[1160px] mx-auto px-0 md:px-8 pt-4 md:pt-8 pb-8">
        <div className="flex flex-col lg:flex-row lg:gap-14 xl:gap-20">

          {/* LEFT — Gallery */}
          <motion.div
            className="w-full lg:w-[52%] lg:sticky lg:top-24 lg:self-start"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Gallery images={data.images} title={data.title} />
          </motion.div>

          {/* RIGHT — Info */}
          <div className="w-full lg:w-[48%] px-5 pt-6 md:px-0 md:pt-0 flex flex-col">

            {/* Brand + Rating */}
            <motion.div
              className="flex items-center justify-between mb-3"
              variants={fadeUp} initial="hidden" animate="visible" custom={0}
            >
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#C08A8E]">
                {data.brand}
              </span>
              <Stars rating={data.rating} count={data.reviewCount} />
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-[1.6rem] md:text-[2rem] font-bold text-[#2A2424] leading-[1.2] tracking-tight mb-4"
              style={{ letterSpacing: "-0.02em" }}
            >
              {data.title}
            </motion.h1>

            {/* Price */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="flex items-baseline gap-2 mb-5"
            >
              <span className="text-3xl font-bold text-[#2A2424] tracking-tight">{data.price}</span>
              <span className="text-sm font-semibold text-[#2A2424]/50">{data.currency}</span>
              <span className="ml-auto text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> En stock
              </span>
            </motion.div>

            {/* Description */}
            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="text-sm text-[#2A2424]/65 leading-[1.75] mb-6 border-l-2 border-[#E5B6B9] pl-4"
            >
              {data.commercial_description}
            </motion.p>

            {/* Préoccupations ciblées */}
            {data.skin_concerns.length > 0 && (
              <motion.div
                variants={fadeUp} initial="hidden" animate="visible" custom={4}
                className="mb-7"
              >
                <span className="text-[10px] font-bold text-[#2A2424]/40 uppercase tracking-widest block mb-2">Préoccupations ciblées</span>
                <div className="flex flex-wrap gap-2">
                  {data.skin_concerns.map((concern: string, i: number) => (
                    <span
                      key={`concern-top-${i}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white border border-[#EDE0E0] text-[#2A2424]"
                    >
                      <span className="text-[#C08A8E]">✦</span> {concern}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quantity */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={5}
              className="flex items-center gap-3 mb-4"
            >
              <span className="text-xs font-semibold text-[#2A2424]/50 uppercase tracking-wider w-20">Quantité</span>
              <div className="flex items-center border border-[#EDE0E0] rounded-full overflow-hidden bg-white shadow-sm">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center text-[#2A2424] hover:bg-[#F4EAEB] transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-[#2A2424]">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-9 h-9 flex items-center justify-center text-[#2A2424] hover:bg-[#F4EAEB] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              ref={ctaRef}
              variants={fadeUp} initial="hidden" animate="visible" custom={6}
              className="mb-6"
            >
              <motion.button
                onClick={handleAddToCart}
                whileTap={{ scale: 0.97 }}
                className="relative w-full overflow-hidden py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg"
                style={{
                  background: added
                    ? "linear-gradient(135deg, #4ade80, #22c55e)"
                    : "linear-gradient(135deg, #2A2424 0%, #3D3030 100%)",
                  boxShadow: "0 4px 24px rgba(42,36,36,0.25)",
                  transition: "background 0.4s ease",
                }}
              >
                <AnimatePresence mode="wait">
                  {added ? (
                    <motion.span
                      key="check"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Ajouté au panier !
                    </motion.span>
                  ) : (
                    <motion.span
                      key="bag"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" /> Ajouter au panier — {data.price} FCFA
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={7}
              className="flex items-start justify-between gap-3 px-2 py-4 rounded-2xl bg-white border border-[#EDE0E0] mb-6"
            >
              <TrustBadge icon={<ShieldCheck className="w-5 h-5" />} label="Paiement" sub="100% Sécurisé" />
              <div className="w-px h-10 self-center bg-[#EDE0E0]" />
              <TrustBadge icon={<Truck className="w-5 h-5" />} label="Livraison" sub="Rapide & Locale" />
              <div className="w-px h-10 self-center bg-[#EDE0E0]" />
              <TrustBadge icon={<Package className="w-5 h-5" />} label="Authentique" sub="Certifié K-Beauty" />
            </motion.div>

            {/* ── ACCORDÉONS ─────────────────────────────────── */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={8}
            >
              <Accordion title="✦ Pourquoi on l'aime" defaultOpen accent>
                <div className="flex flex-col gap-3 pt-1">
                  {data.skin_types.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-[#2A2424]/40 uppercase tracking-widest block mb-2">Types de peau</span>
                      <div className="flex flex-wrap gap-2">
                        {data.skin_types.map((type: string, i: number) => (
                          <motion.span
                            key={`type-${i}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="inline-flex items-center text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#F4EAEB] text-[#2A2424]"
                          >
                            {type}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fallback si vide */}
                  {data.skin_types.length === 0 && (
                    <div className="flex flex-wrap gap-2">
                      {data.benefits.map((b, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#F4EAEB] text-[#2A2424]"
                        >
                          <span className="text-[#C08A8E]">{b.icon}</span>
                          {b.label}
                        </motion.span>
                      ))}
                    </div>
                  )}
                </div>
              </Accordion>

              <Accordion title="Conseils d'utilisation">
                <div className="pt-2 pb-1">
                  {data.layering_steps.map((step, i) => {
                    const iconMap: Record<string, React.ReactNode> = {
                      droplets: <Droplets className="w-4 h-4" />,
                      wind: <Wind className="w-4 h-4" />,
                      star: <Sparkles className="w-4 h-4" />,
                      sun: <Sun className="w-4 h-4" />,
                      moon: <Moon className="w-4 h-4" />,
                    };
                    const isLast = i === data.layering_steps.length - 1;
                    return (
                      <motion.div
                        key={step.step}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="flex gap-3"
                      >
                        {/* Left — connector line */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              step.highlight
                                ? "bg-[#2A2424] text-white shadow-md"
                                : "bg-[#F4EAEB] text-[#C08A8E]"
                            }`}
                          >
                            {iconMap[step.icon]}
                          </div>
                          {!isLast && (
                            <div className="w-px flex-1 my-1.5 bg-gradient-to-b from-[#EDE0E0] to-transparent min-h-[20px]" />
                          )}
                        </div>

                        {/* Right — content */}
                        <div className={`flex-1 pb-5 ${isLast ? "" : ""}`}>
                          {/* Header row */}
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-widest ${
                                  step.highlight ? "text-[#2A2424]" : "text-[#2A2424]/40"
                                }`}
                              >
                                Étape {step.step}
                              </span>
                              {step.highlight && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#E5B6B9]/30 text-[#C08A8E] px-2 py-0.5 rounded-full">
                                  Ce produit
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                step.timing === "Matin & Soir"
                                  ? "bg-[#F4EAEB] text-[#C08A8E]"
                                  : step.timing === "Matin"
                                  ? "bg-amber-50 text-amber-500"
                                  : "bg-indigo-50 text-indigo-400"
                              }`}
                            >
                              {step.timing}
                            </span>
                          </div>

                          {/* Step title */}
                          <p
                            className={`text-sm font-semibold mb-1 ${
                              step.highlight ? "text-[#2A2424]" : "text-[#2A2424]/80"
                            }`}
                          >
                            {step.label}
                          </p>

                          {/* Description */}
                          <p className="text-xs text-[#2A2424]/50 leading-relaxed mb-2">
                            {step.description}
                          </p>

                          {/* Pro tip */}
                          <div className="inline-flex items-center gap-1.5 bg-[#FDFBF7] border border-[#EDE0E0] rounded-lg px-2.5 py-1.5">
                            <span className="text-[#C08A8E] text-[10px]">✦</span>
                            <span className="text-[10px] text-[#2A2424]/50 italic">{step.tip}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </Accordion>

              <Accordion title="Transparence & Ingrédients INCI">
                <div className="prose prose-sm prose-stone max-w-none text-[#2A2424]/60 pt-1
                  [&_h3]:text-[13px] [&_h3]:font-bold [&_h3]:text-[#2A2424] [&_h3]:mb-2
                  [&_strong]:text-[#2A2424] [&_ul]:pl-4 [&_li]:mb-1.5">
                  <ReactMarkdown>{data.inci_markdown}</ReactMarkdown>

                  <div className="mt-6 pt-4 border-t border-[#EDE0E0]">
                    <h3 className="text-[13px] font-bold text-[#2A2424] mb-2">Liste complète INCI</h3>
                    <p className="text-xs leading-relaxed text-[#2A2424]/60">
                      {data.raw_inci || "Non communiquée"}
                    </p>
                  </div>
                </div>
              </Accordion>
            </motion.div>

          </div>
        </div>
      </div>

      {/* ══ ROUTINE SECTION — "Complétez votre routine" ══════════ */}
      <section className="w-full bg-[#F4EAEB]/30 border-t border-[#EDE0E0] py-12 overflow-hidden">
        <div className="w-full max-w-[1160px] mx-auto">
          <motion.div
            className="px-5 md:px-8 mb-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C08A8E] mb-1">Allez plus loin</p>
            <h2 className="text-xl md:text-2xl font-bold text-[#2A2424] tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              Complétez votre routine
            </h2>
          </motion.div>
        </div>

        <div className="w-full pl-5 md:pl-8 lg:pl-[calc((100vw-1160px)/2+32px)]">
          <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 pr-5 md:pr-8 pb-4">
            {formattedRecommended.map((item: any, i: number) => (
              <motion.div
                key={item.id || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="shrink-0 snap-start"
              >
                <Link
                  href={item.id ? `/shop/product/${item.id}` : "#"}
                  className="w-[160px] md:w-[200px] flex flex-col group"
                >
                  <div className="w-full aspect-square rounded-2xl overflow-hidden mb-3 bg-white border border-[#EDE0E0] relative">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-[#2A2424]/0 group-hover:bg-[#2A2424]/5 transition-colors rounded-2xl" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#C08A8E] mb-1">
                    {item.brand}
                  </span>
                  <span className="text-xs font-semibold text-[#2A2424] line-clamp-2 mb-2 group-hover:text-[#C08A8E] transition-colors leading-tight">
                    {item.title}
                  </span>
                  <span className="text-xs font-bold text-[#2A2424]">{item.price}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STICKY CTA — MOBILE ONLY ════════════════════════════ */}
      <AnimatePresence>
        {isStickyVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe-bottom"
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
          >
            <div className="bg-white/90 backdrop-blur-xl border border-[#EDE0E0] rounded-2xl p-3 shadow-[0_-8px_40px_rgba(42,36,36,0.12)] flex items-center gap-3">
              {/* Mini product preview */}
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F4EAEB] shrink-0">
                <img src={data.images[0]} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] font-medium text-[#2A2424]/60 truncate">{data.title}</span>
                <span className="text-sm font-bold text-[#2A2424]">{data.price} FCFA</span>
              </div>
              <motion.button
                onClick={handleAddToCart}
                whileTap={{ scale: 0.95 }}
                className="shrink-0 px-5 py-2.5 bg-[#2A2424] text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Ajouter
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
