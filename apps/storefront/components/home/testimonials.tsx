"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Star, Quote } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    id: 1,
    quote: "J'ai essayé des dizaines de boutiques en ligne, mais The Welfare Shop est la seule qui m'a vraiment aidée à comprendre ma peau. La routine personnalisée qu'ils m'ont proposée a transformé ma peau en 3 semaines.",
    name: "Aminata Diallo",
    role: "Cliente · Yaoundé",
    rating: 5,
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
    featured: true,
    bg: "bg-[#2A2424]",
    textColor: "text-white",
    subColor: "text-white/60",
    quoteColor: "text-[#E5B6B9]",
    starColor: "text-[#E5B6B9]",
  },
  {
    id: 2,
    quote: "La qualité des produits coréens est incomparable. Le COSRX Snail Mucin a effacé mes cicatrices d'acné en moins d'un mois. Je ne commande plus nulle part ailleurs.",
    name: "Sophie Ngono",
    role: "Esthéticienne · Douala",
    rating: 5,
    avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
    bg: "bg-white",
    textColor: "text-[#2A2424]",
    subColor: "text-[#2A2424]/50",
    quoteColor: "text-[#E5B6B9]",
    starColor: "text-amber-400",
  },
  {
    id: 3,
    quote: "La livraison est ultra rapide et les produits sont 100% authentiques. J'avais peur des contrefaçons mais tout était parfait, avec les sceaux d'origine coréenne.",
    name: "Fatou Bah",
    role: "Cliente · Douala",
    rating: 5,
    avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
    bg: "bg-[#F4EAEB]",
    textColor: "text-[#2A2424]",
    subColor: "text-[#2A2424]/50",
    quoteColor: "text-[#E5B6B9]",
    starColor: "text-amber-400",
  },
  {
    id: 4,
    quote: "L'assistant IA m'a suggéré une routine anti-taches qui a vraiment fonctionné. C'est comme avoir une dermatologue dans sa poche. Vraiment impressionnant.",
    name: "Clarisse Mvondo",
    role: "Thérapeute beauté · Bafoussam",
    rating: 5,
    avatar: "https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
    bg: "bg-white",
    textColor: "text-[#2A2424]",
    subColor: "text-[#2A2424]/50",
    quoteColor: "text-[#E5B6B9]",
    starColor: "text-amber-400",
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
});

