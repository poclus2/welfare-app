"use client";

/**
 * Fixed SVG-noise overlay to break the flatness of the gradient/photo panels
 * on the auth pages. Pure SVG (feTurbulence) — no external asset.
 */
export function GrainOverlay({ opacity = 0.05 }: { opacity?: number }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full mix-blend-overlay"
      style={{ opacity }}
      aria-hidden="true"
    >
      <filter id="auth-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#auth-grain)" />
    </svg>
  );
}
