"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n-context";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export function OtpCodeInput({
  value,
  onChange,
  onResend,
  autoFocus = true,
}: {
  value: string;
  onChange: (code: string) => void;
  onResend: () => Promise<void> | void;
  autoFocus?: boolean;
}) {
  const { t } = useI18n();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const digits = value.padEnd(CODE_LENGTH, " ").split("").slice(0, CODE_LENGTH);

  const setAllDigits = (next: string[]) => {
    onChange(next.join("").replace(/\s/g, ""));
  };

  const handleChange = (index: number, raw: string) => {
    const d = raw.replace(/\D/g, "");
    if (!d) {
      const next = digits.slice();
      next[index] = "";
      setAllDigits(next);
      return;
    }
    // Handles pasting the full code into a single box.
    if (d.length > 1) {
      const chars = d.slice(0, CODE_LENGTH - index).split("");
      const next = digits.slice();
      chars.forEach((c, i) => {
        next[index + i] = c;
      });
      setAllDigits(next);
      const lastIndex = Math.min(index + chars.length, CODE_LENGTH - 1);
      inputsRef.current[lastIndex]?.focus();
      return;
    }
    const next = digits.slice();
    next[index] = d;
    setAllDigits(next);
    if (index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await onResend();
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={CODE_LENGTH}
            value={d.trim()}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-12 w-11 rounded-xl border border-gray-200 bg-gray-50/50 text-center text-lg font-semibold text-gray-900 transition-all focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
          />
        ))}
      </div>
      <button
        type="button"
        onClick={handleResend}
        disabled={cooldown > 0 || resending}
        className="text-[13px] font-medium text-gray-500 transition-colors hover:text-black disabled:cursor-not-allowed disabled:text-gray-300"
      >
        {cooldown > 0 ? `${t("Renvoyer le code dans")} ${cooldown}s` : t("Renvoyer le code")}
      </button>
    </div>
  );
}
