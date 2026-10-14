"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { FaceMap, FaceZone } from "@/lib/face-map";
import { SK } from "./theme";

export type FaceMarker = { zone: FaceZone; title: string; text: string };

// The front photo with the analysis filter: the face mesh as dots, a sweeping scan line, viewfinder corners
// and a few labelled zones. The photo is framed on the face (landmarks from the capture screen), and every
// overlay is placed with the same transform, so the dots stay on her face whatever the phone's camera.
export function FaceScanFrame({ photo, map, markers, height = 430 }: { photo: string; map: FaceMap; markers: FaceMarker[]; height?: number }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // image size and position: the face takes ~60 % of the frame's height, centred, the photo always covers the frame
  let layout: { s: number; tx: number; ty: number } | null = null;
  if (natural && width) {
    const { w: iw, h: ih } = natural;
    const faceH = (map.box.y1 - map.box.y0) * ih;
    const s = Math.max((0.6 * height) / faceH, width / iw, height / ih);
    const cx = ((map.box.x0 + map.box.x1) / 2) * iw * s;
    const cy = ((map.box.y0 + map.box.y1) / 2) * ih * s;
    const clamp = (v: number, min: number) => Math.min(0, Math.max(min, v));
    layout = { s, tx: clamp(width / 2 - cx, width - iw * s), ty: clamp(height * 0.54 - cy, height - ih * s) };
  }
  const toPx = ([x, y]: [number, number]) =>
    layout && natural ? { left: layout.tx + x * natural.w * layout.s, top: layout.ty + y * natural.h * layout.s } : { left: 0, top: 0 };

  return (
    <div
      ref={boxRef}
      role="img"
      aria-label={`Votre photo de face, avec les zones observées : ${markers.map((m) => m.title).join(", ")}`}
      className="relative overflow-hidden"
      style={{ height, borderRadius: 30, background: "#2A2424" }}
    >
      <img
        src={photo}
        alt=""
        onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        className="absolute max-w-none"
        style={
          layout && natural
            ? { left: layout.tx, top: layout.ty, width: natural.w * layout.s, height: natural.h * layout.s }
            : { inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0 }
        }
      />

      {layout && (
        <>
          {/* face mesh */}
          <motion.svg
            className="absolute inset-0 pointer-events-none"
            width="100%"
            height="100%"
            aria-hidden="true"
            animate={{ opacity: [0.35, 0.8, 0.35] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            {map.mesh.map((p, i) => {
              const { left, top } = toPx(p);
              return <circle key={i} cx={left} cy={top} r={1.2} fill="#FFFFFF" />;
            })}
          </motion.svg>

          {/* scan line */}
          <motion.div
            className="absolute inset-x-0 pointer-events-none"
            style={{ height: 70, background: "linear-gradient(180deg, rgba(224,24,124,0) 0%, rgba(224,24,124,.22) 100%)" }}
            animate={{ top: [-40, height - 40] }}
            transition={{ duration: 3.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          >
            <div
              className="absolute bottom-0 rounded-full"
              style={{ left: "6%", right: "6%", height: 2, background: SK.accent, boxShadow: "0 0 14px 3px rgba(224,24,124,.55)" }}
            />
          </motion.div>

          {/* zones */}
          {markers.map((m) => {
            const { left, top } = toPx(map.zones[m.zone]);
            // forehead and nose: label beside the point; cheeks and chin: label under it, so the labels of
            // points on the same line (nose / cheek) never cover each other
            const LABEL_W = 170;
            const below = m.zone !== "forehead" && m.zone !== "nose";
            const labelOnLeft = width - left - 14 < LABEL_W;
            const labelStyle = below
              ? { top: top + 24, left: Math.min(Math.max(8, left - 40), width - LABEL_W - 8) }
              : { top: top - 16, ...(labelOnLeft ? { right: width - left + 14 } : { left: left + 14 }) };
            return (
              <div key={m.zone}>
                <div className="absolute" style={{ left: left - 5, top: top - 5, width: 10, height: 10 }}>
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{ background: SK.accent }}
                    animate={{ scale: [1, 2.6], opacity: [0.7, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  />
                  <span className="absolute rounded-full" style={{ inset: 1, background: "#FFFFFF", border: `2px solid ${SK.accent}` }} />
                </div>
                <div
                  className="absolute rounded-[14px] px-[11px] py-[7px] text-[12px] leading-tight whitespace-nowrap"
                  style={{ ...labelStyle, background: "rgba(255,255,255,.92)", color: SK.ink }}
                >
                  <div className="font-bold">{m.title}</div>
                  <div>{m.text}</div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* viewfinder corners */}
      {[
        "left-[14px] top-[14px] border-l-2 border-t-2 rounded-tl-lg",
        "right-[14px] top-[14px] border-r-2 border-t-2 rounded-tr-lg",
        "left-[14px] bottom-[14px] border-l-2 border-b-2 rounded-bl-lg",
        "right-[14px] bottom-[14px] border-r-2 border-b-2 rounded-br-lg",
      ].map((c) => (
        <div key={c} className={`absolute w-[26px] h-[26px] border-white ${c}`} />
      ))}

      <div
        className="absolute left-1/2 top-[22px] -translate-x-1/2 flex items-center gap-2 px-3 py-[7px] rounded-full text-white text-[12px] font-bold whitespace-nowrap"
        style={{ background: "rgba(42,36,36,.55)" }}
      >
        <span className="w-[7px] h-[7px] rounded-full" style={{ background: SK.accent }} />
        Photo de face · analysée
      </div>
    </div>
  );
}
