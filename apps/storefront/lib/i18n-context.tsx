"use client";

import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type I18nContextType = {
  t: (key: string) => string;
  locale: string;
  setLocale: (locale: string) => void;
  dict: any;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ 
  children, 
  initialLocale, 
  dictionaries 
}: { 
  children: React.ReactNode; 
  initialLocale: string;
  dictionaries: { [key: string]: any } 
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);

  const setLocale = useCallback((newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    setLocaleState(newLocale);
    // Optional: We can still refresh in the background so server components sync up
    router.refresh();
  }, [router]);

  // Handle back-button / client-side route changes if cookie changes
  useEffect(() => {
    const match = document.cookie.match(new RegExp("(^| )NEXT_LOCALE=([^;]+)"));
    if (match && match[2] && match[2] !== locale) {
      setLocaleState(match[2]);
    }
  }, [locale]);

  const dict = dictionaries[locale] || dictionaries["fr"];
  
  const t = useCallback((key: string) => {
    if (!key) return "";
    
    // Support dot notation e.g., "navbar.shop"
    const keys = key.split(".");
    let value = dict;
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }
    
    // If found and it's a string, return it
    if (typeof value === "string") return value;
    
    // Fallback: Check if the key exists directly in the dict (for natural language keys)
    if (dict && dict[key] && typeof dict[key] === "string") return dict[key];
    
    // Ultimate fallback: just return the key itself
    return key;
  }, [dict]);

  return (
    <I18nContext.Provider value={{ t, locale, setLocale, dict }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
