"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Minus, 
  Plus, 
  Star, 
  Search, 
  ShoppingBag,
  Sparkles,
  Droplets,
  Wind,
  ShieldCheck,
  Leaf,
  CheckCircle2,
  ArrowRight,
  Menu
} from "lucide-react";
import Link from "next/link";
import { AnnouncementBar } from "@/components/ui/announcement-bar";
import { Footer } from "@/components/home/footer"; // Import the real footer
import { SearchModal } from "@/components/ui/search-modal";
import { useEffect } from "react";

// --- Mock Data ---
const product = {
  id: "1",
  name: "Glass Skin Refining Serum",
  price: 22500,
  rating: 4.9,
  reviewsCount: 486,
  description: "Pink Soft helps brighten and disguise dark circles. Lock in your look with the Refining Serum. Infused with skin-loving vitamins, it blurs imperfections, controls shine, and leaves you with a soft, natural finish all day long.",
  images: [
    "https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/4465828/pexels-photo-4465828.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/5938259/pexels-photo-5938259.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/8131583/pexels-photo-8131583.jpeg?auto=compress&cs=tinysrgb&w=800"
  ],
  features: [
    { icon: <Wind className="w-4 h-4" />, text: "Texture ultra-légère" },
    { icon: <Sparkles className="w-4 h-4" />, text: "Fini éclatant (Glass Skin)" },
    { icon: <Droplets className="w-4 h-4" />, text: "Hydratation profonde" },
    { icon: <ShieldCheck className="w-4 h-4" />, text: "Testé dermatologiquement" },
    { icon: <CheckCircle2 className="w-4 h-4" />, text: "Convient aux peaux sensibles" },
    { icon: <Leaf className="w-4 h-4" />, text: "100% Vegan & Cruelty-Free" }
  ],
  variants: [
    { id: "v1", color: "#FDE6E5", name: "Fair" },
    { id: "v2", color: "#F6D6C7", name: "Light" },
    { id: "v3", color: "#E8BBA7", name: "Medium" },
    { id: "v4", color: "#C68E71", name: "Tan" },
    { id: "v5", color: "#9A6345", name: "Deep" }
  ]
};

const relatedProducts = [
  {
    id: "r1",
    name: "Aisha Lip Kit",
    price: 32500,
    rating: 4.9,
    sold: 323,
    image: "https://images.pexels.com/photos/4198246/pexels-photo-4198246.jpeg?auto=compress&cs=tinysrgb&w=600",
    tag: "Nouveau"
  },
  {
    id: "r2",
    name: "Soft Satin Bronzer",
    price: 78000,
    rating: 4.9,
    sold: 323,
    image: "https://images.pexels.com/photos/4465829/pexels-photo-4465829.jpeg?auto=compress&cs=tinysrgb&w=600",
    tag: "Just in"
  },
  {
    id: "r3",
    name: "Colour Theory Set",
    price: 130000,
    rating: 4.9,
    sold: 323,
    image: "https://images.pexels.com/photos/5938259/pexels-photo-5938259.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    id: "r4",
    name: "Faces Moisturising",
    price: 45500,
    rating: 4.9,
    sold: 323,
    image: "https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=600"
  }
];

