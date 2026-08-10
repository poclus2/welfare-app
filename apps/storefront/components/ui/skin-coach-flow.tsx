"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ScanFace, ChevronRight, Camera, RefreshCw, Send, Zap } from "lucide-react";
import Webcam from "react-webcam";
import { analyzeSkin, SkinAnalysisResult } from "@/app/actions/analyze-skin";
import { useSkinCoachStore } from "@/lib/store/use-skin-coach-store";
import { useRouter } from "next/navigation";
import SmartCameraCapture, { CaptureResult } from "./smart-camera-capture";

// ─── Types ──────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  sender: "ai" | "user";
  text?: string;
  image?: string;
};

type Option = {
  label: string;
  nextQuestionId: string;
};

type QuestionNode = {
  id: string;
  text: string;
  type: "choice" | "text" | "text_or_photo";
  options?: Option[];
  nextQuestionId?: string;
};

type UserResponse = {
  questionId: string;
  answer: string | { type: "image"; base64: string };
};

// ─── Flow Data ──────────────────────────────────────────────────────────────

const DECISION_TREE: QuestionNode[] = [
  {
    id: "q_main_goal",
    text: "👋 Bonjour ! Pendant que j'analyse vos photos, dites-m'en plus sur vous. Quel est votre objectif numéro 1 aujourd'hui ?",
    type: "choice",
    options: [
      { label: "Combattre l'acné & imperfections", nextQuestionId: "q_post_wash" },
      { label: "Atténuer les taches (Hyperpigmentation)", nextQuestionId: "q_post_wash" },
      { label: "Hydratation & effet Glow", nextQuestionId: "q_post_wash" },
      { label: "Anti-âge & fermeté", nextQuestionId: "q_post_wash" }
    ]
  },
  {
    id: "q_post_wash",
    text: "Pour bien comprendre votre métabolisme, dites-moi : comment ressentez-vous votre peau dans les minutes qui suivent son nettoyage ?",
    type: "choice",
    options: [
      { label: "Elle tiraille, j'ai un besoin urgent de l'hydrater", nextQuestionId: "q_midday_behavior" },
      { label: "Elle est normale et plutôt confortable", nextQuestionId: "q_midday_behavior" },
      { label: "Elle regraisse très rapidement", nextQuestionId: "q_midday_behavior" }
    ]
  },
  {
    id: "q_midday_behavior",
    text: "Et au milieu de la journée (vers 14h), comment évolue-t-elle généralement ?",
    type: "choice",
    options: [
      { label: "Elle brille sur tout le visage", nextQuestionId: "q_sensitivity" },
      { label: "Elle brille uniquement sur la zone T (Front, Nez, Menton)", nextQuestionId: "q_sensitivity" },
      { label: "Elle reste mate, mais j'ai des zones sèches ou squameuses", nextQuestionId: "q_sensitivity" },
      { label: "Elle ne bouge pas, elle reste confortable", nextQuestionId: "q_sensitivity" }
    ]
  },
  {
    id: "q_sensitivity",
    text: "C'est noté. Comment réagit généralement votre peau aux nouveaux produits ?",
    type: "choice",
    options: [
      { label: "Très bien, elle supporte tout", nextQuestionId: "q_allergies_check" },
      { label: "Sensible, parfois des rougeurs", nextQuestionId: "q_allergies_check" },
      { label: "Très réactive et intolérante", nextQuestionId: "q_allergies_check" }
    ]
  },
  {
    id: "q_allergies_check",
    text: "Une question de sécurité : avez-vous des allergies connues à certains cosmétiques ou ingrédients ?",
    type: "choice",
    options: [
      { label: "Oui", nextQuestionId: "q_allergies_details" },
      { label: "Non", nextQuestionId: "q_current_routine" }
    ]
  },
  {
    id: "q_allergies_details",
    text: "Aïe ! Dites-moi quels sont les ingrédients ou produits que votre peau ne supporte pas :",
    type: "text",
    nextQuestionId: "q_current_routine"
  },
  {
    id: "q_current_routine",
    text: "Utilisez-vous déjà une routine de soins au quotidien ?",
    type: "choice",
    options: [
      { label: "Oui", nextQuestionId: "q_routine_details" },
      { label: "Non, je commence tout juste", nextQuestionId: "q_sun_exposure" }
    ]
  },
  {
    id: "q_routine_details",
    text: "Super ! Écrivez-moi le nom des produits que vous utilisez, ou prenez-les simplement en photo 📸 :",
    type: "text_or_photo",
    nextQuestionId: "q_sun_exposure"
  },
  {
    id: "q_sun_exposure",
    text: "Dernière question : à quelle fréquence êtes-vous exposée au soleil dans la journée ?",
    type: "choice",
    options: [
      { label: "Très peu (surtout en intérieur)", nextQuestionId: "q_finish" },
      { label: "Modérément (trajets, balades)", nextQuestionId: "q_finish" },
      { label: "Beaucoup (travail/sport en extérieur)", nextQuestionId: "q_finish" }
    ]
  }
];

