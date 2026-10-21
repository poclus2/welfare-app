// Phone numbers for the login / sign-up forms: a country code picked from a short list plus the national
// number, always sent to the API in the international form "+2376XXXXXXXX" (the same form as the API's
// toE164, which is also what WhatsApp needs).

export type PhoneCountry = {
  iso: string;
  name: string; // French, translated through the dictionaries
  dial: string; // without the "+"
  dropLeadingZero?: boolean; // a 0 typed before the national number is not part of the international form
  lengths?: number[]; // national digit counts, when we know them for sure
  placeholder?: string;
};

export const OTHER_COUNTRY = "ZZ"; // "Autre indicatif": the full number is typed with its code

export const PHONE_COUNTRIES: PhoneCountry[] = [
  // Cameroon has no trunk 0, but customers often type one out of habit
  { iso: "CM", name: "Cameroun", dial: "237", dropLeadingZero: true, lengths: [9], placeholder: "6XX XXX XXX" },
  { iso: "GA", name: "Gabon", dial: "241" },
  { iso: "CG", name: "Congo", dial: "242" },
  { iso: "TD", name: "Tchad", dial: "235" },
  { iso: "CF", name: "Centrafrique", dial: "236" },
  { iso: "GQ", name: "Guinée équatoriale", dial: "240" },
  { iso: "NG", name: "Nigeria", dial: "234", dropLeadingZero: true },
  { iso: "CI", name: "Côte d'Ivoire", dial: "225" },
  { iso: "SN", name: "Sénégal", dial: "221" },
  { iso: "FR", name: "France", dial: "33", dropLeadingZero: true, lengths: [9], placeholder: "6 12 34 56 78" },
  { iso: "BE", name: "Belgique", dial: "32", dropLeadingZero: true },
  { iso: "CH", name: "Suisse", dial: "41", dropLeadingZero: true },
  { iso: "GB", name: "Royaume-Uni", dial: "44", dropLeadingZero: true },
  { iso: "US", name: "États-Unis / Canada", dial: "1" },
];

export const DEFAULT_PHONE_COUNTRY = "CM";

const OTHER: PhoneCountry = { iso: OTHER_COUNTRY, name: "Autre indicatif", dial: "" };

export function findCountry(iso: string): PhoneCountry {
  if (iso === OTHER_COUNTRY) return OTHER;
  return PHONE_COUNTRIES.find((c) => c.iso === iso) ?? PHONE_COUNTRIES[0]!;
}

const digitsOf = (s: string) => s.replace(/\D/g, "");

// Longest code first, so "+237…" is Cameroon and not some shorter code
const BY_DIAL_LENGTH = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

/** The national digits that go after the country code (a typed leading 0 dropped where it isn't dialled). */
export function nationalDigits(iso: string, national: string): string {
  const c = findCountry(iso);
  const d = digitsOf(national);
  return c.dropLeadingZero && d.startsWith("0") ? d.slice(1) : d;
}

/** "+2376XXXXXXXX", or "" while nothing is typed. */
export function toE164(iso: string, national: string): string {
  const d = nationalDigits(iso, national);
  if (!d) return "";
  return `+${findCountry(iso).dial}${d}`;
}

export function isPlausibleNational(iso: string, national: string): boolean {
  const d = nationalDigits(iso, national);
  const c = findCountry(iso);
  if (c.lengths) return c.lengths.includes(d.length);
  if (iso === OTHER_COUNTRY) return d.length >= 8 && d.length <= 15;
  return d.length >= 6 && d.length <= 12;
}

/** Display form of the national part ("654 815 887" for Cameroon); other countries are left as typed. */
export function formatNational(iso: string, national: string): string {
  const d = nationalDigits(iso, national);
  if (iso === "CM" && d.length === 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (iso === "FR" && d.length === 9) return `${d[0]} ${d.slice(1).match(/../g)!.join(" ")}`;
  return national.replace(/[^\d ]/g, "").trim();
}

/**
 * A number written with its code ("+237 6…", "00237 6…", or the digits after the "+" when `assumeCode`):
 * the matching country and the rest. A code missing from the list gives "Autre indicatif".
 */
export function splitInternational(raw: string, assumeCode = false): { iso: string; national: string } | null {
  const s = raw.trim();
  let d = digitsOf(s);
  if (s.startsWith("00")) d = d.slice(2);
  else if (!s.startsWith("+") && !assumeCode) return null;
  const c = BY_DIAL_LENGTH.find((country) => d.startsWith(country.dial) && d.length > country.dial.length);
  if (!c) return { iso: OTHER_COUNTRY, national: d };
  return { iso: c.iso, national: d.slice(c.dial.length) };
}

/** Country + national part of a stored or URL value ("+237654815887", "654815887", "237654815887"...). */
export function splitPhone(value: string, fallbackIso = DEFAULT_PHONE_COUNTRY): { iso: string; national: string } {
  if (!value.trim()) return { iso: fallbackIso, national: "" };
  const intl = splitInternational(value);
  if (intl) return intl;
  const d = digitsOf(value);
  if (d.length === 12 && d.startsWith("237")) return { iso: "CM", national: d.slice(3) };
  return { iso: fallbackIso, national: d };
}

/** "+237 654 815 887" for messages such as "code sent to …". */
export function formatPhoneForDisplay(e164: string): string {
  const { iso, national } = splitPhone(e164);
  if (iso === OTHER_COUNTRY) return e164;
  return `+${findCountry(iso).dial} ${formatNational(iso, national)}`;
}
