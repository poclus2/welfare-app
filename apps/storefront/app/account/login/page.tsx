"use client";

import { useState } from "react";
import { sdk } from "@/lib/medusa";
import { claimPendingScans } from "@/lib/pending-scans";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Star, ShoppingBag, Gift, Eye, EyeSlash, WarningCircle, Info } from "@phosphor-icons/react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { AuthShowcase } from "@/components/account/AuthShowcase";
import { OtpCodeInput } from "@/components/account/OtpCodeInput";
import { PhoneInput } from "@/components/ui/phone-input";
import { formatPhoneForDisplay } from "@/lib/phone";

const benefits = [
  { icon: Star, text: "Cumulez des points à chaque achat" },
  { icon: Gift, text: "Accédez à des offres exclusives membres" },
  { icon: ShoppingBag, text: "Suivez toutes vos commandes en temps réel" },
];

const PHONE_ID = "login-phone";
const PHONE_BOX_CLASS =
  "rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-3 text-sm text-gray-900 transition-all focus-within:border-black focus-within:bg-white focus-within:ring-1 focus-within:ring-black";
const PHONE_INPUT_CLASS =
  "block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black";

export default function LoginPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";
  const phoneParam = searchParams.get("phone") || "";
  const hint = searchParams.get("hint");

  const [mode, setMode] = useState<"password" | "otp">("password");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState(phoneParam);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // A phone identity can exist without a customer profile (a sign-up interrupted before the profile was
  // created, e.g. by an e-mail already in use): the password is right, but there is no account behind it
  // and every account call answers 401, which used to bounce her straight back to this page. Send her to
  // finish the sign-up instead (same phone: the half-made identity is reused).
  const goAfterLogin = async () => {
    try {
      await sdk.store.customer.retrieve();
    } catch (err: any) {
      if (err?.status === 401) {
        try { await sdk.auth.logout(); } catch {}
        router.push(`/account/register?phone=${encodeURIComponent(phone)}&incomplete=1&redirect=${encodeURIComponent(redirectUrl)}`);
        return;
      }
      // any other failure: let the account page deal with it (it offers a retry)
    }
    await claimPendingScans(); // a diagnostic run before logging in goes to her account
    router.push(redirectUrl);
    router.refresh();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await sdk.auth.login("customer", "phonepass", { phone, password });
      await goAfterLogin();
    } catch (err: any) {
      setError(t("Identifiants incorrects. Veuillez réessayer."));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendLoginOtp = async () => {
    await sdk.client.fetch("/store/otp/send", {
      method: "POST",
      body: { phone, purpose: "login" },
    });
  };

  const handleSendLoginCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await sendLoginOtp();
      setOtpStep("code");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message?.includes("Trop de") || err?.message?.includes("pas encore disponible")
          ? err.message
          : t("Impossible d'envoyer le code. Vérifiez le numéro et réessayez.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyLoginCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const verifyResult: any = await sdk.client.fetch("/store/otp/verify", {
        method: "POST",
        body: { phone, code, purpose: "login" },
      });

      await sdk.auth.login("customer", "phoneotp", { phone, ticket: verifyResult.login_ticket });
      await goAfterLogin();
    } catch (err: any) {
      setError(
        err?.message?.includes("Aucun compte")
          ? err.message
          : t("Code invalide ou expiré.")
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (next: "password" | "otp") => {
    setMode(next);
    setOtpStep("phone");
    setCode("");
    setError("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      <div className="lg:hidden">
        <AuthShowcase
          variant="mobile"
          headline="Votre espace beauté"
          headlineAccent="personnalisé"
          subtitle="Connectez-vous pour accéder à votre programme de fidélité."
          benefits={benefits}
        />
      </div>

      <AuthShowcase
        variant="desktop"
        headline="Votre espace beauté"
        headlineAccent="personnalisé"
        subtitle="Connectez-vous pour accéder à votre programme de fidélité et à toutes vos commandes."
        benefits={benefits}
      />

      {/* Form panel */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-[380px]">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
              {t("Connexion")}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {t("Pas encore de compte ?")}{" "}
              <Link href="/account/register" className="font-medium text-gray-900 underline underline-offset-4 transition-colors hover:text-[#c97c85]">
                {t("Créer un compte")}
              </Link>
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("password")}
              className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-all ${
                mode === "password" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("Mot de passe")}
            </button>
            <button
              type="button"
              onClick={() => switchMode("otp")}
              className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-all ${
                mode === "otp" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("Code WhatsApp")}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {hint === "exists" && !error && (
              <motion.div
                key="hint"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-700"
              >
                <Info weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <span className="leading-relaxed">{t("Un compte existe déjà avec ce numéro. Connectez-vous ci-dessous.")}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {mode === "password" ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm text-red-600"
                  >
                    <WarningCircle weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span className="leading-relaxed">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Téléphone */}
              <div className="space-y-2">
                <label htmlFor={PHONE_ID} className="block text-[13px] font-medium text-gray-700">
                  {t("Numéro de téléphone")}
                </label>
                <PhoneInput
                  id={PHONE_ID}
                  required
                  value={phone}
                  onChange={setPhone}
                  boxClassName={PHONE_BOX_CLASS}
                  inputClassName={PHONE_INPUT_CLASS}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[13px] font-medium text-gray-700">
                    {t("Mot de passe")}
                  </label>
                  <Link
                    href="/account/reset-password"
                    className="text-[13px] text-gray-500 transition-colors hover:text-black"
                  >
                    {t("Mot de passe oublié ?")}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-gray-700"
                    aria-label={showPassword ? t("Masquer le mot de passe") : t("Afficher le mot de passe")}
                  >
                    {showPassword ? <EyeSlash weight="light" className="h-4 w-4" /> : <Eye weight="light" className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 text-sm font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.15)] hover:bg-[#1a1a1a] disabled:pointer-events-none disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t("Connexion...")}
                  </span>
                ) : (
                  <>
                    {t("Se connecter")}
                    <ArrowRight weight="bold" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>
            </form>
          ) : otpStep === "phone" ? (
            <form onSubmit={handleSendLoginCode} className="space-y-6">
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm text-red-600"
                  >
                    <WarningCircle weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span className="leading-relaxed">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label htmlFor={PHONE_ID} className="block text-[13px] font-medium text-gray-700">
                  {t("Numéro de téléphone")}
                </label>
                <PhoneInput
                  id={PHONE_ID}
                  required
                  value={phone}
                  onChange={setPhone}
                  boxClassName={PHONE_BOX_CLASS}
                  inputClassName={PHONE_INPUT_CLASS}
                />
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 text-sm font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.15)] hover:bg-[#1a1a1a] disabled:pointer-events-none disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t("Envoi du code...")}
                  </span>
                ) : (
                  <>
                    {t("Recevoir le code par WhatsApp")}
                    <ArrowRight weight="bold" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handleVerifyLoginCode} className="space-y-6">
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm text-red-600"
                  >
                    <WarningCircle weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span className="leading-relaxed">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {t("Entrez le code à 6 chiffres envoyé par WhatsApp au")} <span className="font-medium text-gray-900">{formatPhoneForDisplay(phone)}</span>
                </p>
                <OtpCodeInput value={code} onChange={setCode} onResend={sendLoginOtp} />
              </div>

              <motion.button
                type="submit"
                disabled={isLoading || code.length !== 6}
                whileTap={{ scale: 0.98 }}
                className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 text-sm font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.15)] hover:bg-[#1a1a1a] disabled:pointer-events-none disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t("Connexion...")}
                  </span>
                ) : (
                  <>
                    {t("Se connecter")}
                    <ArrowRight weight="bold" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => {
                  setOtpStep("phone");
                  setError("");
                  setCode("");
                }}
                className="text-[13px] font-medium text-gray-500 transition-colors hover:text-black"
              >
                {t("Modifier le numéro")}
              </button>
            </form>
          )}

          {/* Mobile benefits */}
          <div className="mt-12 border-t border-gray-100 pt-8 lg:hidden">
            <div className="space-y-4">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fdf8f8]">
                    <benefit.icon weight="light" className="h-4 w-4 text-[#c97c85]" />
                  </div>
                  <span className="text-[13px] text-gray-600">{t(benefit.text)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
