"use client";

import { useSkinCoachStore } from "@/lib/store/use-skin-coach-store";
import SkinAnalysisResultView from "@/components/ui/skin-analysis-result-view";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { sdk } from "@/lib/medusa";
import { claimPendingScans, rememberPendingScan, rememberScanInHistory } from "@/lib/pending-scans";
import { fetchRoutineProducts } from "@/lib/routine-products";

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
    // no session saved in this browser (lib/medusa.ts): not logged in, without waiting for the server
    let hasToken = true;
    try { hasToken = !!localStorage.getItem("medusa_auth_token"); } catch { /* storage blocked: ask the server */ }
    if (!hasToken) {
      setIsCheckingAuth(false);
      return;
    }
    // her products are fetched while her account is checked, instead of after (read from the store: the
    // first render, which matches the server one, does not have her saved result yet)
    const saved = useSkinCoachStore.getState().result;
    const ids = (saved?.kbeauty_routine || []).map((s) => s.medusa_product_id).filter((id): id is string => !!id);
    if (ids.length) fetchRoutineProducts(ids);
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
    // (the store itself: the first render does not have her saved result yet, see above)
    if (!result && !isCheckingAuth && !useSkinCoachStore.getState().result) {
      router.replace("/skin-coach");
    }
  }, [result, router, isCheckingAuth]);

  // 3. Rattacher le diagnostic à l'historique de la cliente connectée.
  // Le diagnostic est déjà enregistré côté serveur par l'analyse (photos et résumés réels, sans compte
  // rattaché) : on le revendique simplement pour cette cliente, au lieu d'en créer un doublon.
  // Les scans faits sans être connectée sont aussi rattachés à la connexion et sur la page compte
  // (lib/pending-scans.ts).
  // A diagnostic shown here (new, or reopened from her account on another phone) makes her next scan in this
  // browser go to the same skin advisor
  const shownScanId = result?.scan_id || (result as any)?.id; // (id = rouvert depuis l'historique)
  useEffect(() => {
    if (typeof shownScanId === "string") rememberScanInHistory(shownScanId);
  }, [shownScanId]);

  // Her diagnostic is kept in this browser as it was at the end of the scan: once her skin advisor has
  // reviewed it, she must see the corrected routine here too, not only from her account (2026-10-22)
  const reviewCheckedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isAuthenticated || typeof shownScanId !== "string" || reviewCheckedRef.current === shownScanId) return;
    reviewCheckedRef.current = shownScanId;
    sdk.client
      .fetch<{ scans?: any[] }>("/store/skin-scans", { method: "GET" })
      .then((data) => {
        const scan = (data?.scans || []).find((s: any) => s.id === shownScanId);
        const current = useSkinCoachStore.getState().result;
        if (!scan?.review_status || !current) return;
        const reviewed = Array.isArray(scan.reviewed_routine) && scan.reviewed_routine.length ? scan.reviewed_routine : null;
        useSkinCoachStore.getState().setResult({
          ...current,
          kbeauty_routine: reviewed || current.kbeauty_routine,
          review: { status: scan.review_status, corrections: scan.review_corrections || [] },
        });
      })
      .catch(() => {}); // her saved diagnostic is still shown
  }, [isAuthenticated, shownScanId]);

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
