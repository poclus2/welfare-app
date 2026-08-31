"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle, Scan, CaretRight, Camera, ArrowCounterClockwise, PaperPlaneTilt, Lightning } from "@phosphor-icons/react";
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
  options?: Option[];
};

type Option = {
  label: string;
  nextQuestionId?: string;
};

type QuestionNode = {
  id: string;
  text: string;
  subtitle?: string;
  type: "choice" | "multi_choice" | "text" | "text_or_photo";
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
      { label: "Très bien, elle supporte tout", nextQuestionId: "q_has_allergies" },
      { label: "Sensible, parfois des rougeurs", nextQuestionId: "q_has_allergies" },
      { label: "Très réactive et intolérante", nextQuestionId: "q_has_allergies" }
    ]
  },
  {
    id: "q_has_allergies",
    text: "Faites-vous des allergies à certains produits cosmétiques ?",
    type: "choice",
    options: [
      { label: "Oui", nextQuestionId: "q_allergies_list" },
      { label: "Non", nextQuestionId: "q_current_routine" }
    ]
  },
  {
    id: "q_allergies_list",
    text: "À quels ingrédients êtes-vous allergique ou sensible ?",
    subtitle: "Vous pouvez en sélectionner plusieurs.",
    type: "multi_choice",
    options: [
      { label: "Parfums synthétiques (Fragrance)" },
      { label: "Huiles Essentielles (Tea tree, Lavande, Agrumes...)" },
      { label: "Extraits Botaniques (Aloé Vera, Armoise, Thé vert...)" },
      { label: "Mucine d'escargot (Snail Mucin)" },
      { label: "Propolis / Miel / Venin d'abeille" },
      { label: "Centella Asiatica (Cica)" },
      { label: "Ferments (Galactomyces, Bifida...)" },
      { label: "Vitamine C pure (Acide L-Ascorbique)" },
      { label: "Rétinol / Rétinoïdes (Vitamine A)" },
      { label: "Acides Exfoliants (AHA, BHA, Acide Glycolique...)" },
      { label: "Niacinamide (Vitamine B3)" },
      { label: "Alcools asséchants (Alcohol Denat, Ethanol)" },
      { label: "Filtres Solaires Chimiques (Oxybenzone, Octocrylene...)" },
      { label: "Silicones (Dimethicone...)" },
      { label: "Autres (à préciser)" }
    ],
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
  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mr-2.5 mt-auto shadow-md"
    style={{ background: "linear-gradient(135deg, #E8C4C6 0%, #F0D4D6 100%)", border: "1.5px solid rgba(200,134,138,0.4)" }}>
    <Sparkle className="w-4 h-4" style={{ color: "#B06068" }} />
  </div>
);

// ─── Progress steps ──────────────────────────────────────────────────────────
const TOTAL_STEPS = 8;

// ─── Component ──────────────────────────────────────────────────────────────

