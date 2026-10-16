"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

// Brands The Welfare Shop works with (list given by the shop). Each one opens the catalogue filtered on
// that brand: /shop/all matches brand_name across every Medusa collection spelled that way.
const brands = [
  { name: "Mary & May", style: "font-serif font-medium tracking-wide text-2xl md:text-3xl" },
  { name: "Biodance", style: "font-serif font-medium tracking-wide text-2xl md:text-3xl" },
  { name: "Dr.FORHAIR", style: "font-sans font-bold tracking-tight text-xl md:text-2xl" },
  { name: "Isntree", style: "font-sans font-bold tracking-tight text-2xl md:text-3xl lowercase" },
  { name: "Farmstay", style: "font-serif font-normal tracking-[0.15em] text-xl md:text-2xl uppercase" },
  { name: "medicube", style: "font-sans font-black tracking-tighter text-2xl md:text-3xl lowercase" },
  { name: "Cos De BAHA", style: "font-sans font-semibold tracking-[0.1em] text-xl md:text-2xl uppercase" },
  { name: "A'pieu", style: "font-sans font-bold tracking-normal text-2xl md:text-3xl" },
  { name: "Anua", style: "font-serif font-medium tracking-[0.2em] text-2xl md:text-3xl uppercase" },
  { name: "Tocobo", style: "font-sans font-black tracking-tight text-2xl md:text-3xl lowercase" },
  { name: "Jumiso", style: "font-sans font-semibold tracking-[0.2em] text-xl md:text-2xl uppercase" },
  { name: "SKIN1004", style: "font-sans font-light tracking-[0.3em] text-xl md:text-2xl" },
  { name: "K-Secret", style: "font-serif font-medium tracking-wide text-xl md:text-2xl" },
  { name: "Purito", style: "font-sans font-medium tracking-[0.25em] text-xl md:text-2xl uppercase" },
  { name: "Aestura", style: "font-serif font-normal tracking-[0.2em] text-xl md:text-2xl uppercase" },
  { name: "celimax", style: "font-sans font-bold tracking-tight text-2xl md:text-3xl lowercase" },
  { name: "Axis-Y", style: "font-sans font-black tracking-normal text-2xl md:text-3xl uppercase" },
  { name: "Beauty of Joseon", style: "font-serif font-medium tracking-wide text-xl md:text-2xl" },
  { name: "TIAM", style: "font-sans font-bold tracking-[0.3em] text-xl md:text-2xl" },
  { name: "heimish", style: "font-serif font-normal tracking-wide text-2xl md:text-3xl lowercase" },
  { name: "numbuzin", style: "font-sans font-semibold tracking-tight text-2xl md:text-3xl lowercase" },
  { name: "Dr. Althea", style: "font-sans font-medium tracking-[0.1em] text-xl md:text-2xl" },
  { name: "Haruharu Wonder", style: "font-serif font-normal tracking-wide text-xl md:text-2xl lowercase" },
  { name: "Derma:B", style: "font-sans font-bold tracking-normal text-2xl md:text-3xl" },
  { name: "Frudia", style: "font-serif font-medium tracking-[0.15em] text-xl md:text-2xl uppercase" },
];

export function BrandMarquee() {
  const { t } = useI18n();
  return (
    <section className="w-full bg-[#2A2424] py-10 overflow-hidden flex flex-col items-center">
      <div className="w-full max-w-[1600px] mx-auto px-6 md:px-12 mb-6">
        <h2 className="text-center text-xs font-bold tracking-[0.2em] uppercase text-white/60">
          {t("Découvrez les marques avec lesquelles nous collaborons")}
        </h2>
      </div>

      {/* Two copies side by side, the track slides by one copy (-50%) then starts over: seamless loop.
          Hover or keyboard focus pauses it so a logo can be clicked. */}
      <div className="group relative flex w-full overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-[#2A2424] to-transparent z-10 pointer-events-none" />
        <div className="flex w-max items-center animate-[brand-marquee_70s_linear_infinite] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex items-center shrink-0" aria-hidden={copy === 1 || undefined}>
              {brands.map((brand) => (
                <li key={brand.name} className="mx-7 md:mx-11">
                  <Link
                    href={`/shop/all?brand_name=${encodeURIComponent(brand.name)}`}
                    tabIndex={copy === 1 ? -1 : undefined}
                    className="block whitespace-nowrap text-white opacity-55 hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-300"
                  >
                    <span className={brand.style}>{brand.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-[#2A2424] to-transparent z-10 pointer-events-none" />
      </div>
    </section>
  );
}
