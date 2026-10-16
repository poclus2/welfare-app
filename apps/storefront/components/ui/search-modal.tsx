"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { instantMeiliSearch } from "@meilisearch/instant-meilisearch";
import { InstantSearch, SearchBox, Highlight, Configure, useHits, useSearchBox } from "react-instantsearch";
import { X, MagnifyingGlass, ArrowRight, Scan, BookOpen } from "@phosphor-icons/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { sdk } from "@/lib/medusa";
import { useI18n } from "@/lib/i18n-context";
import { DISPLAY_FONT, SK } from "@/components/ui/skin-coach/theme";

// The search bar, in the Skin Coach look. It reads the Meilisearch "products" index with the search-only
// key (synonyms, needs, skin types, actives and in-stock ranking are set by the API, lib/meili-products.ts).

// every word must match, like the results page (lib/meili-search.ts), so "Voir les N résultats" is right
const searchClient = instantMeiliSearch(
  process.env.NEXT_PUBLIC_MEILISEARCH_HOST || "http://localhost:7700",
  process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY || "",
  { meiliSearchParams: { matchingStrategy: "all" as any } }
);

// shown before anything is typed: what shoppers look for most
const SUGGESTIONS = ["Peau grasse", "Écran solaire", "Taches", "Acné", "Niacinamide", "Peau sensible"];

const resultsUrl = (q: string) => `/shop/all?q=${encodeURIComponent(q)}`;

function Hit({ hit, onClose }: { hit: any; onClose: () => void }) {
  const { t } = useI18n();
  const soldOut = hit.in_stock === 0;
  return (
    <Link
      href={`/shop/product/${hit.id}`}
      onClick={onClose}
      className="flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-[#FCEAF3]/60"
      style={{ borderBottom: `1px solid ${SK.lineSoft}` }}
    >
      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0" style={{ border: `1px solid ${SK.lineSoft}` }}>
        {hit.thumbnail ? (
          <img src={hit.thumbnail} alt="" className={`w-full h-full object-contain ${soldOut ? "opacity-50" : ""}`} />
        ) : (
          <MagnifyingGlass className="w-5 h-5" style={{ color: SK.line }} />
        )}
      </div>
      <div className="flex flex-col flex-1 min-w-0 [&_mark]:bg-transparent [&_mark]:font-bold [&_mark]:text-[#E0187C]">
        <p className="text-[14px] font-bold leading-snug line-clamp-2" style={{ color: SK.ink }}>
          <Highlight attribute="title" hit={hit} />
        </p>
        {hit.description ? (
          <p className="text-[12px] truncate mt-0.5" style={{ color: SK.muted }}>{String(hit.description).replace(/[#*`]/g, "")}</p>
        ) : null}
        <div className="flex items-center gap-2 mt-1">
          {hit.price ? (
            <span style={{ fontFamily: DISPLAY_FONT, fontSize: 15, fontWeight: 700, color: SK.accent }}>
              {new Intl.NumberFormat("fr-FR").format(hit.price)} <span className="text-[11px]">FCFA</span>
            </span>
          ) : null}
          {soldOut && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: SK.track, color: SK.muted }}>{t("Rupture")}</span>
          )}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 shrink-0" style={{ color: SK.muted }} />
    </Link>
  );
}

