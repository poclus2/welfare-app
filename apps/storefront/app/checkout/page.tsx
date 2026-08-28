"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { sdk } from "@/lib/medusa";
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, Truck, Package,
  CaretRight, CaretLeft, User, Phone, MapPin, Envelope, CircleNotch,
  Storefront, House, Check, Clock, CreditCard, DeviceMobile, Money, MapTrifold as MapIcon, ShoppingBag,
} from "@phosphor-icons/react";

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
  address: string;
  city: string;
  country: string;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LIVRAISON_FEE = 1500;

const STORES = [
  {
    id: "hippodrome" as StoreLocation,
    name: "The Welfare Hippodrome",
    address: "Route de l'Hippodrome, Douala",
    icon: <MapIcon className="w-6 h-6 text-[#8B5A2B]" />,
    hours: "Lun–Sam, 9h–20h",
  },
  {
    id: "playce" as StoreLocation,
    name: "The Welfare Playce",
    address: "Playce, Yaoundé",
    icon: <ShoppingBag className="w-6 h-6 text-[#1DAFEC]" />,
    hours: "Lun–Dim, 10h–21h",
  },
];

const CAMEROON_CITIES = [
  "Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua", 
  "Maroua", "Ngaoundéré", "Bertoua", "Ebolowa", "Kribi", 
  "Limbe", "Buea", "Kumba", "Nkongsamba", "Edéa"
];

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { num: 1, label: "Identitéé" },
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

  const [paymentMode, setPaymentMode] = useState<"pawapay" | "cash">("pawapay");
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null);

  const [identity, setIdentity] = useState<IdentityForm>({
    firstName: "", lastName: "", email: "", phone: "",
  });
  const [delivery, setDelivery] = useState<DeliveryForm>({
    mode: "domicile", store: null, address: "", city: "Douala", country: "Cameroun", notes: "",
  });

  const [identityErrors, setIdentityErrors] = useState<Partial<IdentityForm>>({});
  const [deliveryErrors, setDeliveryErrors] = useState<Partial<Record<keyof DeliveryForm, string> & { shipping: string, neighborhood: string }>>({});

  // Dynamic Delivery Data
  const [citiesData, setCitiesData] = useState<any[]>([]);
  const [pickupPointsData, setPickupPointsData] = useState<any[]>([]);
  const [settingsData, setSettingsData] = useState<any>(null);
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState("");

  useEffect(() => {
    const loadDeliveryData = async () => {
      try {
        const [citiesRes, pointsRes, settingsRes] = await Promise.all([
          sdk.client.fetch<any>("/store/delivery/cities", { method: "GET" }),
          sdk.client.fetch<any>("/store/delivery/pickup-points", { method: "GET" }),
          sdk.client.fetch<any>("/store/delivery/settings", { method: "GET" })
        ]);
        if (citiesRes.cities) setCitiesData(citiesRes.cities);
        if (pointsRes.points) setPickupPointsData(pointsRes.points);
        if (settingsRes.setting) setSettingsData(settingsRes.setting);
      } catch (err) {
        console.error("Failed to load delivery data", err);
      }
    };
    loadDeliveryData();
  }, []);

  // Compute selected options ETA and COD Fee
  let eta = "";
  if (delivery.mode === "domicile") {
    const selectedCity = citiesData.find(c => c.name === delivery.city);
    if (selectedCity) {
      eta = selectedCity.estimated_time || "";
      if (selectedCity.has_neighborhoods && deliveryNeighborhood) {
        const hood = selectedCity.neighborhoods?.find((h: any) => h.id === deliveryNeighborhood);
        if (hood && hood.estimated_time) eta = hood.estimated_time;
      }
    }
  }

  const codFee = (paymentMode === "cash" && settingsData?.cod_fee) ? settingsData.cod_fee : 0;

  // Get current shipping option price
  const currentShippingOption = shippingOptions.find(o => o.id === selectedShippingOptionId);
  
  let livraisonFee = 0;
  if (currentShippingOption) {
    livraisonFee = currentShippingOption.amount;
  } else if (delivery.mode === "retrait") {
    const store = pickupPointsData.find(p => p.id === delivery.store);
    livraisonFee = store ? store.price : 0;
  } else {
    // Fallback logic if shipping options didn't load
    const selectedCity = citiesData.find(c => c.name === delivery.city);
    livraisonFee = selectedCity?.fixed_price || LIVRAISON_FEE;
    if (selectedCity?.has_neighborhoods && deliveryNeighborhood) {
      const hood = selectedCity.neighborhoods?.find((h: any) => h.id === deliveryNeighborhood);
      if (hood) livraisonFee = hood.price;
    }
  }

  const total = totalAmount + livraisonFee + codFee;

  // Fetch shipping options for the cart
  const fetchOptions = async () => {
    if (cartId) {
      try {
        const { shipping_options } = await sdk.store.fulfillment.listCartOptions({ cart_id: cartId });
        setShippingOptions(shipping_options);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [cartId]);

  // Redirect if cart empty
  useEffect(() => {
    if (items.length === 0 && !isLoading) {
      router.push("/shop");
    }
  }, [items, router, isLoading]);

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
    const e: Partial<Record<keyof DeliveryForm, string> & { shipping: string, neighborhood: string }> = {};
    if (delivery.mode === "retrait" && !delivery.store) e.store = "Choisissez un magasin";
    if (delivery.mode === "domicile") {
      if (!delivery.address.trim()) e.address = "Requis";
      if (!delivery.city.trim()) e.city = "Requis";
    }
    // Comment out strict shipping option validation so users can still test if options aren't seeded yet
    // if (!selectedShippingOptionId) e.shipping = "Veuillez sélectionner une méthode de livraison";
    
    setDeliveryErrors(e as any);
    return Object.keys(e).length === 0;
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleStep1Next = async () => {
    if (!validateIdentity()) {
      alert("Veuillez remplir correctement tous les champs d'identité.");
      return;
    }
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
          country_code: "cm",
        }
      });
      await fetchOptions(); // Refetch options after setting country to CM
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateDelivery()) {
      alert("Veuillez remplir tous les champs de livraison (voir les bordures rouges).");
      return;
    }
    if (!cartId) {
      alert("Le panier n'est pas initialisé correctement.");
      return;
    }
    setIsLoading(true);
    try {
      // 1. Update Cart Address & Metadata for Delivery
      await sdk.store.cart.update(cartId, {
        shipping_address: {
          first_name: identity.firstName,
          last_name: identity.lastName,
          phone: identity.phone,
          address_1: delivery.mode === "domicile" ? delivery.address : "Retrait en magasin : " + delivery.store,
          city: delivery.mode === "domicile" ? delivery.city : "Douala",
          country_code: "cm",
        },
        metadata: {
          delivery_mode: delivery.mode,
          delivery_notes: delivery.notes,
          mobile_network: paymentMode === "pawapay" ? mobileNetwork : null,
          payment_mode: paymentMode
        }
      });

      // 2. Add Shipping Method if selected
      if (selectedShippingOptionId) {
        await sdk.store.cart.addShippingMethod(cartId, {
          option_id: selectedShippingOptionId
        });
      } else if (shippingOptions.length > 0) {
        // Auto-select first matching option if user didn't select but options exist
        const defaultOpt = shippingOptions.find(o => 
          delivery.mode === "domicile" 
            ? o.name.toLowerCase().includes("domicile") || o.name.toLowerCase().includes(delivery.city.toLowerCase())
            : o.name.toLowerCase().includes("retrait")
        ) || shippingOptions[0];
        
        if (defaultOpt) {
          await sdk.store.cart.addShippingMethod(cartId, { option_id: defaultOpt.id });
        }
      } else {
        throw new Error("Aucun mode de livraison n'est disponible pour cette adresse.");
      }

      // 3. Initiate Payment Session
      const { cart } = await sdk.store.cart.retrieve(cartId);
      await sdk.store.payment.initiatePaymentSession(cart as any, {
        provider_id: paymentMode === "pawapay" ? "pp_pawapay_pawapay" : "pp_system_default"
      });

      // 4. Complete Checkout
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
        paymentMode,
        createdAt: new Date().toISOString(),
      };
      sessionStorage.setItem("welfare_last_order", JSON.stringify(order));
      
      clearCart();
      window.location.href = `/checkout/confirmation?ref=${ref}`;
    } catch (err: any) {
      console.error("Payment Error:", err);
      const msg = err?.message || err?.toString() || "Erreur inconnue";
      alert("Erreur lors de la validation: " + msg);
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
                    <span className="text-xs font-bold uppercase tracking-widest text-[#2A2424]/50">Identitéé</span>
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
                      <Envelope className="inline w-3 h-3 mr-1" />Email
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
                  Continuer vers la livraison <CaretRight className="w-4 h-4" />
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
                        <House className={`w-5 h-5 ${delivery.mode === "domicile" ? "text-white" : "text-[#C08A8E]"}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#2A2424]">Livraison</p>
                        <p className="text-xs font-bold text-[#2A2424]">à domicile</p>
                        <p className="text-[10px] text-[#C08A8E] font-semibold mt-1">+{livraisonFee > 0 ? `+${formatPrice(livraisonFee)} FCFA` : "Gratuit"}</p>
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
                        <Storefront className={`w-5 h-5 ${delivery.mode === "retrait" ? "text-white" : "text-[#C08A8E]"}`} />
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
                            <select
                              value={delivery.city}
                              onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#EDE0E0] focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] text-sm text-[#2A2424] bg-white outline-none transition-all"
                            >
                              {CAMEROON_CITIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                            {deliveryErrors.city && <p className="text-[10px] text-red-500 mt-1">{deliveryErrors.city}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">Pays</label>
                            <select
                              value={delivery.country}
                              onChange={(e) => setDelivery({ ...delivery, country: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#EDE0E0] focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] text-sm text-[#2A2424] bg-white outline-none transition-all"
                            >
                              <option>Cameroun</option>
                            </select>
                          </div>
                        </div>

                        {/* Quartier (Dynamic) */}
                        {citiesData.find(c => c.name === delivery.city)?.has_neighborhoods && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-3"
                          >
                            <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">Quartier</label>
                            <select
                              value={deliveryNeighborhood}
                              onChange={(e) => setDeliveryNeighborhood(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-[#EDE0E0] focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] text-sm text-[#2A2424] bg-white outline-none transition-all"
                            >
                              <option value="">Sélectionnez un quartier</option>
                              {citiesData.find(c => c.name === delivery.city)?.neighborhoods?.map((h: any) => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                              ))}
                            </select>
                            {deliveryErrors.neighborhood && <p className="text-[10px] text-red-500 mt-1">{deliveryErrors.neighborhood}</p>}
                          </motion.div>
                        )}
                        
                        {/* ETA display */}
                        {eta && (
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            Délai estimé : {eta}
                          </div>
                        )}
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
                          <Storefront className="w-4 h-4 text-[#C08A8E]" />
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
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${delivery.store === store.id ? "bg-[#2A2424]" : "bg-[#F4EAEB]"}`}>
                              {store.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#2A2424]">{store.name}</p>
                              <p className="text-xs text-[#2A2424]/50 mt-0.5">{store.address}</p>
                              <p className="text-[10px] text-[#C08A8E] font-semibold mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {store.hours}
                              </p>
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
                  <p className="text-xs font-bold uppercase tracking-widest text-[#C08A8E] mb-3 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#1DAFEC]" /> Mode de paiement
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => setPaymentMode("pawapay")}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        paymentMode === "pawapay" ? "border-[#2A2424] bg-white" : "border-transparent hover:border-[#EDE0E0] bg-white/60"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#1DAFEC]/10 flex items-center justify-center shrink-0">
                        <DeviceMobile className="w-5 h-5 text-[#1DAFEC]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#2A2424]">Paiement en ligne</p>
                        <p className="text-xs text-[#2A2424]/50">Mobile Money (Wave, Orange, MTN...)</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${paymentMode === "pawapay" ? "border-[#2A2424] bg-[#2A2424]" : "border-[#EDE0E0]"}`}>
                        {paymentMode === "pawapay" && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {paymentMode === "pawapay" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden px-1"
                        >
                          <div className="pt-1 pb-3">
                            <select 
                              value={mobileNetwork}
                              onChange={(e) => setMobileNetwork(e.target.value)}
                              className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#EDE0E0] bg-white outline-none focus:border-[#C08A8E]"
                            >
                              <option value="SEN-WAVE">Wave Sénégal</option>
                              <option value="SEN-ORANGE_MONEY">Orange Money Sénégal</option>
                              <option value="SEN-FREE_MONEY">Free Money Sénégal</option>
                              <option value="CMR-MTN_MOMO">MTN MoMo Cameroun</option>
                              <option value="CMR-ORANGE_MONEY">Orange Money Cameroun</option>
                              <option value="CIV-WAVE">Wave Côte d'Ivoire</option>
                              <option value="CIV-ORANGE_MONEY">Orange Money Côte d'Ivoire</option>
                            </select>
                            <p className="text-[11px] text-[#2A2424]/50 mt-2 leading-relaxed">
                              Vous recevrez une notification (Push USSD) sur votre téléphone après confirmation pour valider le paiement.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={() => setPaymentMode("cash")}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        paymentMode === "cash" ? "border-[#2A2424] bg-white" : "border-transparent hover:border-[#EDE0E0] bg-white/60"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Money className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#2A2424]">Paiement Cash</p>
                        <p className="text-xs text-[#2A2424]/50">
                          {delivery.mode === "retrait" ? "Au retrait en magasin" : "À la livraison"}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${paymentMode === "cash" ? "border-[#2A2424] bg-[#2A2424]" : "border-[#EDE0E0]"}`}>
                        {paymentMode === "cash" && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 bg-[#2A2424] text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <CircleNotch className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Confirmer ma commande <CaretRight className="w-4 h-4" /></>
                  )}
                </motion.button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-[#2A2424]/50 hover:text-[#2A2424] transition-colors py-1"
                >
                  <CaretLeft className="w-3.5 h-3.5" /> Modifier mes informations
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
                  {delivery.mode === "retrait" ? <Storefront className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                  {delivery.mode === "retrait" ? "Retrait magasin" : "Livraison"}
                </span>
                <span className={delivery.mode === "retrait" ? "text-emerald-600 font-semibold" : ""}>
                  {delivery.mode === "retrait" ? "Gratuit" : `${livraisonFee > 0 ? `+${formatPrice(livraisonFee)} FCFA` : "Gratuit"}`}
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
