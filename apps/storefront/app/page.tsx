import { HeroSlider, type HomeBanner } from "@/components/home/hero-slider";
import { BrandMarquee } from "@/components/home/brand-marquee";
import { CategoriesBento } from "@/components/home/categories-bento";
import { BestSellers } from "@/components/home/bestsellers";
import { SkinCoach } from "@/components/home/skin-coach";
import { SekoriaTeaser } from "@/components/home/sekoria-teaser";
import { LoyaltyProgram } from "@/components/home/loyalty";
import { Audiences } from "@/components/home/audiences";
import { Footer } from "@/components/home/footer";
import { sdk } from "@/lib/medusa";
import { getDictionary } from "@/lib/dictionary";
import { BOUTIQUE_BESTSELLER_IDS } from "@/lib/home-bestsellers";

// Slides edited from the admin (Bannières d'accueil); cached a minute like the rest of the page
async function fetchHomeBanners(): Promise<HomeBanner[]> {
  try {
    const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
    const res = await fetch(`${medusaUrl}/store/home-banners`, {
      headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`home-banners responded ${res.status}`);
    const data = await res.json();
    return data.home_banners || [];
  } catch (error) {
    console.error("Failed to fetch home banners:", error);
    return [];
  }
}

export default async function BentoPage() {
  const dict = await getDictionary();
  const bannersPromise = fetchHomeBanners();
  let products: any[] = [];
  try {
    const { regions } = await sdk.store.region.list().catch(() => ({ regions: [] }));
    const regionId = regions?.[0]?.id;

    const queryParams: any = { limit: 8, fields: "+variants,*images,*categories,*collection" };
    if (BOUTIQUE_BESTSELLER_IDS.length > 0) queryParams.id = BOUTIQUE_BESTSELLER_IDS.slice(0, 8);
    if (regionId) {
      queryParams.region_id = regionId;
      queryParams.fields += ",*variants.prices,*variants.calculated_price";
    }

    const { products: fetchedProducts } = await sdk.store.product.list(
      queryParams,
      { next: { revalidate: 60 } } as any
    );
    
    const order = new Map(BOUTIQUE_BESTSELLER_IDS.map((id, i) => [id, i]));
    if (order.size > 0) fetchedProducts.sort((a: any, b: any) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));

    products = fetchedProducts.map((p: any) => {
      const imageUrl = p.images && p.images.length > 0 ? p.images[0].url : p.thumbnail || "/products/1.webp";
      const price = p.variants?.[0]?.calculated_price?.calculated_amount
        || p.variants?.[0]?.prices?.[0]?.amount
        || 15000;
      
      return {
        id: p.id,
        name: p.title,
        category: p.categories?.[0]?.name || "Soin",
        brand: p.collection?.title || "",
        price: price,
        image: imageUrl,
        variantId: p.variants?.[0]?.id,
      };
    });
  } catch (error) {
    console.error("Failed to fetch home bestsellers:", error);
  }

  const banners = await bannersPromise;

  return (
    <main className="flex flex-col w-full overflow-hidden relative">
      <HeroSlider banners={banners} />
      <BrandMarquee />
      <CategoriesBento />
      <BestSellers products={products} />
      <SkinCoach />
      <SekoriaTeaser />
      <LoyaltyProgram />
      <Audiences />
      {/* Testimonials: back with real customer messages (WhatsApp screenshots) once the shop sends them */}
      <Footer dict={dict.footer} />
    </main>
  );
}