export function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector("input");
    if (input && input.value.trim()) {
      onClose();
      router.push(resultsUrl(input.value.trim()));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#2A2424]/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -16, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.97, y: -16, x: "-50%" }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={t("Rechercher un produit")}
            className="fixed top-[8%] left-1/2 w-[92%] max-w-2xl rounded-[28px] shadow-2xl z-[60] overflow-hidden"
            style={{ background: SK.ground, border: `1px solid ${SK.line}` }}
          >
            <div className="flex flex-col h-full max-h-[82vh]">
              <InstantSearch searchClient={searchClient.searchClient} indexName="products">
                <Configure hitsPerPage={6} />

                <div className="flex items-center gap-3 px-4 py-3.5 bg-white" style={{ borderBottom: `1px solid ${SK.lineSoft}` }}>
                  <MagnifyingGlass className="w-5 h-5 shrink-0 ml-1" style={{ color: SK.accent }} weight="bold" />
                  <SearchBox
                    onSubmit={handleSubmit}
                    placeholder={t("Un produit, une marque, un besoin...")}
                    classNames={{
                      root: "flex-1 min-w-0",
                      form: "relative flex items-center",
                      input: "w-full bg-transparent border-none outline-none text-[17px] text-[#2A2424] placeholder:text-[#2A2424]/35",
                      submit: "hidden",
                      reset: "hidden",
                    }}
                    autoFocus
                  />
                  <button
                    onClick={onClose}
                    aria-label={t("Fermer")}
                    className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-colors"
                    style={{ background: SK.tint, color: SK.ink }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-y-auto hide-scrollbar flex-1">
                  <Results onClose={onClose} />
                </div>
              </InstantSearch>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Results({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { hits, results } = useHits();
  const { query, refine } = useSearchBox();
  const total = results?.nbHits ?? hits.length;

  useEffect(() => {
    if (!query || query.length < 3) return;

    const timer = setTimeout(() => {
      sdk.client.fetch(`/store/search-analytics`, {
        method: "POST",
        body: {
          term: query,
          results_count: total,
        },
      }).catch(e => console.error("Search tracking error", e));
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [query, total]);

  // nothing typed yet: popular searches
  if (!query) {
    return (
      <div className="p-5 flex flex-col gap-3">
        <p className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: SK.muted }}>{t("Recherches fréquentes")}</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => refine(s)}
              className="h-10 px-4 rounded-full text-[14px] font-semibold bg-white transition-colors hover:border-[#E0187C]"
              style={{ border: `1px solid ${SK.line}`, color: SK.ink }}
            >
              {t(s)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (hits.length === 0) {
    return (
      <div className="p-5 flex flex-col gap-4">
        <div className="text-center py-3">
          <h3 style={{ margin: 0, fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 300, color: SK.ink }}>
            {t("Aucun résultat pour")} <span style={{ fontWeight: 700, color: SK.accent }}>«&nbsp;{query}&nbsp;»</span>
          </h3>
          <p className="text-[14px] mt-1.5" style={{ color: SK.muted }}>{t("Essayez un autre mot, ou laissez-vous guider :")}</p>
          {query.trim().includes(" ") && (
            <Link href={resultsUrl(query)} onClick={onClose} className="inline-block mt-2 text-[14px] font-bold underline underline-offset-2" style={{ color: SK.accent }}>
              {t("Voir les produits les plus proches")}
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/skin-coach" onClick={onClose} className="rounded-3xl p-4 flex items-start gap-3 text-white" style={{ background: SK.accent }}>
            <Scan className="w-6 h-6 shrink-0" />
            <span className="flex flex-col gap-0.5">
              <span style={{ fontFamily: DISPLAY_FONT, fontSize: 17, fontWeight: 700 }}>{t("Skin Coach")}</span>
              <span className="text-[13px] leading-snug">{t("Votre routine sur-mesure à partir d'une photo de votre peau.")}</span>
            </span>
          </Link>
          <Link href="/learning" onClick={onClose} className="rounded-3xl p-4 flex items-start gap-3 bg-white" style={{ border: `1px solid ${SK.line}`, color: SK.ink }}>
            <BookOpen className="w-6 h-6 shrink-0" style={{ color: SK.accent }} />
            <span className="flex flex-col gap-0.5">
              <span style={{ fontFamily: DISPLAY_FONT, fontSize: 17, fontWeight: 700 }}>{t("Skin Learning Center")}</span>
              <span className="text-[13px] leading-snug" style={{ color: SK.muted }}>{t("Nos guides sur les actifs et les besoins de la peau.")}</span>
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="bg-white">
        {hits.map((hit: any) => (
          <Hit key={hit.id || hit.objectID} hit={hit} onClose={onClose} />
        ))}
      </div>
      <Link
        href={resultsUrl(query)}
        onClick={onClose}
        className="m-3 h-12 rounded-full flex items-center justify-center gap-2 text-[14px] font-bold text-white"
        style={{ background: SK.accent }}
      >
        {total > hits.length ? `${t("Voir les")} ${total} ${t("résultats")}` : t("Voir les résultats")}
        <ArrowRight className="w-4 h-4" weight="bold" />
      </Link>
    </div>
  );
}
