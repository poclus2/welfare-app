// Only imported by app/api/products/inci-check (server): the list never reaches the browser
import INCI_NAMES from "./inci-names.json";

// Flags the names of an INCI list that are not official INCI names, so the admin knows exactly which
// words to compare against the label (a misread "Butylen Glycol", a name translated into French...).
//
// lib/inci-names.json = CosIng (the EU cosmetic ingredient database): the full Ingredients/Fragrance
// Inventory export of 15/02/2016 (via Open Beauty Facts) + ~5 000 more recent names from the official
// CosIng search API. Ingredients registered later may be missing: an unknown name is a hint to check,
// never an error. Kept server-side (≈1 MB).

const norm = (s: string) =>
  s.toUpperCase().replace(/\s+/g, " ").replace(/\s*\/\s*/g, "/").replace(/\s*-\s*/g, "-").trim();

// Common on Korean/US labels though not CosIng spellings
const EXTRA = ["FRAGRANCE", "AQUA/WATER", "WATER/AQUA", "WATER/AQUA/EAU", "AQUA/WATER/EAU"];
const NAMES = new Set<string>([...(INCI_NAMES as string[]), ...EXTRA]);

/** Splits on commas/semicolons, but not inside (...) / [...] nor in "1,2-Hexanediol". */
export function splitInci(text: string) {
  return text
    .split(/[,;](?![^()[\]]*[)\]])(?!\d)/)
    .map((x) => x.replace(/^[\s.*•-]+|[\s.*]+$/g, "").trim())
    .filter(Boolean);
}

export function isKnownInci(ingredient: string) {
  const n = norm(ingredient);
  if (!n) return true;
  if (NAMES.has(n)) return true;
  // "Water (Aqua)", "Aqua (Water/Eau)", "Titanium Dioxide (CI 77891)": one of the names is enough
  const outside = norm(n.replace(/\([^)]*\)/g, " "));
  const inside = [...n.matchAll(/\(([^)]*)\)/g)].flatMap((m) => m[1].split("/")).map(norm);
  if ([outside, ...inside].some((p) => p && NAMES.has(p))) return true;
  // "Water/Aqua" written as one item: every part known
  const parts = n.split("/").map(norm).filter(Boolean);
  return parts.length > 1 && parts.every((p) => NAMES.has(p));
}

export function checkInci(text: string) {
  const items = splitInci(text);
  const unknown = items.filter((i) => /\[illisible\]/i.test(i) || !isKnownInci(i));
  return { total: items.length, unknown: [...new Set(unknown)] };
}
