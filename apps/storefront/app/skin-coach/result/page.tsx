"use client";

import { useSkinCoachStore } from "@/lib/store/use-skin-coach-store";
import SkinAnalysisResultView from "@/components/ui/skin-analysis-result-view";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { sdk } from "@/lib/medusa";

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
  useEffect(() => {
    const claimScan = async () => {
      const scanId = (result as any)?.scan_id;
      if (!result || !customerId || !scanId || hasSavedRef.current || (result as any).id) return; // (id = déjà dans l'historique)
      hasSavedRef.current = true;
      try {
        await sdk.client.fetch(`/store/skin-scans/${scanId}/claim`, { method: "POST" });
      } catch (err) {
        console.error("Failed to attach the skin scan to the customer", err);
      }
    };

    if (isAuthenticated && result && customerId) {
      claimScan();
    }
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
