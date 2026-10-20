"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Check,
  CircleNotch,
  Clock,
  Copy,
  HourglassMedium,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n-context";
import { MANUAL_PAYMENT, ManualProvider, ussdHref } from "@/lib/manual-payment";
import { orderCode } from "@/lib/order-view";
import { DISPLAY_FONT, Eyebrow, SK, SectionTitle } from "@/components/account/account-ui";

// Order confirmation, in the Skin Coach look of the customer space. What the customer must know depends on
// how they paid:
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
  mobileNetwork?: string | null;
  manualProvider?: ManualProvider | null;
};

const ease = [0.22, 1, 0.36, 1] as const;
const GOOD_GREEN = "#0B6B45";
const PENDING = { bg: "#FFF1D6", color: "#7A4B00" };

// The shop's WhatsApp line (customer service)
const SHOP_WHATSAPP = "237640236304";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount || 0));
}

function formatLocalPhone(local?: string | null) {
  if (!local || local.length !== 9) return local || "";
  return `+237 ${local.slice(0, 1)} ${local.slice(1, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
}

function Block({ children, className = "", delay = 0, tint = false }: { children: ReactNode; className?: string; delay?: number; tint?: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease }}
      className={`rounded-[26px] p-[18px] sm:p-5 ${className}`}
      style={tint ? { background: SK.tint } : { background: SK.surface, border: `1px solid ${SK.lineSoft}` }}
    >
      {children}
    </motion.section>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <p className="text-[12px] font-bold uppercase tracking-[0.06em] mb-3" style={{ color: SK.muted }}>{children}</p>
);

const Spinner = () => (
  <main className="min-h-screen flex items-center justify-center" style={{ background: SK.ground }}>
    <div className="w-12 h-12 rounded-full animate-spin" style={{ border: `4px solid ${SK.track}`, borderTopColor: SK.accent }} />
  </main>
);

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

  // same number as in the customer space ("#WF-0042")
  const orderNumber = order?.displayId ? orderCode(order.displayId) : ref ? `#WF-${ref.replace(/^order_/, "").slice(-6).toUpperCase()}` : "";
  const isPawapay = order?.paymentMode === "pawapay";
  const isManual = order?.paymentMode === "manuel";
  const isOrange = order?.mobileNetwork === "ORANGE_CMR";
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

  if (!loaded) return <Spinner />;

  // Status steps, adapted to the payment mode and the delivery mode (same timeline as the order detail)
  type StepState = "done" | "current" | "todo";
  const steps: { label: string; detail?: string; state: StepState }[] = [
    { label: t("Commande reçue"), state: "done" },
    {
      label: isManual ? t("Paiement en vérification") : t("Paiement reçu"),
      detail: isManual ? t("Notre équipe confirme la réception de votre transfert.") : undefined,
      state: isManual ? "current" : "done",
    },
    { label: t("Préparation"), detail: isManual ? undefined : t("Nous préparons votre commande."), state: isManual ? "todo" : "current" },
    { label: isPickup ? t("Retrait en boutique") : t("Livraison"), state: "todo" },
  ];

  const [heroLight, heroBold] = isPawapay
    ? [t("Merci,"), t("commande confirmée.")]
    : isManual
      ? [t("Commande"), t("enregistrée.")]
      : [t("Merci pour"), t("votre commande.")];
  const heroText = isPawapay
    ? isOrange
      ? t("Nous avons bien reçu votre paiement Orange Money. Votre commande part en préparation.")
      : t("Nous avons bien reçu votre paiement MTN Mobile Money. Votre commande part en préparation.")
    : isManual
      ? t("Notre équipe vérifie la réception de votre paiement Mobile Money. Vous serez contacté(e) dès qu'il est confirmé.")
      : t("Votre commande a bien été enregistrée. Vous serez contacté(e) pour la suite.");

  return (
    <main className="min-h-screen" style={{ background: SK.ground, color: SK.ink }}>
      <div className="w-full max-w-[600px] mx-auto px-5 pt-8 pb-16 md:pt-12 flex flex-col gap-4">
        {/* ─── Hero ─── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="flex flex-col gap-4 mb-2">
          <div className="flex items-center justify-between gap-3">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 240, damping: 16 }}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={isManual ? { background: PENDING.bg, color: PENDING.color } : { background: SK.accent, color: "#FFFFFF" }}
            >
              {isManual ? <HourglassMedium weight="fill" className="w-8 h-8" /> : <Check weight="bold" className="w-8 h-8" />}
            </motion.div>
            {orderNumber && (
              <button
                onClick={copyNumber}
                aria-label={`${t("Copier le numéro de commande")} ${orderNumber}`}
                className="h-11 pl-4 pr-1.5 rounded-full flex items-center gap-2 text-[14px]"
                style={{ background: SK.surface, border: `1px solid ${SK.line}` }}
              >
                <span className="font-bold whitespace-nowrap">{orderNumber}</span>
                <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: SK.tint, color: copied ? GOOD_GREEN : SK.accent }}>
                  {copied ? <Check weight="bold" className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </span>
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Eyebrow>{firstName ? `${t("Merci")} ${firstName} !` : t("Confirmation")}</Eyebrow>
            <h1 style={{ margin: 0, fontFamily: DISPLAY_FONT, fontSize: 40, lineHeight: 1.04, fontWeight: 300, letterSpacing: "-0.02em" }}>
              {heroLight} <span style={{ fontWeight: 700, color: SK.accent }}>{heroBold}</span>
            </h1>
            <p className="text-[15px] leading-relaxed" style={{ color: SK.muted }}>{heroText}</p>
          </div>
        </motion.div>

        {/* ─── Progress ─── */}
        {order && (
          <Block delay={0.08} className="pb-1.5">
            <Label>{t("Où en est ma commande")}</Label>
            <ol>
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3.5">
                  <div className="flex flex-col items-center w-[26px]">
                    <div
                      className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: s.state === "done" ? SK.accent : SK.surface,
                        border: s.state === "done" ? "none" : `2px solid ${s.state === "current" ? SK.accent : SK.line}`,
                      }}
                    >
                      {s.state === "done" && <Check weight="bold" className="w-3.5 h-3.5 text-white" />}
                      {s.state === "current" && <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: SK.accent }} />}
                    </div>
                    {i < steps.length - 1 && <div className="flex-1 w-0.5 min-h-[18px]" style={{ background: s.state === "done" ? SK.accent : SK.lineSoft }} />}
                  </div>
                  <div className="pt-0.5 pb-4">
                    <p className="text-[15px]" style={{ fontWeight: s.state === "current" ? 700 : 600, color: s.state === "todo" ? SK.muted : SK.ink }}>{s.label}</p>
                    {s.detail && <p className="text-[13px]" style={{ color: SK.muted }}>{s.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Block>
        )}

        {/* ─── Payment ─── */}
        {isPawapay && (
          <Block delay={0.14}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-[12px] font-bold uppercase tracking-[0.06em]" style={{ color: SK.muted }}>{t("Paiement")}</p>
              <span className="px-2.5 py-[5px] rounded-full text-[12px] font-bold" style={{ background: "#EEF6F1", color: GOOD_GREEN }}>{t("Payé")}</span>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[15px] font-bold">{isOrange ? "Orange Money" : "MTN Mobile Money"}</p>
                {order?.mobileMoneyPhone && <p className="text-[13px]" style={{ color: SK.muted }}>{formatLocalPhone(order.mobileMoneyPhone)}</p>}
              </div>
              <p className="whitespace-nowrap" style={{ fontFamily: DISPLAY_FONT, fontSize: 26, fontWeight: 700 }}>{formatPrice(total)} FCFA</p>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[12px]" style={{ color: SK.muted }}>
              <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: GOOD_GREEN }} /> {isOrange ? t("Paiement sécurisé. Conservez le SMS de confirmation d'Orange Money.") : t("Paiement sécurisé. Conservez le SMS de confirmation de MTN Mobile Money.")}
            </p>
          </Block>
        )}

        {isManual && (
          <Block delay={0.14}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-[12px] font-bold uppercase tracking-[0.06em]" style={{ color: SK.muted }}>{t("Paiement")}</p>
              <span className="px-2.5 py-[5px] rounded-full text-[12px] font-bold flex items-center gap-1" style={{ background: PENDING.bg, color: PENDING.color }}>
                <Clock weight="fill" className="w-3.5 h-3.5" /> {t("À vérifier")}
              </span>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[15px] font-bold">{provider?.label || t("Mobile Money")}</p>
                <p className="text-[13px]" style={{ color: SK.muted }}>{t("Paiement manuel (USSD)")}</p>
              </div>
              <p className="whitespace-nowrap" style={{ fontFamily: DISPLAY_FONT, fontSize: 26, fontWeight: 700 }}>{formatPrice(total)} FCFA</p>
            </div>
            <div className="mt-4 rounded-[18px] p-4 text-[14px] leading-relaxed" style={{ background: SK.ground, border: `1px solid ${SK.lineSoft}` }}>
              {t("Vous n'avez pas encore envoyé le paiement ? Composez le code ci-dessous et transférez exactement")}{" "}
              <strong>{formatPrice(total)} FCFA</strong>.
              {provider && <p className="mt-2 font-bold text-[17px] tracking-wide">{provider.code}</p>}
            </div>
            {order?.manualProvider && (
              <a
                href={ussdHref(order.manualProvider)}
                className="mt-3 h-[48px] rounded-full text-[15px] font-bold flex items-center justify-center gap-2"
                style={{ border: `1px solid ${SK.ink}`, color: SK.ink, background: SK.surface }}
              >
                <Phone weight="fill" className="w-4 h-4" /> {t("Lancer le paiement (USSD)")}
              </a>
            )}
            {order?.identity?.phone && (
              <p className="mt-3 text-[13px]" style={{ color: SK.muted }}>
                {t("Nous vous contacterons au")} <span className="font-semibold" style={{ color: SK.ink }}>{order.identity.phone}</span> {t("dès réception du paiement.")}
              </p>
            )}
          </Block>
        )}

        {/* ─── Items + amounts ─── */}
        {order?.items && order.items.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2, ease }} className="flex flex-col gap-2.5 mt-2">
            <SectionTitle light={t("Vos")} bold={t("articles")} size={26} />
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-[22px] p-2.5" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: SK.tint }}>
                  {item.thumbnail
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.thumbnail} alt="" className="w-full h-full object-contain" />
                    : <Package className="w-7 h-7" style={{ color: SK.muted }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold leading-snug line-clamp-2">{item.title}</p>
                  <p className="text-[13px]" style={{ color: SK.muted }}>{t("Quantité :")} {item.quantity}</p>
                </div>
                <p className="text-[14px] font-bold whitespace-nowrap">{formatPrice(item.price * item.quantity)} FCFA</p>
              </div>
            ))}

            <div className="rounded-[26px] p-[18px] flex flex-col gap-2.5" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
              {amounts && (
                <>
                  <div className="flex justify-between text-[14px]"><span style={{ color: SK.muted }}>{t("Sous-total")}</span><span>{formatPrice(amounts.subtotal)} FCFA</span></div>
                  {amounts.discount > 0 && (
                    <div className="flex justify-between text-[14px]"><span style={{ color: SK.muted }}>{t("Réduction")}</span><span style={{ color: GOOD_GREEN }}>− {formatPrice(amounts.discount)} FCFA</span></div>
                  )}
                  <div className="flex justify-between text-[14px]">
                    <span style={{ color: SK.muted }}>{isPickup ? t("Retrait magasin") : t("Livraison")}</span>
                    <span style={amounts.delivery === 0 ? { color: GOOD_GREEN, fontWeight: 600 } : undefined}>{amounts.delivery === 0 ? t("Gratuit") : `${formatPrice(amounts.delivery)} FCFA`}</span>
                  </div>
                  {amounts.paymentFee > 0 && (
                    <div className="flex justify-between text-[14px]"><span style={{ color: SK.muted }}>{t("Frais Mobile Money (3 %)")}</span><span>{formatPrice(amounts.paymentFee)} FCFA</span></div>
                  )}
                  <div className="h-px" style={{ background: SK.lineSoft }} />
                </>
              )}
              <div className="flex justify-between items-baseline">
                <span className="text-[15px] font-bold">{isPawapay ? t("Total payé") : t("Total à payer")}</span>
                <span style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700 }}>{formatPrice(total)} FCFA</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Pickup / delivery ─── */}
        {order?.delivery && (
          <Block delay={0.26}>
            <Label>{isPickup ? t("Retrait en boutique") : t("Livraison")}</Label>
            <div className="text-[14px] leading-relaxed">
              {isPickup ? (
                <>
                  <p className="font-bold text-[15px]">{order.delivery.storeInfo?.name || t("Boutique The Welfare")}</p>
                  {order.delivery.storeInfo?.address && <p className="flex items-center gap-1.5" style={{ color: SK.muted }}><MapPin className="w-4 h-4 shrink-0" /> {order.delivery.storeInfo.address}</p>}
                  {order.delivery.storeInfo?.hours && <p className="flex items-center gap-1.5" style={{ color: SK.muted }}><Clock className="w-4 h-4 shrink-0" /> {t(order.delivery.storeInfo.hours)}</p>}
                </>
              ) : (
                <>
                  <p className="font-bold text-[15px]">{[order.delivery.address, order.delivery.neighborhood].filter(Boolean).join(", ") || t("Adresse de livraison")}</p>
                  <p className="flex items-center gap-1.5" style={{ color: SK.muted }}><MapPin className="w-4 h-4 shrink-0" /> {order.delivery.city}, Cameroun</p>
                  {order.delivery.eta && <p className="flex items-center gap-1.5" style={{ color: SK.muted }}><Clock className="w-4 h-4 shrink-0" /> {t("Délai estimé :")} {t(order.delivery.eta)}</p>}
                </>
              )}
              {order.identity && (
                <p className="mt-2 pt-2" style={{ borderTop: `1px solid ${SK.lineSoft}`, color: SK.muted }}>
                  <span className="font-semibold" style={{ color: SK.ink }}>{order.identity.firstName} {order.identity.lastName}</span>
                  {order.identity.phone && <> · {order.identity.phone}</>}
                </p>
              )}
            </div>
            <p className="mt-3 rounded-[14px] px-3.5 py-2.5 text-[13px] font-semibold" style={{ background: SK.tint }}>
              {isPickup
                ? isManual ? t("Votre commande sera prête dès la confirmation du paiement.") : t("Présentez votre numéro de commande en boutique pour la retirer.")
                : isManual ? t("La livraison sera programmée dès la confirmation du paiement.") : t("Nous vous contacterons pour organiser la livraison.")}
            </p>
          </Block>
        )}

        {/* ─── Help ─── */}
        <Block tint delay={0.3} className="flex flex-col gap-3">
          <p style={{ fontFamily: DISPLAY_FONT, fontSize: 21, lineHeight: 1.2, fontWeight: 400 }}>
            {t("Une question sur")} <span style={{ fontWeight: 700 }}>{t("votre commande ?")}</span>
          </p>
          <p className="text-[14px] leading-relaxed" style={{ color: "#3F3331" }}>{t("La boutique vous répond sur WhatsApp.")}</p>
          <a
            href={`https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(`${t("Bonjour, je vous écris au sujet de ma commande")} ${orderNumber}`.trim())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start h-[46px] px-[18px] rounded-full text-[14px] font-bold flex items-center gap-2"
            style={{ background: SK.surface, color: SK.ink }}
          >
            <WhatsappLogo weight="fill" className="w-5 h-5" style={{ color: "#1DA851" }} />
            {t("Écrire à la boutique sur WhatsApp")}
          </a>
        </Block>

        {/* ─── Actions ─── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.34, ease }} className="flex flex-col gap-2.5 pt-2">
          <Link href="/shop" className="h-[58px] rounded-full text-[16px] font-bold flex items-center justify-center" style={{ background: SK.accent, color: "#FFFFFF" }}>
            {t("Continuer mes achats")}
          </Link>
          <Link href="/account" className="h-[52px] rounded-full text-[15px] font-bold flex items-center justify-center" style={{ border: `1px solid ${SK.ink}`, color: SK.ink, background: SK.surface }}>
            {t("Suivre mes commandes")}
          </Link>
        </motion.div>
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ConfirmationContent />
    </Suspense>
  );
}
