"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n-context";
import { CountryFlag } from "@/components/ui/country-flag";
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

const CHOICES = [...PHONE_COUNTRIES, findCountry(OTHER_COUNTRY)];

type Props = {
  /** International form ("+237654815887") or "" — what the parent sends to the API */
  value?: string;
  onChange?: (e164: string) => void;
  /** Adds a hidden input carrying the international form, for forms posted as FormData */
  name?: string;
  id?: string;
  required?: boolean;
  autoComplete?: string;
  /** Country button (focus-within: classes give it the same focus ring as the number field) */
  boxClassName?: string;
  boxStyle?: CSSProperties;
  inputClassName?: string;
  inputStyle?: CSSProperties;
};

// Country code on the left (a list with drawn flags: emoji flags show as two letters on Windows),
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
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const emitted = useRef(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
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

  // The list closes on a click elsewhere
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

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

  const openList = () => {
    setActive(Math.max(0, CHOICES.findIndex((c) => c.iso === iso)));
    setOpen(true);
  };

  const choose = (nextIso: string) => {
    setOpen(false);
    handleCountry(nextIso);
  };

  const handleListKey = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + CHOICES.length) % CHOICES.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(CHOICES[active]!.iso);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className="flex gap-2">
      <div ref={pickerRef} className="relative shrink-0">
        <button
          type="button"
          aria-label={`${t("Indicatif pays")} : ${t(country.name)}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={handleListKey}
          className={`flex h-full cursor-pointer items-center gap-1.5 outline-none ${boxClassName}`}
          style={boxStyle}
        >
          <CountryFlag iso={iso} />
          <span className="tabular-nums">+{country.dial}</span>
          <CaretDown
            aria-hidden
            weight="bold"
            className={`h-3 w-3 opacity-40 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <ul
            ref={listRef}
            role="listbox"
            aria-label={t("Indicatif pays")}
            className="absolute left-0 top-full z-50 mt-1.5 max-h-72 w-64 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 text-sm text-gray-900 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          >
            {CHOICES.map((c, i) => (
              <li
                key={c.iso}
                role="option"
                aria-selected={c.iso === iso}
                data-index={i}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(c.iso)}
                className={`flex cursor-pointer items-center gap-2.5 px-3 py-2.5 ${i === active ? "bg-gray-100" : ""} ${
                  c.iso === iso ? "font-medium" : ""
                }`}
              >
                <CountryFlag iso={c.iso} />
                <span className="flex-1 truncate">{t(c.name)}</span>
                {c.dial && <span className="tabular-nums text-gray-400">+{c.dial}</span>}
              </li>
            ))}
          </ul>
        )}
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
