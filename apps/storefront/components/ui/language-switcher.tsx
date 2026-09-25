"use client";

import { useState } from "react";
import { Globe } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n-context";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (newLocale: string) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  const languages = [
    { code: "fr", label: "FR" },
    { code: "en", label: "EN" }
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 text-sm font-medium text-[#2A2424] hover:bg-[#F1EFEA] rounded-full transition-colors"
        aria-label="Changer de langue"
      >
        <Globe weight="light" className="w-5 h-5" />
        <span className="uppercase">{locale}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-24 bg-white rounded-xl shadow-lg border border-[#F4EAEB] overflow-hidden z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  locale === lang.code 
                    ? "bg-[#2A2424] text-white font-medium" 
                    : "text-[#2A2424] hover:bg-[#F1EFEA]"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
