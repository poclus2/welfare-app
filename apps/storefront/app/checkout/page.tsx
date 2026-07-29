"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { sdk } from "@/lib/medusa";
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, Truck, Package,
  ChevronRight, ChevronLeft, User, Phone, MapPin, Mail, Loader2,
  Store, Home, Check,
} from "lucide-react";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount));
}

// ─── Types ────────────────────────────────────────────────────────────────────
type DeliveryMode = "domicile" | "retrait";
type StoreLocation = "hippodrome" | "playce" | null;

interface IdentityForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface DeliveryForm {
  mode: DeliveryMode;
  store: StoreLocation;      // used only for retrait
  address: string;           // used only for domicile
  city: string;              // used only for domicile
  country: string;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LIVRAISON_FEE = 1500;

const STORES = [
  {
    id: "hippodrome" as StoreLocation,
    name: "The Welfare Hippodrome",
    address: "Route de l'Hippodrome, Dakar",
    emoji: "🏇",
    hours: "Lun–Sam, 9h–20h",
  },
  {
    id: "playce" as StoreLocation,
    name: "The Welfare Playce",
    address: "Playce Dakar, Almadies",
    emoji: "🛍️",
    hours: "Lun–Dim, 10h–21h",
  },
];

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { num: 1, label: "Identité" },
    { num: 2, label: "Livraison" },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step > s.num
                  ? "bg-emerald-500 text-white"
                  : step === s.num
                  ? "bg-[#2A2424] text-white"
                  : "bg-[#EDE0E0] text-[#2A2424]/40"
              }`}
            >
              {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
            </div>
            <span
              className={`text-sm font-semibold transition-colors ${
                step >= s.num ? "text-[#2A2424]" : "text-[#2A2424]/40"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`mx-4 h-px w-12 transition-colors ${step > 1 ? "bg-emerald-400" : "bg-[#EDE0E0]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart, cartId } = useCart();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileNetwork, setMobileNetwork] = useState("SEN-WAVE");

  const [identity, setIdentity] = useState<IdentityForm>({
    firstName: "", lastName: "", email: "", phone: "",
  });
  const [delivery, setDelivery] = useState<DeliveryForm>({
    mode: "domicile", store: null, address: "", city: "", country: "Sénégal", notes: "",
  });

  const [identityErrors, setIdentityErrors] = useState<Partial<IdentityForm>>({});
  const [deliveryErrors, setDeliveryErrors] = useState<Partial<Record<keyof DeliveryForm, string>>>({});

  const livraisonFee = delivery.mode === "retrait" ? 0 : LIVRAISON_FEE;
  const total = totalAmount + livraisonFee;

  // Redirect if cart empty
  useEffect(() => {
    if (items.length === 0) router.push("/shop");
  }, [items, router]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateIdentity = () => {
    const e: Partial<IdentityForm> = {};
    if (!identity.firstName.trim()) e.firstName = "Requis";
    if (!identity.lastName.trim()) e.lastName = "Requis";
    if (!identity.email.trim() || !/\S+@\S+\.\S+/.test(identity.email)) e.email = "Email invalide";
    if (!identity.phone.trim()) e.phone = "Requis";
    setIdentityErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateDelivery = () => {
    const e: Partial<Record<keyof DeliveryForm, string>> = {};
    if (delivery.mode === "retrait" && !delivery.store) e.store = "Choisissez un magasin";
    if (delivery.mode === "domicile") {
      if (!delivery.address.trim()) e.address = "Requis";
      if (!delivery.city.trim()) e.city = "Requis";
    }
    setDeliveryErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleStep1Next = async () => {
    if (!validateIdentity()) return;
    if (!cartId) {
      alert("Panier non initialisé");
      return;
    }
    
    setIsLoading(true);
    try {
      await sdk.store.cart.update(cartId, {
        email: identity.email,
        shipping_address: {
          first_name: identity.firstName,
          last_name: identity.lastName,
          phone: identity.phone,
        }
      });
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateDelivery()) return;
    if (!cartId) return;
    setIsLoading(true);
    try {
      // 1. Update Cart Address & Metadata for Delivery
      await sdk.store.cart.update(cartId, {
        shipping_address: {
          first_name: identity.firstName,
          last_name: identity.lastName,
          phone: identity.phone,
          address_1: delivery.mode === "domicile" ? delivery.address : "Retrait en magasin : " + delivery.store,
          city: delivery.mode === "domicile" ? delivery.city : "Dakar",
          country_code: "sn",
        },
        metadata: {
          delivery_mode: delivery.mode,
          delivery_notes: delivery.notes,
          mobile_network: mobileNetwork
        }
      });

      // 2. Initiate Payment Session with PawaPay
      const { cart } = await sdk.store.cart.retrieve(cartId);
      await sdk.store.payment.initiatePaymentSession(cart as any, {
        provider_id: "pawapay"
      });

      // 3. Complete Checkout
      const response = await sdk.store.cart.complete(cartId);
      
      let ref = "WLF-PENDING";
      if (response.type === "order") {
        ref = response.order.id;
      } else if (response.type === "cart") {
        ref = response.cart.id;
      }
      
      // Store in session storage for the confirmation page UI only
      const order = {
        ref,
        items,
        identity,
        delivery,
        total,
        livraisonFee,
        createdAt: new Date().toISOString(),
      };
      sessionStorage.setItem("welfare_last_order", JSON.stringify(order));
      
      clearCart();
      router.push(`/checkout/confirmation?ref=${ref}`);
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de la validation: " + err.message);
      setIsLoading(false);
    }
  };

  // ── Input helpers ────────────────────────────────────────────────────────────
  const inputBase = "w-full px-4 py-3 rounded-xl border text-sm text-[#2A2424] bg-white outline-none transition-all";
  const inputOk = "border-[#EDE0E0] focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB]";
  const inputErr = "border-red-400 focus:ring-2 focus:ring-red-200";

  const iClass = (field: keyof IdentityForm) => `${inputBase} ${identityErrors[field] ? inputErr : inputOk}`;
  const dClass = (field: keyof DeliveryForm) => `${inputBase} ${deliveryErrors[field] ? inputErr : inputOk}`;

  if (items.length === 0) return null;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#F8F5F2] text-[#2A2424]">
      {/* Top bar */}
      <div className="bg-white border-b border-[#EDE0E0] px-5 md:px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => (step === 2 ? setStep(1) : router.push("/shop"))}
          className="flex items-center gap-2 text-sm font-medium text-[#2A2424]/60 hover:text-[#2A2424] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 2 ? "Retour" : "Retour à la boutique"}
        </button>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2A2424]/50">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Paiement 100% sécurisé
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8">

        {/* LEFT — Forms */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#2A2424] mb-1" style={{ letterSpacing: "-0.02em" }}>
            Finaliser ma commande
          </h1>
          <p className="text-sm text-[#2A2424]/50 mb-6">
            {step === 1 ? "Étape 1 sur 2 — Vos informations" : "Étape 2 sur 2 — Mode de livraison"}
          </p>

          <StepIndicator step={step} />

          <AnimatePresence mode="wait">
            {/* ════════════════ STEP 1 — IDENTITÉ ════════════════ */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-[#C08A8E]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[#2A2424]/50">Identité</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">Prénom</label>
                      <input
                        type="text"
                        placeholder="Fatou"
                        value={identity.firstName}
                        onChange={(e) => setIdentity({ ...identity, firstName: e.target.value })}
                        className={iClass("firstName")}
                      />
                      {identityErrors.firstName && <p className="text-[10px] text-red-500 mt-1">{identityErrors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">Nom</label>
                      <input
                        type="text"
                        placeholder="Diallo"
                        value={identity.lastName}
                        onChange={(e) => setIdentity({ ...identity, lastName: e.target.value })}
                        className={iClass("lastName")}
                      />
                      {identityErrors.lastName && <p className="text-[10px] text-red-500 mt-1">{identityErrors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">
                      <Mail className="inline w-3 h-3 mr-1" />Email
                    </label>
                    <input
                      type="email"
                      placeholder="fatou@exemple.com"
                      value={identity.email}
                      onChange={(e) => setIdentity({ ...identity, email: e.target.value })}
                      className={iClass("email")}
                    />
                    {identityErrors.email && <p className="text-[10px] text-red-500 mt-1">{identityErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">
                      <Phone className="inline w-3 h-3 mr-1" />Téléphone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="+221 77 000 00 00"
                      value={identity.phone}
                      onChange={(e) => setIdentity({ ...identity, phone: e.target.value })}
                      className={iClass("phone")}
                    />
                    {identityErrors.phone && <p className="text-[10px] text-red-500 mt-1">{identityErrors.phone}</p>}
                  </div>
                </div>

                <motion.button
                  onClick={handleStep1Next}
                  whileTap={{ scale: 0.97 }}
                  className="mt-5 w-full py-4 bg-[#2A2424] text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  Continuer vers la livraison <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}

            {/* ════════════════ STEP 2 — LIVRAISON ════════════════ */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                {/* Mode selector */}
                <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Truck className="w-4 h-4 text-[#C08A8E]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[#2A2424]/50">Mode de livraison</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Livraison à domicile */}
                    <button
                      onClick={() => setDelivery({ ...delivery, mode: "domicile", store: null })}
                      className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 text-center transition-all duration-200 ${
                        delivery.mode === "domicile"
                          ? "border-[#2A2424] bg-[#2A2424]/5"
                          : "border-[#EDE0E0] hover:border-[#C08A8E]/50"
                      }`}
                    >
                      {delivery.mode === "domicile" && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-[#2A2424] rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${delivery.mode === "domicile" ? "bg-[#2A2424]" : "bg-[#F4EAEB]"}`}>
                        <Home className={`w-5 h-5 ${delivery.mode === "domicile" ? "text-white" : "text-[#C08A8E]"}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#2A2424]">Livraison</p>
                        <p className="text-xs font-bold text-[#2A2424]">à domicile</p>
                        <p className="text-[10px] text-[#C08A8E] font-semibold mt-1">+{formatPrice(LIVRAISON_FEE)} FCFA</p>
                      </div>
                    </button>

                    {/* Retrait en magasin */}
                    <button
                      onClick={() => setDelivery({ ...delivery, mode: "retrait" })}
                      className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 text-center transition-all duration-200 ${
                        delivery.mode === "retrait"
                          ? "border-[#2A2424] bg-[#2A2424]/5"
                          : "border-[#EDE0E0] hover:border-[#C08A8E]/50"
                      }`}
                    >
                      {delivery.mode === "retrait" && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-[#2A2424] rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${delivery.mode === "retrait" ? "bg-[#2A2424]" : "bg-[#F4EAEB]"}`}>
                        <Store className={`w-5 h-5 ${delivery.mode === "retrait" ? "text-white" : "text-[#C08A8E]"}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#2A2424]">Retrait</p>
                        <p className="text-xs font-bold text-[#2A2424]">en magasin</p>
                        <p className="text-[10px] text-emerald-600 font-semibold mt-1">Gratuit</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* ── Domicile fields ── */}
                <AnimatePresence>
                  {delivery.mode === "domicile" && (
                    <motion.div
                      key="domicile-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#C08A8E]" />
                          <span className="text-xs font-bold uppercase tracking-widest text-[#2A2424]/50">Adresse de livraison</span>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">Adresse complète</label>
                          <input
                            type="text"
                            placeholder="Rue 10, Villa 5, Sacré Cœur 3"
                            value={delivery.address}
                            onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                            className={dClass("address")}
                          />
                          {deliveryErrors.address && <p className="text-[10px] text-red-500 mt-1">{deliveryErrors.address}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">Ville</label>
                            <input
                              type="text"
                              placeholder="Dakar"
                              value={delivery.city}
                              onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                              className={dClass("city")}
                            />
                            {deliveryErrors.city && <p className="text-[10px] text-red-500 mt-1">{deliveryErrors.city}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">Pays</label>
                            <select
                              value={delivery.country}
                              onChange={(e) => setDelivery({ ...delivery, country: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#EDE0E0] focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] text-sm text-[#2A2424] bg-white outline-none transition-all"
                            >
                              <option>Sénégal</option>
                              <option>Côte d&apos;Ivoire</option>
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
                            Instructions <span className="text-[#2A2424]/30">(optionnel)</span>
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Ex: Appeler avant de venir, passer par l'entrée latérale..."
                            value={delivery.notes}
                            onChange={(e) => setDelivery({ ...delivery, notes: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-[#EDE0E0] focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] text-sm text-[#2A2424] bg-white outline-none transition-all resize-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Store picker ── */}
                <AnimatePresence>
                  {delivery.mode === "retrait" && (
                    <motion.div
                      key="store-picker"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Store className="w-4 h-4 text-[#C08A8E]" />
                          <span className="text-xs font-bold uppercase tracking-widest text-[#2A2424]/50">Choisissez votre magasin</span>
                        </div>
                        {deliveryErrors.store && (
                          <p className="text-[10px] text-red-500">{deliveryErrors.store}</p>
                        )}
                        {STORES.map((store) => (
                          <button
                            key={store.id}
                            onClick={() => setDelivery({ ...delivery, store: store.id })}
                            className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                              delivery.store === store.id
                                ? "border-[#2A2424] bg-[#2A2424]/5"
                                : "border-[#EDE0E0] hover:border-[#C08A8E]/50"
                            }`}
                          >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${delivery.store === store.id ? "bg-[#2A2424]" : "bg-[#F4EAEB]"}`}>
                              {store.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#2A2424]">{store.name}</p>
                              <p className="text-xs text-[#2A2424]/50 mt-0.5">{store.address}</p>
                              <p className="text-[10px] text-[#C08A8E] font-semibold mt-1">🕐 {store.hours}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${delivery.store === store.id ? "border-[#2A2424] bg-[#2A2424]" : "border-[#EDE0E0]"}`}>
                              {delivery.store === store.id && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Payment info */}
                <div className="bg-[#F4EAEB]/40 border border-[#EDE0E0] rounded-2xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#C08A8E] mb-2">💳 Mode de paiement</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1DAFEC]/10 flex items-center justify-center text-lg">📱</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#2A2424]">Mobile Money</p>
                      <select 
                        value={mobileNetwork}
                        onChange={(e) => setMobileNetwork(e.target.value)}
                        className="mt-1 w-full text-xs px-2 py-1.5 rounded-lg border border-[#EDE0E0] bg-white outline-none focus:border-[#C08A8E]"
                      >
                        <option value="SEN-WAVE">Wave Sénégal</option>
                        <option value="SEN-ORANGE_MONEY">Orange Money Sénégal</option>
                        <option value="SEN-FREE_MONEY">Free Money Sénégal</option>
                        <option value="CIV-WAVE">Wave Côte d'Ivoire</option>
                        <option value="CIV-ORANGE_MONEY">Orange Money Côte d'Ivoire</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#2A2424]/50 mt-3 leading-relaxed">
                    Vous recevrez les instructions de paiement par notification (Push USSD) sur votre téléphone après confirmation.
                  </p>
                </div>

                {/* Submit */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 bg-[#2A2424] text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Confirmer ma commande <ChevronRight className="w-4 h-4" /></>
                  )}
                </motion.button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-[#2A2424]/50 hover:text-[#2A2424] transition-colors py-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Modifier mes informations
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — Order summary */}
        <motion.div
          className="lg:w-[340px] shrink-0"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 sticky top-24">
            <h2 className="text-sm font-bold text-[#2A2424] mb-4">Récapitulatif</h2>

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

            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between text-sm text-[#2A2424]/60">
                <span>Sous-total</span>
                <span>{formatPrice(totalAmount)} FCFA</span>
              </div>
              <div className="flex justify-between text-sm text-[#2A2424]/60">
                <span className="flex items-center gap-1.5">
                  {delivery.mode === "retrait" ? <Store className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                  {delivery.mode === "retrait" ? "Retrait magasin" : "Livraison"}
                </span>
                <span className={delivery.mode === "retrait" ? "text-emerald-600 font-semibold" : ""}>
                  {delivery.mode === "retrait" ? "Gratuit" : `${formatPrice(LIVRAISON_FEE)} FCFA`}
                </span>
              </div>
              <div className="w-full h-px bg-[#F4EAEB]" />
              <div className="flex justify-between">
                <span className="text-sm font-bold text-[#2A2424]">Total</span>
                <span className="text-base font-bold text-[#2A2424]">{formatPrice(total)} FCFA</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1 text-[10px] text-[#2A2424]/40">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Sécurisé
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#2A2424]/40">
                <Package className="w-3 h-3" /> Authentique
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#2A2424]/40">
                <Truck className="w-3 h-3" /> Rapide
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
