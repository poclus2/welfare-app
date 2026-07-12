export const MOCK_PRODUCTS = [
  {
    id: "haruharu-wonder-sunscreen",
    title: "Haruharu Wonder Black Rice Moisture Airyfit Sunscreen",
    price_fcfa: 14500,
    category: "Protections Solaires",
    image: "/product-serum.png", // Fallback images for now
    metadata: {
      usage_instructions: "Appliquer généreusement en dernière étape de la routine matinale, 15 minutes avant l'exposition au soleil.",
      precautions: "Renouveler l'application toutes les 2 heures en cas d'exposition prolongée.",
      inci_ingredients: "Water, Oryza Sativa (Rice) Extract, Dibutyl Adipate, Propanediol, Diethylamino Hydroxybenzoyl Hexyl Benzoate, Ceramide NP..."
    },
    active_ingredients: [
      { name: "Extrait de Riz Noir", description: "Riche en antioxydants, protège la peau contre les radicaux libres." },
      { name: "Céramides", description: "Renforcent la barrière cutanée et maintiennent l'hydratation." }
    ],
    skin_profile: {
      skin_types: ["Sensible", "Sèche", "Mixte", "Normale"],
      skin_concerns: ["Protection", "Sensibilité", "Sécheresse"]
    }
  },
  {
    id: "medicube-sun-cream",
    title: "Medicube Red Moisture Real Sun Cream",
    price_fcfa: 15000,
    category: "Solaires",
    image: "/product-cream.png",
    metadata: {
      usage_instructions: "Appliquer uniformément sur le visage et le cou tous les matins.",
      precautions: "Usage externe uniquement.",
      inci_ingredients: "Water, Ethylhexyl Methoxycinnamate, Centella Asiatica Extract, Titanium Dioxide, Niacinamide..."
    },
    active_ingredients: [
      { name: "Centella asiatica", description: "Apaise les rougeurs et répare les peaux sensibilisées." }
    ],
    skin_profile: {
      skin_types: ["Grasse", "Mixte", "Sensible"],
      skin_concerns: ["Acné", "Rougeurs", "Protection"]
    }
  },
  {
    id: "medicube-txa-niacinamide-cream",
    title: "Medicube TXA Niacinamide Cream",
    price_fcfa: 18500,
    category: "Hydratants",
    image: "/product-cream.png",
    metadata: {
      usage_instructions: "Appliquer une quantité modérée sur le visage après le sérum, matin et soir.",
      precautions: "L'utilisation stricte d'un écran solaire (SPF) est obligatoire la journée.",
      inci_ingredients: "Water, Niacinamide, Tranexamic Acid, Glycerin, Caprylic/Capric Triglyceride..."
    },
    active_ingredients: [
      { name: "Acide tranexamique", description: "Cible et réduit visiblement l'hyperpigmentation et les taches tenaces." },
      { name: "Niacinamide", description: "Illumine le teint et régule la production de sébum." }
    ],
    skin_profile: {
      skin_types: ["Mixte", "Grasse", "Normale"],
      skin_concerns: ["Hyperpigmentation", "Taches", "Éclat"]
    }
  },
  {
    id: "cos-de-baha-tn",
    title: "Cos de Baha TN (Tranexamic Acid + Niacinamide) Serum",
    price_fcfa: 12000,
    category: "Sérums & Ampoules",
    image: "/product-serum.png",
    metadata: {
      usage_instructions: "Appliquer 2-3 gouttes sur une peau propre après le toner.",
      precautions: "Effectuer un patch test avant utilisation.",
      inci_ingredients: "Aloe Barbadensis Leaf Extract, Tranexamic Acid, Niacinamide, Glycerin, Sodium Hyaluronate..."
    },
    active_ingredients: [
      { name: "Acide tranexamique", description: "Réduit l'apparence des cicatrices d'acné et du mélasma." },
      { name: "Niacinamide", description: "Améliore la texture de la peau et réduit les pores." }
    ],
    skin_profile: {
      skin_types: ["Toutes", "Mixte", "Grasse"],
      skin_concerns: ["Hyperpigmentation", "Imperfections", "Teint terne"]
    }
  },
  {
    id: "cos-de-baha-tt",
    title: "Cos de Baha TT Serum",
    price_fcfa: 12000,
    category: "Sérums & Ampoules",
    image: "/product-serum.png",
    metadata: {
      usage_instructions: "Appliquer quelques gouttes sur les zones ciblées ou sur l'ensemble du visage.",
      precautions: "Commencer par 2 à 3 fois par semaine pour vérifier la tolérance cutanée.",
      inci_ingredients: "Centella Asiatica Extract, Tranexamic Acid, Butylene Glycol, Water..."
    },
    active_ingredients: [
      { name: "Acide tranexamique", description: "Traitement intensif contre les décolorations cutanées." }
    ],
    skin_profile: {
      skin_types: ["Sensible", "Mixte"],
      skin_concerns: ["Hyperpigmentation", "Rougeurs"]
    }
  },
  {
    id: "cos-de-baha-t15",
    title: "Cos de Baha T15 Serum",
    price_fcfa: 12500,
    category: "Sérums & Ampoules",
    image: "/product-serum.png",
    metadata: {
      usage_instructions: "Appliquer le soir sur une peau nettoyée.",
      precautions: "Peut augmenter la sensibilité au soleil. SPF obligatoire le lendemain.",
      inci_ingredients: "Aloe Barbadensis Leaf Extract, Propanediol, Active Ingredient 15%, Panthenol..."
    },
    active_ingredients: [
      { name: "Complexe Actif Concentré", description: "Formule hautement concentrée pour des résultats rapides sur la texture de la peau." }
    ],
    skin_profile: {
      skin_types: ["Grasse", "Normale"],
      skin_concerns: ["Acné", "Texture irrégulière"]
    }
  },
  {
    id: "happy-bath-deep-clean-body-wash",
    title: "Happy Bath Deep Clean Body Wash",
    price_fcfa: 9500,
    category: "Nettoyants",
    image: "/product-toner.png",
    metadata: {
      usage_instructions: "Faire mousser sur une éponge de bain ou entre les mains, masser sur le corps et rincer.",
      precautions: "Éviter le contact avec les yeux.",
      inci_ingredients: "Water, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Fragrance, Lauric Acid..."
    },
    active_ingredients: [
      { name: "Agents nettoyants profonds", description: "Élimine efficacement les impuretés et l'excès de sébum corporel." }
    ],
    skin_profile: {
      skin_types: ["Grasse", "Normale"],
      skin_concerns: ["Acné corporelle", "Impuretés"]
    }
  },
  {
    id: "mumchit-body-lotion",
    title: "Mumchit Melting Body Lotion",
    price_fcfa: 11000,
    category: "Hydratants",
    image: "/product-cream.png",
    metadata: {
      usage_instructions: "Appliquer généreusement sur le corps après la douche pour retenir l'hydratation.",
      precautions: "Conserver à l'abri de la lumière directe du soleil.",
      inci_ingredients: "Water, Glycerin, Mineral Oil, Fragrance, Cetearyl Alcohol, Ceramide NP..."
    },
    active_ingredients: [
      { name: "Céramides", description: "Protège et nourrit la barrière cutanée du corps." }
    ],
    skin_profile: {
      skin_types: ["Sèche", "Sensible", "Normale"],
      skin_concerns: ["Sécheresse", "Rugosité"]
    }
  },
  {
    id: "mumchit-body-wash",
    title: "Mumchit Body Wash",
    price_fcfa: 9000,
    category: "Nettoyants",
    image: "/product-toner.png",
    metadata: {
      usage_instructions: "Masser sur peau humide pour créer une mousse onctueuse, puis rincer.",
      precautions: "En cas d'irritation, cesser l'utilisation.",
      inci_ingredients: "Water, Sodium Laureth Sulfate, Glycerin, Fragrance, Panthenol..."
    },
    active_ingredients: [
      { name: "Panthénol", description: "Apaise la peau pendant le nettoyage pour éviter les tiraillements." }
    ],
    skin_profile: {
      skin_types: ["Toutes"],
      skin_concerns: ["Nettoyage doux"]
    }
  },
  {
    id: "medicube-kojic-acid-tumeric-body-wash",
    title: "Medicube Kojic Acid Turmeric Body Wash",
    price_fcfa: 16000,
    category: "Nettoyants",
    image: "/product-toner.png",
    metadata: {
      usage_instructions: "Masser sur le corps et laisser agir 1 à 2 minutes sur les zones hyperpigmentées avant de rincer.",
      precautions: "Peut tacher les éponges claires à cause du curcuma. Utiliser une protection solaire si les zones traitées sont exposées.",
      inci_ingredients: "Water, Lauryl Glucoside, Kojic Acid, Curcuma Longa (Turmeric) Root Extract, Glycerin..."
    },
    active_ingredients: [
      { name: "Acide Kojique", description: "Inhibe la production de mélanine pour éclaircir les taches brunes corporelles." },
      { name: "Curcuma", description: "Anti-inflammatoire naturel qui illumine le teint et unifie la peau." }
    ],
    skin_profile: {
      skin_types: ["Toutes"],
      skin_concerns: ["Hyperpigmentation corporelle", "Taches brunes"]
    }
  }
];

export const FILTER_OPTIONS = {
  skinTypes: ["Toutes", "Sèche", "Mixte", "Grasse", "Normale", "Sensible"],
  skinConcerns: [
    "Acné", 
    "Acné corporelle", 
    "Hyperpigmentation", 
    "Hyperpigmentation corporelle", 
    "Imperfections", 
    "Impuretés",
    "Nettoyage doux", 
    "Protection", 
    "Rougeurs", 
    "Rugosité",
    "Sensibilité", 
    "Sécheresse", 
    "Taches", 
    "Taches brunes",
    "Teint terne", 
    "Texture irrégulière", 
    "Éclat"
  ],
  ingredients: [
    "Acide Kojique",
    "Acide tranexamique",
    "Agents nettoyants profonds",
    "Centella asiatica",
    "Complexe Actif Concentré",
    "Curcuma",
    "Céramides",
    "Extrait de Riz Noir",
    "Niacinamide",
    "Panthénol"
  ]
};
