// The Skin Coach questionnaire (components/ui/skin-coach-flow.tsx). Kept out of the component so the script that
// records the questions read aloud (scripts/generate-question-audio.ts) reads the same texts.

export type Option = {
  label: string;
  nextQuestionId?: string;
};

export type QuestionNode = {
  id: string;
  text: string;
  subtitle?: string;
  type: "choice" | "multi_choice" | "text" | "text_or_photo";
  options?: Option[];
  nextQuestionId?: string;
};


export const DECISION_TREE: QuestionNode[] = [
  {
    id: "q_main_goal",
    text: "👋 Bonjour ! Pendant que j'analyse vos photos, dites-m'en plus sur vous. Quel est votre objectif numéro 1 aujourd'hui ?",
    type: "choice",
    options: [
      { label: "Combattre l'acné & imperfections", nextQuestionId: "q_post_wash" },
      { label: "Atténuer les taches (Hyperpigmentation)", nextQuestionId: "q_active_acne" },
      { label: "Hydratation & effet Glow", nextQuestionId: "q_active_acne" },
      { label: "Anti-âge & fermeté", nextQuestionId: "q_post_wash" }
    ]
  },
  {
    // Acne comes first: someone who wants to fade spots (or glow) but has active pimples is steered to an
    // acne-calming routine (see analyze-skin.ts). This question is the declared half of that decision;
    // the photo scan is the other half.
    id: "q_active_acne",
    text: "Une précision importante pour bien vous conseiller : avez-vous des boutons actifs ou inflammés en ce moment ?",
    type: "choice",
    options: [
      { label: "Oui, j'ai des boutons actifs ou inflammés", nextQuestionId: "q_lightening" },
      { label: "Non, ma peau est plutôt calme", nextQuestionId: "q_lightening" }
    ]
  },
  {
    // Asked on the spots / glow paths. Current use: no depigmenting active is added on top, and she is advised
    // to talk to a professional (lib/skin-safety.ts reads "actuellement"). An unusual pigmentation seen on the
    // photos leads to a dermatologist referral.
    id: "q_lightening",
    text: "Utilisez-vous, ou avez-vous déjà utilisé, des produits éclaircissants ou « blanchissants » (crèmes, laits ou savons) ?",
    type: "choice",
    options: [
      { label: "Oui, actuellement", nextQuestionId: "q_post_wash" },
      { label: "Oui, par le passé", nextQuestionId: "q_post_wash" },
      { label: "Non, jamais", nextQuestionId: "q_post_wash" }
    ]
  },
  {
    id: "q_post_wash",
    text: "Pour bien comprendre votre métabolisme, dites-moi : comment ressentez-vous votre peau dans les minutes qui suivent son nettoyage ?",
    type: "choice",
    options: [
      { label: "Elle tiraille, j'ai un besoin urgent de l'hydrater", nextQuestionId: "q_midday_behavior" },
      { label: "Elle est normale et plutôt confortable", nextQuestionId: "q_midday_behavior" },
      { label: "Elle regraisse très rapidement", nextQuestionId: "q_midday_behavior" }
    ]
  },
  {
    id: "q_midday_behavior",
    text: "Et au milieu de la journée (vers 14h), comment évolue-t-elle généralement ?",
    type: "choice",
    options: [
      { label: "Elle brille sur tout le visage", nextQuestionId: "q_sensitivity" },
      { label: "Elle brille uniquement sur la zone T (Front, Nez, Menton)", nextQuestionId: "q_sensitivity" },
      { label: "Elle reste mate, mais j'ai des zones sèches ou squameuses", nextQuestionId: "q_sensitivity" },
      { label: "Elle ne bouge pas, elle reste confortable", nextQuestionId: "q_sensitivity" }
    ]
  },
  {
    id: "q_sensitivity",
    text: "C'est noté. Comment réagit généralement votre peau aux nouveaux produits ?",
    type: "choice",
    options: [
      { label: "Très bien, elle supporte tout", nextQuestionId: "q_pregnancy" },
      { label: "Sensible, parfois des rougeurs", nextQuestionId: "q_pregnancy" },
      { label: "Très réactive et intolérante", nextQuestionId: "q_pregnancy" }
    ]
  },
  {
    // Pregnancy / breastfeeding: some actives are then excluded in code (lib/skin-safety.ts reads "Oui...")
    id: "q_pregnancy",
    text: "Êtes-vous actuellement enceinte ou en train d'allaiter ?",
    type: "choice",
    options: [
      { label: "Oui, enceinte ou allaitante", nextQuestionId: "q_derm_treatment" },
      { label: "Non, ou je ne suis pas concernée", nextQuestionId: "q_derm_treatment" }
    ]
  },
  {
    // Under treatment: no irritating active is added on top, and she is told to check with her doctor
    // (lib/skin-safety.ts reads "Oui...")
    id: "q_derm_treatment",
    text: "Suivez-vous actuellement un traitement prescrit par un médecin pour votre peau (crème, gel ou comprimés contre l'acné, par exemple) ?",
    type: "choice",
    options: [
      { label: "Oui, j'ai un traitement en cours", nextQuestionId: "q_has_allergies" },
      { label: "Non", nextQuestionId: "q_has_allergies" }
    ]
  },
  {
    id: "q_has_allergies",
    text: "Faites-vous des allergies à certains produits cosmétiques ?",
    type: "choice",
    options: [
      { label: "Oui", nextQuestionId: "q_allergies_list" },
      { label: "Non", nextQuestionId: "q_current_routine" }
    ]
  },
  {
    id: "q_allergies_list",
    text: "À quels ingrédients êtes-vous allergique ou sensible ?",
    subtitle: "Vous pouvez en sélectionner plusieurs.",
    type: "multi_choice",
    options: [
      { label: "Parfums synthétiques (Fragrance)" },
      { label: "Huiles Essentielles (Tea tree, Lavande, Agrumes...)" },
      { label: "Extraits Botaniques (Aloé Vera, Armoise, Thé vert...)" },
      { label: "Mucine d'escargot (Snail Mucin)" },
      { label: "Propolis / Miel / Venin d'abeille" },
      { label: "Centella Asiatica (Cica)" },
      { label: "Ferments (Galactomyces, Bifida...)" },
      { label: "Vitamine C pure (Acide L-Ascorbique)" },
      { label: "Rétinol / Rétinoïdes (Vitamine A)" },
      { label: "Acides Exfoliants (AHA, BHA, Acide Glycolique...)" },
      { label: "Niacinamide (Vitamine B3)" },
      { label: "Alcools asséchants (Alcohol Denat, Ethanol)" },
      { label: "Filtres Solaires Chimiques (Oxybenzone, Octocrylene...)" },
      { label: "Silicones (Dimethicone...)" },
      { label: "Autres (à préciser)" }
    ],
    nextQuestionId: "q_current_routine"
  },
  {
    id: "q_current_routine",
    text: "Utilisez-vous déjà une routine de soins au quotidien ?",
    type: "choice",
    options: [
      { label: "Oui", nextQuestionId: "q_routine_details" },
      { label: "Non, je commence tout juste", nextQuestionId: "q_sun_exposure" }
    ]
  },
  {
    id: "q_routine_details",
    text: "Super ! Écrivez-moi le nom des produits que vous utilisez, ou prenez-les simplement en photo 📸 :",
    type: "text_or_photo",
    nextQuestionId: "q_sun_exposure"
  },
  {
    id: "q_sun_exposure",
    text: "À quelle fréquence êtes-vous exposée au soleil dans la journée ?",
    type: "choice",
    options: [
      { label: "Très peu (surtout en intérieur)", nextQuestionId: "q_makeup" },
      { label: "Modérément (trajets, balades)", nextQuestionId: "q_makeup" },
      { label: "Beaucoup (travail/sport en extérieur)", nextQuestionId: "q_makeup" }
    ]
  },
  {
    // decides the evening double cleanse with a make-up remover (lib/skin-routine.ts, client's rule 2026-10-18)
    id: "q_makeup",
    text: "Vous maquillez-vous régulièrement ?",
    type: "choice",
    options: [
      { label: "Oui, presque tous les jours", nextQuestionId: "q_budget" },
      { label: "Oui, de temps en temps", nextQuestionId: "q_budget" },
      { label: "Rarement", nextQuestionId: "q_budget" },
      { label: "Jamais", nextQuestionId: "q_budget" }
    ]
  },
  {
    id: "q_budget",
    text: "Dernière question ! Pour que je puisse adapter mes recommandations de produits à vos attentes, quel budget souhaitez-vous idéalement allouer à votre routine soin ?",
    type: "choice",
    options: [
      { label: "Essentiel (25k - 35k FCFA)", nextQuestionId: "q_finish" },
      { label: "Intermédiaire (35k - 45k FCFA)", nextQuestionId: "q_finish" },
      { label: "Premium (50k+ FCFA)", nextQuestionId: "q_finish" }
    ]
  }
];

// Shown (and read aloud) once the last answer is in, while the routine is being generated
export const ANALYSIS_START_MESSAGE = "Parfait ! Laissez-moi analyser tout ça... Génération de votre routine personnalisée en cours ✨";
