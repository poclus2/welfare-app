"use client";

import { useSkinCoachStore } from "@/lib/store/use-skin-coach-store";
import SkinAnalysisResultView from "@/components/ui/skin-analysis-result-view";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { sdk } from "@/lib/medusa";
import { claimPendingScans, rememberPendingScan } from "@/lib/pending-scans";

export default function SkinCoachResultPage() {
  const result = useSkinCoachStore((state) => state.result);
  const clearResult = useSkinCoachStore((state) => state.clearResult);
  const router = useRouter();
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  const hasSavedRef = useRef(false);

  // 1. Vérifier si l'utilisateur est connecté
  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const { customer } = await sdk.store.customer.retrieve();
        if (mounted) {
          setIsAuthenticated(true);
          setCustomerId(customer.id);
        }
      } catch (err) {
        if (mounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsCheckingAuth(false);
        }
      }
    };
    checkAuth();
    return () => { mounted = false; };
  }, []);

  // 2. Rediriger si pas de résultat
  useEffect(() => {
    if (!result && !isCheckingAuth) {
      router.replace("/skin-coach");
    }
  }, [result, router, isCheckingAuth]);

  // 3. Rattacher le diagnostic à l'historique de la cliente connectée.
  // Le diagnostic est déjà enregistré côté serveur par l'analyse (photos et résumés réels, sans compte
  // rattaché) : on le revendique simplement pour cette cliente, au lieu d'en créer un doublon.
  // Les scans faits sans être connectée sont aussi rattachés à la connexion et sur la page compte
  // (lib/pending-scans.ts).
  useEffect(() => {
    if (!isAuthenticated || !result || !customerId || hasSavedRef.current) return;
    hasSavedRef.current = true;
    if (!(result as any).id) rememberPendingScan(result.scan_id); // (id = déjà dans l'historique)
    claimPendingScans();
  }, [isAuthenticated, result, customerId]);

  const handleRetake = () => {
    clearResult();
    router.push("/skin-coach");
  };

  if (isCheckingAuth || !result) {
    return (
      <div className="min-h-screen bg-[#F9F6F00] flex items-center justify-center">
        <CircleNotch className="w-8 h-8 animate-spin text-[#B06068]" />
      </div>
    );
  }

  // 4. Si non connectée : aperçu gratuit (type de peau, scores, mot du coach) ; la routine et les produits
  // sont réservés aux comptes (voir le mode `locked` de la vue)
  if (!isAuthenticated) {
    return <SkinAnalysisResultView result={result} onRetake={handleRetake} locked />;
  }

  // 5. Si connecté : Afficher le résultat normal
  return <SkinAnalysisResultView result={result} onRetake={handleRetake} />;
}
