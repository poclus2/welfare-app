"use client";

import { useSkinCoachStore } from "@/lib/store/use-skin-coach-store";
import SkinAnalysisResultView from "@/components/ui/skin-analysis-result-view";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { CircleNotch, LockKey, ArrowRight } from "@phosphor-icons/react";
import { sdk } from "@/lib/medusa";
import Link from "next/link";
import { motion } from "framer-motion";
import { IconIA } from "@/components/ui/icons/IconIA";

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

  // 3. Sauvegarder le scan dans la DB si l'utilisateur est connecté
  useEffect(() => {
    const saveScan = async () => {
      if (!result || !customerId || hasSavedRef.current || (result as any).id) return; // Do not save if it came from history (has id)
      hasSavedRef.current = true;
      try {
        await sdk.client.fetch("/store/skin-scans", {
          method: "POST",
          body: {
            customer_id: customerId,
            final_skin_type: result.final_skin_type,
            estimated_skin_age: result.estimated_skin_age || 25,
            melanin_phototype: result.melanin_phototype,
            concerns: result.metrics ? ["Acné", "Hydratation"] : [], // Fallback since concerns wasn't natively an array
            metrics: result.metrics,
            routine: result.kbeauty_routine,
            images: [],
            qwen_raw_summary: "Generated from UI",
            claude_raw_summary: "Generated from UI",
          }
        });
      } catch (err) {
        console.error("Failed to save skin scan", err);
      }
    };

    if (isAuthenticated && result && customerId) {
      saveScan();
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

  // 4. Si non connecté : Afficher l'écran de verrouillage par-dessus le résultat flouté
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen bg-[#F9F6F0] overflow-hidden">
        {/* Résultat Flouté en arrière-plan */}
        <div className="absolute inset-0 filter blur-md opacity-40 pointer-events-none select-none">
          <SkinAnalysisResultView result={result} onRetake={() => {}} />
        </div>

        {/* Modal de Verrouillage */}
        <div className="absolute inset-0 flex items-center justify-center p-4 z-z50 bg-white/30 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl text-center border border-[#B06068]/20 relative overflow-hidden">
            
            {/* Orbe décoratif */}
            <div className="Absolute top-[-50px] right-[-50px] w-32 h-32 rounded-full bg-[#B06068]/10 blur-2xl pointer-events-none" />
            
            <div className="w-16 h-16 bg-[#F4EAAEB] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <LockKey className="w-8 h-8 text-[#B06068]" weight="duotone" />
            </div>
            
            <h2 className="text-3xl font-serif text-[#2A2424] mb-4">
              Vos résultats sont prêts !
            </h2>
            
            <p className="text-[#2A2424]/70 mb-8 leading-relaxed">
              Notre intelligence artificielle a terminé l'analyse de votre peau. 
              Créez un compte gratuitement pour découvrir votre profil cutané, vos statistiques et votre routine sur-mesure.
            </p>

            <div className="space-y-4">
              <Link href="/account/register?redirect=/skin-coach/result" className="group relative w-full flex items-center justify-center gap-2 bg-[#2A2424] text-[#F9F6F0] px-6 py-4 rounded-xl hover:bg-[#1A1616] transition-colors duration-300 font-medium">
                <IconIA className="text-[#E8C0C6]" />
                <span>Dévoiler mes résultats</span>
                <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
              </Link>
              
              <Link href="/account/login?redirect=/skin-coach/result" className="w-full flex items-center justify-center px-6 py-4 rounded-xl text-[#2A2424] hover:bg-[#F4EAEB] transition-colors duration-300 font-medium">
                J'ai déjà un compte
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 5. Si connecté : Afficher le résultat normal
  return <SkinAnalysisResultView result={result} onRetake={handleRetake} />;
}
