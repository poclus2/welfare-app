import Link from "next/link";
import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";

const SHOP_WHATSAPP = "237640236304"; // same number as the order confirmation page

export function Footer({ dict }: { dict?: any }) {
  const t = dict || {
    joinListTitle: "Rejoignez la glow list.",
    joinListDesc: "Abonnez-vous pour obtenir 10% de réduction sur votre première routine, un accès exclusif aux nouveautés et des conseils soins de la peau.",
    emailPlaceholder: "Entrez votre email",
    subscribe: "S'abonner",
    about: "À Propos",
    ourStory: "Notre Histoire",
    help: "Aide",
    faq: "FAQ",
    shipping: "Livraison & Retours",
    trackOrder: "Suivre ma commande",
    privacy: "Politique de confidentialité",
    terms: "Conditions d'utilisation",
    rights: "© {year} The Welfare Shop. Tous droits réservés."
  };

  return (
    <footer className="w-full bg-[#1A1616] text-[#FDFDFC] pt-24 pb-12 flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-[1600px] mx-auto px-5 md:px-12">
        
        {/* Top Section: Newsletter & Brand */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 mb-24 border-b border-white/10 pb-20">
          
          {/* Brand & Newsletter */}
          <div className="max-w-xl">
            <Link href="/" className="flex items-center mb-8 group inline-flex hover:opacity-80 transition-opacity">
              <div className="bg-white rounded-full w-24 h-24 md:w-32 md:h-32 shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center p-3">
                <img 
                  src="/logo.webp" 
                  alt="The Welfare Shop" 
                  className="w-full h-full object-contain scale-[1.2]" 
                />
              </div>
            </Link>
            
            {/* The newsletter form is gone until it really subscribes someone (it used to do nothing) */}
            <h3 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
              Soins coréens, conseil personnalisé.
            </h3>
            <p className="text-white/60 mb-8 text-lg">
              Une question sur un produit, une commande ou votre routine ? Notre équipe vous répond sur WhatsApp.
            </p>
            <a
              href={`https://wa.me/${SHOP_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#E5B6B9] text-[#1A1616] px-7 py-4 rounded-full font-medium hover:bg-white transition-colors"
            >
              <WhatsappLogo className="w-5 h-5" />
              Nous écrire sur WhatsApp
            </a>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-24 w-full lg:w-auto">
            
            {/* Column 1 */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-2">Boutique</h4>
              <Link href="/shop/nettoyants" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Nettoyants</Link>
              <Link href="/shop/serums" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Sérums et ampoules</Link>
              <Link href="/shop/hydratants" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Hydratants</Link>
              <Link href="/shop/solaires" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Protections solaires</Link>
              <Link href="/marques" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Toutes les marques</Link>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-2">{t.about}</h4>
              <Link href="/skin-coach" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Skin Coach AI</Link>
              <Link href="/ambassadrices" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Programme créateurs</Link>
              <Link href="/learning-center" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Le Journal</Link>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-2">{t.help}</h4>
              <a href={`https://wa.me/${SHOP_WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Nous contacter</a>
              <Link href="/account" className="text-white/80 hover:text-[#E5B6B9] transition-colors">Mon compte</Link>
            </div>

          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/40 text-sm">
            {t.rights.replace("{year}", new Date().getFullYear().toString())}
          </p>
          
          {/* Social links: back once the shop gives its official accounts (TikTok, Instagram, Facebook) */}

          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/privacy" className="hover:text-white transition-colors">{t.privacy}</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
