"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Check,
  CheckCircle,
  CircleNotch,
  Clock,
  Copy,
  DeviceMobile,
  HourglassMedium,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Storefront,
  Truck,
  User,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n-context";
import { MANUAL_PAYMENT, ManualProvider, ussdHref } from "@/lib/manual-payment";

// Order confirmation. What the customer must know depends on how they paid:
//   - "pawapay": the Mobile Money push was approved, the order is paid → receipt + what happens next;
//   - "manuel": they sent the money by USSD themselves, the shop still has to check it → status
//     "en vérification", with the code and exact amount in case they have not paid yet.
// The page reads the summary the checkout left in sessionStorage; without it (other device, cleared
// storage) it falls back to a neutral confirmation.

type StoredOrder = {
  ref: string;
  displayId?: number | null;
  items?: { id: string; title: string; thumbnail?: string; price: number; quantity: number; variantTitle?: string }[];
  identity?: { firstName: string; lastName: string; email: string; phone: string };
  delivery?: {
    mode: "domicile" | "retrait";
    address?: string;
    city?: string;
    neighborhood?: string;
    eta?: string;
    storeInfo?: { name: string; address: string; hours: string } | null;
  };
  amounts?: { subtotal: number; discount: number; delivery: number; paymentFee: number; total: number };
  total?: number;
  paymentMode?: "pawapay" | "manuel";
  mobileMoneyPhone?: string | null;
  manualProvider?: ManualProvider | null;
};

const ease = [0.22, 1, 0.36, 1] as const;

// The shop's WhatsApp line (customer service)
const SHOP_WHATSAPP = "237640236304";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount || 0));
}

function formatLocalPhone(local?: string | null) {
  if (!local || local.length !== 9) return local || "";
  return `+237 ${local.slice(0, 1)} ${local.slice(1, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
}

function Card({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
      className={`bg-white rounded-3xl border border-[#EDE0E0] shadow-[0_2px_24px_rgba(42,36,36,0.04)] ${className}`}
    >
      {children}
    </motion.section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A2424]/40 mb-3">{children}</p>;
}