export default function SkinCoachFlow() {
  const router = useRouter();
  const [captures, setCaptures] = useState<CaptureResult | null>(null);
  const [hasCaptured, setHasCaptured] = useState(false);

  const [currentQuestionId, setCurrentQuestionId] = useState<string>("q_main_goal");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [progressPercent, setProgressPercent] = useState<number>(5);
  const [inputText, setInputText] = useState("");
  const [stepIndex, setStepIndex] = useState(0);

  // Multi-choice state
  const [selectedMultiChoice, setSelectedMultiChoice] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");

  const [showCamera, setShowCamera] = useState(false);
  const [cameraNextQuestionId, setCameraNextQuestionId] = useState<string | undefined>(undefined);
  const webcamRef = useRef<Webcam>(null);

  const setResult = useSkinCoachStore((state) => state.setResult);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  }, [messages, isTyping, isGenerating, currentQuestionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating && analysisProgress < 99) {
      interval = setInterval(() => {
        setAnalysisProgress(prev => {
          const increment = (99 - prev) * 0.05;
          return prev + Math.max(increment, 0.1);
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isGenerating, analysisProgress]);

  useEffect(() => {
    if (hasCaptured && messages.length === 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        const firstNode = DECISION_TREE.find(n => n.id === "q_main_goal");
        setMessages([{ id: "msg-1", sender: "ai", text: firstNode?.text || "", options: firstNode?.options }]);
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
        setAnalysisProgress(100);
        setTimeout(() => {
          router.push("/skin-coach/result");
        }, 600);
      } else {
        setMessages(prev => [...prev, { id: `msg-ai-err-${Date.now()}`, sender: "ai", text: "Oups, une erreur est survenue lors de l'analyse : " + result.error }]);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: `msg-ai-err-${Date.now()}`, sender: "ai", text: "Erreur de connexion au serveur d'analyse." }]);
      setIsGenerating(false);
    }
  };

  const handleOptionSelect = (option: Option) => {
    if (!option.nextQuestionId) return;
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
        setAnalysisProgress(0);
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
          setMessages((prev) => [...prev, { id: `msg-ai-${Date.now()}`, sender: "ai", text: nextNode.text, options: nextNode.options }]);
          setCurrentQuestionId(nextQuestionId);
          setIsTyping(false);
        }
      }
    }, 1200);
  };

  const currentNode = DECISION_TREE.find((n) => n.id === currentQuestionId);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden flex flex-col font-sans" style={{ background: "#FDF8F7" }}>

      {/* ─── 1. BACKGROUND ─── */}
      <div className={`absolute z-0 ${hasCaptured ? "inset-x-0 top-0 h-[52vh]" : "inset-0"} w-full bg-slate-900 transition-all duration-700 ease-in-out`}>

        {!hasCaptured ? (
          <SmartCameraCapture
            onComplete={handleCaptureComplete}
            onCancel={() => router.push("/")}
          />
        ) : (
          <div className="relative w-full h-full flex flex-row">
            <img src={captures?.front} alt="Analyse de peau Face" className="w-1/3 h-full object-cover object-top" />
            <img src={captures?.left} alt="Analyse de peau Gauche" className="w-1/3 h-full object-cover object-top border-l border-white/10" />
            <img src={captures?.right} alt="Analyse de peau Droite" className="w-1/3 h-full object-cover object-top border-l border-white/10" />

            {/* Gradient fade to light background */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(253,248,247,0.1) 0%, rgba(253,248,247,0.55) 60%, #FDF8F7 100%)" }}
            />

            {/* Scanning animation */}
            <motion.div
              className="absolute inset-x-0 h-[2px] pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(176,96,104,0.6), transparent)" }}
              animate={{ top: ["10%", "90%", "10%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Labels */}
            <div className="absolute top-5 left-0 right-0 flex justify-around px-2 pointer-events-none">
              {["FACE", "GAUCHE", "DROITE"].map((label) => (
                <div key={label} className="text-[10px] font-bold tracking-widest uppercase bg-black/25 px-2 py-1 rounded-full backdrop-blur-sm border border-white/10" style={{ color: "rgba(255,240,240,0.9)" }}>
                  {label}
                </div>
              ))}
            </div>

            {/* Retake button */}
            <button
              onClick={handleRetake}
              className="absolute top-5 right-4 bg-white/70 hover:bg-white backdrop-blur-md border border-rose-100 text-rose-500 p-2.5 rounded-full transition-all z-50 shadow-md hover:scale-105 active:scale-95"
            >
              <ArrowCounterClockwise className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ─── 2. CHAT PANEL ─── */}
      {hasCaptured && (
        <div className="relative z-10 flex-1 flex flex-col mt-[12vh] rounded-t-[2rem] overflow-hidden"
          style={{ background: "linear-gradient(180deg, rgba(253,248,247,0.98) 0%, #FDF8F7 100%)", backdropFilter: "blur(30px)", borderTop: "1px solid rgba(200,134,138,0.18)", boxShadow: "0 -8px 40px rgba(200,134,138,0.1)" }}>

          {/* ─── Header ─── */}
          <div className="flex flex-col items-center pt-3 pb-4 px-6 shrink-0 border-b border-rose-100">
            <div className="w-10 h-1 rounded-full mb-4" style={{ background: "rgba(200,134,138,0.25)" }} />

            {/* Progress bar */}
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(200,134,138,0.12)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #C8868A, #E5B6B9)" }}
                />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Lightning className="w-3 h-3" style={{ color: "#C8868A" }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#C8868A" }}>
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* ─── Messages ─── */}
          <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5 space-y-4 scroll-smooth">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isLastMsg = idx === messages.length - 1;
                return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, type: "spring", bounce: 0.25 }}
                  className={`flex flex-col w-full ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start items-end"}`}>
                    {msg.sender === "ai" && <AIAvatar />}

                    <div className={`max-w-[78%] text-[14px] leading-relaxed ${
                      msg.sender === "user"
                        ? "rounded-2xl rounded-br-sm px-4 py-3 shadow-sm"
                        : "rounded-2xl rounded-bl-sm px-4 py-3.5"
                    }`}
                      style={msg.sender === "user"
                        ? { background: "linear-gradient(135deg, #C8868A, #D99EA1)", color: "white", boxShadow: "0 2px 12px rgba(200,134,138,0.25)" }
                        : { background: "white", border: "1px solid rgba(200,134,138,0.15)", color: "#3D2B2D", boxShadow: "0 2px 8px rgba(200,134,138,0.08)" }
                      }
                    >
                      {msg.image ? (
                        <img src={msg.image} alt="Photo utilisateur" className="w-full h-auto rounded-xl object-cover" />
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>

                  {/* Render Options inline if it's an AI message, it's the last message, and it has options */}
                  {msg.sender === "ai" && msg.options && isLastMsg && !isTyping && !isGenerating && (
                    currentNode?.type === "multi_choice" ? (
                      <div className="flex flex-col gap-4 mt-3 ml-[46px] w-[calc(100%-46px)] pr-4">
                        {currentNode.subtitle && (
                          <p className="text-[13px] font-medium -mt-1 mb-1" style={{ color: "rgba(61,43,45,0.6)" }}>
                            {currentNode.subtitle}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {msg.options.map((option, index) => {
                            const isSelected = selectedMultiChoice.includes(option.label);
                            return (
                              <motion.button
                                key={`${option.label}-${index}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.04, type: "spring", bounce: 0.3 }}
                                onClick={() => {
                                  let newSel = [...selectedMultiChoice];
                                  if (newSel.includes(option.label)) {
                                    newSel = newSel.filter(l => l !== option.label);
                                  } else {
                                    newSel.push(option.label);
                                  }
                                  setSelectedMultiChoice(newSel);
                                }}
                                className="px-3.5 py-2 rounded-full text-[12px] md:text-[13px] font-semibold transition-all duration-200"
                                style={
                                  isSelected
                                    ? { background: "#2A2424", color: "white", border: "1px solid #2A2424", boxShadow: "0 2px 8px rgba(42,36,36,0.2)" }
                                    : { background: "transparent", color: "rgba(61,43,45,0.8)", border: "1px solid rgba(200,134,138,0.4)" }
                                }
                              >
                                {option.label}
                              </motion.button>
                            );
                          })}
                        </div>
                        
                        <AnimatePresence>
                          {selectedMultiChoice.includes("Autres (à préciser)") && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <input
                                type="text"
                                placeholder="Précisez vos allergies..."
                                value={otherText}
                                onChange={(e) => setOtherText(e.target.value)}
                                className="w-full mt-2 px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                                style={{ background: "white", border: "1px solid rgba(200,134,138,0.4)", color: "#3D2B2D" }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => {
                            if (selectedMultiChoice.length === 0) return;
                            
                            let finalChoices = [...selectedMultiChoice];
                            if (finalChoices.includes("Autres (à préciser)") && otherText.trim()) {
                              finalChoices = finalChoices.filter(c => c !== "Autres (à préciser)");
                              finalChoices.push(`Autres: ${otherText.trim()}`);
                            }

                            const answerText = finalChoices.join(", ");
                            const newResponses = [...userResponses, { questionId: currentQuestionId, answer: answerText }];
                            setUserResponses(newResponses);
                            const userMsg: Message = { id: `msg-user-${Date.now()}`, sender: "user", text: answerText };
                            setMessages((prev) => [...prev, userMsg]);
                            
                            setSelectedMultiChoice([]);
                            setOtherText("");
                            
                            processNextStep(newResponses, currentNode.nextQuestionId!);
                          }}
                          disabled={selectedMultiChoice.length === 0 || (selectedMultiChoice.includes("Autres (à préciser)") && !otherText.trim())}
                          className="mt-3 w-full py-3.5 px-4 rounded-full text-sm font-bold tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: "#2A2424", color: "white", boxShadow: "0 4px 12px rgba(42,36,36,0.15)" }}
                        >
                          Valider mes choix
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5 mt-3 ml-[46px] w-[calc(100%-46px)] pr-4">
                        {msg.options.map((option, index) => (
                          <motion.button
                            key={`${option.label}-${index}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.07, type: "spring", bounce: 0.2 }}
                            onClick={() => handleOptionSelect(option)}
                            className="w-full text-left py-3.5 px-4 rounded-2xl text-[13px] font-semibold flex items-center justify-between group transition-all active:scale-[0.98]"
                            style={{
                              background: "white",
                              border: "1px solid rgba(200,134,138,0.2)",
                              color: "#3D2B2D",
                              boxShadow: "0 2px 8px rgba(200,134,138,0.07)"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(200,134,138,0.06)";
                              e.currentTarget.style.borderColor = "rgba(200,134,138,0.4)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "white";
                              e.currentTarget.style.borderColor = "rgba(200,134,138,0.2)";
                            }}
                          >
                            <span>{option.label}</span>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-3"
                              style={{ background: "rgba(200,134,138,0.1)", border: "1px solid rgba(200,134,138,0.2)" }}>
                              <CaretRight className="w-3.5 h-3.5" style={{ color: "#C8868A" }} />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )
                  )}
                </motion.div>
                );
              })}

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
                    style={{ background: "white", border: "1px solid rgba(200,134,138,0.15)", boxShadow: "0 2px 8px rgba(200,134,138,0.08)" }}>
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <motion.div key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay }}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "rgba(200,134,138,0.7)" }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} className="h-1" />
            </AnimatePresence>
          </div>

          {/* ─── Input Zone ─── */}
          {!isTyping && !isGenerating && currentNode && currentNode.type !== "choice" && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.2 }}
              className="px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shrink-0"
              style={{ borderTop: "1px solid rgba(200,134,138,0.1)" }}
            >
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
                        background: "white",
                        border: "1.5px solid rgba(200,134,138,0.25)",
                        color: "#3D2B2D",
                        boxShadow: "0 2px 8px rgba(200,134,138,0.07)"
                      }}
                    />
                    {currentNode.type === "text_or_photo" && (
                      <button
                        onClick={() => {
                          setCameraNextQuestionId(currentNode.nextQuestionId);
                          setShowCamera(true);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: "rgba(200,134,138,0.8)" }}
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleTextSubmit(inputText, currentNode.nextQuestionId)}
                    disabled={!inputText.trim()}
                    className="p-4 rounded-2xl transition-all disabled:opacity-30 shadow-md active:scale-95"
                    style={{ background: "linear-gradient(135deg, #C8868A, #E5B6B9)" }}
                  >
                    <PaperPlaneTilt className="w-5 h-5 text-white" />
                  </button>
                </div>
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
                screenshotQuality={0.5}
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
              <div className="absolute bottom-24 left-0 right-0 flex justify-center items-center">
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
            style={{ background: "rgba(253, 248, 247, 0.95)", backdropFilter: "blur(20px)" }}
          >
            {/* Background soft orbs */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(229,182,185,0.25) 0%, transparent 70%)", top: "5%", left: "50%", translateX: "-50%" }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ width: 300, height: 300, background: "radial-gradient(circle, rgba(200,134,138,0.15) 0%, transparent 70%)", bottom: "15%", left: "20%" }}
              animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* Scan rings */}
            <div className="relative flex items-center justify-center mb-10">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border"
                  style={{
                    width: 80 + i * 50,
                    height: 80 + i * 50,
                    borderColor: `rgba(200,134,138,${0.35 - i * 0.07})`,
                  }}
                  animate={{ rotate: i % 2 === 0 ? [0, 360] : [360, 0], scale: [1, 1.04, 1] }}
                  transition={{ duration: 6 + i * 2, repeat: Infinity, ease: "linear" }}
                />
              ))}

              {/* Center logo */}
              <motion.div
                className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #F0D4D6 0%, #E5B6B9 100%)",
                  border: "2px solid rgba(200,134,138,0.4)",
                  boxShadow: "0 0 40px rgba(200,134,138,0.25), inset 0 0 20px rgba(255,255,255,0.5)"
                }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Scan className="w-9 h-9" style={{ color: "#8B4347" }} />
              </motion.div>
            </div>

            {/* Text block */}
            <div className="text-center px-8 space-y-4 relative z-10">
              <motion.h2
                className="text-2xl font-extrabold"
                style={{ color: "#3D2B2D", letterSpacing: "-0.02em" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Analyse en cours...
              </motion.h2>

              <motion.p
                className="text-sm font-medium"
                style={{ color: "rgba(61,43,45,0.55)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Notre IA dermatologique croise vos données visuelles avec vos réponses pour créer votre routine parfaite.
              </motion.p>

              {/* Step list */}
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
                    style={{ background: "white", border: "1px solid rgba(200,134,138,0.15)", boxShadow: "0 2px 8px rgba(200,134,138,0.07)" }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: step.delay, type: "spring", bounce: 0.3 }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: "#C8868A" }}
                      animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: step.delay }}
                    />
                    <span className="text-[13px] font-medium" style={{ color: "rgba(61,43,45,0.7)" }}>
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Circular Progress bar */}
              <motion.div
                className="mt-8 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="rgba(200,134,138,0.15)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#progress-gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "251.2", strokeDashoffset: 251.2 }}
                      animate={{ strokeDashoffset: 251.2 - (251.2 * analysisProgress) / 100 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#C8868A" />
                        <stop offset="100%" stopColor="#E5B6B9" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold" style={{ color: "#3D2B2D" }}>
                      {Math.round(analysisProgress)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
