// The Skin Coach's message never shows a score (owner's decision: levels only, no /100 and no %).
// The model is told so (analyze-skin.ts), but it sees the photo scores in its prompt and sometimes repeats
// them in brackets ("barrière d'hydratation remarquable (95/100)"): those brackets are taken out here, for
// new messages and for old ones shown again from the account. A score inside a sentence is left to the
// prompt: cutting it out would break the sentence.

export function withoutScores(message: string): string {
  return (message || "")
    .replace(/\s*\([^()]*\d{1,3}\s*(?:\/\s*100|%)[^()]*\)/g, "") // "(95/100)", "(sébum à 45/100)", "(12 %)"
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
