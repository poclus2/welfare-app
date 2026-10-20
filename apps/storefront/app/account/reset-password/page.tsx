"use client";

import { useState, Suspense } from "react";
import { sdk } from "@/lib/medusa";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { LockKey, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { OtpCodeInput } from "@/components/account/OtpCodeInput";
import { useI18n } from "@/lib/i18n-context";
import { PhoneInput } from "@/components/ui/phone-input";
import { formatPhoneForDisplay } from "@/lib/phone";

const MIN_PASSWORD_LENGTH = 8;

// Forgot password: the customer proves she owns the phone with a WhatsApp code, then picks a new password.
function ResetPasswordForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<"phone" | "code" | "done">("phone");
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestCode = async () => {
    await sdk.client.fetch("/store/password-reset/request", { method: "POST", body: { phone: phone.trim() } });
  };

  // the API answers in French with a precise reason (rate limit, feature not available yet...)
  const apiMessage = (err: any) =>
    typeof err?.message === "string" && err.message.length < 200 ? err.message : t("Une erreur est survenue. Réessayez.");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestCode();
      setStep("code");
    } catch (err: any) {
      setError(apiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setError(t("Entrez le code à 6 chiffres reçu par WhatsApp."));
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t("Le mot de passe doit contenir au moins 8 caractères."));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await sdk.client.fetch("/store/password-reset/confirm", {
        method: "POST",
        body: { phone: phone.trim(), code, password },
      });
      setStep("done");
      try {
        await sdk.auth.login("customer", "phonepass", { phone: phone.trim(), password });
        setTimeout(() => router.push("/account"), 1800);
      } catch {
        setTimeout(() => router.push("/account/login"), 1800);
      }
    } catch (err: any) {
      setError(apiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#2A2424] focus:border-[#2A2424] sm:text-sm transition-colors";
  const buttonClass =
    "w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#2A2424] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A2424] disabled:opacity-50 transition-all group";

  if (step === "done") {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t("Mot de passe mis à jour")}</h3>
        <p className="text-sm text-gray-500">{t("Vous allez être redirigée vers votre espace.")}</p>
      </div>
    );
  }

  if (step === "code") {
    return (
      <form className="space-y-6" onSubmit={handleConfirm}>
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">{error}</div>}

        <p className="text-sm text-gray-600">
          {t("Entrez le code à 6 chiffres envoyé par WhatsApp au")} <span className="font-medium text-gray-900">{formatPhoneForDisplay(phone)}</span>
        </p>
        <OtpCodeInput value={code} onChange={setCode} onResend={requestCode} />

        <div>
          <label className="block text-sm font-medium text-gray-700">{t("Nouveau mot de passe")}</label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <LockKey weight="light" className="w-5 h-5" />
            </div>
            <input
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">{t("Au moins 8 caractères.")}</p>
        </div>

        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? t("Mise à jour...") : t("Enregistrer mon mot de passe")}
        </button>
        <button
          type="button"
          onClick={() => { setStep("phone"); setCode(""); setError(""); }}
          className="w-full text-sm font-medium text-gray-500 hover:text-[#2A2424]"
        >
          {t("Modifier le numéro")}
        </button>
      </form>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleRequest}>
      {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">{error}</div>}

      <div>
        <label htmlFor="reset-phone" className="block text-sm font-medium text-gray-700">{t("Numéro de téléphone")}</label>
        <div className="mt-1">
          <PhoneInput
            id="reset-phone"
            required
            value={phone}
            onChange={setPhone}
            boxClassName="rounded-xl border border-gray-200 px-3 py-3 shadow-sm sm:text-sm transition-colors focus-within:border-[#2A2424] focus-within:ring-1 focus-within:ring-[#2A2424]"
            inputClassName="appearance-none block w-full px-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#2A2424] focus:border-[#2A2424] sm:text-sm transition-colors"
          />
        </div>
      </div>

      <div className="text-sm">
        <Link href="/account/login" className="font-medium text-[#2A2424] hover:underline">
          {t("Retour à la connexion")}
        </Link>
      </div>

      <button type="submit" disabled={loading} className={buttonClass}>
        {loading ? t("Envoi...") : t("Recevoir un code par WhatsApp")}
        {!loading && <ArrowRight weight="light" className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
      </button>
    </form>
  );
}

function Header() {
  const { t } = useI18n();
  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 className="text-center text-3xl font-light text-[#2A2424]">{t("Mot de passe oublié")}</h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        {t("Entrez votre numéro de téléphone : nous vous envoyons un code par WhatsApp pour choisir un nouveau mot de passe.")}
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F4EAEB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Header />

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-4 shadow-xl shadow-pink-900/5 sm:rounded-2xl sm:px-10 border border-pink-100"
        >
          <Suspense fallback={<div className="text-center p-4">…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
