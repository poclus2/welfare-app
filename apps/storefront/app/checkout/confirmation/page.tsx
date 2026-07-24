"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle, Phone, ShoppingBag, Copy, Check, Loader2 } from "lucide-react";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount));
}

// Wave payment number for The Welfare
const WAVE_NUMBER = "+221 77 XXX XX XX"; // ← À remplacer avec votre vrai numéro

function ConfirmationContent() {
  const params = useSearchParams();
  const ref = params.get("ref") || "WLF-XXXXX";
  const [order, setOrder] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("welfare_last_order");
      if (stored) {
        setOrder(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(ref).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#F8F5F2] flex flex-col items-center justify-start py-12 px-5">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[520px]"
      >
        {/* Success icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center mb-5"
          >
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[#2A2424] mb-2" style={{ letterSpacing: "-0.02em" }}>
            Commande confirmée ! 🎉
          </h1>
          <p className="text-sm text-[#2A2424]/60 max-w-[340px] leading-relaxed">
            Merci pour votre commande. Nous allons vous contacter très prochainement pour finaliser le paiement.
          </p>
        </div>

        {/* Order ref */}
        <div className="bg-white rounded-2xl border border-[#EDE0E0] p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40 mb-2">
            Numéro de commande
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#2A2424] font-mono tracking-wider">{ref}</span>
            <button
              onClick={handleCopyRef}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#C08A8E] hover:text-[#2A2424] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
        </div>

        {/* Order summary */}
        {order && (
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-5 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40 mb-3">
              Récapitulatif
            </p>
            <div className="space-y-2 mb-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-[#2A2424]/70 line-clamp-1 flex-1 mr-2">
                    {item.title} × {item.quantity}
                  </span>
                  <span className="font-semibold text-[#2A2424] shrink-0">
                    {formatPrice(item.price * item.quantity)} FCFA
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3 border-t border-[#EDE0E0]">
              <span className="text-sm font-bold text-[#2A2424]">Total</span>
              <span className="text-sm font-bold text-[#2A2424]">{formatPrice(order.total)} FCFA</span>
            </div>
          </div>
        )}

        {/* Payment instructions */}
        <div className="bg-[#F4EAEB]/50 border border-[#EDE0E0] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C08A8E] mb-3">
            📱 Instructions de paiement
          </p>
          <ol className="space-y-3 text-sm text-[#2A2424]/70 leading-relaxed">
            <li className="flex gap-2">
              <span className="font-bold text-[#C08A8E] shrink-0">1.</span>
              <span>
                Envoyez le montant total de{" "}
                <strong className="text-[#2A2424]">{order ? formatPrice(order.total) : "—"} FCFA</strong>{" "}
                via <strong className="text-[#2A2424]">Wave</strong>, <strong className="text-[#2A2424]">Orange Money</strong> ou <strong className="text-[#2A2424]">Free Money</strong>.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#C08A8E] shrink-0">2.</span>
              <span>
                Envoyez le paiement au numéro :{" "}
                <span className="font-bold text-[#2A2424] font-mono">{WAVE_NUMBER}</span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#C08A8E] shrink-0">3.</span>
              <span>
                Mentionnez votre numéro de commande{" "}
                <strong className="text-[#2A2424] font-mono">{ref}</strong> dans le message de paiement.
              </span>
            </li>
          </ol>

          <a
            href={`https://wa.me/${WAVE_NUMBER.replace(/\s+/g, "").replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1DA851] transition-colors"
          >
            <Phone className="w-4 h-4" />
            Nous contacter sur WhatsApp
          </a>
        </div>

        {/* Delivery info */}
        {order?.form && (
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-5 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#2A2424]/40 mb-3">
              Livraison prévue à
            </p>
            <p className="text-sm font-semibold text-[#2A2424]">
              {order.form.firstName} {order.form.lastName}
            </p>
            <p className="text-xs text-[#2A2424]/60 mt-1">{order.form.address}</p>
            <p className="text-xs text-[#2A2424]/60">{order.form.city}, {order.form.country}</p>
          </div>
        )}

        {/* CTA back to shop */}
        <Link
          href="/shop"
          className="flex items-center justify-center gap-2 w-full py-4 bg-[#2A2424] text-white rounded-2xl text-sm font-bold hover:bg-black transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Continuer mes achats
        </Link>
      </motion.div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C08A8E] animate-spin" />
      </main>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
