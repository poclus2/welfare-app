"use client";

import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, Minus, Plus, ArrowRight, Trash, Package, ShoppingBag } from "@phosphor-icons/react";
import { PromoCodeField } from "./PromoCodeField";
import { DISPLAY_FONT, SK } from "@/components/account/account-ui";

// The cart, in the Skin Coach look of the customer space (pink-white ground, white cards, magenta as the
// only accent). The delivery fee depends on the city or the pick-up shop chosen at checkout: it is not
// guessed here.

function formatPrice(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount));
}

export function CartDrawer() {
  const { t } = useI18n();
  const { isOpen, closeCart, items, removeItem, updateQuantity, totalItems, totalAmount, discountTotal, freeShipping } =
    useCart();

  const total = Math.max(0, totalAmount - discountTotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCart}
            className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            key="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t("Mon panier")}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-[120] w-full max-w-[440px] shadow-2xl flex flex-col"
            style={{ background: SK.ground, color: SK.ink }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 pt-6 pb-4">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: SK.muted }}>
                  {totalItems} {totalItems !== 1 ? t("articles") : t("article")}
                </p>
                <h2 style={{ margin: 0, fontFamily: DISPLAY_FONT, fontSize: 34, lineHeight: 1.04, fontWeight: 300, letterSpacing: "-0.02em" }}>
                  {t("Mon")} <span style={{ fontWeight: 700, color: SK.accent }}>{t("panier")}</span>
                </h2>
              </div>
              <button
                onClick={closeCart}
                aria-label={t("Fermer")}
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ background: SK.surface, border: `1px solid ${SK.line}`, color: SK.ink }}
              >
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-2.5">
              {items.length === 0 ? (
                <div className="my-auto rounded-[26px] p-6 flex flex-col items-start gap-3" style={{ background: SK.surface, border: `1px dashed ${SK.line}` }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: SK.tint }}>
                    <ShoppingBag className="w-7 h-7" style={{ color: SK.accent }} />
                  </div>
                  <p style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700 }}>{t("Votre panier est vide")}</p>
                  <p className="text-[14px] leading-relaxed" style={{ color: SK.muted }}>{t("Ajoutez des produits pour commencer")}</p>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="h-[46px] px-[18px] rounded-full flex items-center text-[14px] font-bold"
                    style={{ background: SK.accent, color: "#FFFFFF" }}
                  >
                    {t("Découvrir la boutique")}
                  </Link>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 60, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-3 rounded-[22px] p-2.5"
                      style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}
                    >
                      <div className="w-[84px] h-[84px] rounded-2xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: SK.tint }}>
                        {item.thumbnail
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={item.thumbnail} alt="" className="w-full h-full object-contain" />
                          : <Package className="w-7 h-7" style={{ color: SK.muted }} />}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[14px] font-bold leading-snug line-clamp-2">{item.title}</p>
                          <button
                            onClick={() => removeItem(item.id)}
                            aria-label={`${t("Retirer")} ${item.title}`}
                            className="w-8 h-8 -mt-1 -mr-1 rounded-full flex items-center justify-center shrink-0 hover:bg-[#FCEAF3] transition-colors"
                            style={{ color: SK.muted }}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                        {item.variantTitle && <span className="text-[12px]" style={{ color: SK.muted }}>{item.variantTitle}</span>}

                        <div className="flex items-center justify-between gap-2 mt-auto pt-2">
                          <div className="flex items-center h-9 rounded-full" style={{ border: `1px solid ${SK.line}` }}>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label={t("Diminuer la quantité")}
                              className="w-9 h-9 flex items-center justify-center rounded-full"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-[14px] font-bold" aria-live="polite">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label={t("Augmenter la quantité")}
                              className="w-9 h-9 flex items-center justify-center rounded-full"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[15px] font-bold whitespace-nowrap">{formatPrice(item.price * item.quantity)} FCFA</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col gap-3.5" style={{ background: SK.surface, borderTop: `1px solid ${SK.lineSoft}`, borderRadius: "26px 26px 0 0" }}>
                <PromoCodeField />

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[14px]">
                    <span style={{ color: SK.muted }}>{t("Sous-total")}</span>
                    <span>{formatPrice(totalAmount)} FCFA</span>
                  </div>
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-[14px]">
                      <span style={{ color: SK.muted }}>{t("Réduction")}</span>
                      <span style={{ color: "#0B6B45" }}>− {formatPrice(discountTotal)} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[14px]">
                    <span style={{ color: SK.muted }}>{t("Livraison")}</span>
                    <span style={freeShipping ? { color: "#0B6B45", fontWeight: 600 } : { color: SK.muted }}>
                      {freeShipping ? t("Offerte") : t("Calculée à l'étape suivante")}
                    </span>
                  </div>
                  <div className="h-px" style={{ background: SK.lineSoft }} />
                  <div className="flex justify-between items-baseline">
                    <span className="text-[15px] font-bold">{t("Total")}</span>
                    <span style={{ fontFamily: DISPLAY_FONT, fontSize: 26, fontWeight: 700 }}>{formatPrice(total)} FCFA</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="h-[58px] rounded-full text-[16px] font-bold flex items-center justify-center gap-2"
                  style={{ background: SK.accent, color: "#FFFFFF" }}
                >
                  {t("Commander")} <ArrowRight className="w-5 h-5" />
                </Link>
                <button onClick={closeCart} className="h-10 text-[14px] font-semibold underline-offset-2 hover:underline" style={{ color: SK.muted }}>
                  {t("Continuer mes achats")}
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
