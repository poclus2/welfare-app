"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ScanFace, ChevronRight } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  sender: "ai" | "user";
  text: string;
};

type Option = {
  id: string;
  label: string;
  nextStep?: number;
};

type StepInfo = {
  id: number;
  question: string;
  options: Option[];
};

// ─── Mock Flow ──────────────────────────────────────────────────────────────

const FLOW_STEPS: StepInfo[] = [
  {
    id: 1,
    question: "👋 Bonjour ! Je suis My Skin Coach. En moins de 3 minutes, je vais analyser votre peau. Connaissez-vous votre type de peau ?",
    options: [
      { id: "yes", label: "Oui", nextStep: 2 },
      { id: "no", label: "Non, aidez-moi", nextStep: 3 },
    ],
  },
  {
    id: 2,
    question: "Super ! Quel est votre type de peau ?",
    options: [
      { id: "mixte", label: "Mixte", nextStep: 3 },
      { id: "grasse", label: "Grasse", nextStep: 3 },
      { id: "seche", label: "Sèche", nextStep: 3 },
      { id: "normale", label: "Normale", nextStep: 3 },
    ],
  },
  {
    id: 3,
    question: "Quels sont vos objectifs principaux aujourd'hui ?",
    options: [
      { id: "acne", label: "Anti-Acné", nextStep: 4 },
      { id: "glow", label: "Éclat & Glow", nextStep: 4 },
      { id: "anti-age", label: "Anti-âge", nextStep: 4 },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function SkinCoachFlow() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isGenerating]);

  // Initialize first AI message
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setMessages([{ id: "msg-1", sender: "ai", text: FLOW_STEPS[0]?.question || "" }]);
      setIsTyping(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleOptionSelect = (option: Option) => {
    // 1. Add user response bubble
    const userMsg: Message = { id: `msg-user-${Date.now()}`, sender: "user", text: option.label };
    setMessages((prev) => [...prev, userMsg]);
    
    // 2. Hide options and show AI typing indicator
    setIsTyping(true);

    // 3. Process next step after a realistic delay
    setTimeout(() => {
      if (option.nextStep && option.nextStep <= FLOW_STEPS.length) {
        const nextStepInfo = FLOW_STEPS.find((s) => s.id === option.nextStep);
        if (nextStepInfo) {
          setMessages((prev) => [...prev, { id: `msg-ai-${Date.now()}`, sender: "ai", text: nextStepInfo.question }]);
          setCurrentStep(option.nextStep);
          setIsTyping(false);
        }
      } else {
        // End of the mocked flow
        setIsGenerating(true);
        setIsTyping(false);
        setMessages((prev) => [
          ...prev, 
          { id: `msg-ai-${Date.now()}`, sender: "ai", text: "Parfait ! Laissez-moi analyser tout ça... Génération de votre routine personnalisée en cours ✨" }
        ]);
      }
    }, 1200); // 1.2s typing delay
  };

  const currentStepInfo = FLOW_STEPS.find((s) => s.id === currentStep);
  const progressPercent = Math.round((currentStep / FLOW_STEPS.length) * 100);

  return (
    <div className="relative w-full h-[100dvh] bg-[#F4EAEB] overflow-hidden flex flex-col font-sans">
      
      {/* ─── 1. BACKGROUND (Scanner Visuel) ─── */}
      <div className="absolute inset-0 z-0 h-[65vh] w-full bg-slate-200">
        {/* Placeholder image : Femme peau lumineuse */}
        <img 
          src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1470&auto=format&fit=crop" 
          alt="Analyse de peau" 
          className="w-full h-full object-cover object-top opacity-90"
        />
        {/* Gradient pour fondre l'image dans l'UI du bas */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#F4EAEB] pointer-events-none" />
        
        {/* Cadre de Scan Animé */}
        <div className="absolute inset-0 flex items-start justify-center pt-[15vh]">
          <div className="relative w-[75%] max-w-sm aspect-[3/4] border-2 border-white/30 rounded-[2.5rem] overflow-hidden">
            {/* Repères coins (Corner highlights) */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-[2.5rem]" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-[2.5rem]" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-[2.5rem]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-[2.5rem]" />
            
            {/* Ligne de balayage lumineuse */}
            <motion.div
              animate={{ y: ["0%", "400%", "0%"] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
              className="absolute top-0 left-0 right-0 h-1 bg-emerald-400/80 shadow-[0_0_20px_4px_rgba(52,211,153,0.5)]"
            />
          </div>
        </div>
      </div>

      {/* ─── 2. FOREGROUND (Chatbot Conversationnel Glassmorphism) ─── */}
      <div className="relative z-10 flex-1 flex flex-col mt-[45vh] bg-white/70 backdrop-blur-2xl border-t border-white/50 rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.06)]">
        
        {/* Barre de progression & Poignée (Drag Handle) */}
        <div className="flex flex-col items-center pt-4 pb-3 px-6 shrink-0">
          <div className="w-12 h-1.5 bg-slate-300/40 rounded-full mb-5" />
          <div className="w-full flex items-center gap-4">
            <div className="flex-1 h-1.5 bg-[#EDE0E0] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-slate-800 rounded-full"
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
              Diagnostic {progressPercent}%
            </span>
          </div>
        </div>

        {/* Zone de Messages (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 space-y-5 scroll-smooth">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* Avatar IA */}
                {msg.sender === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-[#182823] flex items-center justify-center shrink-0 mr-3 mt-auto shadow-sm">
                    <Sparkles className="w-4 h-4 text-emerald-100" />
                  </div>
                )}
                
                {/* Bulle de texte */}
                <div 
                  className={`max-w-[75%] p-4 text-[14px] leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-slate-800 text-white rounded-3xl rounded-br-sm shadow-md"
                      : "bg-white text-slate-800 rounded-3xl rounded-bl-sm shadow-sm border border-[#EDE0E0]/60"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
            
            {/* Indicateur de Frappe (Typing) */}
            {isTyping && (
              <motion.div
                key="typing-indicator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="flex w-full justify-start items-end gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-[#182823] flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4 text-emerald-100" />
                </div>
                <div className="bg-white px-4 py-3.5 rounded-3xl rounded-bl-sm shadow-sm border border-[#EDE0E0]/60 flex items-center gap-1.5 h-[46px]">
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: 0 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                </div>
              </motion.div>
            )}

            {/* État final : Chargement de la routine */}
            {isGenerating && (
              <motion.div
                key="generating-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="w-full flex flex-col items-center justify-center pt-10 pb-4 space-y-5"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100/50 flex items-center justify-center shadow-inner">
                  <ScanFace className="w-10 h-10 text-[#182823] animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-slate-800 animate-pulse">Analyse de vos besoins en cours...</p>
              </motion.div>
            )}
            
            {/* Point d'ancrage pour l'auto-scroll */}
            <div ref={chatEndRef} className="h-1" />
          </AnimatePresence>
        </div>

        {/* ─── 3. Quick Replies (Boutons Chips) ─── */}
        {!isTyping && !isGenerating && currentStepInfo && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.2 }}
            className="p-6 pt-2 bg-white/40 shrink-0"
          >
            <div className="flex flex-col gap-2.5">
              {currentStepInfo.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option)}
                  className="w-full bg-slate-800 text-white hover:bg-slate-900 active:scale-[0.98] transition-all py-4 px-6 rounded-2xl text-[15px] font-semibold flex items-center justify-between group shadow-sm"
                >
                  {option.label}
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <ChevronRight className="w-4 h-4 text-white/90 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
