"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BellRinging, CheckCircle, CircleNotch } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n-context";

// Teasing only: no price, no date, no countdown, no pre-order until the shop has validated products,
// prices and dates. The packagings stay blurred on purpose. The button signs people up to be told about
// the launch (API /store/launch-subscribers), with an explicit consent that is stored with them.
const S = {
  red: "#C0392B",
  redLight: "#E74C3C",
  dark: "#0F0A09",
};

const HIDDEN_PRODUCTS = ["/sekoria_serum.webp", "/sekoria_toner.webp", "/sekoria_sunscreen.webp", "/sekoria_night_cream.webp"];

const CONSENT_TEXT =
  "J'accepte que The Welfare Shop me contacte sur WhatsApp, et par email si je l'indique, pour m'informer du lancement de Sekoria. Je peux demander à ne plus être contacté(e) à tout moment.";

function LaunchForm() {
  const { t } = useI18n();
  const [form, setForm] = useState({ first_name: "", phone: "", email: "", website: "" });
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError(t("Cochez la case pour accepter d'être contacté(e) pour le lancement."));
      return;
    }
    setState("sending");
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"}/store/launch-subscribers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
        body: JSON.stringify({
          ...form,
          campaign: "sekoria",
          consent: true,
          consent_text: t(CONSENT_TEXT), // the sentence as it was shown
          source: "home",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || t("L'inscription n'a pas pu être enregistrée. Réessayez."));
      setState("done");
    } catch (err: any) {
      // a network failure surfaces as a TypeError ("Failed to fetch"): show our own sentence instead
      setError(err instanceof TypeError || !err?.message ? t("L'inscription n'a pas pu être enregistrée. Réessayez.") : err.message);
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <div role="status" className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <CheckCircle className="w-6 h-6 shrink-0" weight="fill" style={{ color: S.redLight }} />
        <div>
          <p className="text-white font-semibold">{t("C'est noté, merci !")}</p>
          <p className="text-white/55 text-sm mt-1">{t("Vous serez parmi les premières personnes informées du lancement de Sekoria.")}</p>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full bg-white/[0.06] border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-white/50 transition-colors";

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="sr-only">{t("Prénom")}</span>
          <input value={form.first_name} onChange={set("first_name")} placeholder={t("Prénom (facultatif)")} autoComplete="given-name" className={inputClass} />
        </label>
        <label className="block">
          <span className="sr-only">{t("Numéro WhatsApp")}</span>
          <input value={form.phone} onChange={set("phone")} placeholder={t("Numéro WhatsApp *")} type="tel" inputMode="tel" autoComplete="tel" required className={inputClass} />
        </label>
      </div>
      <label className="block">
        <span className="sr-only">{t("Email")}</span>
        <input value={form.email} onChange={set("email")} placeholder={t("Email (facultatif)")} type="email" autoComplete="email" className={inputClass} />
      </label>
      {/* honeypot, hidden from people */}
      <input value={form.website} onChange={set("website")} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <label className="flex items-start gap-3 cursor-pointer mt-1">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 w-4 h-4 shrink-0 accent-[#E74C3C]" />
        <span className="text-white/60 text-xs leading-relaxed">
          {t(CONSENT_TEXT)}{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-white">
            {t("Politique de confidentialité")}
          </Link>
        </span>
      </label>

      {error && <p className="text-sm text-[#FF8A7A]" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-sm font-semibold text-white transition-colors disabled:opacity-60 sm:self-start"
        style={{ background: S.red }}
      >
        {state === "sending" ? <CircleNotch className="w-4 h-4 animate-spin" /> : <BellRinging className="w-4 h-4" />}
        {t("M'inscrire")}
      </button>
    </form>
  );
}

export function SekoriaTeaser() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <section className="w-full py-20 md:py-28 overflow-hidden relative" style={{ background: S.dark }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 75% 40%, ${S.red}40 0%, transparent 60%)` }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-5 md:px-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 max-w-xl w-full"
        >
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase mb-6" style={{ color: S.redLight }}>
            Sekoria
          </p>
          <h2 className="text-[2.6rem] md:text-[4rem] leading-[1.02] font-medium tracking-tight text-white mb-6">
            {t("Chut…")}
            <br />
            <span className="font-serif italic" style={{ color: S.redLight }}>
              {t("Sekoria arrive bientôt.")}
            </span>
          </h2>
          <p className="text-white/60 text-base md:text-lg leading-relaxed mb-8">
            {t("Une nouvelle marque de soins se prépare. Découvrez prochainement Sekoria, imaginée par The Welfare Shop.")}
          </p>

          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <LaunchForm />
              </motion.div>
            ) : (
              <motion.button
                key="cta"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95"
                style={{ background: S.red }}
              >
                <BellRinging className="w-4 h-4" />
                {t("Être informé du lancement")}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Blurred packagings: shapes only, nothing readable */}
        <div className="flex-1 w-full max-w-[560px]">
          <div className="grid grid-cols-2 gap-3 md:gap-4" aria-hidden="true">
            {HIDDEN_PRODUCTS.map((src, i) => (
              <motion.div
                key={src}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: 0.1 * i }}
                className={`relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 ${i % 2 === 1 ? "translate-y-6" : ""}`}
                style={{ background: "#1A1110" }}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              </motion.div>
            ))}
          </div>
          <p className="mt-12 text-center text-[11px] tracking-[0.3em] uppercase text-white/35">
            {t("Bientôt dévoilée")}
          </p>
        </div>
      </div>
    </section>
  );
}
