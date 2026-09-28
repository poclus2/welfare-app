"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Drop, Sparkle } from "@phosphor-icons/react";
import { IconIA } from "@/components/ui/icons/IconIA";
import { GrainOverlay } from "./GrainOverlay";
import { useI18n } from "@/lib/i18n-context";

type Benefit = { icon: React.ComponentType<{ className?: string; weight?: any }>; text: string };

const INGREDIENTS = [
  { label: "Centella Asiatica", top: "14%", left: "8%", delay: 0 },
  { label: "Acide hyaluronique", top: "58%", left: "72%", delay: 0.8 },
  { label: "Niacinamide", top: "80%", left: "12%", delay: 1.6 },
];

export function AuthShowcase({
  headline,
  headlineAccent,
  subtitle,
  benefits,
  variant = "desktop",
}: {
  headline: string;
  headlineAccent: string;
  subtitle: string;
  benefits: Benefit[];
  variant?: "desktop" | "mobile";
}) {
  const { t } = useI18n();

  const isMobile = variant === "mobile";

  return (
    <div
      className={
        isMobile
          ? "relative h-[42vh] min-h-[320px] w-full overflow-hidden rounded-b-[2.5rem]"
          : "relative hidden h-screen w-[52%] overflow-hidden lg:flex lg:flex-col lg:justify-end"
      }
    >
      {/* Photo — slow ken-burns drift */}
      <div className="absolute inset-0">
        <Image
          src="/auth-glow-skincare.png"
          alt="Application d'un soin visage éclat, texture crème sur peau glowy"
          fill
          priority
          sizes={isMobile ? "100vw" : "52vw"}
          className="object-cover object-[68%_20%] auth-kenburns"
        />
      </div>

      {/* Colour wash — brand dark brown to transparent, tinted rose */}
      <div
        className="absolute inset-0"
        style={{
          background: isMobile
            ? "linear-gradient(180deg, rgba(42,36,36,0.55) 0%, rgba(42,36,36,0.15) 45%, rgba(42,36,36,0.75) 100%)"
            : "linear-gradient(115deg, rgba(42,36,36,0.20) 0%, rgba(42,36,36,0.55) 55%, rgba(42,36,36,0.94) 100%)",
        }}
      />
      <div
        className="absolute inset-0 mix-blend-soft-light opacity-70"
        style={{
          background:
            "radial-gradient(circle at 72% 32%, rgba(201,124,133,0.55) 0%, transparent 55%)",
        }}
      />

      <GrainOverlay opacity={isMobile ? 0.04 : 0.06} />

      {/* Pulsing glow at the point of contact on the photo (desktop only — enough room) */}
      {!isMobile && (
        <motion.div
          className="absolute h-40 w-40 rounded-full"
          style={{
            top: "38%",
            left: "63%",
            background: "radial-gradient(circle, rgba(255,236,224,0.55) 0%, transparent 70%)",
          }}
          animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Floating ingredient chips — desktop only, room to breathe */}
      {!isMobile &&
        INGREDIENTS.map((ing) => (
          <motion.div
            key={ing.label}
            className="absolute z-10 hidden items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-md xl:flex"
            style={{ top: ing.top, left: ing.left }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 1, 1, 1], y: [10, 0, -8, 0] }}
            transition={{
              opacity: { duration: 0.8, delay: 0.6 + ing.delay },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 + ing.delay },
            }}
          >
            <Drop weight="fill" className="h-3 w-3 text-[#e8a4ac]" />
            {ing.label}
          </motion.div>
        ))}

      {/* Large rotating botanical watermark, corner */}
      <motion.div
        className="pointer-events-none absolute -bottom-16 -left-16 text-white/[0.06]"
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      >
        <IconIA className={isMobile ? "h-52 w-52" : "h-[26rem] w-[26rem]"} />
      </motion.div>

      {/* Copy */}
      <div className={isMobile ? "relative z-10 px-6 pb-6 pt-10" : "relative z-10 p-12 pb-14"}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/70 backdrop-blur-md">
            <Sparkle weight="fill" className="h-3 w-3 text-[#e8a4ac]" />
            {t("Rituel K-Beauty")}
          </div>
          <h1
            className={
              (isMobile ? "text-[1.75rem] leading-[1.08] " : "text-[2.75rem] leading-[1.05] ") +
              "font-light text-[#F4EAEB]"
            }
            style={{ letterSpacing: "-0.02em" }}
          >
            {t(headline)}
            <br />
            <span className="text-[#e8a4ac]">{t(headlineAccent)}</span>
          </h1>
          {!isMobile && (
            <p className="mt-4 max-w-sm text-base leading-relaxed text-[#F4EAEB]/65">
              {t(subtitle)}
            </p>
          )}
        </motion.div>

        {!isMobile && (
          <div className="mt-8 space-y-3.5">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.12, duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-md">
                  <benefit.icon weight="light" className="h-4 w-4 text-[#e8a4ac]" />
                </div>
                <span className="text-sm text-[#F4EAEB]/80">{t(benefit.text)}</span>
              </motion.div>
            ))}
          </div>
        )}

        {!isMobile && (
          <p className="mt-10 text-[11px] text-[#F4EAEB]/35">
            © {new Date().getFullYear()} The Welfare Shop · {t("Programme Fidélité")}
          </p>
        )}
      </div>
    </div>
  );
}
