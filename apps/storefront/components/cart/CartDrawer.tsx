"use client";

import { useCart } from "@/lib/cart-context";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2, Package } from "lucide-react";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount));
}

export function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQuantity, totalItems, totalAmount } =
    useCart();

  const LIVRAISON = 1500;
  const total = totalAmount + (totalAmount > 0 ? LIVRAISON : 0);

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
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            key="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-[90] w-full max-w-[420px] bg-[#FDFBF7] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#EDE0E0]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#2A2424] rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#2A2424]">Mon Panier</h2>
                  <p className="text-[11px] text-[#2A2424]/50">
                    {totalItems} article{totalItems !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="w-9 h-9 rounded-full bg-[#F4EAEB] hover:bg-[#EDE0E0] flex items-center justify-center text-[#2A2424] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 py-16 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-[#F4EAEB]/60 flex items-center justify-center">
                    <Package className="w-9 h-9 text-[#C08A8E]/50" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2A2424]">Votre panier est vide</p>
                    <p className="text-xs text-[#2A2424]/50 mt-1">
                      Ajoutez des produits pour commencer
                    </p>
                  </div>
                  <button
                    onClick={closeCart}
                    className="px-6 py-2.5 bg-[#2A2424] text-white rounded-full text-xs font-bold"
                  >
                    Découvrir la boutique
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 60, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-3 bg-white rounded-2xl p-3 border border-[#EDE0E0]"
                    >
                      {/* Image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#F4EAEB]">
                        <img
                          src={item.thumbnail || "https://placehold.co/80x80/F4EAEB/2A2424?text="}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <p className="text-xs font-semibold text-[#2A2424] line-clamp-2 leading-tight">
                          {item.title}
                        </p>
                        {item.variantTitle && (
                          <span className="text-[10px] text-[#2A2424]/40">{item.variantTitle}</span>
                        )}
                        <p className="text-sm font-bold text-[#2A2424] mt-auto">
                          {formatPrice(item.price * item.quantity)} FCFA
                        </p>

                        {/* Quantity + Delete */}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center border border-[#EDE0E0] rounded-full overflow-hidden bg-[#F8F5F2]">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-[#2A2424] hover:bg-[#F4EAEB] transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-[#2A2424]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-[#2A2424] hover:bg-[#F4EAEB] transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-7 h-7 flex items-center justify-center text-[#2A2424]/30 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-[#EDE0E0] px-6 py-5 space-y-4">
                {/* Totaux */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-[#2A2424]/60">
                    <span>Sous-total</span>
                    <span className="font-medium">{formatPrice(totalAmount)} FCFA</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[#2A2424]/60">
                    <span>Livraison</span>
                    <span className="font-medium">{formatPrice(LIVRAISON)} FCFA</span>
                  </div>
                  <div className="w-full h-px bg-[#EDE0E0]" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#2A2424]">Total</span>
                    <span className="text-lg font-bold text-[#2A2424]">
                      {formatPrice(total)} FCFA
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-[#2A2424] text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-black transition-colors"
                >
                  Commander <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={closeCart}
                  className="w-full text-center text-xs text-[#2A2424]/50 hover:text-[#2A2424] transition-colors py-1"
                >
                  Continuer mes achats
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
