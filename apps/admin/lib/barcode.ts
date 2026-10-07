// Product barcodes. The barcode is what links a Medusa variant to Odoo: the stock sync
// (apps/api/src/api/odoo-sync) finds variants by barcode, so a variant without one, or with a typo,
// never receives its shop stock.

export function normalizeBarcode(raw: string) {
  return raw.replace(/\s+/g, "").trim();
}

/** GTIN check digit (EAN-8, UPC-A, EAN-13, GTIN-14): catches a mistyped digit or a misread scan. */
export function isValidGtin(code: string) {
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false;
  const digits = code.split("").map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

export type BarcodeCheck =
  | { kind: "empty" }
  | { kind: "gtin" } // valid EAN/UPC
  | { kind: "bad_checksum" } // looks like an EAN/UPC but a digit is wrong
  | { kind: "other" }; // not an EAN/UPC (internal code, Code 128...): accepted, but unusual

export function checkBarcode(raw: string): BarcodeCheck {
  const code = normalizeBarcode(raw);
  if (!code) return { kind: "empty" };
  if (/^\d+$/.test(code) && [8, 12, 13, 14].includes(code.length)) {
    return isValidGtin(code) ? { kind: "gtin" } : { kind: "bad_checksum" };
  }
  return { kind: "other" };
}

/** The same product can be printed as UPC-A (12) or EAN-13 (leading 0): look both up for duplicates. */
export function barcodeVariants(code: string) {
  const out = new Set([code]);
  if (/^\d{12}$/.test(code)) out.add("0" + code);
  if (/^0\d{12}$/.test(code)) out.add(code.slice(1));
  return [...out];
}
