"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, Truck, Package,
  ChevronRight, User, Phone, MapPin, Mail, Loader2
} from "lucide-react";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount));
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes: string;
}

const LIVRAISON = 1500;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "review">("form");
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Sénégal",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const total = totalAmount + LIVRAISON;

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push("/shop");
    }
  }, [items, router]);

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.firstName.trim()) e.firstName = "Requis";
    if (!form.lastName.trim()) e.lastName = "Requis";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Email invalide";
    if (!form.phone.trim()) e.phone = "Requis";
    if (!form.address.trim()) e.address = "Requis";
    if (!form.city.trim()) e.city = "Requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      // Generate a simple order reference
      const orderRef = `WLF-${Date.now().toString(36).toUpperCase()}`;

      // Store order in sessionStorage so the confirmation page can read it
      const order = {
        ref: orderRef,
        items,
        form,
        total,
        livraison: LIVRAISON,
        createdAt: new Date().toISOString(),
      };
      sessionStorage.setItem("welfare_last_order", JSON.stringify(order));

      // Clear the cart
      clearCart();

      // Navigate to confirmation
      router.push(`/checkout/confirmation?ref=${orderRef}`);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const inputClass = (field: keyof FormData) =>
    `w-full px-4 py-3 rounded-xl border text-sm text-[#2A2424] bg-white outline-none transition-all ${
      errors[field]
        ? "border-red-400 focus:ring-2 focus:ring-red-200"
        : "border-[#EDE0E0] focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB]"
    }`;

  if (items.length === 0) {
    return null; // will redirect
  }

  return (
    <main className="min-h-screen bg-[#F8F5F2] text-[#2A2424]">
      {/* Top bar */}
      <div className="bg-white border-b border-[#EDE0E0] px-5 md:px-8 py-4 flex items-center justify-between">
        <Link
          href="/shop"
          className="flex items-center gap-2 text-sm font-medium text-[#2A2424]/60 hover:text-[#2A2424] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la boutique
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2A2424]/50">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Paiement 100% sécurisé
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8">

        {/* LEFT — Form */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-2xl font-bold text-[#2A2424] mb-1" style={{ letterSpacing: "-0.02em" }}>
              Finaliser ma commande
            </h1>
            <p className="text-sm text-[#2A2424]/50 mb-8">
              Remplissez vos informations de livraison ci-dessous.
            </p>

            {/* Form */}
            <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-[#C08A8E]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#2A2424]/50">Identité</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">Prénom</label>
                  <input
                    type="text"
                    placeholder="Fatou"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className={inputClass("firstName")}
                  />
                  {errors.firstName && <p className="text-[10px] text-red-500 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">Nom</label>
                  <input
                    type="text"
                    placeholder="Diallo"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className={inputClass("lastName")}
                  />
                  {errors.lastName && <p className="text-[10px] text-red-500 mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">
                  <Mail className="inline w-3 h-3 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  placeholder="fatou@exemple.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass("email")}
                />
                {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">
                  <Phone className="inline w-3 h-3 mr-1" />
                  Téléphone / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+221 77 000 00 00"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass("phone")}
                />
                {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div className="w-full h-px bg-[#F4EAEB]" />

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C08A8E]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#2A2424]/50">Adresse de livraison</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">Adresse complète</label>
                <input
                  type="text"
                  placeholder="Rue 10, Villa 5, Sacré Cœur 3"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={inputClass("address")}
                />
                {errors.address && <p className="text-[10px] text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">Ville</label>
                  <input
                    type="text"
                    placeholder="Dakar"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className={inputClass("city")}
                  />
                  {errors.city && <p className="text-[10px] text-red-500 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">Pays</label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#EDE0E0] focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] text-sm text-[#2A2424] bg-white outline-none transition-all"
                  >
                    <option>Sénégal</option>
                    <option>Côte d'Ivoire</option>
                    <option>Mali</option>
                    <option>Burkina Faso</option>
                    <option>Guinée</option>
                    <option>Cameroun</option>
                    <option>France</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">
                  Instructions de livraison <span className="text-[#2A2424]/30">(optionnel)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Appeler avant de venir, passer par l'entrée latérale..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#EDE0E0] focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] text-sm text-[#2A2424] bg-white outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Payment info */}
            <div className="mt-4 bg-[#F4EAEB]/40 border border-[#EDE0E0] rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#C08A8E] mb-2">💳 Mode de paiement</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1DAFEC]/10 flex items-center justify-center">
                  <span className="text-lg">📱</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2A2424]">Mobile Money</p>
                  <p className="text-xs text-[#2A2424]/50">Wave · Orange Money · Free Money</p>
                </div>
                <div className="ml-auto">
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full">✓ Disponible</span>
                </div>
              </div>
              <p className="text-[11px] text-[#2A2424]/50 mt-3 leading-relaxed">
                Après confirmation de votre commande, vous recevrez les instructions de paiement par WhatsApp sur le numéro renseigné.
              </p>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Order summary */}
        <motion.div
          className="lg:w-[360px] shrink-0"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 sticky top-24">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4">Récapitulatif</h2>

            {/* Items */}
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F4EAEB] shrink-0">
                    <img
                      src={item.thumbnail || "https://placehold.co/56x56/F4EAEB/2A2424?text="}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#2A2424] line-clamp-2 leading-tight">{item.title}</p>
                    <p className="text-[11px] text-[#2A2424]/50 mt-0.5">Qté : {item.quantity}</p>
                  </div>
                  <p className="text-xs font-bold text-[#2A2424] shrink-0">
                    {formatPrice(item.price * item.quantity)} FCFA
                  </p>
                </div>
              ))}
            </div>

            <div className="w-full h-px bg-[#EDE0E0] mb-4" />

            {/* Totaux */}
            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between text-sm text-[#2A2424]/60">
                <span>Sous-total</span>
                <span>{formatPrice(totalAmount)} FCFA</span>
              </div>
              <div className="flex justify-between text-sm text-[#2A2424]/60">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Livraison
                </span>
                <span>{formatPrice(LIVRAISON)} FCFA</span>
              </div>
              <div className="w-full h-px bg-[#F4EAEB]" />
              <div className="flex justify-between">
                <span className="text-sm font-bold text-[#2A2424]">Total</span>
                <span className="text-base font-bold text-[#2A2424]">{formatPrice(total)} FCFA</span>
              </div>
            </div>

            {/* CTA */}
            <motion.button
              onClick={handleSubmit}
              disabled={isLoading}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 bg-[#2A2424] text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Confirmer ma commande <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            {/* Trust */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-1 text-[10px] text-[#2A2424]/40">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Sécurisé
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#2A2424]/40">
                <Package className="w-3 h-3" /> Authentique
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#2A2424]/40">
                <Truck className="w-3 h-3" /> Livraison rapide
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
