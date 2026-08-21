"use client";

import { useSkinCoachStore } from "@/lib/store/use-skin-coach-store";
import SkinAnalysisResultView from "@/components/ui/skin-analysis-result-view";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CircleNotch } from "@phosphor-icons/react";

export default function SkinCoachResultPage() {
  const result = useSkinCoachStore((state) => state.result);
  const clearResult = useSkinCoachStore((state) => state.clearResult);
  const router = useRouter();

  // Si aucun résultat n'est en mémoire, on redirige vers le coach
  useEffect(() => {
    if (!result) {
      router.replace("/skin-coach");
    }
  }, [result, router]);

  const handleRetake = () => {
    clearResult();
    router.push("/skin-coach");
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center">
        <CircleNotch className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return <SkinAnalysisResultView result={result} onRetake={handleRetake} />;
}
