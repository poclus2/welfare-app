"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Identifiants incorrects");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0EB] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#C08A8E]/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#2A2424]/5 blur-3xl" />
      </div>

      <div className="w-full max-w-[400px] relative">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_48px_rgba(42,36,36,0.12)] p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#2A2424] flex items-center justify-center mb-4 shadow-lg">
              <span className="text-2xl">🌿</span>
            </div>
            <h1 className="text-xl font-bold text-[#2A2424]">The Welfare</h1>
            <p className="text-sm text-[#2A2424]/50 mt-1">Administration</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5 uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@thewelfare.store"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#EDE0E0] text-sm text-[#2A2424] bg-[#FDFBF7] outline-none focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5 uppercase tracking-widest">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-[#EDE0E0] text-sm text-[#2A2424] bg-[#FDFBF7] outline-none focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2A2424]/30 hover:text-[#2A2424]/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#2A2424] text-white rounded-xl text-sm font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="flex items-center justify-center gap-1.5 mt-6 text-[10px] text-[#2A2424]/30">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Accès sécurisé — Réservé au personnel autorisé
          </div>
        </div>
      </div>
    </div>
  );
}
