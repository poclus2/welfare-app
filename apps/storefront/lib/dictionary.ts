import "server-only";
import { cookies } from "next/headers";

export type Locale = "fr" | "en";

export const defaultLocale: Locale = "fr";

const dictionaries = {
  fr: () => import("../dictionaries/fr.json").then((module) => module.default),
  en: () => import("../dictionaries/en.json").then((module) => module.default),
};

export const getDictionary = async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;
  
  const locale = localeCookie && dictionaries[localeCookie] ? localeCookie : defaultLocale;
  
  return dictionaries[locale]();
};

export const getLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;
  
  return localeCookie && dictionaries[localeCookie] ? localeCookie : defaultLocale;
}
