"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bot, Sparkles, ScanFace } from "lucide-react";
import Link from "next/link";

export function SkinCoach() {
  return (
    <section className="w-full bg-[#FFFFFF] py-20 md:py-32 flex flex-col items-center overflow-hidden relative">
      {/* Cherry blossom background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.12] pointer-events-none"
        style={{ backgroundImage: "url('/cherry_blossom_bg.png')" }}
      />
      <div className="w-full max-w-[1600px] mx-auto px-8 md:px-12 flex flex-col lg:flex-row items-center gap-16 relative z-10">
        
        {/* Left Text */}
        <div className="flex-1 flex flex-col items-start max-w-xl">

          
          <h2 className="text-[2.5rem] md:text-[3.5rem] leading-[1.1] font-medium tracking-tight text-[#2A2424] mb-6">
            Rencontrez votre<br/>Skin Coach IA
          </h2>
          
          <p className="text-[#2A2424]/70 text-lg mb-10 leading-relaxed">
            Éliminez les doutes. Scannez votre visage, répondez à trois questions simples et laissez notre IA concevoir une routine approuvée par des dermatologues, parfaitement adaptée aux besoins uniques de votre peau.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link 
              href="/coach" 
              className="w-full sm:w-auto bg-[#2A2424] text-white px-8 py-4 rounded-full text-[15px] font-medium hover:bg-black/80 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-xl"
            >
              <ScanFace className="w-5 h-5" />
              Démarrer l'analyse gratuite
            </Link>
          </div>
          
          <div className="mt-8 flex items-center gap-6 border-t border-[#2A2424]/10 pt-8 w-full">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#2A2424]">98%</span>
              <span className="text-sm text-[#2A2424]/60">Précision</span>
            </div>
            <div className="w-px h-8 bg-[#2A2424]/10"></div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#2A2424]">10k+</span>
              <span className="text-sm text-[#2A2424]/60">Routines créées</span>
            </div>
          </div>
        </div>

        {/* Right Interactive Mockup */}
        <div className="flex-1 w-full relative min-h-[500px] lg:min-h-[600px] flex items-center justify-center">
          {/* Decorative background blobs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#E5B6B9]/30 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-[#DCE4E5]/50 rounded-full blur-[80px]"></div>

          {/* Phone / Interface Mockup Container */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative w-full max-w-[400px] bg-[#FAF8F6] rounded-[2.5rem] shadow-2xl border border-white p-4 z-10"
          >
            <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative shadow-inner">
              <img 
                src="https://images.pexels.com/photos/3373739/pexels-photo-3373739.jpeg?auto=compress&cs=tinysrgb&w=800" 
                alt="AI Scan" 
                className="w-full h-[300px] object-cover" 
              />
              
              {/* Scan Overlay */}
              <div className="absolute top-0 left-0 w-full h-[300px] bg-black/10">
                <motion.div 
                  animate={{ top: ["10%", "80%", "10%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-[10%] w-[80%] h-0.5 bg-white shadow-[0_0_15px_rgba(255,255,255,1)]"
                ></motion.div>
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/40 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-white tracking-wider">ANALYSE</span>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="p-6 bg-white relative -mt-6 rounded-t-[2rem]">
                <div className="flex flex-col gap-4">
                  {/* AI Message */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F4EAEB] flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-[#2A2424]" />
                    </div>
                    <div className="bg-[#FAF8F6] p-3.5 rounded-2xl rounded-tl-sm text-sm text-[#2A2424] shadow-sm">
                      Analyse terminée ! J'ai détecté une légère déshydratation sur vos joues.
                    </div>
                  </div>
                  
                  {/* Product Suggestion */}
                  <div className="flex gap-3 pl-11">
                    <div className="bg-white border border-[#2A2424]/10 p-3 rounded-2xl w-full flex items-center gap-3 shadow-sm">
                      <div className="w-10 h-10 rounded-lg bg-[#F4EAEB] overflow-hidden shrink-0">
                        <img src="https://images.pexels.com/photos/4041391/pexels-photo-4041391.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Product" className="w-full h-full object-cover mix-blend-multiply" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#2A2424]">Aqua Gel Cream</p>
                        <p className="text-[10px] text-[#2A2424]/60">Parfait pour l'hydratation matinale</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Glassmorphic elements outside the phone */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute top-[40%] -left-12 lg:-left-24 bg-white/60 backdrop-blur-xl p-3.5 rounded-2xl border border-white shadow-xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-[#E5B6B9] flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#2A2424]">Barrière intacte</p>
                <p className="text-[10px] text-[#2A2424]/60">État sain</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
