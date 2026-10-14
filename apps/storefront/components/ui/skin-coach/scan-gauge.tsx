"use client";

import { useId } from "react";
import { DISPLAY_FONT, SK } from "./theme";

// Analysis gauge: a thin ring filling clockwise from just right of 12 o'clock, grey ticks scanning just
// ahead of its end, the percentage in the middle.
const SIZE = 280;
const R = 118;
const C = 2 * Math.PI * R;
const START = 12; // degrees from 12 o'clock
const SWEEP = 336; // a small gap stays at the top at 100 %

export function ScanGauge({ progress, size = SIZE }: { progress: number; size?: number }) {
  const id = useId().replace(/:/g, "");
  const p = Math.max(0, Math.min(100, progress));
  const arc = (p / 100) * (SWEEP / 360) * C;
  const end = START + (p / 100) * SWEEP;
  const ticks =
    p >= 100
      ? []
      : Array.from({ length: 10 }, (_, i) => end + 8 + i * 3.2).filter((a) => a < START + 360 - 8);
  const scale = size / SIZE;

  return (
    <div role="img" aria-label={`Analyse en cours : ${Math.round(p)} %`} style={{ width: size, height: size, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, transformOrigin: "0 0", width: SIZE, height: SIZE }}>
        <div
          className="absolute rounded-full"
          style={{ left: 34, top: 34, width: 212, height: 212, background: "radial-gradient(circle, #FFFFFF 0%, rgba(255,255,255,0) 72%)" }}
        />
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0" aria-hidden="true">
          <defs>
            <linearGradient id={`g${id}`} gradientUnits="userSpaceOnUse" x1="20" y1="260" x2="260" y2="20">
              <stop offset="0" stopColor={SK.accentLight} />
              <stop offset="1" stopColor={SK.accent} />
            </linearGradient>
          </defs>
          <circle
            cx={140}
            cy={140}
            r={R}
            fill="none"
            stroke={`url(#g${id})`}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${C}`}
            transform="rotate(-78 140 140)"
            opacity={p < 0.5 ? 0 : 1}
            style={{ transition: "stroke-dasharray 0.4s ease-out" }}
          />
        </svg>
        {ticks.map((a, i) => {
          const rad = (a * Math.PI) / 180;
          return (
            <div
              key={i}
              className="absolute rounded-sm"
              style={{
                left: 140 + R * Math.sin(rad) - 0.75,
                top: 140 - R * Math.cos(rad) - 8,
                width: 1.5,
                height: 16,
                background: "#9F9095",
                opacity: 0.85 - i * 0.07,
                transform: `rotate(${a}deg)`,
              }}
            />
          );
        })}
        <div className="absolute inset-0 flex items-center justify-center gap-1">
          <span style={{ fontFamily: DISPLAY_FONT, fontSize: 84, fontWeight: 300, lineHeight: 1, letterSpacing: "-0.03em", color: SK.ink }}>
            {Math.round(p)}
          </span>
          <span style={{ fontFamily: DISPLAY_FONT, fontSize: 28, fontWeight: 400, lineHeight: 1, color: SK.ink, alignSelf: "flex-start", marginTop: 104 }}>
            %
          </span>
        </div>
      </div>
    </div>
  );
}
