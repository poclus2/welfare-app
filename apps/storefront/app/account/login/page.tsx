"use client";

import { useState } from "react";
import { sdk } from "@/lib/medusa";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Star, ShoppingBag, Gift, Eye, EyeSlash, WarningCircle, Info } from "@phosphor-icons/react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { AuthShowcase } from "@/components/account/AuthShowcase";

const benefits = [
  { icon: Star, text: "Cumulez des points à chaque achat" },
  { icon: Gift, text: "Accédez à des offres exclusives membres" },
  { icon: ShoppingBag, text: "Suivez toutes vos commandes en temps réel" },
];

export default function LoginPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";
  const phoneParam = searchParams.get("phone") || "";
  const hint = searchParams.get("hint");

  const [phone, setPhone] = useState(phoneParam);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await sdk.auth.login("customer", "phonepass", { phone, password });
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(t("Identifiants incorrects. Veuillez réessayer."));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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

          <form onSubmit={handleLogin} className="space-y-6">
            <AnimatePresence mode="wait">
              {hint === "exists" && !error && (
                <motion.div
                  key="hint"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-700"
                >
                  <Info weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <span className="leading-relaxed">{t("Un compte existe déjà avec ce numéro. Connectez-vous ci-dessous.")}</span>
                </motion.div>
              )}
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
              <label className="block text-[13px] font-medium text-gray-700">
                {t("Numéro de téléphone")}
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                placeholder={t("+237 6XX XXX XXX")}
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