// ─── Reusable AI Avatar ──────────────────────────────────────────────────────

const AIAvatar = () => (
  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mr-2.5 mt-auto shadow-lg"
    style={{ background: "linear-gradient(135deg, #2A1E1F 0%, #4a2c2e 100%)", border: "1.5px solid rgba(229,182,185,0.3)" }}>
    <Sparkles className="w-4 h-4" style={{ color: "#E5B6B9" }} />
  </div>
);

// ─── Progress steps ──────────────────────────────────────────────────────────
const TOTAL_STEPS = 8; // DECISION_TREE length (excluding q_finish)

// ─── Component ──────────────────────────────────────────────────────────────

export default function SkinCoachFlow() {
  const router = useRouter();
  // Capture states
  const [captures, setCaptures] = useState<CaptureResult | null>(null);
  const [hasCaptured, setHasCaptured] = useState(false);

  // Chat states
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("q_main_goal");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(5);
  const [inputText, setInputText] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  
  // Photo capture state for text_or_photo
  const [showCamera, setShowCamera] = useState(false);
  const [cameraNextQuestionId, setCameraNextQuestionId] = useState<string | undefined>(undefined);
  const webcamRef = useRef<Webcam>(null);
  
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
        const firstNode = DECISION_TREE.find(n => n.id === "q_main_goal");
        setMessages([{ id: "msg-1", sender: "ai", text: firstNode?.text || "" }]);
        setIsTyping(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [hasCaptured, messages.length]);

  const handleCaptureComplete = (result: CaptureResult) => {
    setCaptures(result);
    setHasCaptured(true);
  };

  const handleRetake = () => {
    setCaptures(null);
    setHasCaptured(false);
    setMessages([]);
    setUserResponses([]);
    setCurrentQuestionId("q_main_goal");
    setProgressPercent(5);
    setStepIndex(0);
    setIsGenerating(false);
  };

  const executeAnalysis = async (finalResponses: UserResponse[]) => {
    if (!captures) return;
    
    try {
      const result = await analyzeSkin(captures, finalResponses);
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
    const newResponses = [...userResponses, { questionId: currentQuestionId, answer: option.label }];
    setUserResponses(newResponses);
    const userMsg: Message = { id: `msg-user-${Date.now()}`, sender: "user", text: option.label };
    setMessages((prev) => [...prev, userMsg]);
    processNextStep(newResponses, option.nextQuestionId);
  };

  const handleTextSubmit = (text: string, nextQuestionId?: string) => {
    if (!text.trim() || !nextQuestionId) return;
    
    const newResponses = [...userResponses, { questionId: currentQuestionId, answer: text.trim() }];
    setUserResponses(newResponses);
    const userMsg: Message = { id: `msg-user-${Date.now()}`, sender: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    
    setInputText("");
    processNextStep(newResponses, nextQuestionId);
  };

  const handlePhotoSubmit = (base64Image: string, nextQuestionId?: string) => {
    if (!nextQuestionId) return;

    const newResponses = [...userResponses, { questionId: currentQuestionId, answer: { type: "image" as const, base64: base64Image } }];
    setUserResponses(newResponses);
    const userMsg: Message = { id: `msg-user-${Date.now()}`, sender: "user", image: base64Image };
    setMessages((prev) => [...prev, userMsg]);

    setShowCamera(false);
    processNextStep(newResponses, nextQuestionId);
  };

  const processNextStep = (newResponses: UserResponse[], nextQuestionId: string) => {
    setIsTyping(true);
    setStepIndex(prev => Math.min(prev + 1, TOTAL_STEPS));

    setProgressPercent((prev) => {
      const increment = Math.floor(Math.random() * 11) + 10;
      const newProgress = prev + increment;
      return newProgress > 95 ? 95 : newProgress;
    });

    setTimeout(() => {
      if (nextQuestionId === "q_finish") {
        setProgressPercent(100);
        setIsGenerating(true);
        setIsTyping(false);
        setMessages((prev) => [
          ...prev, 
          { id: `msg-ai-${Date.now()}`, sender: "ai", text: "Parfait ! Laissez-moi analyser tout ça... Génération de votre routine personnalisée en cours ✨" }
        ]);
        
        executeAnalysis(newResponses);
      } else {
        const nextNode = DECISION_TREE.find((n) => n.id === nextQuestionId);
        if (nextNode) {
          setMessages((prev) => [...prev, { id: `msg-ai-${Date.now()}`, sender: "ai", text: nextNode.text }]);
          setCurrentQuestionId(nextQuestionId);
          setIsTyping(false);
        }
      }
    }, 1200);
  };

  const currentNode = DECISION_TREE.find((n) => n.id === currentQuestionId);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden flex flex-col font-sans" style={{ background: "#1A1516" }}>
      
      {/* ─── 1. BACKGROUND ─── */}
      <div className={`absolute z-0 ${hasCaptured ? "inset-x-0 top-0 h-[52vh]" : "inset-0"} w-full bg-slate-900 transition-all duration-700 ease-in-out`}>
        
        {!hasCaptured ? (
          <SmartCameraCapture 
            onComplete={handleCaptureComplete} 
            onCancel={() => router.push("/")} 
          />
        ) : (
          // Images Capturées
          <div className="relative w-full h-full flex flex-row">
            <img 
              src={captures?.front} 
              alt="Analyse de peau Face" 
              className="w-1/3 h-full object-cover object-top"
            />
            <img 
              src={captures?.left} 
              alt="Analyse de peau Gauche" 
              className="w-1/3 h-full object-cover object-top border-l border-white/10"
            />
            <img 
              src={captures?.right} 
              alt="Analyse de peau Droite" 
              className="w-1/3 h-full object-cover object-top border-l border-white/10"
            />

            {/* Overlay gradient dégradant vers le bas */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(26,21,22,0.15) 0%, rgba(26,21,22,0.7) 70%, #1A1516 100%)" }}
            />

            {/* Scanning animation bars */}
            <motion.div 
              className="absolute inset-x-0 h-[2px] pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(229,182,185,0.7), transparent)" }}
              animate={{ top: ["10%", "90%", "10%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Étiquettes d'analyse */}
            <div className="absolute top-5 left-0 right-0 flex justify-around px-2 pointer-events-none">
              {["FACE", "GAUCHE", "DROITE"].map((label) => (
                <div key={label} className="text-[10px] font-bold tracking-widest uppercase bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm border border-white/5" style={{ color: "rgba(229,182,185,0.8)" }}>
                  {label}
                </div>
              ))}
            </div>
            
            {/* Bouton pour recommencer */}
            <button 
              onClick={handleRetake}
              className="absolute top-5 right-4 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 text-white p-2.5 rounded-full transition-all z-50 shadow-md hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ─── 2. CHAT PANEL ─── */}
      {hasCaptured && (
        <div className="relative z-10 flex-1 flex flex-col mt-[45vh] rounded-t-[2rem] overflow-hidden"
          style={{ background: "linear-gradient(180deg, rgba(36,26,27,0.99) 0%, #1A1516 100%)", backdropFilter: "blur(30px)", borderTop: "1px solid rgba(229,182,185,0.12)" }}>
          
          {/* ─── Header ─── */}
          <div className="flex flex-col items-center pt-3 pb-4 px-6 shrink-0 border-b border-white/5">
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full mb-4" style={{ background: "rgba(255,255,255,0.1)" }} />
            
            {/* Progress bar */}
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #C8868A, #E5B6B9)" }}
                />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Zap className="w-3 h-3" style={{ color: "#E5B6B9" }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(229,182,185,0.7)" }}>
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* ─── Messages ─── */}
          <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5 space-y-4 scroll-smooth">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, type: "spring", bounce: 0.25 }}
                  className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start items-end"}`}
                >
                  {msg.sender === "ai" && <AIAvatar />}
                  
                  <div className={`max-w-[78%] text-[14px] leading-relaxed ${
                    msg.sender === "user" 
                      ? "text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-lg"
                      : "rounded-2xl rounded-bl-sm px-4 py-3.5 shadow-sm"
                  }`}
                    style={msg.sender === "user"
                      ? { background: "linear-gradient(135deg, #4a2c2e, #6b3d40)", border: "1px solid rgba(229,182,185,0.25)" }
                      : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.88)" }
                    }
                  >
                    {msg.image ? (
                      <img src={msg.image} alt="Photo utilisateur" className="w-full h-auto rounded-xl object-cover" />
                    ) : (
                      msg.text
                    )}
                  </div>
                </motion.div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  key="typing-indicator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="flex w-full justify-start items-end gap-2.5"
                >
                  <AIAvatar />
                  <div className="px-4 py-3.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <motion.div key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay }}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "rgba(229,182,185,0.7)" }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}


              <div ref={chatEndRef} className="h-1" />
            </AnimatePresence>
          </div>

          {/* ─── Input Zone ─── */}
          {!isTyping && !isGenerating && currentNode && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.2 }}
              className="px-5 pb-8 pt-3 shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              {currentNode.type === "choice" && currentNode.options ? (
                <div className="flex flex-col gap-2.5">
                  {currentNode.options.map((option, index) => (
                    <motion.button
                      key={`${option.label}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.07, type: "spring", bounce: 0.2 }}
                      onClick={() => handleOptionSelect(option)}
                      className="w-full text-left py-3.5 px-5 rounded-2xl text-[14px] font-semibold flex items-center justify-between group transition-all active:scale-[0.98]"
                      style={{
                        background: "rgba(229,182,185,0.05)",
                        border: "1px solid rgba(229,182,185,0.15)",
                        color: "rgba(255,255,255,0.85)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(229,182,185,0.1)";
                        e.currentTarget.style.borderColor = "rgba(229,182,185,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(229,182,185,0.05)";
                        e.currentTarget.style.borderColor = "rgba(229,182,185,0.15)";
                      }}
                    >
                      <span>{option.label}</span>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-3 transition-all"
                        style={{ background: "rgba(229,182,185,0.1)", border: "1px solid rgba(229,182,185,0.2)" }}>
                        <ChevronRight className="w-3.5 h-3.5" style={{ color: "#E5B6B9" }} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 relative">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleTextSubmit(inputText, currentNode.nextQuestionId);
                        }
                      }}
                      placeholder="Votre réponse..."
                      className={`w-full text-[14px] py-4 ${currentNode.type === "text_or_photo" ? 'pl-5 pr-14' : 'pl-5 pr-5'} rounded-2xl outline-none transition-all`}
                      style={{
                        background: "rgba(229,182,185,0.06)",
                        border: "1px solid rgba(229,182,185,0.2)",
                        color: "rgba(255,255,255,0.9)",
                      }}
                    />
                    {currentNode.type === "text_or_photo" && (
                      <button
                        onClick={() => {
                          setCameraNextQuestionId(currentNode.nextQuestionId);
                          setShowCamera(true);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: "rgba(229,182,185,0.7)" }}
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleTextSubmit(inputText, currentNode.nextQuestionId)}
                    disabled={!inputText.trim()}
                    className="p-4 rounded-2xl transition-all disabled:opacity-30 shadow-lg active:scale-95"
                    style={{ background: "linear-gradient(135deg, #C8868A, #E5B6B9)" }}
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* ─── Camera Overlay ─── */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 bg-black flex flex-col"
          >
            <div className="relative flex-1 overflow-hidden">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-6 left-6">
                <button 
                  onClick={() => setShowCamera(false)}
                  className="bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/20 text-sm font-semibold"
                >
                  Annuler
                </button>
              </div>
              <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center">
                <button
                  onClick={() => {
                    const src = webcamRef.current?.getScreenshot();
                    if (src && cameraNextQuestionId) {
                      handlePhotoSubmit(src, cameraNextQuestionId);
                    }
                  }}
                  className="w-20 h-20 bg-white/20 rounded-full border-4 border-white flex items-center justify-center p-2 backdrop-blur-sm hover:scale-105 active:scale-95 transition-transform"
                >
                  <div className="w-full h-full bg-white rounded-full shadow-lg" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ─── Analysis Popup Modal ─── */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            key="analysis-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center"
            style={{ background: "rgba(26, 21, 22, 0.94)", backdropFilter: "blur(20px)" }}
          >
            {/* Animated background orbs */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(229,182,185,0.1) 0%, transparent 70%)", top: "10%", left: "50%", translateX: "-50%" }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ width: 300, height: 300, background: "radial-gradient(circle, rgba(200,134,138,0.08) 0%, transparent 70%)", bottom: "15%", left: "20%" }}
              animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* DNA helix-like scan rings */}
            <div className="relative flex items-center justify-center mb-10">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border"
                  style={{
                    width: 80 + i * 50,
                    height: 80 + i * 50,
                    borderColor: `rgba(229,182,185,${0.35 - i * 0.07})`,
                  }}
                  animate={{ rotate: i % 2 === 0 ? [0, 360] : [360, 0], scale: [1, 1.04, 1] }}
                  transition={{ duration: 6 + i * 2, repeat: Infinity, ease: "linear" }}
                />
              ))}

              {/* Center logo */}
              <motion.div
                className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #2A1E1F 0%, #4a2c2e 100%)",
                  border: "2px solid rgba(229,182,185,0.35)",
                  boxShadow: "0 0 40px rgba(229,182,185,0.2), inset 0 0 20px rgba(229,182,185,0.06)"
                }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ScanFace className="w-9 h-9 text-emerald-300" />
              </motion.div>
            </div>

            {/* Text block */}
            <div className="text-center px-8 space-y-4 relative z-10">
              <motion.h2
                className="text-2xl font-extrabold text-white"
                style={{ letterSpacing: "-0.02em" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Analyse en cours...
              </motion.h2>

              <motion.p
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.45)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Notre IA dermatologique croise vos données visuelles avec vos réponses pour créer votre routine parfaite.
              </motion.p>

              {/* Animated step list */}
              <div className="mt-6 space-y-2.5 text-left">
                {[
                  { label: "Analyse des photos (Face, Gauche, Droite)", delay: 0.6 },
                  { label: "Calcul des indices cutanés", delay: 1.1 },
                  { label: "Croisement avec vos réponses", delay: 1.6 },
                  { label: "Génération de votre routine K-Beauty", delay: 2.1 },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: step.delay, type: "spring", bounce: 0.3 }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: "#10b981" }}
                      animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: step.delay }}
                    />
                    <span className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Bottom loading bar */}
              <motion.div
                className="mt-6 w-full h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #10b981, #34d399, #10b981)", backgroundSize: "200%" }}
                  animate={{ backgroundPosition: ["0%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  initial={{ width: "0%" }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
