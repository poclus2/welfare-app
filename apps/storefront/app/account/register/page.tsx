"use client";

import { useState, Suspense } from "react";
import { sdk } from "@/lib/medusa";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Envelope, LockKey, ArrowRight, Sparkle, Star, ShoppingBag, Gift, User } from "@phosphor-icons/react";
import Link from "next/link";

const benefits = [
  { icon: Star, text: "Cumulez des points à chaque achat" },
  { icon: Gift, text: "Accédez à des offres exclusives membres" },
  { icon: ShoppingBag, text: "Suivez toutes vos commandes en temps réel" },
];

function RegisterForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");

  const [email, setEmail] = useState(emailParam || "");
  const [password, setPassword] = useState("");
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
      const token = await sdk.auth.register("customer", "emailpass", {
        email,
        password,
      });

      // 2. Create Customer using the auth token
      await sdk.store.customer.create(
        {
          email,
          first_name: firstName,
          last_name: lastName,
        },
        {},
        { Authorization: `Bearer ${token}` }
      );

      // 3. Login to get the persistent session token
      await sdk.auth.login("customer", "emailpass", {
        email,
        password,
      });

      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError("Une erreur est survenue lors de la création du compte. Peut-être que cet e-mail existe déjà ?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-5">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm"
        >
          {error}
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Prénom */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#2A2424]">
            Prénom
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <User weight="light" className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="block w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-[#2A2424] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2A2424]/20 focus:border-[#2A2424] transition-all"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              placeholder="Prénom"
            />
          </div>
        </div>

        {/* Nom */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#2A2424]">
            Nom
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <User weight="light" className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="block w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-[#2A2424] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2A2424]/20 focus:border-[#2A2424] transition-all"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              placeholder="Nom"
            />
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[#2A2424]">
          Adresse e-mail
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <Envelope weight="light" className="w-4 h-4" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-[#2A2424] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2A2424]/20 focus:border-[#2A2424] transition-all"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            placeholder="vous@email.com"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[#2A2424]">
          Mot de passe
        </label>
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
            Création en cours...
          </span>
        ) : (
          <>
            Activer mon compte fidélité
            <ArrowRight weight="bold" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
}

export default function RegisterPage() {
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
              <Sparkle weight="fill" className="w-8 h-8 text-[#F4EAEB]" />
              <span className="text-[#F4EAEB] text-xl font-semibold tracking-tight">The Welfare Shop</span>
            </div>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-light text-[#F4EAEB] leading-tight tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              Rejoignez notre programme<br />
              <span className="text-[#c97c85]">de fidélité</span>
            </h1>
            <p className="mt-4 text-[#F4EAEB]/60 text-base leading-relaxed max-w-sm">
              Créez votre compte pour cumuler des points, suivre vos commandes et accéder à des offres exclusives.
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
                <span className="text-[#F4EAEB]/80 text-sm">{benefit.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <p className="text-[#F4EAEB]/40 text-xs">
            © {new Date().getFullYear()} The Welfare Shop · Programme Fidélité
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-[#fdf8f8] overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Link href="/" className="flex items-center gap-2">
            <Sparkle weight="fill" className="w-7 h-7 text-[#2A2424]" />
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
              Inscription
            </h2>
            <p className="mt-2 text-gray-500 text-sm">
              Vous avez déjà un compte ?{" "}
              <Link href="/account/login" className="text-[#2A2424] font-medium underline underline-offset-4 hover:text-[#c97c85] transition-colors">
                Connectez-vous
              </Link>
            </p>
          </div>

          <Suspense fallback={
            <div className="flex justify-center p-8">
              <Sparkle weight="fill" className="w-8 h-8 text-[#2A2424] animate-pulse" />
            </div>
          }>
            <RegisterForm />
          </Suspense>

          {/* Mobile benefits */}
          <div className="mt-8 lg:hidden pt-8 border-t border-gray-100">
            <div className="space-y-3">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#F4EAEB] flex items-center justify-center flex-shrink-0">
                    <benefit.icon weight="light" className="w-3.5 h-3.5 text-[#c97c85]" />
                  </div>
                  <span className="text-gray-600 text-xs">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
