// Shop filters (type de peau / préoccupations / ingrédients) are built from the products' own metadata.
//
// The catalogue metadata was filled by hand and by AI over time, so the same idea shows up in many
// shapes: "Peau sensible", "Peaux sensibles", "Sensitive", "sensitive"; "Déshydratation", "Dehydration",
// "Peau déshydratée"... Matching the raw strings made the filters miss most products. Each raw value is
// folded into one canonical label here, and the storefront filters on those labels only.
//
// Ingredients: products carry no structured ingredient list, only the INCI text (metadata.raw_inci), so
// ingredients are detected in it by their INCI name.

type Rule = [label: string, re: RegExp]

// A product that suits "all skin types" matches every skin-type filter, so it carries this label.
export const ALL_SKIN_TYPES = "Toutes"

const SKIN_TYPE_RULES: Rule[] = [
  [ALL_SKIN_TYPES, /tou[ts]e?s? (les )?types?|toutes (les )?(peaux|types)|all skin/i],
  ["Sèche", /s[èe]che|\bsec\b|\bdry\b|d[ée]shydrat|dehydrat/i],
  ["Mixte", /mixte|combination|combin/i],
  ["Grasse", /gras|oily|s[ée]bum/i],
  ["Normale", /normal/i],
  ["Sensible", /sensib|sensitive|irrit|r[ée]activ|fragil|d[ée]licat/i],
  ["Mature", /matur|aging|anti-?[aâ]ge|vieillissant/i],
  ["À tendance acnéique", /acn|imperfection|bouton|blemish/i],
]

const CONCERN_RULES: Rule[] = [
  ["Hydratation", /hydrat|d[ée]shydrat|dehydrat|s[éèe]che|dryness|dry skin|nutrition/i],
  ["Acné & imperfections", /acn|imperfection|bouton|points? noirs?|come?don|blemish|blackhead/i],
  ["Taches & hyperpigmentation", /tache|pigment|teint (irr|in[ée]gal)|uneven|dark spot|m[ée]lasma/i],
  ["Éclat & teint terne", /terne|[ée]clat|luminos|glow|dull/i],
  ["Rougeurs & irritations", /rougeur|redness|irritation|inflammation|apais|soothing/i],
  ["Barrière cutanée", /barri/i],
  ["Pores & sébum", /pore|s[ée]bum|brillance|shine/i],
  ["Anti-âge", /anti-?[aâ]ge|rides?\b|ridule|vieillissement|[ée]lasticit|aging|wrinkle|fermet|raffermiss|signes? de l.[âa]ge/i],
  ["Sensibilité", /sensib|sensitiv|r[ée]activ/i],
  ["Protection solaire", /solaire|\bspf\b|\bsun\b|\buv\b/i],
  ["Cuir chevelu & cheveux", /cuir chevelu|scalp|pellicule|cheveux|\bhair\b|dandruff/i],
  ["Cicatrisation & régénération", /cicatri|healing|\bscar|r[ée]g[ée]n|r[ée]paration cutan/i],
  ["Texture & grain de peau", /rugos|rugueu|texture|grain de peau|exfoli/i],
  ["Antioxydant & pollution", /oxydatif|antioxydant|environnement|pollution|radicaux/i],
]

const INGREDIENT_RULES: Rule[] = [
  ["Niacinamide", /niacinamide/i],
  ["Acide hyaluronique", /hyaluron/i],
  ["Centella asiatica", /centella/i],
  ["Céramides", /ceramide/i],
  ["Panthénol", /panthenol/i],
  ["Vitamine C", /ascorb/i],
  ["Rétinol", /retinol|retinal|retinyl/i],
  ["Acide salicylique (BHA)", /salicylic/i],
  ["AHA (acides de fruits)", /glycolic|lactic acid|mandelic/i],
  ["Acide tranexamique", /tranexamic/i],
  ["Acide kojique", /kojic/i],
  ["Arbutine", /arbutin/i],
  ["Peptides", /peptide/i],
  ["Collagène", /collagen/i],
  ["Mucine d'escargot", /snail/i],
  ["Propolis", /propolis/i],
  ["Thé vert", /camellia sinensis|green tea/i],
  ["Aloe vera", /\baloe/i],
]

function fold(values: unknown, rules: Rule[]): string[] {
  const list = (Array.isArray(values) ? values : values ? [values] : []).map(String)
  const out = new Set<string>()
  for (const v of list) for (const [label, re] of rules) if (re.test(v)) out.add(label)
  return rules.map(([l]) => l).filter((l) => out.has(l))
}

export function skinTypeFacets(raw: unknown): string[] {
  return fold(raw, SKIN_TYPE_RULES)
}

export function concernFacets(raw: unknown): string[] {
  return fold(raw, CONCERN_RULES)
}

export function ingredientFacets(rawInci: unknown): string[] {
  const text = typeof rawInci === "string" ? rawInci : ""
  return INGREDIENT_RULES.filter(([, re]) => re.test(text)).map(([l]) => l)
}
