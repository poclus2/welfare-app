"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ScanFace, ChevronRight, Camera, UploadCloud, RefreshCw } from "lucide-react";
import Webcam from "react-webcam";
import { analyzeSkin, SkinAnalysisResult } from "@/app/actions/analyze-skin";
import { useSkinCoachStore } from "@/lib/store/use-skin-coach-store";
import { useRouter } from "next/navigation";

// ─── Types ──────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  sender: "ai" | "user";
  text: string;
};

type Option = {
  label: string;
  nextQuestionId: string;
};

type QuestionNode = {
  id: string;
  text: string;
  options: Option[];
};

type UserResponse = {
  questionId: string;
  answer: string;
};

// ─── Flow Data ──────────────────────────────────────────────────────────────

const DECISION_TREE: QuestionNode[] = [
  {
    "id": "q_knows_skin_type",
    "text": "👋 Bonjour ! Je suis My Skin Coach. En moins de 3 minutes, je vais analyser votre peau et vous proposer une routine personnalisée. Commençons : Connaissez-vous votre type de peau ?",
    "options": [
      { "label": "Oui", "nextQuestionId": "q_skin_type_direct" },
      { "label": "Non", "nextQuestionId": "q_morning_skin" }
    ]
  },
  {
    "id": "q_skin_type_direct",
    "text": "Super ! Quel est votre type de peau ?",
    "options": [
      { "label": "Grasse", "nextQuestionId": "q_main_goal" },
      { "label": "Mixte", "nextQuestionId": "q_main_goal" },
      { "label": "Sèche", "nextQuestionId": "q_main_goal" },
      { "label": "Normale", "nextQuestionId": "q_main_goal" }
    ]
  },
  {
    "id": "q_morning_skin",
    "text": "Pas de soucis, on va le découvrir ensemble ! Au réveil, avant de laver votre visage, comment est votre peau ?",
    "options": [
      { "label": "✨ Elle brille sur tout le visage", "nextQuestionId": "q_day_shine" },
      { "label": "✨ Elle brille uniquement sur la zone T", "nextQuestionId": "q_day_shine" },
      { "label": "✨ Elle ne brille presque pas et je me sens confortable", "nextQuestionId": "q_day_shine" }
    ]
  },
  {
    "id": "q_day_shine",
    "text": "Au cours de la journée, votre peau devient-elle brillante ?",
    "options": [
      { "label": "Oui, très rapidement", "nextQuestionId": "q_tightness" },
      { "label": "Oui, seulement sur la zone T", "nextQuestionId": "q_tightness" },
      { "label": "Très peu", "nextQuestionId": "q_tightness" },
      { "label": "Presque jamais", "nextQuestionId": "q_tightness" }
    ]
  },
  {
    "id": "q_tightness",
    "text": "Avez-vous souvent des sensations de tiraillement ou de sécheresse ?",
    "options": [
      { "label": "Jamais", "nextQuestionId": "q_moisturizer_freq" },
      { "label": "Parfois", "nextQuestionId": "q_moisturizer_freq" },
      { "label": "Souvent", "nextQuestionId": "q_moisturizer_freq" },
      { "label": "Presque tout le temps", "nextQuestionId": "q_moisturizer_freq" }
    ]
  },
  {
    "id": "q_moisturizer_freq",
    "text": "À quelle fréquence appliquez-vous une crème hydratante parce que votre peau en ressent le besoin ?",
    "options": [
      { "label": "Tous les jours", "nextQuestionId": "q_main_goal" },
      { "label": "Quelques fois par semaine", "nextQuestionId": "q_main_goal" },
      { "label": "Rarement", "nextQuestionId": "q_main_goal" },
      { "label": "Jamais", "nextQuestionId": "q_main_goal" }
    ]
  },
  {
    "id": "q_main_goal",
    "text": "C'est noté ! Quels sont vos objectifs principaux pour votre peau aujourd'hui ?",
    "options": [
      { "label": "Traiter l'Acné & Imperfections", "nextQuestionId": "q_dermatologist" },
      { "label": "Cibler l'Hyperpigmentation & Taches", "nextQuestionId": "q_dermatologist" },
      { "label": "Anti-âge & Fermeté", "nextQuestionId": "q_dermatologist" },
      { "label": "Hydratation & Effet Glow", "nextQuestionId": "q_dermatologist" },
      { "label": "Apaiser les rougeurs & Sensibilité", "nextQuestionId": "q_dermatologist" }
    ]
  },
  {
    "id": "q_dermatologist",
    "text": "Une question importante : avez-vous déjà consulté un dermatologue pour ces préoccupations ?",
    "options": [
      { "label": "Oui", "nextQuestionId": "q_current_routine" },
      { "label": "Non", "nextQuestionId": "q_reaction_history" }
    ]
  },
  {
    "id": "q_reaction_history",
    "text": "Avez-vous déjà eu une réaction allergique ou une forte sensibilité à un produit cosmétique ?",
    "options": [
      { "label": "Oui", "nextQuestionId": "q_current_routine" },
      { "label": "Non", "nextQuestionId": "q_current_routine" }
    ]
  },
  {
    "id": "q_current_routine",
    "text": "Utilisez-vous une routine de soins actuellement ?",
    "options": [
      { "label": "Oui", "nextQuestionId": "q_finish" },
      { "label": "Non", "nextQuestionId": "q_finish" }
    ]
  }
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function SkinCoachFlow() {
  const router = useRouter();
  // Capture states
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [hasCaptured, setHasCaptured] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat states
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("q_knows_skin_type");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(5);
  
  // Analysis states
  const setResult = useSkinCoachStore((state) => state.setResult);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isGenerating]);

  // Starts the chat once capture is done
  useEffect(() => {
    if (hasCaptured && messages.length === 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        const firstNode = DECISION_TREE.find(n => n.id === "q_knows_skin_type");
        setMessages([{ id: "msg-1", sender: "ai", text: firstNode?.text || "" }]);
        setIsTyping(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [hasCaptured, messages.length]);

  const captureWebcam = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImageBase64(imageSrc);
        setHasCaptured(true);
      }
    }
  }, [webcamRef]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
        setHasCaptured(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    setImageBase64(null);
    setHasCaptured(false);
    setMessages([]);
    setUserResponses([]);
    setCurrentQuestionId("q_knows_skin_type");
    setProgressPercent(5);
    setIsGenerating(false);
  };

  const executeAnalysis = async (finalResponses: UserResponse[]) => {
    if (!imageBase64) return;
    
    try {
      const result = await analyzeSkin(imageBase64, finalResponses);
      if (result.success && result.data) {
        setResult(result.data);
        router.push("/skin-coach/result");
      } else {
        setMessages(prev => [...prev, { id: `msg-ai-err-${Date.now()}`, sender: "ai", text: "Oups, une erreur est survenue lors de l'analyse : " + result.error }]);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: `msg-ai-err-${Date.now()}`, sender: "ai", text: "Erreur de connexion au serveur d'analyse." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionSelect = (option: Option) => {
    // 1. Enregistrer la réponse
    const newResponses = [...userResponses, { questionId: currentQuestionId, answer: option.label }];
    setUserResponses(newResponses);

    // 2. Add user response bubble
    const userMsg: Message = { id: `msg-user-${Date.now()}`, sender: "user", text: option.label };
    setMessages((prev) => [...prev, userMsg]);
    
    // 3. Hide options and show AI typing indicator
    setIsTyping(true);

    // 4. Progress bar increment (random between 10 and 20)
    setProgressPercent((prev) => {
      const increment = Math.floor(Math.random() * 11) + 10; // 10 to 20
      const newProgress = prev + increment;
      return newProgress > 95 ? 95 : newProgress;
    });

    // 5. Process next step after a realistic delay
    setTimeout(() => {
      if (option.nextQuestionId === "q_finish") {
        // End of the flow
        setProgressPercent(100);
        setIsGenerating(true);
        setIsTyping(false);
        setMessages((prev) => [
          ...prev, 
          { id: `msg-ai-${Date.now()}`, sender: "ai", text: "Parfait ! Laissez-moi analyser tout ça... Génération de votre routine personnalisée en cours ✨" }
        ]);
        
        // Exécute l'analyse avec la Server Action
        executeAnalysis(newResponses);
      } else {
        // Next question
        const nextNode = DECISION_TREE.find((n) => n.id === option.nextQuestionId);
        if (nextNode) {
          setMessages((prev) => [...prev, { id: `msg-ai-${Date.now()}`, sender: "ai", text: nextNode.text }]);
          setCurrentQuestionId(option.nextQuestionId);
          setIsTyping(false);
        }
      }
    }, 1200); // 1.2s typing delay
  };

  const currentNode = DECISION_TREE.find((n) => n.id === currentQuestionId);

  return (
    <div className="relative w-full h-[100dvh] bg-[#F4EAEB] overflow-hidden flex flex-col font-sans">
      
      {/* ─── 1. BACKGROUND (Scanner Visuel / Caméra) ─── */}
      <div className={`absolute inset-0 z-0 ${hasCaptured ? "h-[65vh]" : "h-[100dvh]"} w-full bg-slate-900 transition-all duration-700 ease-in-out`}>
        
        {!hasCaptured ? (
          // Flux Webcam en direct
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            
            {/* Calque et Guide Ovale */}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-8 pointer-events-none">
              <div className="text-white text-center mb-6 px-4">
                <h2 className="text-2xl font-semibold mb-2">Scanner votre visage</h2>
                <p className="text-white/80 text-sm">Placez votre visage au centre du cadre pour une analyse optimale.</p>
              </div>
              
              <div className="relative w-64 h-80 rounded-[4rem] border-2 border-dashed border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Repères visuels (optionnel) */}
                <motion.div
                  animate={{ y: ["0%", "400%", "0%"] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
                  className="absolute top-0 left-0 right-0 h-1 bg-emerald-400/80 shadow-[0_0_20px_4px_rgba(52,211,153,0.5)]"
                />
              </div>
            </div>

            {/* Boutons d'actions */}
            <div className="absolute bottom-12 left-0 right-0 px-6 flex flex-col gap-4">
              <button 
                onClick={captureWebcam}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl transition-all"
              >
                <Camera className="w-5 h-5" />
                Scanner mon visage
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <UploadCloud className="w-5 h-5" />
                Uploader une photo
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
            </div>
          </div>
        ) : (
          // Image Capturée (Gele)
          <div className="relative w-full h-full">
            <img 
              src={imageBase64!} 
              alt="Analyse de peau" 
              className="w-full h-full object-cover object-top opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#F4EAEB] pointer-events-none" />
            
            {/* Cadre de Scan Animé sur la photo gélée */}
              <div className="absolute inset-0 flex items-start justify-center pt-[15vh]">
                <div className="relative w-[75%] max-w-sm aspect-[3/4] border-2 border-white/30 rounded-[2.5rem] overflow-hidden">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-[2.5rem]" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-[2.5rem]" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-[2.5rem]" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-[2.5rem]" />
                  
                  <motion.div
                    animate={{ y: ["0%", "400%", "0%"] }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
                    className="absolute top-0 left-0 right-0 h-1 bg-emerald-400/80 shadow-[0_0_20px_4px_rgba(52,211,153,0.5)]"
                  />
                </div>
              </div>
            
            {/* Bouton pour recommencer */}
              <button 
                onClick={handleRetake}
                className="absolute top-6 right-6 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white p-3 rounded-full transition-colors z-50 shadow-md"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
          </div>
        )}
      </div>

      {/* ─── 2. FOREGROUND (Chatbot Conversationnel Glassmorphism) ─── */}
      {hasCaptured && (
        <div className="relative z-10 flex-1 flex flex-col mt-[45vh] bg-white/70 backdrop-blur-2xl border-t border-white/50 rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.06)] animate-in slide-in-from-bottom duration-700 ease-out">
          
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
          {!isTyping && !isGenerating && currentNode && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.2 }}
              className="p-6 pt-2 bg-white/40 shrink-0"
            >
              <div className="flex flex-col gap-2.5">
                {currentNode.options.map((option, index) => (
                  <button
                    key={`${option.label}-${index}`}
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
      )}

    </div>
  );
}
