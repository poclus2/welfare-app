"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretRight, Camera, ArrowCounterClockwise, PaperPlaneTilt, Images, X, Check } from "@phosphor-icons/react";
import Webcam from "react-webcam";
import { analyzeFace, analyzeSkin, SkinAnalysisResult } from "@/app/actions/analyze-skin";
import posthog from "posthog-js";
import { FOLLOWUP_QUESTIONS, followUpQuestions } from "@/lib/skin-profile";
import { useSkinCoachStore } from "@/lib/store/use-skin-coach-store";
import { rememberPendingScan } from "@/lib/pending-scans";
import { useRouter } from "next/navigation";
import SmartCameraCapture, { CaptureResult } from "./smart-camera-capture";
import { IconIA } from "@/components/ui/icons/IconIA";
import { useI18n } from "@/lib/i18n-context";
import type { FaceMap } from "@/lib/face-map";
import { ScanGauge } from "@/components/ui/skin-coach/scan-gauge";
import { DISPLAY_FONT, SK } from "@/components/ui/skin-coach/theme";

// ─── Types ──────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  sender: "ai" | "user";
  text?: string;
  image?: string;
  images?: string[];
  options?: Option[];
  // analysis failure: what she can do next, and the code to give to the support team
  action?: "retry" | "retake";
  errorCode?: string;
};

// Photos of the products she already uses (camera or gallery), sent to the prescription model only
const MAX_ROUTINE_PHOTOS = 4;

// Gallery photos are often 3-12 MB: shrink them to a JPEG small enough for the server action body limit
// while keeping the labels readable.
function resizeImageFile(file: File, maxSide = 1280, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("canvas"));
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });
}

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
      { label: "Atténuer les taches (Hyperpigmentation)", nextQuestionId: "q_active_acne" },
      { label: "Hydratation & effet Glow", nextQuestionId: "q_active_acne" },
      { label: "Anti-âge & fermeté", nextQuestionId: "q_post_wash" }
    ]
  },
  {
    // Acne comes first: someone who wants to fade spots (or glow) but has active pimples is steered to an
    // acne-calming routine (see analyze-skin.ts). This question is the declared half of that decision;
    // the photo scan is the other half.
    id: "q_active_acne",
    text: "Une précision importante pour bien vous conseiller : avez-vous des boutons actifs ou inflammés en ce moment ?",
    type: "choice",
    options: [
      { label: "Oui, j'ai des boutons actifs ou inflammés", nextQuestionId: "q_lightening" },
      { label: "Non, ma peau est plutôt calme", nextQuestionId: "q_lightening" }
    ]
  },
  {
    // Asked on the spots / glow paths. Current use: no depigmenting active is added on top, and she is advised
    // to talk to a professional (lib/skin-safety.ts reads "actuellement"). An unusual pigmentation seen on the
    // photos leads to a dermatologist referral.
    id: "q_lightening",
    text: "Utilisez-vous, ou avez-vous déjà utilisé, des produits éclaircissants ou « blanchissants » (crèmes, laits ou savons) ?",
    type: "choice",
    options: [
      { label: "Oui, actuellement", nextQuestionId: "q_post_wash" },
      { label: "Oui, par le passé", nextQuestionId: "q_post_wash" },
      { label: "Non, jamais", nextQuestionId: "q_post_wash" }
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
      { label: "Très bien, elle supporte tout", nextQuestionId: "q_pregnancy" },
      { label: "Sensible, parfois des rougeurs", nextQuestionId: "q_pregnancy" },
      { label: "Très réactive et intolérante", nextQuestionId: "q_pregnancy" }
    ]
  },
  {
    // Pregnancy / breastfeeding: some actives are then excluded in code (lib/skin-safety.ts reads "Oui...")
    id: "q_pregnancy",
    text: "Êtes-vous actuellement enceinte ou en train d'allaiter ?",
    type: "choice",
    options: [
      { label: "Oui, enceinte ou allaitante", nextQuestionId: "q_derm_treatment" },
      { label: "Non, ou je ne suis pas concernée", nextQuestionId: "q_derm_treatment" }
    ]
  },
  {
    // Under treatment: no irritating active is added on top, and she is told to check with her doctor
    // (lib/skin-safety.ts reads "Oui...")
    id: "q_derm_treatment",
    text: "Suivez-vous actuellement un traitement prescrit par un médecin pour votre peau (crème, gel ou comprimés contre l'acné, par exemple) ?",
    type: "choice",
    options: [
      { label: "Oui, j'ai un traitement en cours", nextQuestionId: "q_has_allergies" },
      { label: "Non", nextQuestionId: "q_has_allergies" }
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
    text: "À quelle fréquence êtes-vous exposée au soleil dans la journée ?",
    type: "choice",
    options: [
      { label: "Très peu (surtout en intérieur)", nextQuestionId: "q_budget" },
      { label: "Modérément (trajets, balades)", nextQuestionId: "q_budget" },
      { label: "Beaucoup (travail/sport en extérieur)", nextQuestionId: "q_budget" }
    ]
  },
  {
    id: "q_budget",
    text: "Dernière question ! Pour que je puisse adapter mes recommandations de produits à vos attentes, quel budget souhaitez-vous idéalement allouer à votre routine soin ?",
    type: "choice",
    options: [
      { label: "Essentiel (25k - 35k FCFA)", nextQuestionId: "q_finish" },
      { label: "Intermédiaire (35k - 45k FCFA)", nextQuestionId: "q_finish" },
      { label: "Premium (50k+ FCFA)", nextQuestionId: "q_finish" }
    ]
  }
];

