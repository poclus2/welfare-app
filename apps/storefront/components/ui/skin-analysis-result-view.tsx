"use client";

import { motion, Variants } from "framer-motion";
import { SkinAnalysisResult } from "@/app/actions/analyze-skin";
import { Sparkles, Activity, Quote, ChevronRight, ShoppingBag, RotateCcw } from "lucide-react";

import { useRouter } from "next/navigation";

interface Props {
  result: SkinAnalysisResult;
  onRetake: () => void;
}

const ProgressBar = ({ label, value, type }: { label: string, value: number, type: "good" | "bad" }) => {
  // bad type means higher is worse (e.g. acne, dryness)
  // good type means higher is better (e.g. hydration, texture)
  
  let color = "bg-emerald-400";
  if (type === "bad") {
    if (value > 50) color = "bg-rose-400";
    else if (value > 25) color = "bg-orange-300";
    else color = "bg-emerald-400";
  } else {
    if (value < 50) color = "bg-rose-400";
    else if (value < 75) color = "bg-emerald-300";
    else color = "bg-emerald-500";
  }

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
};

export default function SkinAnalysisResultView({ result, onRetake }: Props) {
  const router = useRouter();
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.3 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: "10%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "10%" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-[100dvh] relative w-full bg-[#F9F6F0] font-sans flex flex-col"
    >
      <div className="flex-1 pb-32">
        {/* Header Section */}
        <motion.div 
          variants={containerVariants} initial="hidden" animate="show"
          className="px-6 pt-12 pb-8 bg-gradient-to-b from-white/60 to-transparent"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-stone-200 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Diagnostic IA Finalisé
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-3xl font-extrabold text-slate-800 mb-2">
            Votre Profil Cutané
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-xl font-medium text-emerald-900 leading-tight mb-4">
            {result.melanin_skin_type}
          </motion.p>
          
          <motion.div variants={itemVariants} className="inline-block bg-slate-800 text-emerald-100 text-sm font-semibold px-4 py-2 rounded-2xl shadow-sm">
            Âge Cutané Estimé : {result.estimated_skin_age} ans
          </motion.div>
        </motion.div>

        <motion.div 
          variants={containerVariants} initial="hidden" animate="show"
          className="px-6 space-y-6"
        >
          {/* Dashboard Metrics */}
          <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Vos Indices Cutanés
            </h2>
            <ProgressBar label="Acné & Imperfections" value={result.metrics.acne_percentage} type="bad" />
            <ProgressBar label="Sécheresse" value={result.metrics.dryness_percentage} type="bad" />
            <ProgressBar label="Niveau d'Hydratation" value={result.metrics.hydration_percentage} type="good" />
            <ProgressBar label="Qualité de la Texture" value={result.metrics.texture_quality_percentage} type="good" />
          </motion.div>

          {/* Empathetic Message & Concerns */}
          <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Quote className="w-5 h-5 fill-current" />
              </div>
              <p className="text-[15px] leading-relaxed text-slate-700 italic font-medium">
                "{result.empathetic_message}"
              </p>
            </div>
            
            <div className="pt-4 border-t border-stone-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Points d'attention</h3>
              <div className="flex flex-wrap gap-2">
                {result.detected_concerns.map((concern, idx) => (
                  <span key={idx} className="bg-[#F4EAEB] text-amber-900 text-[13px] font-semibold px-3 py-1.5 rounded-xl">
                    {concern}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recommended Routine */}
          <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <h2 className="text-lg font-bold text-slate-800 mb-5">Votre Routine Sur-Mesure</h2>
            <div className="space-y-4">
              {result.recommended_routine_steps.map((step, idx) => (
                <motion.div 
                  key={idx}
                  variants={itemVariants}
                  className="flex gap-4 p-4 bg-[#F9F6F0] rounded-2xl relative overflow-hidden group cursor-pointer"
                >
                  <div className="text-3xl font-black text-emerald-900/10 shrink-0 select-none">
                    0{idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-slate-800 mb-2 leading-snug">
                      {step}
                    </p>
                    <div className="inline-flex items-center gap-1 text-[13px] font-bold text-emerald-600">
                      Voir les soins recommandés <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Sticky Bottom Actions */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.8, type: "spring", bounce: 0.2 }}
        className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-sm z-50 flex flex-col items-center gap-4"
      >
        <button 
          onClick={() => router.push('/shop')}
          className="w-full bg-slate-900 hover:bg-slate-800 active:scale-95 transition-all text-white py-4 px-6 rounded-2xl font-bold text-[16px] shadow-xl shadow-slate-900/20 flex justify-center items-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          Découvrir ma sélection de soins
        </button>
        <button onClick={onRetake} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
          <RotateCcw className="w-4 h-4" />
          Refaire le diagnostic
        </button>
      </motion.div>
    </motion.div>
  );
}
