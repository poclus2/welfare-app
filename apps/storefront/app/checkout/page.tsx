"use client";

import { useState, useEffect, type ReactNode } from "react";
import { MANUAL_PAYMENT, ussdHref } from "@/lib/manual-payment";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { sdk } from "@/lib/medusa";
import { SHOP_WHATSAPP } from "@/lib/contact";
import posthog from "posthog-js";
import { PromoCodeField } from "@/components/cart/PromoCodeField";
import { DISPLAY_FONT, Eyebrow, SK, SectionTitle } from "@/components/account/account-ui";
import {
  ArrowLeft, ArrowRight, CaretDown, CircleNotch, Clock, Check, House, Storefront, DeviceMobile, Phone,
  Package, ShieldCheck, WarningCircle, Lock,
} from "@phosphor-icons/react";

// Checkout, in the Skin Coach look of the customer space (prototype "Espace client" validated by the owner,
// 2026-10-15): pink-white ground, white cards, magenta as the only accent, Urbanist headlines, pill buttons.
// On the phone the summary comes first, folded, so the total is visible before the forms.

function formatPrice(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount));
}

// Cameroonian mobile number → its 9 local digits (6XXXXXXXX), or null. Mirrors normalizeCameroonMsisdn in the API.
function cameroonLocalNumber(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 12 && digits.startsWith("237")) digits = digits.slice(3);
  return /^6\d{8}$/.test(digits) ? digits : null;
}

// Operator from the number range (same table as detectCameroonOperator in the API); null when unsure.
function cameroonOperator(local: string): "MTN" | "Orange" | "Nexttel" | null {
  const p2 = local.slice(0, 2);
  const p3 = Number(local.slice(0, 3));
  if (p2 === "67" || (p3 >= 650 && p3 <= 654) || (p3 >= 680 && p3 <= 683)) return "MTN";
  if (p2 === "69" || (p3 >= 655 && p3 <= 659) || (p3 >= 686 && p3 <= 689)) return "Orange";
  if (p2 === "66") return "Nexttel";
  return null;
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
const ERROR_RED = "#B3261E";
const GOOD_GREEN = "#0B6B45";
// Mobile Money networks collected by Tara; any network left out goes back to PawaPay (/store/pawapay/deposit)
const TARA_NETWORKS = ["MTN_MOMO_CMR", "ORANGE_CMR"];

const STORES = [
  {
    id: "hippodrome" as StoreLocation,
    name: "The Welfare Hippodrome",
    address: "Route de l'Hippodrome, Yaoundé",
    hours: "Lun - Sam, 9h - 20h",
  },
  {
    id: "playce" as StoreLocation,
    name: "The Welfare Playce",
    address: "Playce, Yaoundé",
    hours: "Lun - Dim, 10h - 21h",
  },
];

const CAMEROON_CITIES = [
  "Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua",
  "Maroua", "Ngaoundéré", "Bertoua", "Ebolowa", "Kribi",
  "Limbe", "Buea", "Kumba", "Nkongsamba", "Edéa"
];

// ─── UI pieces (declared outside the page: defined inside, inputs lose focus on every keystroke) ─────
const fieldClass = "w-full h-[48px] rounded-[14px] px-3.5 text-[15px] outline-none focus:ring-2 appearance-none";
const fieldStyle = (error?: string) => ({
  border: `1px solid ${error ? ERROR_RED : SK.line}`,
  background: SK.surface,
  color: SK.ink,
  ["--tw-ring-color" as any]: SK.accent,
});

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-bold" style={{ color: SK.muted }}>
        {label} {hint && <span className="font-medium">{hint}</span>}
      </label>
      {children}
      {error && <p id={`${id}-error`} className="text-[12px] font-semibold" style={{ color: ERROR_RED }}>{error}</p>}
    </div>
  );
}