// Follow-up questions asked at the end when the photos and the answers disagree, or the photos show
// something she didn't mention (lib/skin-profile.ts). Each one leads to FOLLOWUP_DONE: the next queued
// question, or the analysis.
const FOLLOWUP_DONE = "q_finish_after_followup";
const FOLLOWUP_NODES: QuestionNode[] = FOLLOWUP_QUESTIONS.map((q) => ({
  id: q.id,
  text: q.text,
  type: "choice",
  options: q.options.map((label) => ({ label, nextQuestionId: FOLLOWUP_DONE })),
}));

// ─── Reusable AI Avatar ──────────────────────────────────────────────────────

const AIAvatar = () => (
  <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0" style={{ background: SK.accent }}>
    <IconIA className="w-4 h-4 text-white" />
  </div>
);

// What the analysis screen ticks off while the server works (the gauge follows analysisProgress)
const ANALYSIS_STEPS = ["Lecture de vos 3 photos", "Sébum et pores", "Hydratation et barrière", "Imperfections et taches", "Choix des produits en stock"];

// ─── Progress steps ──────────────────────────────────────────────────────────
const TOTAL_STEPS = 12;

// ─── Component ──────────────────────────────────────────────────────────────

export default function SkinCoachFlow() {
  const { t } = useI18n();
  const router = useRouter();
  const [captures, setCaptures] = useState<CaptureResult | null>(null);
  const [hasCaptured, setHasCaptured] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);

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
  const webcamRef = useRef<Webcam>(null);

  // Product photos waiting to be sent with the "current routine" answer
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const setResult = useSkinCoachStore((state) => state.setResult);
  const setFace = useSkinCoachStore((state) => state.setFace);
  // where the face is on the front photo (capture screen), for the analysis filter of the result page
  const faceMapRef = useRef<FaceMap | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // The flow sits under the announcement bar and navbar: at a full 100dvh its bottom (the answer input)
  // fell below the screen on phones. Size it to the space left under the site header instead.
  const rootRef = useRef<HTMLDivElement>(null);
  const [headerOffset, setHeaderOffset] = useState(0);
  useEffect(() => {
    const measure = () => {
      if (rootRef.current) setHeaderOffset(rootRef.current.getBoundingClientRect().top + window.scrollY);
    };
    measure();
    // the announcement bar gets its text after a fetch, which changes the header height
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

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

  // The photo analysis starts as soon as the photos are taken and runs while she answers the questions;
  // analyzeSkin reuses it at the end (or runs it again if it failed).
  const earlyVisualRef = useRef<Promise<Awaited<ReturnType<typeof analyzeFace>> | null> | null>(null);
  // Answers kept when she has to retake the photos at the end (glasses): the analysis restarts by itself
  const resumeAfterCaptureRef = useRef<UserResponse[] | null>(null);
  // follow-up questions still to ask at the end of the questionnaire
  const followUpQueueRef = useRef<QuestionNode[]>([]);

  const handleCaptureComplete = (result: CaptureResult, frontMap: FaceMap | null) => {
    faceMapRef.current = frontMap;
    setCaptures(result);
    setHasCaptured(true);
    posthog.capture("skin_coach_photos_captured");
    earlyVisualRef.current = analyzeFace(result, photoConsent).catch(() => null);
    const pendingAnswers = resumeAfterCaptureRef.current;
    if (pendingAnswers) {
      resumeAfterCaptureRef.current = null;
      setAnalysisProgress(0);
      setIsGenerating(true);
      executeAnalysis(pendingAnswers, result);
    }
  };

  const handleRetake = () => {
    earlyVisualRef.current = null;
    followUpQueueRef.current = [];
    resumeAfterCaptureRef.current = null;
    setCaptures(null);
    setHasCaptured(false);
    setMessages([]);
    setUserResponses([]);
    setCurrentQuestionId("q_main_goal");
    setProgressPercent(5);
    setStepIndex(0);
    setIsGenerating(false);
    setPendingPhotos([]);
    setPhotoError(null);
  };

  // New photos, same answers (e.g. glasses detected): she doesn't answer the questionnaire again
  const retakePhotosKeepingAnswers = () => {
    posthog.capture("skin_coach_retake_photos");
    resumeAfterCaptureRef.current = userResponses;
    earlyVisualRef.current = null;
    setCaptures(null);
    setHasCaptured(false);
  };

  const showFailure = (failure: { code: string; error: string; retryable: boolean }) => {
    posthog.capture("skin_coach_analysis_failed", { code: failure.code });
    setMessages(prev => [...prev, {
      id: `msg-ai-err-${Date.now()}`,
      sender: "ai",
      text: `${t("Oups, l'analyse n'a pas pu aboutir.")} ${failure.error}`,
      errorCode: failure.code,
      action: failure.retryable ? "retry" : "retake",
    }]);
    setIsGenerating(false);
  };

  const executeAnalysis = async (finalResponses: UserResponse[], photos: CaptureResult | null = captures) => {
    if (!photos) return;
    posthog.capture("skin_coach_questionnaire_completed");
    try {
      const early = earlyVisualRef.current ? await earlyVisualRef.current : null;
      // glasses already seen by the early analysis: no need to ask the server again
      if (early && !early.success && early.code === "GLASSES") return showFailure(early);
      const result = await analyzeSkin(photos, finalResponses, photoConsent, early?.success ? early.visual : undefined, faceMapRef.current);
      if (result.success) {
        posthog.capture("skin_coach_analysis_succeeded", { scan_id: result.data.scan_id, early_visual: !!early?.success });
        rememberPendingScan(result.data.scan_id); // attached to the account as soon as she is logged in
        setResult(result.data);
        setFace(photos.front, faceMapRef.current, result.data.scan_id ?? null); // memory; also saved with the photos
        setAnalysisProgress(100);
        setTimeout(() => {
          router.push("/skin-coach/result");
        }, 600);
      } else {
        showFailure(result);
      }
    } catch (error) {
      console.error(error);
      showFailure({
        code: "NETWORK",
        error: t("Connexion au serveur d'analyse impossible. Vérifiez votre connexion internet : vos photos et vos réponses sont conservées."),
        retryable: true,
      });
    }
  };

  // Same photos, same answers: only the analysis is run again (the early photo analysis is reused when it worked)
  const retryAnalysis = () => {
    posthog.capture("skin_coach_analysis_retry");
    setAnalysisProgress(0);
    setIsGenerating(true);
    executeAnalysis(userResponses);
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

  const addPendingPhotos = (photos: string[]) => {
    setPhotoError(null);
    setPendingPhotos((prev) => {
      const room = MAX_ROUTINE_PHOTOS - prev.length;
      if (photos.length > room) setPhotoError(t(`Vous pouvez ajouter jusqu'à ${MAX_ROUTINE_PHOTOS} photos.`));
      return [...prev, ...photos.slice(0, Math.max(room, 0))];
    });
  };

  const handleGalleryFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const photos: string[] = [];
    let failed = 0;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
        failed++;
        continue;
      }
      try {
        photos.push(await resizeImageFile(file));
      } catch {
        failed++;
      }
    }
    addPendingPhotos(photos);
    if (failed) setPhotoError(t("Certaines photos n'ont pas pu être lues. Essayez avec une photo JPEG ou PNG."));
  };

  // "Current routine" answer: product names and/or photos (camera or gallery), sent together
  const handleRoutineSubmit = (nextQuestionId?: string) => {
    const text = inputText.trim();
    if ((!text && pendingPhotos.length === 0) || !nextQuestionId) return;
    const newResponses: UserResponse[] = [
      ...userResponses,
      ...(text ? [{ questionId: currentQuestionId, answer: text }] : []),
      ...pendingPhotos.map((base64) => ({ questionId: currentQuestionId, answer: { type: "image" as const, base64 } })),
    ];
    setUserResponses(newResponses);
    const now = Date.now();
    setMessages((prev) => [
      ...prev,
      ...(text ? [{ id: `msg-user-${now}`, sender: "user" as const, text }] : []),
      ...(pendingPhotos.length ? [{ id: `msg-user-photos-${now}`, sender: "user" as const, images: pendingPhotos }] : []),
    ]);
    setInputText("");
    setPendingPhotos([]);
    setPhotoError(null);
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

    setTimeout(async () => {
      // End of the questionnaire: the follow-up questions (at most 2, lib/skin-profile.ts) are asked first,
      // then the analysis starts
      if (nextQuestionId === "q_finish") followUpQueueRef.current = await pendingFollowUps(newResponses);
      if ((nextQuestionId === "q_finish" || nextQuestionId === FOLLOWUP_DONE) && followUpQueueRef.current.length) {
        const followUp = followUpQueueRef.current.shift()!;
        posthog.capture("skin_coach_followup_asked", { question: followUp.id });
        setMessages((prev) => [...prev, { id: `msg-ai-${Date.now()}`, sender: "ai", text: followUp.text, options: followUp.options }]);
        setCurrentQuestionId(followUp.id);
        setIsTyping(false);
        return;
      }
      if (nextQuestionId === "q_finish" || nextQuestionId === FOLLOWUP_DONE) {
        setProgressPercent(100);
        setAnalysisProgress(0);
        setIsGenerating(true);
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: `msg-ai-${Date.now()}`, sender: "ai", text: t("Parfait ! Laissez-moi analyser tout ça... Génération de votre routine personnalisée en cours ✨") }
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

  // The photo analysis started after the capture: waited for (at most 45 s) to compare it with the answers
  const pendingFollowUps = async (responses: UserResponse[]): Promise<QuestionNode[]> => {
    if (!earlyVisualRef.current) return [];
    const early = await Promise.race([earlyVisualRef.current, new Promise<null>((r) => setTimeout(() => r(null), 45_000))]);
    if (!early?.success) return [];
    return followUpQuestions(early.visual.result?.metrics, responses)
      .map((q) => FOLLOWUP_NODES.find((n) => n.id === q.id))
      .filter((n): n is QuestionNode => !!n);
  };

  const currentNode = DECISION_TREE.find((n) => n.id === currentQuestionId) || FOLLOWUP_NODES.find((n) => n.id === currentQuestionId);
  const litSegments = Math.round((progressPercent / 100) * 12);
  const analysisStep = analysisProgress >= 100 ? ANALYSIS_STEPS.length : Math.min(ANALYSIS_STEPS.length - 1, Math.floor(analysisProgress / 20));

  return (
    <div
      ref={rootRef}
      className="relative w-full h-[100dvh] overflow-hidden flex flex-col font-sans"
      style={{ background: SK.ground, height: `calc(100dvh - ${headerOffset}px)` }}
    >

      {/* ─── 1. BACKGROUND ─── */}
      <div className={`absolute z-0 ${hasCaptured ? "inset-x-0 top-0 h-[52vh]" : "inset-0"} w-full transition-all duration-700 ease-in-out`} style={{ background: SK.ink }}>

        {!hasCaptured ? (
          <SmartCameraCapture
            onComplete={handleCaptureComplete}
            onCancel={() => router.push("/")}
            onConsent={() => setPhotoConsent(true)}
          />
        ) : (
          <div className="relative w-full h-full flex flex-row">
            <img src={captures?.front} alt={t("Analyse de peau Face")} className="w-1/3 h-full object-cover object-top" />
            <img src={captures?.left} alt={t("Analyse de peau Gauche")} className="w-1/3 h-full object-cover object-top border-l border-white/10" />
            <img src={captures?.right} alt={t("Analyse de peau Droite")} className="w-1/3 h-full object-cover object-top border-l border-white/10" />

            {/* Gradient fade to the light background */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(251,248,249,0.05) 0%, rgba(251,248,249,0.55) 60%, #FBF8F9 100%)" }}
            />

            {/* Scanning line */}
            <motion.div
              className="absolute inset-x-[6%] h-[2px] rounded-full pointer-events-none"
              style={{ background: SK.accent, boxShadow: "0 0 14px 3px rgba(224,24,124,.45)" }}
              animate={{ top: ["10%", "90%", "10%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Labels */}
            <div className="absolute top-5 left-0 right-0 flex justify-around px-2 pointer-events-none">
              {["Face", "Gauche", "Droite"].map((label) => (
                <div key={label} className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: "rgba(42,36,36,0.55)" }}>
                  {t(label)}
                </div>
              ))}
            </div>

            {/* Retake button */}
            <button
              onClick={handleRetake}
              aria-label={t("Refaire le diagnostic")}
              className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center z-50 active:scale-95 transition-transform"
              style={{ background: "rgba(255,255,255,0.92)", color: SK.ink }}
            >
              <ArrowCounterClockwise className="w-[18px] h-[18px]" />
            </button>
          </div>
        )}
      </div>

      {/* ─── 2. CHAT PANEL ─── */}
      {hasCaptured && (
        <div className="relative z-10 flex-1 flex flex-col mt-[12vh] rounded-t-[30px] overflow-hidden"
          style={{ background: SK.ground, borderTop: `1px solid ${SK.lineSoft}`, boxShadow: "0 -8px 40px rgba(42,36,36,0.08)" }}>

          {/* ─── Header: progress ─── */}
          <div className="flex flex-col gap-3 pt-3 pb-4 px-5 shrink-0" style={{ borderBottom: `1px solid ${SK.lineSoft}` }}>
            <div className="w-10 h-1 rounded-full mx-auto" style={{ background: SK.line }} />
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: SK.muted }}>Skin Coach</span>
              <span className="text-[15px] font-semibold" style={{ fontFamily: DISPLAY_FONT, color: SK.ink }}>{t("Questionnaire")}</span>
            </div>
            <div className="grid grid-cols-12 gap-1" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="h-1 rounded-full transition-colors duration-500" style={{ background: i < litSegments ? SK.accent : SK.line }} />
              ))}
            </div>
          </div>

          {/* ─── Messages ─── */}
          <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5 space-y-5 scroll-smooth">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isLastMsg = idx === messages.length - 1;
                const isFollowUp = FOLLOWUP_NODES.some((n) => n.text === msg.text);
                return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className={`flex flex-col w-full ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  {msg.sender === "ai" ? (
                    <div className="flex w-full items-start gap-2.5 max-w-[92%]">
                      <AIAvatar />
                      <div className="flex flex-col gap-1.5 min-w-0">
                        {isFollowUp && (
                          <span className="self-start px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.06em]" style={{ background: SK.tint, color: SK.muted }}>
                            {t("Une précision")}
                          </span>
                        )}
                        <div className="text-[16px] leading-relaxed" style={{ color: SK.ink }}>
                          {msg.text ? t(msg.text) : null}
                          {msg.errorCode && (
                            <span className="block mt-2 text-[12px]" style={{ color: SK.muted }}>
                              {t("Code")} : {msg.errorCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[78%] px-4 py-3 text-[15px] leading-snug font-medium"
                      style={{ background: SK.accent, color: "#FFFFFF", borderRadius: "22px 22px 6px 22px" }}>
                      {msg.images ? (
                        <div className={`grid gap-1.5 ${msg.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                          {msg.images.map((src, i) => (
                            <img key={i} src={src} alt={t("Photo de produit")} className="w-full aspect-square rounded-xl object-cover" />
                          ))}
                        </div>
                      ) : msg.image ? (
                        <img src={msg.image} alt={t("Photo utilisateur")} className="w-full h-auto rounded-xl object-cover" />
                      ) : (
                        msg.text ? t(msg.text) : null
                      )}
                    </div>
                  )}

                  {/* Analysis failure: retry with the same photos and answers, or retake only the photos */}
                  {msg.action && isLastMsg && !isGenerating && (
                    <div className="flex flex-col gap-2 mt-3 ml-10 w-[calc(100%-40px)]">
                      <button
                        onClick={msg.action === "retry" ? retryAnalysis : retakePhotosKeepingAnswers}
                        className="w-full h-[54px] px-4 rounded-full text-[15px] font-bold text-white flex items-center justify-center gap-2"
                        style={{ background: SK.accent }}
                      >
                        {msg.action === "retry"
                          ? <><ArrowCounterClockwise className="w-4 h-4" /> {t("Réessayer l'analyse")}</>
                          : <><Camera className="w-4 h-4" /> {t("Reprendre les photos")}</>}
                      </button>
                      <p className="text-[13px] text-center" style={{ color: SK.muted }}>
                        {t("Vos réponses au questionnaire sont conservées.")}
                      </p>
                    </div>
                  )}

                  {/* Answer options, under the last question */}
                  {msg.sender === "ai" && msg.options && isLastMsg && !isTyping && !isGenerating && (
                    currentNode?.type === "multi_choice" ? (
                      <div className="flex flex-col gap-4 mt-3 ml-10 w-[calc(100%-40px)]">
                        {currentNode.subtitle && (
                          <p className="text-[14px] -mt-1" style={{ color: SK.muted }}>
                            {t(currentNode.subtitle)}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {msg.options.map((option, index) => {
                            const isSelected = selectedMultiChoice.includes(option.label);
                            return (
                              <motion.button
                                key={`${option.label}-${index}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => {
                                  setSelectedMultiChoice((prev) =>
                                    prev.includes(option.label) ? prev.filter((l) => l !== option.label) : [...prev, option.label]
                                  );
                                }}
                                aria-pressed={isSelected}
                                className="min-h-[44px] px-4 py-2 rounded-full text-[14px] font-semibold transition-colors"
                                style={
                                  isSelected
                                    ? { background: SK.accent, color: "#FFFFFF", border: `1px solid ${SK.accent}` }
                                    : { background: SK.surface, color: SK.ink, border: `1px solid ${SK.line}` }
                                }
                              >
                                {t(option.label)}
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
                                placeholder={t("Précisez vos allergies...")}
                                value={otherText}
                                onChange={(e) => setOtherText(e.target.value)}
                                className="w-full mt-1 px-4 h-12 rounded-2xl text-[15px] focus:outline-none"
                                style={{ background: SK.surface, border: `1px solid ${SK.line}`, color: SK.ink }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
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
                            const userMsg: Message = { id: `msg-user-${Date.now()}`, sender: "user", text: finalChoices.map(c => t(c)).join(", ") };
                            setMessages((prev) => [...prev, userMsg]);

                            setSelectedMultiChoice([]);
                            setOtherText("");

                            processNextStep(newResponses, currentNode.nextQuestionId!);
                          }}
                          disabled={selectedMultiChoice.length === 0 || (selectedMultiChoice.includes("Autres (à préciser)") && !otherText.trim())}
                          className="w-full h-[54px] rounded-full text-[15px] font-bold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: SK.accent, color: "#FFFFFF" }}
                        >
                          {t("Valider mes choix")}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5 mt-3 ml-10 w-[calc(100%-40px)]">
                        {msg.options.map((option, index) => (
                          <motion.button
                            key={`${option.label}-${index}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleOptionSelect(option)}
                            className="w-full min-h-[52px] text-left py-3 px-4 rounded-[18px] text-[15px] font-semibold flex items-center justify-between gap-3 transition-colors active:scale-[0.99] hover:border-[#2A2424]"
                            style={{ background: SK.surface, border: `1px solid ${SK.line}`, color: SK.ink }}
                          >
                            <span>{t(option.label)}</span>
                            <CaretRight className="w-4 h-4 shrink-0" style={{ color: SK.muted }} />
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  className="flex w-full items-center gap-2.5"
                >
                  <AIAvatar />
                  <div className="flex items-center gap-1.5 py-2">
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <motion.div key={i}
                        animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay }}
                        className="w-2 h-2 rounded-full"
                        style={{ background: SK.accent }}
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
              style={{ background: SK.surface, borderTop: `1px solid ${SK.lineSoft}` }}
            >
              {currentNode.type === "text_or_photo" && (
                <>
                  {/* Product photos picked so far, sent together with the text */}
                  {pendingPhotos.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto">
                      {pendingPhotos.map((src, i) => (
                        <div key={i} className="relative shrink-0">
                          <img src={src} alt={t("Photo de produit")} className="w-16 h-16 rounded-xl object-cover" style={{ border: `1px solid ${SK.line}` }} />
                          <button
                            onClick={() => setPendingPhotos((prev) => prev.filter((_, j) => j !== i))}
                            aria-label={t("Retirer la photo")}
                            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full text-white flex items-center justify-center shadow"
                            style={{ background: SK.ink }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {photoError && (
                    <p className="text-[13px] mb-2" style={{ color: SK.accent }}>{photoError}</p>
                  )}
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleGalleryFiles(e.target.files);
                      e.target.value = ""; // the same photo can be picked again after removing it
                    }}
                  />
                </>
              )}
              <div className="flex items-center gap-3 relative">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (currentNode.type === "text_or_photo") handleRoutineSubmit(currentNode.nextQuestionId);
                          else handleTextSubmit(inputText, currentNode.nextQuestionId);
                        }
                      }}
                      placeholder={t(currentNode.type === "text_or_photo" ? "Nom des produits, ou ajoutez des photos" : "Votre réponse...")}
                      className={`w-full text-[15px] h-[54px] ${currentNode.type === "text_or_photo" ? 'pl-5 pr-[5.5rem]' : 'pl-5 pr-5'} rounded-full outline-none`}
                      style={{ background: SK.ground, border: `1px solid ${SK.line}`, color: SK.ink }}
                    />
                    {currentNode.type === "text_or_photo" && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center" style={{ color: SK.ink }}>
                        <button
                          onClick={() => galleryInputRef.current?.click()}
                          disabled={pendingPhotos.length >= MAX_ROUTINE_PHOTOS}
                          aria-label={t("Choisir dans la galerie")}
                          className="w-10 h-10 flex items-center justify-center disabled:opacity-30"
                        >
                          <Images className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setShowCamera(true)}
                          disabled={pendingPhotos.length >= MAX_ROUTINE_PHOTOS}
                          aria-label={t("Prendre une photo")}
                          className="w-10 h-10 flex items-center justify-center disabled:opacity-30"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      currentNode.type === "text_or_photo"
                        ? handleRoutineSubmit(currentNode.nextQuestionId)
                        : handleTextSubmit(inputText, currentNode.nextQuestionId)
                    }
                    disabled={!inputText.trim() && !(currentNode.type === "text_or_photo" && pendingPhotos.length > 0)}
                    aria-label={t("Envoyer")}
                    className="w-[54px] h-[54px] rounded-full flex items-center justify-center transition-opacity disabled:opacity-30 active:scale-95"
                    style={{ background: SK.accent }}
                  >
                    <PaperPlaneTilt className="w-5 h-5 text-white" />
                  </button>
                </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ─── Camera Overlay (photos of products she uses) ─── */}
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
                  className="h-11 px-4 rounded-full text-white text-[14px] font-semibold"
                  style={{ background: "rgba(42,36,36,0.55)", border: "1px solid rgba(255,255,255,0.22)" }}
                >
                  {t("Annuler")}
                </button>
              </div>
              <div className="absolute bottom-24 left-0 right-0 flex justify-center items-center">
                <button
                  onClick={() => {
                    const src = webcamRef.current?.getScreenshot();
                    if (src) {
                      addPendingPhotos([src]);
                      setShowCamera(false);
                    }
                  }}
                  aria-label={t("Prendre la photo")}
                  className="w-[76px] h-[76px] rounded-full p-1 active:scale-95 transition-transform"
                  style={{ background: SK.accent }}
                >
                  <span className="block w-full h-full rounded-full bg-white" style={{ border: "4px solid #2A2424" }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Analysis screen ─── */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            key="analysis-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-[100] flex flex-col overflow-y-auto px-6 pt-7 pb-8"
            style={{ background: SK.ground }}
          >
            <div className="w-full max-w-md mx-auto flex flex-col gap-5 flex-1">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: SK.muted }}>Skin Coach</p>
                <h2 className="mt-2" style={{ fontFamily: DISPLAY_FONT, fontSize: 38, lineHeight: 1.05, fontWeight: 300, color: SK.ink, letterSpacing: "-0.01em" }}>
                  {t("Nous lisons")}<br />
                  <span style={{ fontWeight: 700, color: SK.accent }}>{t("votre peau.")}</span>
                </h2>
              </div>

              <div className="flex items-center justify-center py-2">
                <ScanGauge progress={analysisProgress} size={260} />
              </div>

              <div className="rounded-[26px] px-4 py-2.5 flex flex-col gap-1" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
                {ANALYSIS_STEPS.map((label, i) => {
                  const done = i < analysisStep;
                  const current = i === analysisStep;
                  return (
                    <div key={label} className="flex items-center gap-3 min-h-[40px]">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: done ? SK.accent : SK.tint }}>
                        {done ? (
                          <Check className="w-3.5 h-3.5 text-white" weight="bold" />
                        ) : current ? (
                          <span className="w-3.5 h-3.5 rounded-full animate-spin" style={{ border: `2px solid ${SK.ink}`, borderRightColor: "transparent" }} />
                        ) : null}
                      </div>
                      <span className="text-[15px]" style={{ fontWeight: current ? 700 : 500, color: i <= analysisStep ? SK.ink : SK.muted }}>
                        {t(label)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-[14px] leading-relaxed text-center mt-auto" style={{ color: SK.muted }}>
                {t("Une photo peut tromper : vos réponses comptent autant que l'image.")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
