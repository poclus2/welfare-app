"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n-context";
import Link from "next/link";
import Image from "next/image";

type Benefit = { icon: React.ComponentType<{ className?: string; weight?: any }>; text: string };

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

  if (isMobile) {
    return (
      <div className="relative w-full overflow-hidden bg-[#1a1515] px-6 py-12">
        {/* Subtle atmospheric glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#c97c85] opacity-20 blur-[80px]"></div>
        
        <div className="relative z-10">
          <Link 
            href="/" 
            className="mb-8 inline-flex h-24 w-24 items-center justify-center rounded-full bg-white p-3 shadow-lg transition-transform hover:scale-105"
          >
            <Image 
              src="/logo.webp" 
              alt="The Welfare Shop" 
              width={160} 
              height={160} 
              className="h-full w-full object-contain" 
              priority
            />
          </Link>
          <h1 className="mb-3 text-3xl font-light leading-tight tracking-tight text-[#F4EAEB]">
            {t(headline)} <span className="font-medium text-[#c97c85]">{t(headlineAccent)}</span>
          </h1>
          <p className="text-sm text-[#F4EAEB]/70">{t(subtitle)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative hidden h-screen w-1/2 flex-col justify-between overflow-hidden bg-[#1a1515] p-16 lg:flex xl:p-20">
      {/* Background atmospheric glows */}
      <div className="auth-orb-drift pointer-events-none absolute -right-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-[#c97c85] opacity-[0.15] mix-blend-screen blur-[120px]"></div>
      <div className="pointer-events-none absolute -bottom-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-[#e8a4ac] opacity-5 blur-[150px]"></div>

      {/* Top: Logo */}
      <div className="relative z-10">
        <Link 
          href="/" 
          className="inline-flex h-32 w-32 items-center justify-center rounded-full bg-white p-4 shadow-xl transition-transform hover:scale-105"
        >
          <Image 
            src="/logo.webp" 
            alt="The Welfare Shop" 
            width={200} 
            height={200} 
            className="h-full w-full object-contain" 
            priority
          />
        </Link>
      </div>

      {/* Middle: Copy & Benefits */}
      <div className="relative z-10 max-w-[480px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="mb-6 text-5xl font-light leading-[1.1] tracking-tight text-[#F4EAEB]">
            {t(headline)} <br />
            <span className="font-normal italic text-[#c97c85]">{t(headlineAccent)}</span>
          </h1>
          <p className="text-lg font-light leading-relaxed text-[#F4EAEB]/60">
            {t(subtitle)}
          </p>
        </motion.div>

        <div className="mt-12 space-y-6">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_0_20px_rgba(201,124,133,0.05)] backdrop-blur-md">
                <benefit.icon weight="light" className="h-5 w-5 text-[#c97c85]" />
              </div>
              <span className="text-[15px] font-light text-[#F4EAEB]/80">{t(benefit.text)}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom: Footer link */}
      <div className="relative z-10">
        <p className="text-xs font-light text-[#F4EAEB]/40">
          © {new Date().getFullYear()} The Welfare Shop. {t("Tous droits réservés.")}
        </p>
      </div>
    </div>
  );
}