function ConfirmationContent() {
  const { t } = useI18n();
  const params = useSearchParams();
  const ref = params.get("ref") || "";
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("welfare_last_order");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only trust the summary of this very order
        if (!ref || parsed.ref === ref) setOrder(parsed);
      }
    } catch {
      // storage unavailable: neutral confirmation
    }
    setLoaded(true);
  }, [ref]);

  const orderNumber = order?.displayId ? `WLF-${order.displayId}` : ref ? `WLF-${ref.replace(/^order_/, "").slice(-6).toUpperCase()}` : "";
  const isPawapay = order?.paymentMode === "pawapay";
  const isManual = order?.paymentMode === "manuel";
  const isPickup = order?.delivery?.mode === "retrait";
  const amounts = order?.amounts;
  const total = amounts?.total ?? order?.total ?? 0;
  const firstName = order?.identity?.firstName?.trim();
  const provider = order?.manualProvider ? MANUAL_PAYMENT[order.manualProvider] : null;

  const copyNumber = () => {
    navigator.clipboard?.writeText(orderNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
        <CircleNotch className="w-8 h-8 text-[#C08A8E] animate-spin" />
      </main>
    );
  }

  // Status steps, adapted to the payment mode and the delivery mode
  const steps = [
    { label: t("Commande reçue"), state: "done" as const },
    { label: isManual ? t("Paiement en vérification") : t("Paiement reçu"), state: isManual ? ("current" as const) : ("done" as const) },
    { label: t("Préparation"), state: isManual ? ("todo" as const) : ("current" as const) },
    { label: isPickup ? t("Retrait en boutique") : t("Livraison"), state: "todo" as const },
  ];

  const heroTitle = isPawapay
    ? t("Paiement reçu, commande confirmée")
    : isManual
      ? t("Commande enregistrée")
      : t("Merci pour votre commande");
  const heroText = isPawapay
    ? t("Nous avons bien reçu votre paiement MTN Mobile Money. Votre commande part en préparation.")
    : isManual
      ? t("Notre équipe vérifie la réception de votre paiement Mobile Money. Vous serez contacté(e) dès qu'il est confirmé.")
      : t("Votre commande a bien été enregistrée. Vous serez contacté(e) pour la suite.");

  return (
    <main className="min-h-screen bg-[#F8F5F2] relative overflow-hidden">
      {/* soft brand glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-[#F4EAEB] blur-3xl opacity-80" />

      <div className="relative w-full max-w-[560px] mx-auto px-4 sm:px-5 pt-10 pb-16">
        {/* ─── Hero ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="flex flex-col items-center text-center mb-8"
        >
          <div className="relative mb-6">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.7, ease }}
              className={`absolute inset-0 -m-4 rounded-full ${isManual ? "bg-amber-100/70" : "bg-emerald-100/70"}`}
            />
            <motion.div
              initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 220, damping: 14 }}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${isManual ? "bg-amber-500 shadow-amber-500/30" : "bg-emerald-500 shadow-emerald-500/30"}`}
            >
              {isManual ? <HourglassMedium weight="fill" className="w-9 h-9 text-white" /> : <Check weight="bold" className="w-10 h-10 text-white" />}
            </motion.div>
          </div>

          {firstName && <p className="text-sm font-semibold text-[#C08A8E] mb-1">{t("Merci")} {firstName} !</p>}
          <h1 className="text-[26px] sm:text-3xl font-bold text-[#2A2424] leading-tight max-w-[420px]" style={{ letterSpacing: "-0.025em" }}>
            {heroTitle}
          </h1>
          <p className="text-sm text-[#2A2424]/60 mt-3 max-w-[400px] leading-relaxed">{heroText}</p>

          {orderNumber && (
            <button
              onClick={copyNumber}
              className="mt-5 inline-flex items-center gap-2 pl-4 pr-3 py-2 rounded-full bg-white border border-[#EDE0E0] shadow-sm text-sm hover:border-[#C08A8E] transition-colors"
            >
              <span className="text-[#2A2424]/50">{t("Commande")}</span>
              <span className="font-bold text-[#2A2424] font-mono tracking-wide">{orderNumber}</span>
              <span className="w-7 h-7 rounded-full bg-[#F4EAEB] flex items-center justify-center">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#C08A8E]" />}
              </span>
            </button>
          )}
        </motion.div>

        <div className="space-y-4">
          {/* ─── Progress ─── */}
          {order && (
            <Card delay={0.1} className="px-5 py-5">
              <ol className="grid grid-cols-4 gap-1">
                {steps.map((s, i) => (
                  <li key={i} className="flex flex-col items-center text-center relative">
                    {i < steps.length - 1 && (
                      <span className={`absolute top-3.5 left-1/2 w-full h-[2px] ${s.state === "done" ? "bg-emerald-400" : "bg-[#EDE0E0]"}`} />
                    )}
                    <span
                      className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                        s.state === "done"
                          ? "bg-emerald-500 border-emerald-500"
                          : s.state === "current"
                            ? isManual ? "bg-white border-amber-500" : "bg-white border-emerald-500"
                            : "bg-white border-[#EDE0E0]"
                      }`}
                    >
                      {s.state === "done" && <Check weight="bold" className="w-3.5 h-3.5 text-white" />}
                      {s.state === "current" && <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isManual ? "bg-amber-500" : "bg-emerald-500"}`} />}
                    </span>
                    <span className={`mt-2 text-[10.5px] leading-tight font-semibold ${s.state === "todo" ? "text-[#2A2424]/35" : "text-[#2A2424]"}`}>{s.label}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {/* ─── Payment ─── */}
          {isPawapay && (
            <Card delay={0.15} className="p-5 sm:p-6">
              <SectionLabel>{t("Paiement")}</SectionLabel>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFCC00] flex items-center justify-center shrink-0">
                  <DeviceMobile weight="fill" className="w-6 h-6 text-[#2A2424]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#2A2424]">MTN Mobile Money</p>
                  {order?.mobileMoneyPhone && <p className="text-xs text-[#2A2424]/50 mt-0.5 font-mono">{formatLocalPhone(order.mobileMoneyPhone)}</p>}
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                  <CheckCircle weight="fill" className="w-3.5 h-3.5" /> {t("Payé")}
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between rounded-2xl bg-[#F8F5F2] px-4 py-3">
                <div>
                  <p className="text-[11px] text-[#2A2424]/50">{t("Montant débité")}</p>
                  <p className="text-xl font-bold text-[#2A2424]">{formatPrice(total)} <span className="text-xs font-semibold text-[#2A2424]/50">FCFA</span></p>
                </div>
                {!!amounts?.paymentFee && (
                  <p className="text-[11px] text-[#2A2424]/50 text-right">{t("dont frais Mobile Money (3 %)")}<br /><span className="font-semibold text-[#2A2424]/70">{formatPrice(amounts.paymentFee)} FCFA</span></p>
                )}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#2A2424]/50">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {t("Paiement sécurisé via PawaPay. Conservez le SMS de confirmation de MTN.")}
              </p>
            </Card>
          )}

          {isManual && (
            <Card delay={0.15} className="p-5 sm:p-6 border-amber-200">
              <SectionLabel>{t("Paiement")}</SectionLabel>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${order?.manualProvider === "orange" ? "bg-orange-500" : "bg-[#FFCC00]"}`}>
                  <DeviceMobile weight="fill" className={`w-6 h-6 ${order?.manualProvider === "orange" ? "text-white" : "text-[#2A2424]"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#2A2424]">{provider?.label || t("Mobile Money")}</p>
                  <p className="text-xs text-[#2A2424]/50 mt-0.5">{t("Paiement manuel (USSD)")}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                  <Clock weight="fill" className="w-3.5 h-3.5" /> {t("À vérifier")}
                </span>
              </div>
              <div className="mt-4 rounded-2xl bg-amber-50/60 border border-amber-100 px-4 py-3 text-sm text-[#2A2424]/80 leading-relaxed">
                {t("Vous n'avez pas encore envoyé le paiement ? Composez le code ci-dessous et transférez exactement")}{" "}
                <strong className="text-[#2A2424]">{formatPrice(total)} FCFA</strong>.
                {provider && <p className="mt-2 font-mono font-bold text-[#2A2424] text-base tracking-wide">{provider.code}</p>}
              </div>
              {order?.manualProvider && (
                <a
                  href={ussdHref(order.manualProvider)}
                  className={`mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-colors ${order.manualProvider === "orange" ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-[#FFCC00] hover:bg-yellow-400 text-[#2A2424]"}`}
                >
                  <Phone weight="fill" className="w-4 h-4" /> {t("Lancer le paiement (USSD)")}
                </a>
              )}
              {order?.identity?.phone && (
                <p className="mt-3 text-[11px] text-[#2A2424]/50">
                  {t("Nous vous contacterons au")} <span className="font-semibold text-[#2A2424]/70">{order.identity.phone}</span> {t("dès réception du paiement.")}
                </p>
              )}
            </Card>
          )}

          {/* ─── Receipt ─── */}
          {order?.items && order.items.length > 0 && (
            <Card delay={0.2} className="p-5 sm:p-6">
              <SectionLabel>{t("Récapitulatif")}</SectionLabel>
              <ul className="space-y-3">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#F8F5F2] border border-[#EDE0E0] overflow-hidden shrink-0 flex items-center justify-center">
                      {item.thumbnail
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                        : <Package className="w-5 h-5 text-[#2A2424]/25" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2A2424] line-clamp-2 leading-snug">{item.title}</p>
                      <p className="text-[11px] text-[#2A2424]/45 mt-0.5">{t("Qté")} {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-[#2A2424] shrink-0">{formatPrice(item.price * item.quantity)}</p>
                  </li>
                ))}
              </ul>

              {/* perforation */}
              <div className="relative my-5 -mx-5 sm:-mx-6">
                <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#F8F5F2] border border-[#EDE0E0]" />
                <span className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#F8F5F2] border border-[#EDE0E0]" />
                <div className="mx-5 border-t-2 border-dashed border-[#EDE0E0]" />
              </div>

              <dl className="space-y-2 text-sm">
                {amounts && (
                  <>
                    <div className="flex justify-between text-[#2A2424]/60"><dt>{t("Sous-total")}</dt><dd>{formatPrice(amounts.subtotal)} FCFA</dd></div>
                    {amounts.discount > 0 && (
                      <div className="flex justify-between text-emerald-700"><dt>{t("Réduction")}</dt><dd>−{formatPrice(amounts.discount)} FCFA</dd></div>
                    )}
                    <div className="flex justify-between text-[#2A2424]/60">
                      <dt>{isPickup ? t("Retrait magasin") : t("Livraison")}</dt>
                      <dd className={amounts.delivery === 0 ? "text-emerald-700 font-semibold" : ""}>{amounts.delivery === 0 ? t("Gratuit") : `${formatPrice(amounts.delivery)} FCFA`}</dd>
                    </div>
                    {amounts.paymentFee > 0 && (
                      <div className="flex justify-between text-[#2A2424]/60"><dt>{t("Frais Mobile Money (3 %)")}</dt><dd>+{formatPrice(amounts.paymentFee)} FCFA</dd></div>
                    )}
                  </>
                )}
                <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-[#EDE0E0]">
                  <dt className="font-bold text-[#2A2424]">{isPawapay ? t("Total payé") : t("Total à payer")}</dt>
                  <dd className="text-lg font-bold text-[#2A2424]">{formatPrice(total)} <span className="text-xs text-[#2A2424]/50">FCFA</span></dd>
                </div>
              </dl>
            </Card>
          )}

          {/* ─── Pickup / delivery ─── */}
          {order?.delivery && (
            <Card delay={0.25} className="p-5 sm:p-6">
              <SectionLabel>{isPickup ? t("Retrait en boutique") : t("Livraison")}</SectionLabel>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F4EAEB] flex items-center justify-center shrink-0">
                  {isPickup ? <Storefront weight="fill" className="w-6 h-6 text-[#C08A8E]" /> : <Truck weight="fill" className="w-6 h-6 text-[#C08A8E]" />}
                </div>
                <div className="flex-1 min-w-0">
                  {isPickup ? (
                    <>
                      <p className="text-sm font-bold text-[#2A2424]">{order.delivery.storeInfo?.name || t("Boutique The Welfare")}</p>
                      {order.delivery.storeInfo?.address && (
                        <p className="text-xs text-[#2A2424]/55 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /> {order.delivery.storeInfo.address}</p>
                      )}
                      {order.delivery.storeInfo?.hours && (
                        <p className="text-xs text-[#2A2424]/55 mt-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5 shrink-0" /> {t(order.delivery.storeInfo.hours)}</p>
                      )}
                      <p className="text-xs text-[#C08A8E] font-semibold mt-2">
                        {isManual ? t("Votre commande sera prête dès la confirmation du paiement.") : t("Présentez votre numéro de commande en boutique pour la retirer.")}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-[#2A2424]">{[order.delivery.address, order.delivery.neighborhood].filter(Boolean).join(", ") || t("Adresse de livraison")}</p>
                      <p className="text-xs text-[#2A2424]/55 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /> {order.delivery.city}, Cameroun</p>
                      {order.delivery.eta && (
                        <p className="text-xs text-[#2A2424]/55 mt-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5 shrink-0" /> {t("Délai estimé :")} {t(order.delivery.eta)}</p>
                      )}
                      <p className="text-xs text-[#C08A8E] font-semibold mt-2">
                        {isManual ? t("La livraison sera programmée dès la confirmation du paiement.") : t("Nous vous contacterons pour organiser la livraison.")}
                      </p>
                    </>
                  )}
                </div>
              </div>
              {order.identity && (
                <div className="mt-4 pt-4 border-t border-[#F5F0EB] flex items-center gap-3 text-xs text-[#2A2424]/60">
                  <User className="w-4 h-4 text-[#2A2424]/35 shrink-0" />
                  <span className="font-semibold text-[#2A2424]/80">{order.identity.firstName} {order.identity.lastName}</span>
                  {order.identity.phone && <span className="ml-auto font-mono">{order.identity.phone}</span>}
                </div>
              )}
            </Card>
          )}

          {/* ─── Actions ─── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3, ease }} className="pt-2 space-y-3">
            <Link
              href="/shop"
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#2A2424] text-white rounded-2xl text-sm font-bold hover:bg-black transition-colors shadow-lg shadow-[#2A2424]/15"
            >
              <ShoppingBag weight="fill" className="w-4 h-4" />
              {t("Continuer mes achats")}
            </Link>
            <a
              href={`https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(`${t("Bonjour, je vous écris au sujet de ma commande")} ${orderNumber}`.trim())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#25D366] text-white rounded-2xl text-sm font-bold hover:bg-[#1DA851] transition-colors"
            >
              <WhatsappLogo weight="fill" className="w-5 h-5" />
              {t("Écrire à la boutique sur WhatsApp")}
            </a>
            <Link
              href="/account"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-white border border-[#EDE0E0] text-[#2A2424] rounded-2xl text-sm font-semibold hover:border-[#C08A8E] transition-colors"
            >
              {t("Suivre mes commandes")}
            </Link>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
          <CircleNotch className="w-8 h-8 text-[#C08A8E] animate-spin" />
        </main>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
