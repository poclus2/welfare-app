import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-[#1A1616] text-[#FDFDFC] pt-24 pb-12 flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-[1600px] mx-auto px-8 md:px-12">
        
        {/* Top Section: Newsletter & Brand */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 mb-24 border-b border-white/10 pb-20">
          
          {/* Brand & Newsletter */}
          <div className="max-w-xl">
            <Link href="/" className="flex items-center mb-8 group inline-flex bg-white/5 rounded-[2rem] p-4 hover:bg-white/10 transition-colors">
              <img 
                src="/logo.png" 
                alt="The Welfare Shop" 
                className="h-28 md:h-40 lg:h-[160px] w-auto object-contain group-hover:scale-105 transition-transform" 
                style={{ filter: "brightness(0) invert(1)" }} 
              />
            </Link>
            
            <h3 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
              Rejoignez la glow list.
            </h3>
            <p className="text-white/60 mb-8 text-lg">
              Abonnez-vous pour obtenir 10% de réduction sur votre première routine, un accès exclusif aux nouveautés et des conseils soins de la peau.
            </p>
            
            <form className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <input 
                type="email" 
                placeholder="Entrez votre email" 
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#E5B6B9] transition-colors"
                required
              />
              <button 
                type="submit" 
                className="bg-[#E5B6B9] text-[#1A1616] px-8 py-4 rounded-full font-medium hover:bg-white transition-colors flex items-center justify-center gap-2"
              >
                S'abonner
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-24 w-full lg:w-auto">
            
            {/* Column 1 */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-2">Boutique</h4>
              <Link href="/shop/serums" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Sérums & Ampoules</Link>
              <Link href="/shop/moisturizers" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Hydratants</Link>
              <Link href="/shop/cleansers" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Nettoyants & Toners</Link>
              <Link href="/shop/sunscreens" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Protections Solaires</Link>
              <Link href="/shop/masks" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Masques & Traitements</Link>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-2">À propos</h4>
              <Link href="/about" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Notre Histoire</Link>
              <Link href="/journal" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Le Journal</Link>
              <Link href="/sekoria" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Gamme Sekoria</Link>
              <Link href="/coach" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Skin Coach IA</Link>
              <Link href="/contact" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Nous Contacter</Link>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-2">Aide</h4>
              <Link href="/faq" className="text-white/80 hover:text-[#E5B6B9] transition-colors">FAQ</Link>
              <Link href="/shipping" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Livraison & Retours</Link>
              <Link href="/track" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Suivre ma commande</Link>
              <Link href="/dashboard" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Mon Compte</Link>
            </div>

          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} The Welfare Shop. Tous droits réservés.
          </p>
          
          <div className="flex items-center gap-6">
            <Link href="#" className="text-white/40 hover:text-white transition-colors text-sm font-medium">IG</Link>
            <Link href="#" className="text-white/40 hover:text-white transition-colors text-sm font-medium">X</Link>
            <Link href="#" className="text-white/40 hover:text-white transition-colors text-sm font-medium">TT</Link>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/privacy" className="hover:text-white transition-colors">Politique de confidentialité</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Conditions d'utilisation</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