export default function ProductPage() {
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Search Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="min-h-screen bg-white flex flex-col w-full overflow-hidden relative">
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AnnouncementBar />
      
      {/* --- Real Navbar matched from Bento --- */}
      <div className="w-full bg-[#F4EAEB] z-40 relative pt-4 md:pt-6 pb-4">
        <header className="flex items-center justify-between px-5 md:px-12 h-16 lg:h-20 w-full max-w-[1600px] mx-auto">
          
          <div className="flex items-center gap-12 lg:gap-20">
            <Link href="/" className="flex items-center relative z-50">
              <img 
                src="/logo.png" 
                alt="The Welfare Shop" 
                className="h-12 lg:h-20 w-auto object-contain lg:scale-[1.8] origin-left" 
              />
            </Link>

            <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-[#2A2424]/70 mt-2">
              <Link href="/" className="hover:text-[#2A2424] transition-colors">Ecosystem</Link>
              <Link href="/shop" className="hover:text-[#2A2424] transition-colors text-[#2A2424]">Products</Link>
              <Link href="/routines" className="flex items-center gap-1 hover:text-[#2A2424] transition-colors">
                Routines <sup className="text-[10px] bg-[#E5B6B9]/30 px-1.5 rounded-full text-[#2A2424]">New</sup>
              </Link>
              <Link href="/about" className="hover:text-[#2A2424] transition-colors">Learn</Link>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            {/* Selectors */}
            <div className="hidden lg:flex items-center gap-3 text-xs font-bold text-[#2A2424]/60 mr-2">
              <select className="bg-transparent focus:outline-none cursor-pointer hover:text-[#2A2424] transition-colors appearance-none">
                <option>FR</option>
                <option>EN</option>
              </select>
              <select className="bg-transparent focus:outline-none cursor-pointer hover:text-[#2A2424] transition-colors appearance-none">
                <option>FCFA</option>
                <option>EUR</option>
                <option>USD</option>
              </select>
            </div>

            {/* Search Bar - Hidden on mobile */}
            <div 
              className="hidden md:flex items-center relative cursor-text group"
              onClick={() => setIsSearchOpen(true)}
            >
              <div className="absolute inset-0 bg-white/60 border border-white/80 rounded-full transition-all group-hover:bg-white group-hover:shadow-md pointer-events-none" />
              <span className="pl-12 pr-6 py-2.5 text-sm text-[#2A2424]/50 relative z-10 w-[250px] lg:w-[350px] flex items-center">
                Rechercher un produit...
              </span>
              <Search className="w-4 h-4 absolute left-4 text-[#2A2424]/50 z-10 group-hover:text-[#2A2424] transition-colors" />
              <div className="absolute right-4 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-semibold text-[#2A2424]/40 bg-black/5 px-2 py-1 rounded">Ctrl K</span>
              </div>
            </div>

            <button 
              className="md:hidden p-2 text-[#2A2424] hover:bg-white/60 rounded-full transition-colors"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
            </button>

            <button className="p-2 lg:p-3 text-[#2A2424] hover:bg-white/60 rounded-full transition-colors relative group">
              <ShoppingBag className="w-5 h-5 lg:w-6 lg:h-6 group-hover:scale-110 transition-transform" />
              <span className="absolute top-1 right-1 lg:top-2 lg:right-2 w-2.5 h-2.5 bg-[#2A2424] rounded-full border-2 border-[#F4EAEB]"></span>
            </button>

            <button className="lg:hidden p-2 text-[#2A2424] hover:bg-white/60 rounded-full transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>
      </div>

      {/* --- Breadcrumb --- */}
      <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-12 py-4 lg:py-6 text-[10px] lg:text-xs font-semibold tracking-wider uppercase text-[#2A2424]/50 flex items-center gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <Link href="/" className="hover:text-[#E5B6B9]">Accueil</Link> 
        <span>/</span> 
        <Link href="/shop" className="hover:text-[#E5B6B9]">Skincare</Link> 
        <span>/</span> 
        <span className="text-[#2A2424]">{product.name}</span>
      </div>

      <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-12 pb-16 lg:pb-24">
        
        {/* =========================================
            TOP SECTION (Gallery + Info)
            ========================================= */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-16 lg:mb-24">
          
          {/* --- LEFT: Gallery --- */}
          <div className="w-full lg:w-1/2 flex flex-col gap-3 lg:gap-4">
            {/* Main Image */}
            <div className="w-full aspect-[4/5] lg:aspect-square rounded-[1.5rem] lg:rounded-[2rem] bg-[#F4EAEB] overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  src={product.images[activeImage]}
                  alt={product.name}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              <button className="absolute top-4 right-4 lg:top-6 lg:right-6 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                <Heart className="w-4 h-4 lg:w-5 lg:h-5 text-[#E5B6B9]" />
              </button>
            </div>
            {/* Thumbnails (Bento Grid) */}
            <div className="grid grid-cols-4 gap-2 lg:gap-4">
              {product.images.slice(1, 5).map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImage(i + 1)}
                  className={`w-full aspect-square rounded-[0.75rem] lg:rounded-[1rem] overflow-hidden bg-[#F4EAEB] border-2 transition-all ${activeImage === i + 1 ? 'border-[#E5B6B9]' : 'border-transparent hover:border-[#E5B6B9]/50'}`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* --- RIGHT: Product Info --- */}
          <div className="w-full lg:w-1/2 flex flex-col lg:pt-4">
            {/* Rating */}
            <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
              <div className="flex text-[#FFB800]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${i < Math.floor(product.rating) ? 'fill-[#FFB800]' : ''}`} />
                ))}
              </div>
              <span className="text-[11px] lg:text-xs font-bold text-[#2A2424]">{product.reviewsCount} Avis</span>
              <span className="text-[#2A2424]/20">|</span>
              <span className="text-[11px] lg:text-xs font-bold text-[#2A2424]/50">SKU: 027-32</span>
            </div>

            {/* Title & Price */}
            <h1 className="text-[2rem] leading-[1.1] lg:text-[2.75rem] font-medium text-[#2A2424] tracking-tight mb-2">
              {product.name}
            </h1>
            <p className="text-xl lg:text-2xl font-semibold text-[#2A2424] mb-6 lg:mb-8">
              {product.price.toLocaleString("fr-FR")} FCFA
            </p>

            {/* Variants */}
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                {product.variants.map((v) => (
                  <button 
                    key={v.id}
                    className="w-6 h-6 lg:w-7 lg:h-7 rounded-full border border-black/10 focus:outline-none ring-2 ring-transparent focus:ring-[#E5B6B9] focus:ring-offset-2 transition-all hover:scale-110"
                    style={{ backgroundColor: v.color }}
                    title={v.name}
                  />
                ))}
              </div>
              <p className="text-sm text-[#2A2424]/70 leading-relaxed mb-6">
                {product.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button className="w-full sm:w-auto border border-[#2A2424] text-[#2A2424] px-5 py-3 lg:py-2 rounded-full text-[11px] font-bold uppercase tracking-wider hover:bg-[#2A2424] hover:text-white transition-colors text-center">
                  Mon diagnostic
                </button>
                <button className="w-full sm:w-auto border border-[#2A2424] text-[#2A2424] px-5 py-3 lg:py-2 rounded-full text-[11px] font-bold uppercase tracking-wider hover:bg-[#2A2424] hover:text-white transition-colors text-center">
                  Routine recommandée
                </button>
              </div>
              <p className="text-xs text-[#2A2424]/50 mb-6 lg:mb-8">
                Gagnez <span className="font-bold text-[#E5B6B9]">34 points</span> avec cet achat.
              </p>
            </div>

            {/* Actions (Qty + Add to cart) */}
            {/* Sticky on mobile bottom edge optionally, but here we just layout well */}
            <div className="flex flex-col sm:flex-row items-center gap-3 lg:gap-4 mb-8 lg:mb-12 border-b border-[#F4EAEB] pb-8 lg:pb-12">
              <div className="flex items-center justify-between w-full sm:w-32 h-12 lg:h-14 rounded-full border border-[#F4EAEB] px-4 bg-[#FAFAF9]">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-[#2A2424]/50 hover:text-[#2A2424] transition-colors p-2"><Minus className="w-4 h-4" /></button>
                <span className="font-semibold text-[#2A2424]">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="text-[#2A2424]/50 hover:text-[#2A2424] transition-colors p-2"><Plus className="w-4 h-4" /></button>
              </div>
              <button className="w-full sm:flex-1 h-12 lg:h-14 rounded-full bg-[#E5B6B9] text-white font-semibold text-sm hover:bg-[#D4A5A8] transition-colors shadow-lg shadow-[#E5B6B9]/30">
                Ajouter au panier
              </button>
              <button className="hidden sm:flex w-12 h-12 lg:w-14 lg:h-14 rounded-full border border-[#F4EAEB] items-center justify-center text-[#2A2424]/50 hover:text-[#E5B6B9] hover:border-[#E5B6B9] bg-[#FAFAF9] hover:bg-white transition-colors shrink-0">
                <Heart className="w-5 h-5" />
              </button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 lg:gap-y-6 gap-x-4">
              {product.features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#FAFAF9] sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                  <div className="text-[#E5B6B9]">{f.icon}</div>
                  <span className="text-sm font-semibold text-[#2A2424]">{f.text}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* =========================================
            MIDDLE SECTION (Details & Reviews)
            ========================================= */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 mb-16 lg:mb-24">
          
          {/* --- LEFT: Tabs --- */}
          <div className="w-full lg:w-1/2">
            <h3 className="text-xl lg:text-2xl font-medium text-[#2A2424] mb-4 lg:mb-6">Détails du produit</h3>
            
            {/* Tabs Header */}
            <div className="flex items-center gap-6 lg:gap-8 border-b border-[#F4EAEB] mb-6 lg:mb-8 overflow-x-auto hide-scrollbar whitespace-nowrap">
              <button 
                onClick={() => setActiveTab("overview")}
                className={`pb-4 text-xs lg:text-sm font-bold uppercase tracking-wider transition-colors relative shrink-0 ${activeTab === "overview" ? "text-[#2A2424]" : "text-[#2A2424]/40"}`}
              >
                Aperçu global
                {activeTab === "overview" && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2A2424]" />}
              </button>
              <button 
                onClick={() => setActiveTab("shipment")}
                className={`pb-4 text-xs lg:text-sm font-bold uppercase tracking-wider transition-colors relative shrink-0 ${activeTab === "shipment" ? "text-[#2A2424]" : "text-[#2A2424]/40"}`}
              >
                Livraison & Retours
                {activeTab === "shipment" && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2A2424]" />}
              </button>
            </div>

            {/* Tabs Content */}
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-8">
                    <div className="bg-[#FAFAF9] p-4 rounded-[1rem] flex items-center gap-4 border border-[#F4EAEB]/50">
                      <div className="w-10 h-10 rounded-full bg-[#F4EAEB] flex items-center justify-center text-[#E5B6B9] shrink-0"><Sparkles className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#2A2424]/50 mb-0.5">Avantage</p>
                        <p className="text-sm font-semibold text-[#2A2424] leading-tight">Éclat instantané</p>
                      </div>
                    </div>
                    <div className="bg-[#FAFAF9] p-4 rounded-[1rem] flex items-center gap-4 border border-[#F4EAEB]/50">
                      <div className="w-10 h-10 rounded-full bg-[#F4EAEB] flex items-center justify-center text-[#E5B6B9] shrink-0"><CheckCircle2 className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#2A2424]/50 mb-0.5">Testé</p>
                        <p className="text-sm font-semibold text-[#2A2424] leading-tight">Dermatologiquement</p>
                      </div>
                    </div>
                    <div className="bg-[#FAFAF9] p-4 rounded-[1rem] flex items-center gap-4 border border-[#F4EAEB]/50">
                      <div className="w-10 h-10 rounded-full bg-[#F4EAEB] flex items-center justify-center text-[#E5B6B9] shrink-0"><Leaf className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#2A2424]/50 mb-0.5">Composition</p>
                        <p className="text-sm font-semibold text-[#2A2424] leading-tight">Vegan & Clean</p>
                      </div>
                    </div>
                    <div className="bg-[#FAFAF9] p-4 rounded-[1rem] flex items-center gap-4 border border-[#F4EAEB]/50">
                      <div className="w-10 h-10 rounded-full bg-[#F4EAEB] flex items-center justify-center text-[#E5B6B9] shrink-0"><Wind className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#2A2424]/50 mb-0.5">Texture</p>
                        <p className="text-sm font-semibold text-[#2A2424] leading-tight">Sérum léger</p>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-[#2A2424] mb-3">Note d'utilisation*</h4>
                  <p className="text-sm text-[#2A2424]/70 leading-relaxed mb-6">
                    Appliquez 2 à 3 gouttes sur une peau nettoyée et tonifiée. Massez doucement pour faire pénétrer. Complétez avec votre crème hydratante favorite pour verrouiller l'hydratation. Peut être utilisé matin et soir.
                  </p>
                  <button className="flex items-center gap-2 text-sm font-bold text-[#2A2424] hover:text-[#E5B6B9] transition-colors">
                    Voir les ingrédients complets <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
              
              {activeTab === "shipment" && (
                <motion.div 
                  key="shipment"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-[#FAFAF9] p-5 lg:p-6 rounded-[1.5rem] border border-[#F4EAEB]/50 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#F4EAEB] flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="w-4 h-4 text-[#E5B6B9]"/></div>
                      <div>
                        <h5 className="font-semibold text-[#2A2424] text-sm mb-1">Livraison standard (3-5 jours)</h5>
                        <p className="text-xs text-[#2A2424]/60 leading-relaxed">Gratuite pour toute commande supérieure à 35 000 FCFA.</p>
                      </div>
                    </div>
                    <div className="w-full h-px bg-[#F4EAEB]" />
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#F4EAEB] flex items-center justify-center shrink-0 mt-0.5"><Wind className="w-4 h-4 text-[#E5B6B9]"/></div>
                      <div>
                        <h5 className="font-semibold text-[#2A2424] text-sm mb-1">Livraison express (24h-48h)</h5>
                        <p className="text-xs text-[#2A2424]/60 leading-relaxed">Option disponible à l'étape du paiement pour 5 500 FCFA.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* --- RIGHT: Reviews --- */}
          <div className="w-full lg:w-1/2">
            <h3 className="text-xl lg:text-2xl font-medium text-[#2A2424] mb-6">Avis & Notes</h3>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:gap-8 mb-8 lg:mb-10 bg-[#FAFAF9] sm:bg-transparent p-6 sm:p-0 rounded-[1.5rem] sm:rounded-none">
              <div className="flex items-baseline gap-2">
                <span className="text-[3.5rem] lg:text-[4rem] font-bold text-[#2A2424] leading-none">4,9</span>
                <span className="text-xl lg:text-2xl font-semibold text-[#E5B6B9]">/5</span>
              </div>
              
              <div className="flex-1 w-full max-w-xs flex flex-col gap-2">
                {[5, 4, 3, 2, 1].map((star, i) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs font-bold text-[#2A2424] w-8">
                      {star} <Star className="w-3 h-3 fill-[#FFB800] text-[#FFB800]" />
                    </span>
                    <div className="flex-1 h-1.5 bg-[#F4EAEB] sm:bg-[#F4EAEB] bg-white rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#2A2424] rounded-full" 
                        style={{ width: i === 0 ? '85%' : i === 1 ? '10%' : i === 2 ? '3%' : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] lg:text-xs font-bold text-[#2A2424]/50 uppercase tracking-wider mb-6">({product.reviewsCount} Nouveaux Avis)</p>

            <div className="flex flex-col gap-6">
              {[1, 2].map((review) => (
                <div key={review} className="border-b border-[#F4EAEB] pb-6 last:border-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-[#2A2424] text-sm">Alexander Stewart</span>
                    <div className="flex items-center gap-2">
                      <div className="flex text-[#FFB800]">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-[#FFB800]" />)}
                      </div>
                      <span className="text-[10px] font-semibold text-[#2A2424]/40">• 02 Oct</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#2A2424]/70 leading-relaxed">
                    I love how lightweight this serum feels! It sets my skincare perfectly without making it look oily and gives me such a smooth, glowing finish.
                  </p>
                </div>
              ))}
            </div>
            
            <button className="w-full border border-[#F4EAEB] text-[#2A2424] font-semibold py-3.5 lg:py-3 rounded-full mt-4 hover:bg-[#FAFAF9] transition-colors text-sm">
              Voir tous les avis
            </button>
          </div>
        </div>

        {/* =========================================
            BOTTOM SECTION (Related Products)
            ========================================= */}
        <div>
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <h3 className="text-xl lg:text-2xl font-medium text-[#2A2424]">Les plus populaires</h3>
            <div className="hidden md:flex items-center gap-2">
              <button className="w-10 h-10 rounded-full border border-[#F4EAEB] flex items-center justify-center text-[#2A2424] hover:bg-[#F4EAEB] transition-colors">
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <button className="w-10 h-10 rounded-full border border-[#F4EAEB] flex items-center justify-center text-[#2A2424] hover:bg-[#F4EAEB] transition-colors">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 -mx-5 px-5 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible hide-scrollbar">
            {relatedProducts.map((prod) => (
              <div key={prod.id} className="snap-start shrink-0 w-[240px] lg:w-auto group flex flex-col bg-[#FAFAF9] rounded-[1.5rem] p-4 cursor-pointer border border-transparent hover:border-[#F4EAEB] transition-colors">
                <div className="relative w-full aspect-square rounded-[1rem] overflow-hidden mb-4 bg-white">
                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-4 h-4 text-[#E5B6B9]" />
                  </button>
                  {prod.tag && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] lg:text-[10px] font-bold tracking-wider uppercase text-[#E5B6B9]">
                      {prod.tag}
                    </div>
                  )}
                </div>
                <h4 className="font-semibold text-[#2A2424] mb-1 text-sm">{prod.name}</h4>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800]" />
                    <span className="text-xs font-bold text-[#2A2424]">{prod.rating}</span>
                    <span className="text-[10px] text-[#2A2424]/40">• {prod.sold} vendus</span>
                  </div>
                  <span className="font-bold text-[#2A2424] text-base">{prod.price.toLocaleString("fr-FR")} FCFA</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 lg:mt-8 flex justify-center">
            <button className="w-full sm:w-auto bg-[#E5B6B9] text-white px-8 py-4 lg:py-3 rounded-full font-semibold text-sm hover:bg-[#D4A5A8] transition-colors shadow-lg shadow-[#E5B6B9]/30">
              Voir tout le catalogue
            </button>
          </div>
        </div>

      </div>
      
      <Footer />

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