function CardBlock({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[26px] p-[18px] sm:p-5 flex flex-col gap-4 ${className}`} style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
      {title && <p className="text-[12px] font-bold uppercase tracking-[0.06em]" style={{ color: SK.muted }}>{title}</p>}
      {children}
    </section>
  );
}

// a choice (delivery mode, shop, payment): pale pink and a magenta ring when selected
function Choice({ selected, onClick, icon, title, text }: {
  selected: boolean; onClick: () => void; icon: ReactNode; title: string; text?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="w-full flex items-center gap-3 rounded-[20px] p-3.5 text-left transition-colors"
      style={{ background: selected ? SK.tint : SK.surface, border: `${selected ? 2 : 1}px solid ${selected ? SK.accent : SK.line}`, margin: selected ? 0 : 1 }}
    >
      <span className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: selected ? SK.accent : SK.tint, color: selected ? "#FFFFFF" : SK.accent }}>
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-bold" style={{ color: SK.ink }}>{title}</span>
        {text && <span className="block text-[13px] leading-snug mt-0.5" style={{ color: SK.muted }}>{text}</span>}
      </span>
      <span
        className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
        style={{ background: selected ? SK.accent : SK.surface, border: selected ? "none" : `2px solid ${SK.line}` }}
        aria-hidden="true"
      >
        {selected && <Check weight="bold" className="w-3 h-3 text-white" />}
      </span>
    </button>
  );
}

function Stepper({ step }: { step: 1 | 2 }) {
  const { t } = useI18n();
  const steps = [t("Vos informations"), t("Livraison & paiement")];
  return (
    <ol className="grid grid-cols-2 gap-2" aria-label={t("Étapes de la commande")}>
      {steps.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const current = step === n;
        return (
          <li key={label} aria-current={current ? "step" : undefined} className="flex flex-col gap-2">
            <span className="h-1.5 rounded-full" style={{ background: done || current ? SK.accent : SK.track }} />
            <span className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: done || current ? SK.ink : SK.muted }}>
              {done ? <Check weight="bold" className="w-3.5 h-3.5" style={{ color: SK.accent }} /> : <span style={{ color: current ? SK.accent : SK.muted }}>{n}.</span>}
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { items, totalAmount, discountTotal, freeShipping, clearCart, cartId, pendingPromoCode, applyPromoCode } = useCart();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentWait, setPaymentWait] = useState("");
  const [formError, setFormError] = useState("");
  // Cart id of a finalisation Medusa refused (the customer quotes it on WhatsApp)
  const [completeFailedRef, setCompleteFailedRef] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false); // phone only: the summary starts folded
  const [mobileNetwork, setMobileNetwork] = useState("MTN_MOMO_CMR");
  // Number charged by the Mobile Money push — may differ from the contact/WhatsApp number
  const [momoPhone, setMomoPhone] = useState("");
  const [momoPhoneError, setMomoPhoneError] = useState("");
  const isOrange = mobileNetwork === "ORANGE_CMR";
  const momoOperator = isOrange ? "Orange" : "MTN";
  const momoMismatchMessage = (operator: string) =>
    operator === "Nexttel"
      ? t("Les numéros Nexttel ne sont pas acceptés : saisissez un numéro MTN ou Orange Money, ou choisissez le paiement manuel.")
      : t("Ce numéro est un numéro {op} : choisissez le réseau {op} ou saisissez un numéro {net}.").split("{op}").join(operator).replace("{net}", momoOperator);
  const [manualProvider, setManualProvider] = useState<"orange" | "mtn">("orange");

  const [paymentMode, setPaymentMode] = useState<"pawapay" | "manuel">("pawapay");
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShippingOptionId] = useState<string | null>(null);

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
    sdk.store.customer.retrieve()
      .then(({ customer }) => {
        if (customer) {
          setIdentity(prev => ({
            ...prev,
            firstName: customer.first_name || prev.firstName,
            lastName: customer.last_name || prev.lastName,
            // a phone sign-up has a made-up address (<digits>@phone.thewelfarecm.com): don't prefill it as hers
            email: customer.email && !customer.email.toLowerCase().endsWith("@phone.thewelfarecm.com") ? customer.email : prev.email,
            phone: customer.phone || prev.phone,
          }));
        }
      })
      .catch(() => {});
  }, []);

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

  // Get current shipping option price
  const currentShippingOption = shippingOptions.find(o => o.id === selectedShippingOptionId);

  let livraisonFee = 0;
  if (currentShippingOption) {
    livraisonFee = Number(currentShippingOption.amount || 0);
  } else if (delivery.mode === "retrait") {
    const store = pickupPointsData.find(p => p.id === delivery.store);
    livraisonFee = store ? Number(store.price || 0) : 0;
  } else {
    // Fallback logic if shipping options didn't load
    const selectedCity = citiesData.find(c => c.name === delivery.city);
    livraisonFee = selectedCity?.fixed_price ? Number(selectedCity.fixed_price) : LIVRAISON_FEE;
    if (selectedCity?.has_neighborhoods && deliveryNeighborhood) {
      const hood = selectedCity.neighborhoods?.find((h: any) => h.id === deliveryNeighborhood);
      if (hood) livraisonFee = Number(hood.price);
    }
  }

  const discountedSubtotal = Math.max(0, Number(totalAmount || 0) - Number(discountTotal || 0));
  const freeShippingByThreshold = Boolean(
    settingsData?.free_shipping_threshold > 0 && discountedSubtotal >= settingsData.free_shipping_threshold
  );
  const effectiveLivraisonFee = (freeShipping || freeShippingByThreshold) ? 0 : livraisonFee;
  const activeLivraisonFee = step === 1 ? 0 : effectiveLivraisonFee;
  const paymentFee = (paymentMode === "pawapay" && step === 2) ? Math.round((discountedSubtotal + activeLivraisonFee) * 0.03) : 0;
  const total = discountedSubtotal + Number(activeLivraisonFee || 0) + Number(paymentFee || 0);
  const itemCount = items.reduce((n, i) => n + (Number(i.quantity) || 1), 0);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId]);

  // Redirect if cart empty
  useEffect(() => {
    if (items.length === 0 && !isLoading) {
      router.push("/shop");
    }
  }, [items, router, isLoading]);

  const goToStep = (s: 1 | 2) => {
    setFormError("");
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateIdentity = () => {
    const e: Partial<IdentityForm> = {};
    if (!identity.firstName.trim()) e.firstName = t("Requis");
    if (!identity.lastName.trim()) e.lastName = t("Requis");
    if (!identity.email.trim() || !/\S+@\S+\.\S+/.test(identity.email)) e.email = t("Email invalide");
    if (!identity.phone.trim()) e.phone = t("Requis");
    setIdentityErrors(e);
    const first = (["firstName", "lastName", "email", "phone"] as const).find((k) => e[k]);
    if (first) document.getElementById(`ck-${first}`)?.focus();
    return !first;
  };

  const validateDelivery = () => {
    const e: Partial<Record<keyof DeliveryForm, string> & { shipping: string, neighborhood: string }> = {};
    if (delivery.mode === "retrait" && !delivery.store) e.store = t("Choisissez un magasin");
    if (delivery.mode === "domicile") {
      if (!delivery.address.trim()) e.address = t("Requis");
      if (!delivery.city.trim()) e.city = t("Requis");
    }
    // Comment out strict shipping option validation so users can still test if options aren't seeded yet
    // if (!selectedShippingOptionId) e.shipping = "Veuillez sélectionner une méthode de livraison";

    setDeliveryErrors(e as any);
    if (e.address) document.getElementById("ck-address")?.focus();
    else if (e.store) document.getElementById("ck-stores")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return Object.keys(e).length === 0;
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleStep1Next = async () => {
    setFormError("");
    if (!validateIdentity()) return;
    if (!cartId) {
      setFormError(t("Panier non initialisé"));
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
      // Suggest the contact number for Mobile Money only when it is an MTN one (the only network enabled)
      const contactLocal = cameroonLocalNumber(identity.phone);
      if (!momoPhone && contactLocal && cameroonOperator(contactLocal) === "MTN") setMomoPhone(contactLocal);
      goToStep(2);
    } catch (err) {
      console.error(err);
      setFormError(t("Erreur de connexion au serveur"));
    } finally {
      setIsLoading(false);
    }
  };

  // Finalisation refused: no order exists, so the cart stays and the customer is told not to pay again
  const reportCompleteFailure = (message: string, providerId: string, amount: number) => {
    console.error("Cart completion failed:", message);
    posthog.capture("checkout_complete_failed", { message, provider_id: providerId, amount, cart_id: cartId, payment_mode: paymentMode });
    setCompleteFailedRef(cartId);
    setPaymentWait("");
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    setFormError("");
    setCompleteFailedRef(null);
    if (!validateDelivery()) return;
    if (!cartId) {
      setFormError(t("Le panier n'est pas initialisé correctement."));
      return;
    }
    let momoLocal: string | null = null;
    if (paymentMode === "pawapay") {
      momoLocal = cameroonLocalNumber(momoPhone);
      const operator = momoLocal ? cameroonOperator(momoLocal) : null;
      const error = !momoLocal
        ? t("Saisissez votre numéro Mobile Money (9 chiffres, ex : 6XXXXXXXX).")
        : operator && operator !== momoOperator
          ? momoMismatchMessage(operator)
          : "";
      setMomoPhoneError(error);
      if (error) {
        document.getElementById("momo-phone")?.focus();
        return;
      }
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
          city: delivery.mode === "domicile" ? delivery.city : "Yaoundé",
          country_code: "cm",
        },
        metadata: {
          delivery_mode: delivery.mode,
          delivery_notes: delivery.notes,
          mobile_network: paymentMode === "pawapay" ? mobileNetwork : null,
          mobile_money_phone: paymentMode === "pawapay" ? momoLocal : null,
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
        throw new Error(t("Aucun mode de livraison n'est disponible pour cette adresse."));
      }

      // A free-shipping code can only attach once the shipping method exists — re-apply it now
      if (pendingPromoCode) {
        const reapplied = await applyPromoCode(pendingPromoCode);
        if (!reapplied.ok) throw new Error(reapplied.error || t("Le code promo n'a pas pu être appliqué."));
      }

      // 3. Mobile Money: send the push to the customer's phone and wait for them to confirm it.
      // Networks in TARA_NETWORKS go through Tara, the others through PawaPay. The order is only created once the payment is confirmed.
      let depositId: string | null = null;
      let depositToken: string | null = null;
      let taraPayment: { paymentId: string; tara_token: string; amount: number } | null = null;
      if (paymentMode === "pawapay" && TARA_NETWORKS.includes(mobileNetwork)) {
        taraPayment = await sdk.client.fetch<{ paymentId: string; tara_token: string; amount: number }>("/store/tara/mobilepay", {
          method: "POST",
          body: { cart_id: cartId, phone: momoLocal },
        });
        setPaymentWait(`${t("Validez le paiement sur votre téléphone")} (${formatPrice(taraPayment.amount)} FCFA)`);

        const deadline = Date.now() + 3 * 60 * 1000;
        let confirmed = false;
        while (Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const status = await sdk.client
            .fetch<{ status: string; message?: string }>(`/store/tara/mobilepay/${taraPayment.paymentId}`)
            .catch(() => null);
          if (status?.status === "SUCCESS") {
            confirmed = true;
            break;
          }
          if (status?.status === "FAILURE") {
            throw new Error(status.message || t("Le paiement Mobile Money a été refusé ou annulé."));
          }
        }
        if (!confirmed) {
          throw new Error(t("Délai dépassé : le paiement n'a pas été confirmé sur votre téléphone. Réessayez ; si vous avez validé après ce délai, contactez-nous avant de repayer."));
        }
        setPaymentWait(t("Paiement confirmé, finalisation de votre commande..."));
      } else if (paymentMode === "pawapay") {
        const deposit = await sdk.client.fetch<{ depositId: string; deposit_token: string; amount: number }>("/store/pawapay/deposit", {
          method: "POST",
          body: { cart_id: cartId, phone: momoLocal, correspondent: mobileNetwork },
        });
        depositId = deposit.depositId;
        depositToken = deposit.deposit_token;
        setPaymentWait(`${t("Validez le paiement sur votre téléphone")} (${formatPrice(deposit.amount)} FCFA)`);

        const deadline = Date.now() + 3 * 60 * 1000;
        let confirmed = false;
        while (Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const status = await sdk.client
            .fetch<{ status: string; message?: string }>(`/store/pawapay/deposit/${depositId}`)
            .catch(() => null);
          if (status?.status === "COMPLETED") {
            confirmed = true;
            break;
          }
          if (status?.status === "FAILED") {
            throw new Error(status.message || t("Le paiement Mobile Money a été refusé ou annulé."));
          }
        }
        if (!confirmed) {
          throw new Error(t("Délai dépassé : le paiement n'a pas été confirmé sur votre téléphone. Réessayez ; si vous avez validé après ce délai, contactez-nous avant de repayer."));
        }
        setPaymentWait(t("Paiement confirmé, finalisation de votre commande..."));
      }

      // 4. Initiate Payment Session
      const providerId = paymentMode !== "pawapay" ? "pp_system_default" : taraPayment ? "pp_tara_tara" : "pp_pawapay_pawapay";
      const { cart } = await sdk.store.cart.retrieve(cartId);
      await sdk.store.payment.initiatePaymentSession(cart as any, {
          provider_id: providerId,
          data: paymentMode !== "pawapay"
            ? {}
            : taraPayment
              ? { taraPaymentId: taraPayment.paymentId, tara_token: taraPayment.tara_token, amount_requested: taraPayment.amount }
              : { depositId, deposit_token: depositToken, correspondent: mobileNetwork },
        });

      // 5. Complete Checkout. Medusa answers 200 { type: "cart", error } when it refuses (payment not authorized,
      // amount short, stock...): only an order with an id is a success, anything else keeps the cart.
      const amount = taraPayment?.amount ?? total;
      let response: Awaited<ReturnType<typeof sdk.store.cart.complete>>;
      try {
        response = await sdk.store.cart.complete(cartId);
      } catch (err: any) {
        reportCompleteFailure(err?.message || String(err), providerId, amount);
        return;
      }
      if (response.type !== "order" || !response.order?.id) {
        const medusaError = response.type === "cart" ? response.error?.message : "";
        reportCompleteFailure(medusaError || "cart.complete returned no order", providerId, amount);
        return;
      }

      const ref = response.order.id;
      const displayId: number | null = (response.order as any).display_id ?? null;

      // Store in session storage for the confirmation page UI only (it adapts to the payment mode)
      const pickupStore = delivery.mode === "retrait" ? STORES.find(s => s.id === delivery.store) : null;
      const order = {
        ref,
        displayId,
        items,
        identity,
        delivery: {
          ...delivery,
          neighborhood: citiesData.find(c => c.name === delivery.city)?.neighborhoods?.find((h: any) => h.id === deliveryNeighborhood)?.name || "",
          eta,
          storeInfo: pickupStore ? { name: pickupStore.name, address: pickupStore.address, hours: pickupStore.hours } : null,
        },
        amounts: {
          subtotal: Number(totalAmount || 0),
          discount: Number(discountTotal || 0),
          delivery: effectiveLivraisonFee,
          paymentFee,
          total,
        },
        total,
        livraisonFee: effectiveLivraisonFee,
        paymentMode,
        mobileMoneyPhone: paymentMode === "pawapay" ? momoLocal : null,
        mobileNetwork: paymentMode === "pawapay" ? mobileNetwork : null,
        manualProvider: paymentMode === "manuel" ? manualProvider : null,
        createdAt: new Date().toISOString(),
      };
      sessionStorage.setItem("welfare_last_order", JSON.stringify(order));

      clearCart();
      window.location.href = `/checkout/confirmation?ref=${ref}`;
    } catch (err: any) {
      console.error("Payment Error:", err);
      const msg = err?.message || err?.toString() || t("Erreur inconnue");
      setFormError(t("Erreur lors de la validation: ") + msg);
      setPaymentWait("");
      setIsLoading(false);
    }
  };

  if (items.length === 0) return null;

  const cityData = citiesData.find(c => c.name === delivery.city);
  const momoHint = (() => {
    if (momoPhoneError) return { text: momoPhoneError, color: ERROR_RED };
    const local = cameroonLocalNumber(momoPhone);
    const operator = local ? cameroonOperator(local) : null;
    if (operator && operator === momoOperator) return { text: t("Numéro {op} détecté").replace("{op}", operator), color: GOOD_GREEN };
    if (operator) return { text: momoMismatchMessage(operator), color: ERROR_RED };
    return null;
  })();
  const deliveryValue = step === 1
    ? t("à calculer")
    : delivery.mode === "retrait" ? t("Gratuit")
    : effectiveLivraisonFee > 0 ? `${formatPrice(effectiveLivraisonFee)} FCFA` : t("Offerte");
  const deliveryFree = step === 2 && (delivery.mode === "retrait" || effectiveLivraisonFee === 0);

  const fade = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.25 } };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen" style={{ background: SK.ground, color: SK.ink }}>
      <div className="w-full max-w-5xl mx-auto px-5 md:px-8 pt-6 pb-16 md:pt-10">

        {/* top: back + reassurance */}
        <div className="flex items-center justify-between gap-3 h-11 mb-5">
          <button
            onClick={() => (step === 2 ? goToStep(1) : router.push("/shop"))}
            aria-label={step === 2 ? t("Retour") : t("Retour à la boutique")}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: SK.surface, border: `1px solid ${SK.line}`, color: SK.ink }}
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
          </button>
          <span className="px-3 py-[7px] rounded-full text-[12px] font-semibold flex items-center gap-1.5" style={{ background: SK.surface, border: `1px solid ${SK.line}` }}>
            <Lock weight="fill" className="w-3.5 h-3.5" style={{ color: SK.accent }} /> {t("Paiement 100% sécurisé")}
          </span>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <Eyebrow>{step === 1 ? t("Étape 1 sur 2") : t("Étape 2 sur 2")}</Eyebrow>
          <SectionTitle as="h1" light={t("Finaliser")} bold={t("ma commande")} size={40} />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10">

          {/* ════════════ LEFT — forms ════════════ */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <Stepper step={step} />

            <AnimatePresence mode="wait">
              {/* ───── STEP 1 — IDENTITÉ ───── */}
              {step === 1 && (
                <motion.div key="step1" {...fade} className="flex flex-col gap-4">
                  <CardBlock title={t("Vos informations")}>
                    <div className="grid grid-cols-2 gap-3">
                      <Field id="ck-firstName" label={t("Prénom")} error={identityErrors.firstName}>
                        <input id="ck-firstName" type="text" autoComplete="given-name" placeholder="Fatou" value={identity.firstName}
                          onChange={(e) => setIdentity({ ...identity, firstName: e.target.value })}
                          aria-invalid={!!identityErrors.firstName} className={fieldClass} style={fieldStyle(identityErrors.firstName)} />
                      </Field>
                      <Field id="ck-lastName" label={t("Nom")} error={identityErrors.lastName}>
                        <input id="ck-lastName" type="text" autoComplete="family-name" placeholder="Mbarga" value={identity.lastName}
                          onChange={(e) => setIdentity({ ...identity, lastName: e.target.value })}
                          aria-invalid={!!identityErrors.lastName} className={fieldClass} style={fieldStyle(identityErrors.lastName)} />
                      </Field>
                    </div>
                    <Field id="ck-email" label={t("E-mail")} hint={t("· pour recevoir votre confirmation")} error={identityErrors.email}>
                      <input id="ck-email" type="email" autoComplete="email" inputMode="email" placeholder="fatou@exemple.com" value={identity.email}
                        onChange={(e) => setIdentity({ ...identity, email: e.target.value })}
                        aria-invalid={!!identityErrors.email} className={fieldClass} style={fieldStyle(identityErrors.email)} />
                    </Field>
                    <Field id="ck-phone" label={t("Téléphone / WhatsApp")} hint={t("· pour le suivi de livraison")} error={identityErrors.phone}>
                      <input id="ck-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="6XX XX XX XX" value={identity.phone}
                        onChange={(e) => setIdentity({ ...identity, phone: e.target.value })}
                        aria-invalid={!!identityErrors.phone} className={fieldClass} style={fieldStyle(identityErrors.phone)} />
                    </Field>
                  </CardBlock>
                </motion.div>
              )}

              {/* ───── STEP 2 — LIVRAISON & PAIEMENT ───── */}
              {step === 2 && (
                <motion.div key="step2" {...fade} className="flex flex-col gap-4">
                  {/* recap of step 1 */}
                  <div className="rounded-[20px] px-4 py-3 flex items-center justify-between gap-3" style={{ background: SK.tint }}>
                    <div className="min-w-0 text-[14px] leading-snug">
                      <p className="font-bold truncate">{identity.firstName} {identity.lastName}</p>
                      <p className="truncate" style={{ color: SK.muted }}>{identity.phone} · {identity.email}</p>
                    </div>
                    <button onClick={() => goToStep(1)} className="h-9 px-3.5 rounded-full text-[13px] font-bold shrink-0" style={{ background: SK.surface, color: SK.ink }}>
                      {t("Modifier")}
                    </button>
                  </div>

                  {/* delivery */}
                  <CardBlock title={t("Mode de livraison")}>
                    <div className="flex flex-col gap-2.5">
                      <Choice
                        selected={delivery.mode === "domicile"}
                        onClick={() => setDelivery({ ...delivery, mode: "domicile", store: null })}
                        icon={<House className="w-5 h-5" />}
                        title={t("Livraison à domicile")}
                        text={<>
                          <span className="font-bold" style={{ color: effectiveLivraisonFee === 0 ? GOOD_GREEN : SK.ink }}>{effectiveLivraisonFee > 0 ? `${formatPrice(livraisonFee)} FCFA` : t("Offerte")}</span>
                          {" · "}{eta ? `${t("Délai estimé :")} ${t(eta)}` : t("Partout au Cameroun")}
                        </>}
                      />
                      <Choice
                        selected={delivery.mode === "retrait"}
                        onClick={() => setDelivery({ ...delivery, mode: "retrait" })}
                        icon={<Storefront className="w-5 h-5" />}
                        title={t("Retrait en boutique")}
                        text={<><span className="font-bold" style={{ color: GOOD_GREEN }}>{t("Gratuit")}</span>{" · "}{t("Yaoundé")}</>}
                      />
                    </div>

                    <AnimatePresence initial={false} mode="wait">
                      {delivery.mode === "domicile" ? (
                        <motion.div key="domicile" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="flex flex-col gap-3 pt-1">
                            <Field id="ck-address" label={t("Adresse complète")} error={deliveryErrors.address}>
                              <input id="ck-address" type="text" autoComplete="street-address" placeholder={t("Rue, quartier, point de repère")} value={delivery.address}
                                onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                                aria-invalid={!!deliveryErrors.address} className={fieldClass} style={fieldStyle(deliveryErrors.address)} />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                              <Field id="ck-city" label={t("Ville")} error={deliveryErrors.city}>
                                <div className="relative">
                                  <select id="ck-city" value={delivery.city} onChange={(e) => { setDelivery({ ...delivery, city: e.target.value }); setDeliveryNeighborhood(""); }}
                                    className={`${fieldClass} pr-9`} style={fieldStyle(deliveryErrors.city)}>
                                    {CAMEROON_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                  <CaretDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: SK.muted }} />
                                </div>
                              </Field>
                              {cityData?.has_neighborhoods ? (
                                <Field id="ck-hood" label={t("Quartier")} error={deliveryErrors.neighborhood}>
                                  <div className="relative">
                                    <select id="ck-hood" value={deliveryNeighborhood} onChange={(e) => setDeliveryNeighborhood(e.target.value)}
                                      className={`${fieldClass} pr-9`} style={fieldStyle(deliveryErrors.neighborhood)}>
                                      <option value="">{t("Sélectionnez un quartier")}</option>
                                      {cityData.neighborhoods?.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
                                    </select>
                                    <CaretDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: SK.muted }} />
                                  </div>
                                </Field>
                              ) : (
                                <Field id="ck-country" label={t("Pays")}>
                                  <input id="ck-country" value={t("Cameroun")} disabled className={fieldClass} style={{ ...fieldStyle(), background: SK.ground, border: `1px solid ${SK.lineSoft}` }} />
                                </Field>
                              )}
                            </div>
                            {eta && (
                              <p className="flex items-center gap-2 text-[13px] font-semibold rounded-[14px] px-3.5 py-2.5" style={{ background: "#EEF6F1", color: GOOD_GREEN }}>
                                <Clock className="w-4 h-4 shrink-0" /> {t("Délai estimé :")} {t(eta)}
                              </p>
                            )}
                            <Field id="ck-notes" label={t("Instructions")} hint={t("(optionnel)")}>
                              <textarea id="ck-notes" rows={2} placeholder={t("Ex: Appeler avant de venir, passer par l'entrée latérale...")} value={delivery.notes}
                                onChange={(e) => setDelivery({ ...delivery, notes: e.target.value })}
                                className="w-full rounded-[14px] px-3.5 py-3 text-[15px] outline-none focus:ring-2 resize-none" style={fieldStyle()} />
                            </Field>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="retrait" id="ck-stores" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="flex flex-col gap-2.5 pt-1">
                            <p className="text-[12px] font-bold" style={{ color: deliveryErrors.store ? ERROR_RED : SK.muted }}>
                              {deliveryErrors.store || t("Choisissez votre magasin")}
                            </p>
                            {STORES.map((store) => (
                              <Choice
                                key={store.id}
                                selected={delivery.store === store.id}
                                onClick={() => { setDelivery({ ...delivery, store: store.id }); setDeliveryErrors((e) => ({ ...e, store: undefined })); }}
                                icon={<Storefront weight="fill" className="w-5 h-5" />}
                                title={store.name}
                                text={<>{store.address}<span className="flex items-center gap-1 mt-0.5"><Clock className="w-3.5 h-3.5" /> {t(store.hours)}</span></>}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardBlock>

                  {/* payment */}
                  <CardBlock title={t("Mode de paiement")}>
                    <div className="flex flex-col gap-2.5">
                      <Choice
                        selected={paymentMode === "pawapay"}
                        onClick={() => setPaymentMode("pawapay")}
                        icon={<DeviceMobile className="w-5 h-5" />}
                        title={t("Mobile Money (MTN / Orange)")}
                        text={t("Validation directe sur votre téléphone · frais 3 %")}
                      />
                      <AnimatePresence initial={false}>
                        {paymentMode === "pawapay" && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="flex flex-col gap-3 pt-1 pb-2">
                              <Field id="momo-network" label={t("Réseau")}>
                                <div className="relative">
                                  <select id="momo-network" value={mobileNetwork} onChange={(e) => setMobileNetwork(e.target.value)} className={`${fieldClass} pr-9`} style={fieldStyle()}>
                                    {/* Both networks are collected by Tara (see TARA_NETWORKS) */}
                                    <option value="MTN_MOMO_CMR">{t("MTN MoMo Cameroun")}</option>
                                    <option value="ORANGE_CMR">{t("Orange Money Cameroun")}</option>
                                  </select>
                                  <CaretDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: SK.muted }} />
                                </div>
                              </Field>
                              <Field id="momo-phone" label={isOrange ? t("Numéro Orange Money à débiter") : t("Numéro MTN Mobile Money à débiter")}>
                                <div className="relative">
                                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-semibold" style={{ color: SK.muted }}>+237</span>
                                  <input
                                    id="momo-phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="6XX XX XX XX"
                                    value={momoPhone}
                                    onChange={(e) => {
                                      setMomoPhone(e.target.value);
                                      setMomoPhoneError("");
                                      // the network follows the number typed
                                      const local = cameroonLocalNumber(e.target.value);
                                      const operator = local ? cameroonOperator(local) : null;
                                      if (operator === "MTN") setMobileNetwork("MTN_MOMO_CMR");
                                      if (operator === "Orange") setMobileNetwork("ORANGE_CMR");
                                    }}
                                    aria-invalid={!!momoPhoneError}
                                    aria-describedby="momo-phone-hint"
                                    className={`${fieldClass} pl-[62px]`}
                                    style={fieldStyle(momoPhoneError)}
                                  />
                                </div>
                              </Field>
                              <p id="momo-phone-hint" className="text-[13px] leading-relaxed" style={{ color: momoHint?.color ?? SK.muted }}>
                                {momoHint ? momoHint.text : t("Vous recevrez une notification (Push USSD) sur ce numéro pour valider le paiement avec votre code PIN.")}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Choice
                        selected={paymentMode === "manuel"}
                        onClick={() => setPaymentMode("manuel")}
                        icon={<Phone className="w-5 h-5" />}
                        title={t("Paiement manuel (USSD)")}
                        text={t("Orange Money / MTN Mobile Money · sans frais")}
                      />
                      <AnimatePresence initial={false}>
                        {paymentMode === "manuel" && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="flex flex-col gap-3 pt-1 pb-1">
                              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("Opérateur")}>
                                {(["orange", "mtn"] as const).map((p) => {
                                  const on = manualProvider === p;
                                  return (
                                    <button
                                      key={p}
                                      type="button"
                                      role="radio"
                                      aria-checked={on}
                                      onClick={() => setManualProvider(p)}
                                      className="h-11 rounded-full text-[14px] font-bold flex items-center justify-center gap-2"
                                      style={on ? { background: SK.ink, color: "#FFFFFF" } : { background: SK.surface, color: SK.ink, border: `1px solid ${SK.line}` }}
                                    >
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: p === "orange" ? "#FF7900" : "#FFCC00" }} aria-hidden="true" />
                                      {MANUAL_PAYMENT[p].label}
                                    </button>
                                  );
                                })}
                              </div>
                              <ol className="flex flex-col gap-2.5 rounded-[18px] p-4 text-[14px] leading-relaxed" style={{ background: SK.ground, border: `1px solid ${SK.lineSoft}` }}>
                                {[
                                  <>{t("Composez le code")} <strong className="whitespace-nowrap">{MANUAL_PAYMENT[manualProvider].code}</strong></>,
                                  <>{t("Transférez le montant exact de")} <strong className="whitespace-nowrap">{formatPrice(total)} FCFA</strong></>,
                                  <>{t("Revenez ici et confirmez votre commande.")}</>,
                                ].map((line, i) => (
                                  <li key={i} className="flex gap-2.5">
                                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: SK.tint, color: SK.accent }}>{i + 1}</span>
                                    <span>{line}</span>
                                  </li>
                                ))}
                              </ol>
                              <a
                                href={ussdHref(manualProvider)}
                                className="h-[48px] rounded-full text-[15px] font-bold flex items-center justify-center gap-2"
                                style={{ border: `1px solid ${SK.ink}`, color: SK.ink, background: SK.surface }}
                              >
                                <Phone weight="fill" className="w-4 h-4" /> {t("Lancer le paiement (USSD)")}
                              </a>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardBlock>
                </motion.div>
              )}
            </AnimatePresence>

            {/* payment in progress */}
            {paymentWait && (
              <div role="status" className="rounded-[22px] p-4 flex items-center gap-3.5" style={{ background: SK.tint }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: SK.surface }}>
                  <CircleNotch className="w-5 h-5 animate-spin" style={{ color: SK.accent }} />
                </div>
                <p className="text-[14px] font-bold leading-snug">{paymentWait}</p>
              </div>
            )}

            {formError && (
              <div role="alert" className="rounded-[18px] px-4 py-3 flex items-start gap-2.5 text-[14px]" style={{ background: "#FDECEC", color: "#9F1C12" }}>
                <WarningCircle weight="fill" className="w-5 h-5 shrink-0 mt-px" />
                <span>{formError}</span>
              </div>
            )}

            {completeFailedRef && (
              <div role="alert" className="rounded-[18px] px-4 py-3 flex items-start gap-2.5 text-[14px]" style={{ background: "#FDECEC", color: "#9F1C12" }}>
                <WarningCircle weight="fill" className="w-5 h-5 shrink-0 mt-px" />
                <div className="min-w-0 space-y-1.5">
                  <p className="font-bold">{t("Votre paiement n'a pas pu être finalisé : aucune commande n'a été créée.")}</p>
                  <p>{t("Si vous avez été débitée, ne repayez pas : contactez-nous sur WhatsApp en indiquant cette référence.")}</p>
                  <p className="break-all">{t("Référence :")} <strong>{completeFailedRef}</strong></p>
                  <a
                    href={`https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(`${t("Bonjour, mon paiement n'a pas été finalisé sur le site. Référence du panier :")} ${completeFailedRef}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-bold underline"
                  >
                    {t("Nous écrire sur WhatsApp")}
                  </a>
                </div>
              </div>
            )}

            {/* main action */}
            <button
              onClick={step === 1 ? handleStep1Next : handleSubmit}
              disabled={isLoading}
              className="h-[58px] rounded-full text-[16px] font-bold flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: SK.accent, color: "#FFFFFF" }}
            >
              {isLoading ? (
                <CircleNotch className="w-5 h-5 animate-spin" />
              ) : step === 1 ? (
                <>{t("Continuer vers la livraison")} <ArrowRight className="w-5 h-5" /></>
              ) : paymentMode === "pawapay" ? (
                <>{t("Payer")} {formatPrice(total)} FCFA</>
              ) : (
                <>{t("Confirmer ma commande")} <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-[12px] text-center" style={{ color: SK.muted }}>
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {step === 1 ? t("Vos informations servent uniquement à la livraison de votre commande.") : t("Produits authentiques · Paiement sécurisé")}
            </p>
          </div>

          {/* ════════════ RIGHT — summary (first and folded on the phone) ════════════ */}
          <aside className="order-first lg:order-none lg:w-[360px] shrink-0 lg:sticky lg:top-28">
            <div className="rounded-[26px] p-[18px] sm:p-5 flex flex-col gap-4" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
              <button
                type="button"
                onClick={() => setSummaryOpen((o) => !o)}
                aria-expanded={summaryOpen}
                aria-controls="ck-summary-items"
                className="flex items-center justify-between gap-3 text-left lg:pointer-events-none"
              >
                <span className="min-w-0">
                  <span className="block whitespace-nowrap" style={{ fontFamily: DISPLAY_FONT, fontSize: 21, lineHeight: 1.1, fontWeight: 300 }}>
                    {t("Votre")} <span style={{ fontWeight: 700 }}>{t("commande")}</span>
                  </span>
                  <span className="block text-[13px] mt-0.5" style={{ color: SK.muted }}>{itemCount} {t(itemCount > 1 ? "articles" : "article")}</span>
                </span>
                <span className="flex items-center gap-2 lg:hidden">
                  <span className="whitespace-nowrap" style={{ fontFamily: DISPLAY_FONT, fontSize: 19, fontWeight: 700 }}>{formatPrice(total)} FCFA</span>
                  <CaretDown className={`w-4 h-4 transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
                </span>
              </button>

              <div id="ck-summary-items" className={`${summaryOpen ? "flex" : "hidden"} lg:flex flex-col gap-4`}>
                <div className="flex flex-col gap-2.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: SK.tint }}>
                        {item.thumbnail
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={item.thumbnail} alt="" className="w-full h-full object-contain" />
                          : <Package className="w-6 h-6" style={{ color: SK.muted }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold leading-snug line-clamp-2">{item.title}</p>
                        <p className="text-[13px]" style={{ color: SK.muted }}>{t("Qté :")} {item.quantity}</p>
                      </div>
                      <p className="text-[14px] font-bold whitespace-nowrap">{formatPrice(item.price * item.quantity)} FCFA</p>
                    </div>
                  ))}
                </div>

                <PromoCodeField />

                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between text-[14px]"><span style={{ color: SK.muted }}>{t("Sous-total")}</span><span>{formatPrice(totalAmount)} FCFA</span></div>
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-[14px]"><span style={{ color: SK.muted }}>{t("Réduction")}</span><span style={{ color: GOOD_GREEN }}>− {formatPrice(discountTotal)} FCFA</span></div>
                  )}
                  <div className="flex justify-between text-[14px]">
                    <span style={{ color: SK.muted }}>{delivery.mode === "retrait" && step === 2 ? t("Retrait magasin") : t("Livraison")}</span>
                    <span style={deliveryFree ? { color: GOOD_GREEN, fontWeight: 600 } : step === 1 ? { color: SK.muted } : undefined}>{deliveryValue}</span>
                  </div>
                  {paymentFee > 0 && step === 2 && (
                    <div className="flex justify-between text-[14px]"><span style={{ color: SK.muted }}>{t("Frais Mobile Money (3 %)")}</span><span>{formatPrice(paymentFee)} FCFA</span></div>
                  )}
                  <div className="h-px" style={{ background: SK.lineSoft }} />
                  <div className="flex justify-between items-baseline">
                    <span className="text-[15px] font-bold">{t("Total")}</span>
                    <span style={{ fontFamily: DISPLAY_FONT, fontSize: 26, fontWeight: 700 }}>{formatPrice(total)} FCFA</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
