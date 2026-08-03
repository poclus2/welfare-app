"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { motion } from "framer-motion";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Loader2, Camera, Check, RefreshCw, ArrowLeft, ArrowRight } from "lucide-react";

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

  // States
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [step, setStep] = useState<"FRONT" | "LEFT" | "RIGHT" | "DONE">("FRONT");
  const [feedback, setFeedback] = useState<string>("Placez votre visage au centre du cadre");
  const [isPerfect, setIsPerfect] = useState(false);
  
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

  // Process Video Frames
  const detectFace = useCallback(() => {
    if (!faceLandmarkerRef.current || !webcamRef.current?.video || step === "DONE") return;

    const video = webcamRef.current.video;
    if (video.readyState !== 4) {
      requestRef.current = requestAnimationFrame(detectFace);
      return;
    }

    try {
      const startTimeMs = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

      if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0 && results.facialTransformationMatrixes[0]) {
        const matrix = results.facialTransformationMatrixes[0].data;
        
        // Extract Yaw and Pitch (simplified from rotation matrix)
        // matrix[8], matrix[9], matrix[10] corresponds to the 3rd column of the 4x4 matrix
        // The rotation matrix is a 3x3 subset in the 4x4 matrix
        // R31 = matrix[2], R32 = matrix[6], R33 = matrix[10] ? Actually MediaPipe uses column-major:
        // [ m00, m10, m20, m30, m01, m11, m21, m31, m02, m12, m22, m32, m03, m13, m23, m33 ]
        // Indices: 0-15.
        // Yaw = atan2(-m20, sqrt(m21^2 + m22^2)) -> atan2(-matrix[8], sqrt(matrix[9]**2 + matrix[10]**2))
        const m20 = matrix[2];
        const m21 = matrix[6];
        const m22 = matrix[10];
        
        // Yaw is rotation around Y axis (Left/Right)
        const yaw = Math.atan2(m20, Math.sqrt(m21 * m21 + m22 * m22)) * (180 / Math.PI);
        // Pitch is rotation around X axis (Up/Down)
        const pitch = Math.atan2(-m21, m22) * (180 / Math.PI);

        // State Machine
        if (step === "FRONT") {
          if (Math.abs(yaw) < 10 && Math.abs(pitch) < 15) {
            setFeedback("Parfait ! Restez immobile...");
            setIsPerfect(true);
          } else {
            setFeedback("Regardez bien droit vers l'objectif");
            setIsPerfect(false);
          }
        } else if (step === "LEFT") {
          if (yaw > 25) { // Tourné vers la gauche (du point de vue de l'utilisateur, face à la caméra)
            setFeedback("Parfait !");
            setIsPerfect(true);
          } else {
            setFeedback("Tournez doucement la tête vers la GAUCHE");
            setIsPerfect(false);
          }
        } else if (step === "RIGHT") {
          if (yaw < -25) {
            setFeedback("Parfait !");
            setIsPerfect(true);
          } else {
            setFeedback("Maintenant, tournez la tête vers la DROITE");
            setIsPerfect(false);
          }
        }
      } else {
        setFeedback("Visage non détecté");
        setIsPerfect(false);
      }
    } catch (e) {
      console.error(e);
    }

    requestRef.current = requestAnimationFrame(detectFace);
  }, [step]);

  // Start Detection Loop
  useEffect(() => {
    if (!isModelLoading) {
      requestRef.current = requestAnimationFrame(detectFace);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isModelLoading, detectFace]);

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
      
      {isModelLoading ? (
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
      ) : (
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
                animate={{ borderColor: isPerfect ? "rgba(52,211,153,1)" : "rgba(255,255,255,0.4)" }}
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
          <div className="absolute bottom-12 left-0 w-full px-6 flex flex-col items-center z-20">
            <motion.div 
              key={feedback}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-6 py-4 rounded-2xl text-center backdrop-blur-md border shadow-xl ${
                isPerfect 
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100' 
                  : 'bg-black/40 border-white/20 text-white'
              }`}
            >
              <p className="font-semibold text-lg">{feedback}</p>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
