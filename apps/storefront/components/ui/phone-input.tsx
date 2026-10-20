"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n-context";
import {
  OTHER_COUNTRY,
  PHONE_COUNTRIES,
  findCountry,
  formatNational,
  isPlausibleNational,
  nationalDigits,
  splitInternational,
  splitPhone,
  toE164,
} from "@/lib/phone";

type Props = {
  /** International form ("+237654815887") or "" — what the parent sends to the API */
  value?: string;
  onChange?: (e164: string) => void;
  /** Adds a hidden input carrying the international form, for forms posted as FormData */
  name?: string;
  id?: string;
  required?: boolean;
  autoComplete?: string;
  /** Country box; its focus ring needs focus-within: classes (the select inside is invisible) */
  boxClassName?: string;
  boxStyle?: CSSProperties;
  inputClassName?: string;
  inputStyle?: CSSProperties;
};

// Country code on the left (a native select under a "🇨🇲 +237" face, so phones show their own picker),
// national number on the right. Pasting a full number ("+237 6…", "00237…", "237 6…") picks the country.
export function PhoneInput({
  value,
  onChange,
  name,
  id,
  required,
  autoComplete = "tel-national",
  boxClassName = "",
  boxStyle,
  inputClassName = "",
  inputStyle,
}: Props) {
  const { t } = useI18n();
  const [iso, setIso] = useState(() => splitPhone(value ?? "").iso);
  const [text, setText] = useState(() => {
    const s = splitPhone(value ?? "");
    return formatNational(s.iso, s.national);
  });
  const emitted = useRef(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const country = findCountry(iso);
  const e164 = toE164(iso, text);

  // The parent replaced the value (e.g. a number read from the URL after mount)
  useEffect(() => {
    if (value === undefined || value === emitted.current) return;
    const s = splitPhone(value);
    setIso(s.iso);
    setText(formatNational(s.iso, s.national));
    emitted.current = value;
  }, [value]);

  useEffect(() => {
    inputRef.current?.setCustomValidity(
      text.trim() && !isPlausibleNational(iso, text) ? t("Ce numéro ne semble pas complet pour ce pays.") : ""
    );
  }, [iso, text, t]);

  const update = (nextIso: string, nextText: string) => {
    setIso(nextIso);
    setText(nextText);
    const next = toE164(nextIso, nextText);
    emitted.current = next;
    onChange?.(next);
  };

  const handleText = (raw: string) => {
    // A number written with its code: "+237…", "00237…", or anything typed under "Autre indicatif"
    if (/^\s*(\+|00)/.test(raw) || iso === OTHER_COUNTRY) {
      const intl = splitInternational(raw, iso === OTHER_COUNTRY);
      if (intl && intl.iso !== OTHER_COUNTRY) return update(intl.iso, intl.national);
      return update(OTHER_COUNTRY, (intl?.national ?? "").slice(0, 15));
    }
    // A Cameroonian number pasted with its code but no "+"
    const d = raw.replace(/\D/g, "");
    if (iso === "CM" && d.length === 12 && d.startsWith("237")) return update("CM", formatNational("CM", d.slice(3)));
    update(iso, raw.replace(/[^\d ]/g, "").slice(0, 20));
  };

  const handleCountry = (nextIso: string) => {
    // Switching to "Autre indicatif" keeps the number: its code moves into the field
    const nextText =
      nextIso === OTHER_COUNTRY && iso !== OTHER_COUNTRY && nationalDigits(iso, text)
        ? `${country.dial}${nationalDigits(iso, text)}`
        : text;
    update(nextIso, nextText);
    inputRef.current?.focus();
  };

  return (
    <div className="flex gap-2">
      <div className={`relative flex shrink-0 items-center gap-1.5 ${boxClassName}`} style={boxStyle}>
        <span aria-hidden className="text-base leading-none">{country.flag}</span>
        <span aria-hidden className="tabular-nums">+{country.dial}</span>
        <CaretDown aria-hidden weight="bold" className="h-3 w-3 opacity-40" />
        <select
          aria-label={t("Indicatif pays")}
          value={iso}
          onChange={(e) => handleCountry(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {`${c.flag} ${t(c.name)} (+${c.dial})`}
            </option>
          ))}
          <option value={OTHER_COUNTRY}>{`🌐 ${t("Autre indicatif")}`}</option>
        </select>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        required={required}
        value={text}
        onChange={(e) => handleText(e.target.value)}
        onBlur={() => iso !== OTHER_COUNTRY && setText(formatNational(iso, text))}
        placeholder={iso === OTHER_COUNTRY ? t("Indicatif et numéro") : country.placeholder ?? ""}
        className={`min-w-0 flex-1 ${inputClassName}`}
        style={inputStyle}
      />
      {name && <input type="hidden" name={name} value={e164} />}
    </div>
  );
}
