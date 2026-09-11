"use client";

import { useState, Suspense } from "react";
import { sdk } from "@/lib/medusa";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Envelope, LockKey, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [email, setEmail] = useState(emailParam || "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      // For requesting a reset
      await sdk.auth.resetPassword("customer", "emailpass", {
        identifier: email,
      });
      setStatus("success");
      setMessage("Si cet e-mail existe, un lien de r�initialisation vous a �t� envoy�.");
    } catch (err: any) {
      console.error(err);
      // Don't leak if email exists or not, just show success
      setStatus("success");
      setMessage("Si cet e-mail existe, un lien de r�initialisation vous a �t� envoy�.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      // For setting the new password using the token
      await sdk.auth.updateProvider("customer", "emailpass", {
        password: password,
      }, token as string);
      
      // Auto login after reset
      await sdk.auth.login("customer", "emailpass", {
        email,
        password,
      });
      
      setStatus("success");
      setMessage("Mot de passe mis � jour avec succ�s ! Vous allez �tre redirig�.");
      setTimeout(() => {
        router.push("/account");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage("Le lien est invalide ou a expir�. Veuillez refaire une demande.");
    }
  };

  if (status === "success" && !token) {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">E-mail envoy�</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <Link href="/account/login" className="text-sm font-medium text-[#2A2424] hover:underline">
          Retour � la connexion
        </Link>
      </div>
    );
  }

  if (token) {
    return (
      <form className="space-y-6" onSubmit={handleUpdatePassword}>
        {status === "error" && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
            {message}
          </div>
        )}
        {status === "success" && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm text-center">
            {message}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <LockKey weight="light" className="w-5 h-5" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#2A2424] focus:border-[#2A2424] sm:text-sm transition-colors"
              placeholder="•••••••• "
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#2A2424] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A2424] disabled:opacity-50 transition-all"
          >
            {status === "loading" ? "Mise � jour..." : "Enregistrer mon mot de passe"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleRequestReset}>
      <div>
        <label className="block text-sm font-medium text-gray-700">Adresse e-mail</label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Envelope weight="light" className="w-5 h-5" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#2A2424] focus:border-[#2A2424] sm:text-sm transition-colors"
            placeholder="vous@email.com"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link href="/account/login" className="font-medium text-[#2A2424] hover:underline">
            Retour � la connexion
          </Link>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#2A2424] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A2424] disabled:opacity-50 transition-all group"
        >
          {status === "loading" ? "Envoi..." : "R�initialiser mon mot de passe"}
          {status !== "loading" && <ArrowRight weight="light" className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
        </button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F4EAEB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-light text-[#2A2424]">
          Mot de passe
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Entrez votre e-mail pour recevoir un lien d'activation, ou choisissez votre nouveau mot de passe si vous avez re�u un e-mail.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-4 shadow-xl shadow-pink-900/5 sm:rounded-2xl sm:px-10 border border-pink-100"
        >
          <Suspense fallback={<div className="text-center p-4">Chargement...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