function Stars({ count, color }: { count: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${color}`}
          fill={i < count ? "currentColor" : "none"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const maxIndex = testimonials.length - 1;

  const prev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const next = () => setActiveIndex((i) => Math.min(maxIndex, i + 1));

  return (
    <section className="w-full bg-[#FFFFFF] py-16 md:py-24 lg:py-32 overflow-hidden relative">
      {/* Cherry blossom background illustration */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/cherry-blossom-wide.png"
          alt=""
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      <div className="w-full max-w-[1600px] mx-auto px-5 md:px-8 lg:px-12">

        {/* ══════════════════════
            DESKTOP LAYOUT
            ══════════════════════ */}
        <div className="hidden md:grid md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[580px]">

          {/* Left anchor card — col-span-1, row-span-2 */}
          <motion.div
            {...fadeUp(0)}
            className="md:col-span-1 md:row-span-2 rounded-[1.5rem] bg-[#F4EAEB] p-8 flex flex-col justify-between overflow-hidden relative"
          >
            <>
              {/* Decorative circle */}
              <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-[#E5B6B9]/20 pointer-events-none" />
              <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-[#E5B6B9]/10 pointer-events-none" />

              <div className="relative z-10">
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#2A2424]/50 mb-6">
                  Témoignages
                </p>
                <h2 className="text-3xl lg:text-4xl font-medium text-[#2A2424] leading-tight">
                  Nos Clients<br />
                  <em className="font-serif not-italic text-[#E5B6B9]">Parlent</em><br />
                  d'Eux-Mêmes
                </h2>
                <p className="text-sm text-[#2A2424]/60 mt-5 leading-relaxed">
                  Des milliers de clientes au Cameroun font confiance à The Welfare Shop pour leur routine K-Beauty quotidienne.
                </p>
              </div>

              {/* Nav arrows */}
              <div className="relative z-10 flex items-center gap-3">
                <button
                  onClick={prev}
                  disabled={activeIndex === 0}
                  className="w-11 h-11 rounded-full border border-[#2A2424]/20 flex items-center justify-center text-[#2A2424] hover:bg-[#2A2424] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={next}
                  disabled={activeIndex === maxIndex}
                  className="w-11 h-11 rounded-full bg-[#2A2424] flex items-center justify-center text-white hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-[#2A2424]/40 ml-2">
                  {activeIndex + 1} / {testimonials.length}
                </span>
              </div>
            </>
          </motion.div>

          {/* Featured testimonial — col-span-2, row-span-2 */}
          <motion.div
            {...fadeUp(0.1)}
            key={testimonials[0].id}
            className="md:col-span-2 md:row-span-2 rounded-[1.5rem] bg-[#2A2424] p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden"
          >
            <>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />

              <Quote className="w-10 h-10 text-[#E5B6B9] relative z-10" strokeWidth={1} />

              <div className="relative z-10">
                <p className="text-xl lg:text-2xl text-white leading-relaxed font-light mb-8">
                  "{testimonials[0].quote}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonials[0].avatar}
                    alt={testimonials[0].name}
                    className="w-14 h-14 rounded-[0.75rem] object-cover"
                  />
                  <div>
                    <p className="font-semibold text-white text-base">{testimonials[0].name}</p>
                    <p className="text-white/50 text-sm mb-1.5">{testimonials[0].role}</p>
                    <Stars count={testimonials[0].rating} color="text-[#E5B6B9]" />
                  </div>
                </div>
              </div>
            </>
          </motion.div>

          {/* Small card 1 — col-span-1, row-span-1 */}
          <motion.div
            {...fadeUp(0.2)}
            className="md:col-span-1 md:row-span-1 rounded-[1.5rem] bg-white border border-[#F4EAEB] p-6 flex flex-col justify-between"
          >
            <>
              <Quote className="w-6 h-6 text-[#E5B6B9] mb-3" strokeWidth={1.5} />
              <p className="text-sm text-[#2A2424]/80 leading-relaxed line-clamp-3 flex-1">
                "{testimonials[1].quote}"
              </p>
              <div className="flex items-center gap-3 mt-5">
                <img
                  src={testimonials[1].avatar}
                  alt={testimonials[1].name}
                  className="w-10 h-10 rounded-[0.6rem] object-cover"
                />
                <div>
                  <p className="font-semibold text-[#2A2424] text-sm">{testimonials[1].name}</p>
                  <Stars count={testimonials[1].rating} color="text-amber-400" />
                </div>
              </div>
            </>
          </motion.div>

          {/* Small card 2 — col-span-1, row-span-1 */}
          <motion.div
            {...fadeUp(0.3)}
            className="md:col-span-1 md:row-span-1 rounded-[1.5rem] bg-[#F4EAEB] p-6 flex flex-col justify-between"
          >
            <>
              <Quote className="w-6 h-6 text-[#E5B6B9] mb-3" strokeWidth={1.5} />
              <p className="text-sm text-[#2A2424]/80 leading-relaxed line-clamp-3 flex-1">
                "{testimonials[2].quote}"
              </p>
              <div className="flex items-center gap-3 mt-5">
                <img
                  src={testimonials[2].avatar}
                  alt={testimonials[2].name}
                  className="w-10 h-10 rounded-[0.6rem] object-cover"
                />
                <div>
                  <p className="font-semibold text-[#2A2424] text-sm">{testimonials[2].name}</p>
                  <Stars count={testimonials[2].rating} color="text-amber-400" />
                </div>
              </div>
            </>
          </motion.div>

        </div>

        {/* ══════════════════════
            MOBILE LAYOUT
            ══════════════════════ */}
        <div className="flex flex-col gap-5 md:hidden">

          {/* Header row: title left, dot pagination right */}
          <motion.div {...fadeUp(0)} className="flex items-end justify-between">
            <>
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#2A2424]/50 mb-2">Témoignages</p>
                <h2 className="text-[2rem] leading-[1.1] font-medium text-[#2A2424]">
                  Nos Clients<br />
                  <em className="font-serif not-italic text-[#E5B6B9]">Parlent</em>
                </h2>
              </div>
              <div className="flex items-center gap-1.5 pb-1">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeIndex ? "w-5 h-2 bg-[#2A2424]" : "w-2 h-2 bg-[#2A2424]/20"
                    }`}
                  />
                ))}
              </div>
            </>
          </motion.div>

          {/* Active card — animated */}
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-[1.5rem] ${testimonials[activeIndex].bg} p-7 relative overflow-hidden flex flex-col justify-between min-h-[300px]`}
          >
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />

            <div>
              <Quote className={`w-7 h-7 ${testimonials[activeIndex].quoteColor} mb-4`} strokeWidth={1} />
              <p className={`text-base ${testimonials[activeIndex].textColor} leading-relaxed font-light`}>
                "{testimonials[activeIndex].quote}"
              </p>
            </div>

            <div className="flex items-center justify-between mt-7">
              <div className="flex items-center gap-3">
                <img
                  src={testimonials[activeIndex].avatar}
                  alt={testimonials[activeIndex].name}
                  className="w-12 h-12 rounded-[0.75rem] object-cover"
                />
                <div>
                  <p className={`font-semibold ${testimonials[activeIndex].textColor} text-sm`}>
                    {testimonials[activeIndex].name}
                  </p>
                  <p className={`${testimonials[activeIndex].subColor} text-xs mb-1`}>
                    {testimonials[activeIndex].role}
                  </p>
                  <Stars count={testimonials[activeIndex].rating} color={testimonials[activeIndex].starColor} />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={prev}
                  disabled={activeIndex === 0}
                  className="w-10 h-10 rounded-full border border-[#2A2424]/15 bg-white/60 backdrop-blur-sm flex items-center justify-center text-[#2A2424] transition-all disabled:opacity-25"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={next}
                  disabled={activeIndex === maxIndex}
                  className="w-10 h-10 rounded-full bg-[#2A2424] flex items-center justify-center text-white transition-all disabled:opacity-25"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Thumbnail pill strip */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActiveIndex(i)}
                className={`flex items-center gap-2 shrink-0 px-3 py-2 rounded-full border transition-all duration-300 ${
                  i === activeIndex
                    ? "border-[#2A2424] bg-[#2A2424] text-white"
                    : "border-[#2A2424]/15 bg-white text-[#2A2424]/60"
                }`}
              >
                <img src={t.avatar} alt={t.name} className="w-6 h-6 rounded-full object-cover" />
                <span className="text-xs font-medium whitespace-nowrap">{t.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}
