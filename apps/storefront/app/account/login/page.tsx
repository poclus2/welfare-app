"use client";

import { useState } from "react";
import { sdk } from "@/lib/medusa";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Phone, LockKey, ArrowRight, Star, ShoppingBag, Gift } from "@phosphor-icons/react";
import Link from "next/link";
import { IconIA } from "@/components/ui/icons/IconIA";
import { useI18n } from "@/lib/i18n-context";

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
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#2A2424] flex-col justify-between p-12">
        {/* Animated gradient orbs */}
        <div
          className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #c97c85 0%, transparent 70%)",
            animation: "float 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #e8a4ac 0%, transparent 70%)",
            animation: "float 14s ease-in-out infinite reverse",
          }}
        />

        <style>{`
          @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.95); }
          }
        `}</style>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/">
            <div className="flex items-center gap-2">
              <IconIA className="w-8 h-8 text-[#F4EAEB]" />
              <span className="text-[#F4EAEB] text-xl font-semibold tracking-tight">The Welfare Shop</span>
            </div>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-light text-[#F4EAEB] leading-tight tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              {t("Votre espace beauté")}<br />
              <span className="text-[#c97c85]">{t("personnalisé")}</span>
            </h1>
            <p className="mt-4 text-[#F4EAEB]/60 text-base leading-relaxed max-w-sm">
              {t("Connectez-vous pour accéder à votre programme de fidélité et à toutes vos commandes.")}
            </p>
          </div>

          <div className="space-y-4">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.15 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-[#F4EAEB]/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon weight="light" className="w-4 h-4 text-[#c97c85]" />
                </div>
                <span className="text-[#F4EAEB]/80 text-sm">{t(benefit.text)}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <p className="text-[#F4EAEB]/40 text-xs">
            © {new Date().getFullYear()} The Welfare Shop · {t("Programme Fidélité")}
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-[#fdf8f8]">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Link href="/" className="flex items-center gap-2">
            <IconIA className="w-7 h-7 text-[#2A2424]" />
            <span className="text-[#2A2424] text-lg font-semibold">The Welfare Shop</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>
              {t("Connexion")}
            </h2>
            <p className="mt-2 text-gray-500 text-sm">
              {t("Pas encore de compte ?")}{" "}
              <Link href="/account/register" className="text-[#2A2424] font-medium underline underline-offset-4 hover:text-[#c97c85] transition-colors">
                {t("Créer un compte")}
              </Link>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {hint === "exists" && !error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-xl text-sm"
              >
                {t("Un compte existe déjà avec ce numéro. Connectez-vous ci-dessous pour accéder à vos résultats.")}
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Téléphone */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#2A2424]">
                {t("Numéro de téléphone")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Phone weight="light" className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-[#2A2424] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2A2424]/20 focus:border-[#2A2424] transition-all"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  placeholder={t("+237 6XX XXX XXX")}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-[#2A2424]">
                  {t("Mot de passe")}
                </label>
                <Link
                  href="/account/reset-password"
                  className="text-xs text-gray-500 hover:text-[#2A2424] transition-colors"
                >
                  {t("Mot de passe oublié ?")}
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <LockKey weight="light" className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-[#2A2424] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2A2424]/20 focus:border-[#2A2424] transition-all"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-semibold text-white bg-[#2A2424] disabled:opacity-60 transition-all duration-200"
              style={{
                boxShadow: "0 4px 6px rgba(42,36,36,0.15), 0 1px 3px rgba(0,0,0,0.1)",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 7px 14px rgba(42,36,36,0.15), 0 3px 6px rgba(0,0,0,0.1)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 4px 6px rgba(42,36,36,0.15), 0 1px 3px rgba(0,0,0,0.1)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("Connexion en cours...")}
                </span>
              ) : (
                <>
                  {t("Se connecter")}
                  <ArrowRight weight="bold" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Mobile benefits */}
          <div className="mt-8 lg:hidden pt-8 border-t border-gray-100">
            <div className="space-y-3">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#F4EAEB] flex items-center justify-center flex-shrink-0">
                    <benefit.icon weight="light" className="w-3.5 h-3.5 text-[#c97c85]" />
                  </div>
                  <span className="text-gray-600 text-xs">{t(benefit.text)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
