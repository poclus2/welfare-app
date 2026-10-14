"use client";

import { useEffect, useId, useState } from "react";
import { DISPLAY_FONT, SK } from "./theme";

// A qualitative level as a ring (no score shown, owner's decision): thirds = how much of the ring is filled.
const R = 52;
const C = 2 * Math.PI * R;

export function LevelRing({ thirds, label, delay = 0 }: { thirds: 1 | 2 | 3; label: string; delay?: number }) {
  const id = useId().replace(/:/g, "");
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFilled(true), 150 + delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);
  const arc = filled ? (thirds / 3) * C : 0;

  return (
    <div className="relative" style={{ width: 124, height: 124 }}>
      <svg width="124" height="124" viewBox="0 0 124 124" className="absolute inset-0" aria-hidden="true">
        <defs>
          <linearGradient id={`r${id}`} gradientUnits="userSpaceOnUse" x1="10" y1="114" x2="114" y2="10">
            <stop offset="0" stopColor={SK.accentLight} />
            <stop offset="1" stopColor={SK.accent} />
          </linearGradient>
        </defs>
        <circle cx="62" cy="62" r={R} fill="none" stroke={SK.track} strokeWidth="9" />
        <circle
          cx="62"
          cy="62"
          r={R}
          fill="none"
          stroke={`url(#r${id})`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${C}`}
          transform="rotate(-90 62 62)"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-center"
        style={{ padding: "0 22px", fontFamily: DISPLAY_FONT, fontSize: 17, lineHeight: 1.1, fontWeight: 600, color: SK.ink }}
      >
        {label}
      </div>
    </div>
  );
}
