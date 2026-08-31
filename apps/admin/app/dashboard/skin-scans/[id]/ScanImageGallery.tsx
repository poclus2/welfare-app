"use client";

import { useState } from "react";
import { ScanFace } from "lucide-react";

export function ScanImageGallery({ images }: { images: any }) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  if (!images || (!images.front && !images.left && !images.right)) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#EDE0E0] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#C08A8E]/10 flex items-center justify-center">
            <ScanFace className="w-4 h-4 text-[#C08A8E]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#2A2424]">Photos du Scan</h2>
            <p className="text-xs text-[#2A2424]/40">3 angles capturés par l&apos;IA faciale</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: "front", label: "Face" },
            { key: "left", label: "Profil Gauche" },
            { key: "right", label: "Profil Droit" },
          ].map(({ key, label }) => {
            const src = images[key];
            return (
              <div key={key} className="flex flex-col gap-2">
                <div 
                  className={`aspect-[3/4] rounded-xl overflow-hidden bg-[#F5F0EB] border border-[#EDE0E0] ${src ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                  onClick={() => src && setZoomedImage(src)}
                >
                  {src ? (
                    <img
                      src={src}
                      alt={label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ScanFace className="w-8 h-8 text-[#2A2424]/20" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-[#2A2424]/50 text-center">{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Zoom */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2A2424]/90 backdrop-blur-sm p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-5xl max-h-screen w-full h-full flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full px-4 py-2 text-sm font-bold transition-colors"
              onClick={() => setZoomedImage(null)}
            >
              Fermer
            </button>
            <img 
              src={zoomedImage} 
              alt="Zoom" 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
