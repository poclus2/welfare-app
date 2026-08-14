"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Camera, ArrowLeft, ArrowRight, Sun, Glasses, X } from "lucide-react";

export type CaptureResult = {
  front: string;
  left: string;
  right: string;
};

interface Props {
  onComplete: (images: CaptureResult) => void;
  onCancel: () => void;
}

export default function SmartCameraCapture({ onComplete, onCancel }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastLuminanceCheckRef = useRef<number>(0);
  const isTooDarkRef = useRef<boolean>(false);

  // States
  const [showIntroModal, setShowIntroModal] = useState(true);
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

    let newFeedback = "";
    let newIsPerfect = false;

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
      onComplete(captures as CaptureResult);
    }
  }, [step, captures, onComplete]);

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-900 overflow-hidden flex flex-col font-sans">
      
      {/* =========================================================
          INTRO MODAL — Full screen popup with preparation checklist
      ========================================================= */}
      <AnimatePresence>
        {showIntroModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.05 }}
              className="bg-[#1a1a2e] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C08A8E] via-pink-400 to-[#C08A8E] rounded-t-3xl" />
              
              {/* Close button */}
              <button
                onClick={onCancel}
                className="absolute top-5 right-5 text-white/40 hover:text-white/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="flex items-center justify-center w-16 h-16 bg-[#C08A8E]/20 rounded-2xl mb-6 mx-auto">
                <Camera className="w-8 h-8 text-[#C08A8E]" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                Avant de commencer
              </h2>
              <p className="text-white/50 text-sm text-center mb-8">
                Pour une analyse précise de votre peau, merci de respecter ces quelques consignes :
              </p>

              {/* Checklist */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-center w-10 h-10 bg-amber-400/20 rounded-xl shrink-0 mt-0.5">
                    <Sun className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Bonne luminosité</p>
                    <p className="text-white/50 text-xs mt-1">
                      Placez-vous près d'une fenêtre ou sous une lumière directe. Évitez les pièces sombres ou le contre-jour.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-400/20 rounded-xl shrink-0 mt-0.5">
                    <Glasses className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Retirez vos lunettes</p>
                    <p className="text-white/50 text-xs mt-1">
                      Les lunettes masquent une partie du visage et faussent l'analyse cutanée par notre IA.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowIntroModal(false)}
                className="w-full py-4 bg-gradient-to-r from-[#C08A8E] to-pink-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-pink-900/30 transition-all"
              >
                Commencer le scan
              </motion.button>

              <p className="text-white/25 text-xs text-center mt-4">
                3 photos seront prises automatiquement par notre IA
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isModelLoading && !showIntroModal ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-slate-700 rounded-full animate-spin border-t-emerald-400" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-white text-xl font-bold mb-2">Calibration de l'IA faciale</h3>
            <p className="text-slate-400 text-sm">Chargement des modèles haute précision...</p>
          </div>
        </div>
      ) : !showIntroModal ? (
        <>
          {/* Header */}
          <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
            <button onClick={onCancel} className="text-white/80 hover:text-white">
              Annuler
            </button>
            <div className="flex gap-2">
              <div className={`w-2 h-2 rounded-full ${step === 'FRONT' ? 'bg-emerald-400' : captures.front ? 'bg-emerald-400' : 'bg-white/30'}`} />
              <div className={`w-2 h-2 rounded-full ${step === 'LEFT' ? 'bg-emerald-400' : captures.left ? 'bg-emerald-400' : 'bg-white/30'}`} />
              <div className={`w-2 h-2 rounded-full ${step === 'RIGHT' ? 'bg-emerald-400' : captures.right ? 'bg-emerald-400' : 'bg-white/30'}`} />
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
            
            {/* Dark overlay with transparent cutout */}
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            
            <div className="relative w-64 h-80 rounded-[4rem] z-10 overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              {/* Ovale Transparent (The cutout) */}
              <div className="w-full h-full bg-transparent" />
              
              {/* Animated borders based on state */}
              <motion.div 
                animate={{ borderColor: isTooDark ? "rgba(239,68,68,1)" : isPerfect ? "rgba(52,211,153,1)" : "rgba(255,255,255,0.4)" }}
                className="absolute inset-0 border-4 rounded-[4rem] transition-colors duration-500"
              />
              
              {/* Scanner Line */}
              {!isPerfect && (
                <motion.div
                  animate={{ y: ["0%", "400%", "0%"] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
                  className="absolute top-0 left-0 right-0 h-1 bg-white/50 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                />
              )}
            </div>

            {/* Arrows for LEFT / RIGHT */}
            {step === "LEFT" && (
              <motion.div 
                animate={{ x: [-10, 10, -10] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/20 p-4 rounded-full backdrop-blur-md"
              >
                <ArrowLeft className="w-8 h-8 text-white" />
              </motion.div>
            )}

            {step === "RIGHT" && (
              <motion.div 
                animate={{ x: [10, -10, 10] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/20 p-4 rounded-full backdrop-blur-md"
              >
                <ArrowRight className="w-8 h-8 text-white" />
              </motion.div>
            )}
          </div>

          {/* Footer Text */}
          <div className="absolute bottom-28 left-0 w-full px-6 flex flex-col items-center z-20 gap-3">
            <motion.div 
              key={feedback}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-6 py-4 rounded-2xl text-center backdrop-blur-md border shadow-xl ${
                isTooDark
                  ? 'bg-red-500/20 border-red-400/50 text-red-100'
                  : isPerfect 
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100' 
                    : 'bg-black/40 border-white/20 text-white'
              }`}
            >
              <p className="font-semibold text-lg">{feedback}</p>
            </motion.div>
          </div>
        </>
      ) : null}
      
      {/* Hidden canvas for luminance calculation */}
      <canvas ref={canvasRef} width={50} height={50} className="hidden" />
    </div>
  );
}
