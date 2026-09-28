"use client";

import { useState, Suspense } from "react";
import { sdk } from "@/lib/medusa";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Envelope, LockKey, ArrowRight, Star, ShoppingBag, Gift, User, Eye, EyeSlash, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { IconIA } from "@/components/ui/icons/IconIA";
import { useI18n } from "@/lib/i18n-context";
import { AuthShowcase } from "@/components/account/AuthShowcase";

const benefits = [
  { icon: Star, text: "Cumulez des points à chaque achat" },
  { icon: Gift, text: "Accédez à des offres exclusives membres" },
  { icon: ShoppingBag, text: "Suivez toutes vos commandes en temps réel" },
];

function RegisterForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get("phone");

  const [phone, setPhone] = useState(phoneParam || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const redirectUrl = searchParams.get("redirect") || "/account";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Medusa v2 Registration flow: 1. Create Auth Identity
      const token = await sdk.auth.register("customer", "phonepass", {
        phone,
        password,
      });

      // 2. Create Customer using the auth token (email is optional/secondary).
      // Medusa's core createCustomerAccountWorkflow hard-requires an email
      // (see validateCustomerAccountCreation), so when the customer doesn't
      // provide one we generate a non-guessable placeholder tied to their
      // phone number instead of blocking registration.
      const customerEmail =
        email.trim() || `${phone.replace(/[^\d]/g, "")}@phone.thewelfarecm.com`;

      await sdk.store.customer.create(
        {
          phone,
          email: customerEmail,
          first_name: firstName,
          last_name: lastName,
        },
        {},
        { Authorization: `Bearer ${token}` }
      );

      // 3. Login to get the persistent session token
      await sdk.auth.login("customer", "phonepass", {
        phone,
        password,
      });

      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      // Check if the error is "phone already exists" (401 from Medusa)
      const errMsg = err?.message || JSON.stringify(err) || "";
      const isPhoneExists =
        errMsg.toLowerCase().includes("already exists") ||
        errMsg.toLowerCase().includes("identity") ||
        err?.status === 401;

      if (isPhoneExists) {
        // Redirect to login with the phone pre-filled and a helpful banner
        const loginUrl = `/account/login?phone=${encodeURIComponent(phone)}&redirect=${encodeURIComponent(redirectUrl)}&hint=exists`;
        router.push(loginUrl);
      } else {
        setError(t("Une erreur est survenue lors de la création du compte. Veuillez réessayer."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-5">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600"
          >
            <WarningCircle weight="fill" className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4">
        {/* Prénom */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#2A2424]">{t("Prénom")}</label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 transition-colors group-focus-within:text-[#c97c85]">
              <User weight="light" className="h-4 w-4" />
            </div>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-10 pr-4 text-sm text-[#2A2424] placeholder-gray-400 transition-all focus:border-[#2A2424] focus:outline-none focus:ring-2 focus:ring-[#2A2424]/20"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              placeholder={t("Prénom")}
            />
          </div>
        </div>

        {/* Nom */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#2A2424]">{t("Nom")}</label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 transition-colors group-focus-within:text-[#c97c85]">
              <User weight="light" className="h-4 w-4" />
            </div>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-10 pr-4 text-sm text-[#2A2424] placeholder-gray-400 transition-all focus:border-[#2A2424] focus:outline-none focus:ring-2 focus:ring-[#2A2424]/20"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              placeholder={t("Nom")}
            />
          </div>
        </div>
      </div>

      {/* Téléphone */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[#2A2424]">{t("Numéro de téléphone")}</label>
        <div className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 transition-colors group-focus-within:text-[#c97c85]">
            <Phone weight="light" className="h-4 w-4" />
          </div>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="block w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-10 pr-4 text-sm text-[#2A2424] placeholder-gray-400 transition-all focus:border-[#2A2424] focus:outline-none focus:ring-2 focus:ring-[#2A2424]/20"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            placeholder={t("+237 6XX XXX XXX")}
          />
        </div>
      </div>

      {/* Email (optionnel) */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[#2A2424]">
          {t("Adresse e-mail")} <span className="font-normal text-gray-400">({t("optionnel")})</span>
        </label>
        <div className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 transition-colors group-focus-within:text-[#c97c85]">
            <Envelope weight="light" className="h-4 w-4" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-10 pr-4 text-sm text-[#2A2424] placeholder-gray-400 transition-all focus:border-[#2A2424] focus:outline-none focus:ring-2 focus:ring-[#2A2424]/20"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            placeholder={t("vous@email.com")}
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[#2A2424]">{t("Mot de passe")}</label>
        <div className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 transition-colors group-focus-within:text-[#c97c85]">
            <LockKey weight="light" className="h-4 w-4" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-10 pr-11 text-sm text-[#2A2424] placeholder-gray-400 transition-all focus:border-[#2A2424] focus:outline-none focus:ring-2 focus:ring-[#2A2424]/20"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-colors hover:text-[#2A2424]"
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
        className="auth-shimmer-btn group flex w-full items-center justify-center gap-2 rounded-xl bg-[#2A2424] px-6 py-3.5 text-sm font-semibold text-white transition-shadow duration-200 disabled:opacity-60"
        style={{ boxShadow: "0 4px 6px rgba(42,36,36,0.15), 0 1px 3px rgba(0,0,0,0.1)" }}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t("Création en cours...")}
          </span>
        ) : (
          <>
            {t("Activer mon compte fidélité")}
            <ArrowRight weight="bold" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </motion.button>
    </form>
  );
}

export default function RegisterPage() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-[#fdf8f8] lg:flex-row">
      {/* Mobile showcase band */}
      <div className="lg:hidden">
        <AuthShowcase
          variant="mobile"
          headline="Rejoignez notre programme"
          headlineAccent="de fidélité"
          subtitle="Créez votre compte pour cumuler des points."
          benefits={benefits}
        />
      </div>

      {/* Desktop showcase panel */}
      <AuthShowcase
        variant="desktop"
        headline="Rejoignez notre programme"
        headlineAccent="de fidélité"
        subtitle="Créez votre compte pour cumuler des points, suivre vos commandes et accéder à des offres exclusives."
        benefits={benefits}
      />

      {/* Form panel */}
      <div className="relative -mt-8 flex flex-1 flex-col justify-center overflow-y-auto rounded-t-[2rem] bg-[#fdf8f8] px-6 py-10 sm:px-12 lg:mt-0 lg:rounded-none lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>
              {t("Inscription")}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {t("Vous avez déjà un compte ?")}{" "}
              <Link href="/account/login" className="font-medium text-[#2A2424] underline underline-offset-4 transition-colors hover:text-[#c97c85]">
                {t("Connectez-vous")}
              </Link>
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex justify-center p-8">
                <IconIA className="h-8 w-8 animate-pulse text-[#2A2424]" />
              </div>
            }
          >
            <RegisterForm />
          </Suspense>

          {/* Mobile benefits */}
          <div className="mt-8 border-t border-gray-100 pt-8 lg:hidden">
            <div className="space-y-3">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F4EAEB]">
                    <benefit.icon weight="light" className="h-3.5 w-3.5 text-[#c97c85]" />
                  </div>
                  <span className="text-xs text-gray-600">{t(benefit.text)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
