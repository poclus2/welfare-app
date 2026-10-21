import { Globe } from "@phosphor-icons/react";

// Small flags drawn inline for the phone country picker: emoji flags show as two letters on Windows,
// and the list must not load images from a third-party site. Simplified (no coats of arms).

function star(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.4;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return points.join(" ");
}

const vertical = (a: string, b: string, c: string) => (
  <>
    <rect width="10" height="20" fill={a} />
    <rect x="10" width="10" height="20" fill={b} />
    <rect x="20" width="10" height="20" fill={c} />
  </>
);

const horizontal = (a: string, b: string, c: string) => (
  <>
    <rect width="30" height="6.67" fill={a} />
    <rect y="6.67" width="30" height="6.67" fill={b} />
    <rect y="13.33" width="30" height="6.67" fill={c} />
  </>
);

const FLAGS: Record<string, React.ReactNode> = {
  CM: (
    <>
      {vertical("#007A5E", "#CE1126", "#FCD116")}
      <polygon points={star(15, 10, 3.6)} fill="#FCD116" />
    </>
  ),
  GA: horizontal("#009E60", "#FCD116", "#3A75C4"),
  CG: (
    <>
      <rect width="30" height="20" fill="#FBDE4A" />
      <polygon points="0,0 20,0 0,20" fill="#009543" />
      <polygon points="30,0 30,20 10,20" fill="#DC241F" />
    </>
  ),
  TD: vertical("#002664", "#FECB00", "#C60C30"),
  CF: (
    <>
      <rect width="30" height="5" fill="#003082" />
      <rect y="5" width="30" height="5" fill="#FFFFFF" />
      <rect y="10" width="30" height="5" fill="#289728" />
      <rect y="15" width="30" height="5" fill="#FFCE00" />
      <rect x="12.5" width="5" height="20" fill="#D21034" />
      <polygon points={star(6, 2.5, 2)} fill="#FFCE00" />
    </>
  ),
  GQ: (
    <>
      {horizontal("#3E9A00", "#FFFFFF", "#E32118")}
      <polygon points="0,0 8,10 0,20" fill="#0073CE" />
    </>
  ),
  NG: vertical("#008751", "#FFFFFF", "#008751"),
  CI: vertical("#F77F00", "#FFFFFF", "#009E60"),
  SN: (
    <>
      {vertical("#00853F", "#FDEF42", "#E31B23")}
      <polygon points={star(15, 10, 3.6)} fill="#00853F" />
    </>
  ),
  FR: vertical("#002654", "#FFFFFF", "#CE1126"),
  BE: vertical("#000000", "#FDDA24", "#EF3340"),
  CH: (
    <>
      <rect width="30" height="20" fill="#DA291C" />
      <rect x="13" y="4" width="4" height="12" fill="#FFFFFF" />
      <rect x="9" y="8" width="12" height="4" fill="#FFFFFF" />
    </>
  ),
  GB: (
    <>
      <rect width="30" height="20" fill="#012169" />
      <path d="M0,0 30,20 M30,0 0,20" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M0,0 30,20 M30,0 0,20" stroke="#C8102E" strokeWidth="1.5" />
      <path d="M15,0 V20 M0,10 H30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="3.5" />
    </>
  ),
  US: (
    <>
      <rect width="30" height="20" fill="#FFFFFF" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#B22234" />
      ))}
      <rect width="13" height={(7 * 20) / 13} fill="#3C3B6E" />
    </>
  ),
};

export function CountryFlag({ iso, className = "" }: { iso: string; className?: string }) {
  const flag = FLAGS[iso];
  if (!flag) return <Globe aria-hidden weight="light" className={`h-[14px] w-5 shrink-0 ${className}`} />;
  return (
    <svg
      aria-hidden
      viewBox="0 0 30 20"
      className={`h-[14px] w-5 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/10 ${className}`}
      preserveAspectRatio="none"
    >
      {flag}
    </svg>
  );
}
