"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { ArrowLeft, ArrowRight, Sun, Eyeglasses, X, Check } from "@phosphor-icons/react";
import { IconIA } from "@/components/ui/icons/IconIA";
import { faceMapFromLandmarks, type FaceMap } from "@/lib/face-map";
import { DISPLAY_FONT, SK } from "@/components/ui/skin-coach/theme";

export type CaptureResult = {
  front: string;
  left: string;
  right: string;
};

interface Props {
  // frontMap: where the face is on the front photo, for the analysis filter of the result page (saved with the photos)
  onComplete: (images: CaptureResult, frontMap: FaceMap | null) => void;
  onCancel: () => void;
  onConsent: () => void; // the customer agreed to the analysis and storage of her photos
}

export default function SmartCameraCapture({ onComplete, onCancel, onConsent }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastLuminanceCheckRef = useRef<number>(0);
  const isTooDarkRef = useRef<boolean>(false);
  // landmarks of the last analysed frame, and the face map taken with the front photo
  const lastLandmarksRef = useRef<{ x: number; y: number }[] | null>(null);
  const frontMapRef = useRef<FaceMap | null>(null);

  // States
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [step, setStep] = useState<"FRONT" | "LEFT" | "RIGHT" | "DONE">("FRONT");
  const [feedback, setFeedback] = useState<string>("Placez votre visage au centre du cadre");
  const [isPerfect, setIsPerfect] = useState(false);
  const [isTooDark, setIsTooDark] = useState(false);
  
  // Results
  const [captures, setCaptures] = useState<Partial<CaptureResult>>({});

  // Initialize MediaPipe FaceLandmarker
  useEffect(() => {
    let isMounted = true;
    const initModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU",
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (isMounted) {
          faceLandmarkerRef.current = faceLandmarker;
          setIsModelLoading(false);
        }
      } catch (error) {
        console.error("Erreur de chargement MediaPipe:", error);
      }
    };

    initModel();
    return () => {
      isMounted = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const captureImage = useCallback((key: keyof CaptureResult) => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCaptures((prev) => ({ ...prev, [key]: imageSrc }));
        if (key === "front" && lastLandmarksRef.current) {
          frontMapRef.current = faceMapFromLandmarks(lastLandmarksRef.current, true);
        }
      }
    }
  }, []);

  const checkLuminance = useCallback((video: HTMLVideoElement) => {
    if (!canvasRef.current) return isTooDarkRef.current;
    const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
    if (!ctx) return isTooDarkRef.current;
    
    ctx.drawImage(video, 0, 0, 50, 50);
    const imageData = ctx.getImageData(0, 0, 50, 50);
    const data = imageData.data;
    
    let sumLuminance = 0;
    for (let i = 0; i < data.length; i += 4) {
      sumLuminance += 0.299 * data[i]! + 0.587 * data[i+1]! + 0.114 * data[i+2]!;
    }
    
    const avgLuminance = sumLuminance / 2500; // 50x50
    const tooDark = avgLuminance < 80;
    
    if (isTooDarkRef.current !== tooDark) {
      isTooDarkRef.current = tooDark;
      setIsTooDark(tooDark);
    }
    
    return tooDark;
  }, []);

  // Animation frame loop
  const processFrame = useCallback(() => {
    const video = webcamRef.current?.video;
    const faceLandmarker = faceLandmarkerRef.current;

    if (!video || !faceLandmarker || video.readyState < 2) {
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const now = performance.now();
    
    // Check luminance every 500ms
    if (now - lastLuminanceCheckRef.current > 500) {
      lastLuminanceCheckRef.current = now;
      checkLuminance(video);
    }

    if (isTooDarkRef.current) {
      setFeedback("⚠️ Endroit trop sombre, rapprochez-vous d'une source de lumière");
      setIsPerfect(false);
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const results = faceLandmarker.detectForVideo(video, now);
    
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      setFeedback("Aucun visage détecté — regardez la caméra");
      setIsPerfect(false);
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const matrix = results.facialTransformationMatrixes?.[0]?.data;
    if (!matrix) {
      setFeedback("Visage détecté — ajustez votre position");
      setIsPerfect(false);
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Extract rotation angles from matrix
    const pitch = Math.atan2(-matrix[9]!, matrix[10]!) * (180 / Math.PI);
    const yaw = Math.asin(Math.max(-1, Math.min(1, matrix[8]!))) * (180 / Math.PI);

    // Calculate face width ratio (bounding box relative to screen)
    const landmarks = results.faceLandmarks[0];
    if (!landmarks) return;
    lastLandmarksRef.current = landmarks;
    const xs = landmarks.map(l => l.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const faceWidthRatio = maxX - minX;

    let newFeedback = "";
    let newIsPerfect = false;

    if (faceWidthRatio < 0.35) {
      newFeedback = "Rapprochez-vous de la caméra";
    } else if (faceWidthRatio > 0.65) {
      newFeedback = "Reculez légèrement";
    } else {
      if (step === "FRONT") {
        const isAligned = Math.abs(yaw) < 8 && Math.abs(pitch) < 10;
        if (isAligned) {
          newFeedback = "✓ Parfait ! Ne bougez plus...";
          newIsPerfect = true;
        } else if (Math.abs(yaw) >= 8) {
          newFeedback = yaw > 0 ? "Tournez légèrement vers la gauche" : "Tournez légèrement vers la droite";
        } else {
          newFeedback = pitch > 0 ? "Baissez légèrement la tête" : "Relevez légèrement la tête";
        }
      } else if (step === "LEFT") {
        // Mirrored webcam: user turning left = positive yaw in image
        const isAligned = yaw > 20 && yaw < 45 && Math.abs(pitch) < 15;
        if (isAligned) {
          newFeedback = "✓ Parfait ! Ne bougez plus...";
          newIsPerfect = true;
        } else {
          newFeedback = "Tournez votre visage vers la gauche (profil ¾)";
        }
      } else if (step === "RIGHT") {
        // Mirrored webcam: user turning right = negative yaw in image
        const isAligned = yaw < -20 && yaw > -45 && Math.abs(pitch) < 15;
        if (isAligned) {
          newFeedback = "✓ Parfait ! Ne bougez plus...";
          newIsPerfect = true;
        } else {
          newFeedback = "Tournez votre visage vers la droite (profil ¾)";
        }
      }
    }

    setFeedback(newFeedback);
    setIsPerfect(newIsPerfect);

    requestRef.current = requestAnimationFrame(processFrame);
  }, [step, checkLuminance]);

  useEffect(() => {
    if (showIntroModal || isModelLoading) return;
    requestRef.current = requestAnimationFrame(processFrame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [processFrame, isModelLoading, showIntroModal]);

  // Capture Trigger Logic (when isPerfect stays true for 1 second)
  useEffect(() => {
    if (!isPerfect) return;

    const timer = setTimeout(() => {
      if (step === "FRONT") {
        captureImage("front");
        setStep("LEFT");
        setIsPerfect(false);
      } else if (step === "LEFT") {
        captureImage("left");
        setStep("RIGHT");
        setIsPerfect(false);
      } else if (step === "RIGHT") {
        captureImage("right");
        setStep("DONE");
        setIsPerfect(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isPerfect, step, captureImage]);

  // Finish flow
  useEffect(() => {
    if (step === "DONE" && captures.front && captures.left && captures.right) {
      onComplete(captures as CaptureResult, frontMapRef.current);
    }
  }, [step, captures, onComplete]);

  const stepIndex = step === "FRONT" ? 0 : step === "LEFT" ? 1 : step === "RIGHT" ? 2 : 3;
  const ovalColor = isTooDark ? "#EF4444" : isPerfect ? SK.accent : "rgba(255,255,255,0.45)";

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden flex flex-col font-sans" style={{ background: "radial-gradient(120% 80% at 50% 30%, #4A3836 0%, #2A2424 70%)" }}>

      {/* =========================================================
          INTRO MODAL — preparation checklist and consent
      ========================================================= */}
      <AnimatePresence>
        {showIntroModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 flex justify-center overflow-y-auto p-4 sm:p-6"
            style={{ background: "rgba(42,36,36,0.72)" }}
          >
            <motion.div
              initial={{ scale: 0.94, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.05 }}
              className="rounded-[30px] p-6 sm:p-8 my-auto max-w-md w-full relative"
              style={{ background: SK.surface }}
            >
              <button
                onClick={onCancel}
                aria-label="Fermer"
                className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center"
                style={{ border: `1px solid ${SK.line}`, color: SK.ink }}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ background: SK.accent }}>
                <IconIA className="w-7 h-7 text-white" />
              </div>

              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: SK.muted }}>Skin Coach</p>
              <h2 className="mb-2" style={{ fontFamily: DISPLAY_FONT, fontSize: 34, lineHeight: 1.05, fontWeight: 300, color: SK.ink }}>
                Avant de <span style={{ fontWeight: 700, color: SK.accent }}>commencer</span>
              </h2>
              <p className="text-[15px] leading-relaxed mb-6" style={{ color: SK.muted }}>
                Pour une analyse précise de votre peau, deux consignes :
              </p>

              <div className="space-y-3 mb-6">
                {[
                  { icon: <Sun className="w-5 h-5" style={{ color: SK.accent }} />, title: "Bonne luminosité", text: "Placez-vous près d'une fenêtre ou sous une lumière directe. Évitez les pièces sombres ou le contre-jour." },
                  { icon: <Eyeglasses className="w-5 h-5" style={{ color: SK.accent }} />, title: "Retirez vos lunettes", text: "Les lunettes masquent une partie du visage et faussent l'analyse." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 rounded-[22px] p-4" style={{ background: SK.ground, border: `1px solid ${SK.lineSoft}` }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: SK.tint }}>{item.icon}</div>
                    <div>
                      <p className="font-bold text-[15px]" style={{ color: SK.ink }}>{item.title}</p>
                      <p className="text-[13px] leading-relaxed mt-1" style={{ color: SK.muted }}>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Consent: required before any photo is taken (analyze-skin.ts refuses without it) */}
              <label className="flex items-start gap-3 mb-6 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 w-5 h-5 shrink-0"
                  style={{ accentColor: SK.accent }}
                />
                <span className="text-[13px] leading-relaxed" style={{ color: SK.muted }}>
                  J'accepte que mes 3 photos et mes réponses soient analysées par l'intelligence artificielle de The Welfare, via nos prestataires d'IA situés hors du Cameroun, pour établir mon diagnostic de peau. Mes photos, et les repères de mon visage qui servent à y afficher l'analyse, sont supprimés sous 2 heures si je ne crée pas de compte, et au bout de 6 mois si je l'enregistre dans mon compte.{" "}
                  <a href="/privacy" target="_blank" rel="noopener" className="underline font-semibold" style={{ color: SK.ink }} onClick={(e) => e.stopPropagation()}>
                    En savoir plus
                  </a>
                </span>
              </label>

              <motion.button
                whileTap={consentChecked ? { scale: 0.98 } : undefined}
                disabled={!consentChecked}
                onClick={() => {
                  if (!consentChecked) return;
                  onConsent();
                  setShowIntroModal(false);
                }}
                className="w-full h-[60px] font-bold text-[16px] rounded-full transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: SK.accent, color: "#FFFFFF" }}
              >
                Commencer le scan
              </motion.button>

              <p className="text-[13px] text-center mt-4" style={{ color: SK.muted }}>
                3 photos seront prises automatiquement
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isModelLoading && !showIntroModal ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="w-20 h-20 rounded-full animate-spin" style={{ border: "4px solid rgba(255,255,255,0.15)", borderTopColor: SK.accent }} />
          <div className="text-center">
            <h3 className="text-white mb-2" style={{ fontFamily: DISPLAY_FONT, fontSize: 26, fontWeight: 300 }}>
              Préparation <span style={{ fontWeight: 700 }}>de la caméra</span>
            </h3>
            <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.75)" }}>Chargement de la détection du visage…</p>
          </div>
        </div>
      ) : !showIntroModal ? (
        <>
          {/* Header */}
          <div className="absolute top-0 left-0 w-full px-4 pt-4 pb-6 z-20 flex flex-col gap-3" style={{ background: "linear-gradient(180deg, rgba(42,36,36,0.7), transparent)" }}>
            <div className="flex items-center justify-between">
              <button onClick={onCancel} className="h-11 px-4 rounded-full text-white text-[14px] font-semibold" style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)" }}>
                Annuler
              </button>
              <span className="text-white text-[15px] font-semibold" style={{ fontFamily: DISPLAY_FONT }}>{Math.min(stepIndex + 1, 3)}/3</span>
            </div>
            <div className="flex gap-2">
              {["Face", "Profil gauche", "Profil droit"].map((label, i) => {
                const active = i === stepIndex;
                const done = i < stepIndex;
                return (
                  <div
                    key={label}
                    className="flex-1 h-10 rounded-full flex items-center justify-center gap-1.5 text-[13px] font-semibold"
                    style={{
                      background: active ? SK.accent : done ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.14)",
                      color: active ? "#FFFFFF" : done ? SK.ink : "rgba(255,255,255,0.85)",
                      border: active || done ? "none" : "1px solid rgba(255,255,255,0.22)",
                    }}
                  >
                    {done && <Check className="w-3.5 h-3.5" weight="bold" />}
                    {label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Camera Feed */}
          <div className="relative flex-1 flex items-center justify-center">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.5}
              videoConstraints={{ facingMode: "user" }}
              mirrored={true}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />

            <div className="relative w-64 h-80 rounded-[50%] z-10" style={{ boxShadow: "0 0 0 9999px rgba(42,36,36,0.55)" }}>
              {/* glow when the face is well placed */}
              <motion.div
                className="absolute -inset-3 rounded-[50%] pointer-events-none"
                style={{ background: SK.accent, filter: "blur(22px)" }}
                animate={{ opacity: isPerfect ? [0.35, 0.7, 0.35] : 0 }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              <motion.div
                animate={{ borderColor: ovalColor }}
                className="absolute inset-0 rounded-[50%] transition-colors duration-500"
                style={{ borderWidth: 3, borderStyle: "solid" }}
              />
              {!isPerfect && (
                <div className="absolute inset-0 rounded-[50%] overflow-hidden">
                  <motion.div
                    animate={{ top: ["10%", "88%", "10%"] }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                    className="absolute rounded-full"
                    style={{ left: "10%", right: "10%", height: 2, background: SK.accent, boxShadow: "0 0 16px 4px rgba(224,24,124,.45)" }}
                  />
                </div>
              )}
            </div>

            {/* Arrows for LEFT / RIGHT */}
            {step === "LEFT" && (
              <motion.div
                animate={{ x: [-10, 10, -10] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full z-20"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >
                <ArrowLeft className="w-8 h-8 text-white" />
              </motion.div>
            )}
            {step === "RIGHT" && (
              <motion.div
                animate={{ x: [10, -10, 10] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full z-20"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >
                <ArrowRight className="w-8 h-8 text-white" />
              </motion.div>
            )}
          </div>

          {/* Instruction */}
          <div className="absolute left-4 right-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-20">
            <motion.div
              key={feedback}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 py-4 rounded-[22px] text-white"
              style={{
                background: isTooDark ? "rgba(239,68,68,0.3)" : isPerfect ? "rgba(224,24,124,0.35)" : "rgba(255,255,255,0.12)",
                border: `1px solid ${isTooDark ? "rgba(248,113,113,0.6)" : isPerfect ? "rgba(224,24,124,0.7)" : "rgba(255,255,255,0.2)"}`,
              }}
            >
              <p style={{ fontFamily: DISPLAY_FONT, fontSize: 21, lineHeight: 1.2, fontWeight: 600 }}>{feedback}</p>
              <p className="mt-1 text-[13px]" style={{ color: "rgba(255,255,255,0.82)" }}>Prise automatique dès que le visage est stable</p>
            </motion.div>
          </div>
        </>
      ) : null}

      {/* Hidden canvas for luminance calculation */}
      <canvas ref={canvasRef} width={50} height={50} className="hidden" />
    </div>
  );
}
