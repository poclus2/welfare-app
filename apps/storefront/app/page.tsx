import { HeroSlider } from "@/components/home/hero-slider";
import { BrandMarquee } from "@/components/home/brand-marquee";
import { CategoriesBento } from "@/components/home/categories-bento";
import { BestSellers } from "@/components/home/bestsellers";
import { SkinCoach } from "@/components/home/skin-coach";
import { PromotionsBento } from "@/components/home/promotions-bento";
import { LoyaltyProgram } from "@/components/home/loyalty";
import { LearningCenter } from "@/components/home/learning-center";
import { Testimonials } from "@/components/home/testimonials";
import { Footer } from "@/components/home/footer";
import { sdk } from "@/lib/medusa";
import { getDictionary } from "@/lib/dictionary";

export default async function BentoPage() {
  const dict = await getDictionary();
  let products: any[] = [];
  try {
    const { regions } = await sdk.store.region.list().catch(() => ({ regions: [] }));
    const regionId = regions?.[0]?.id;

    const queryParams: any = { limit: 8, fields: "+variants,*images,*categories" };
    if (regionId) {
      queryParams.region_id = regionId;
      queryParams.fields += ",*variants.prices,*variants.calculated_price";
    }

    const { products: fetchedProducts } = await sdk.store.product.list(
      queryParams,
      { next: { revalidate: 60 } } as any
    );
    
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
        oldPrice: null,
        rating: 4.8,
        reviews: 120,
        image: imageUrl,
        badge: "Meilleure vente",
      };
    });
  } catch (error) {
    console.error("Failed to fetch home bestsellers:", error);
  }

  return (
    <main className="flex flex-col w-full overflow-hidden relative">
      <HeroSlider dict={dict.home} />
      <BrandMarquee />
      <CategoriesBento />
      <BestSellers products={products} />
      <SkinCoach />
      <PromotionsBento />
      <LoyaltyProgram />
      <LearningCenter />
      <Testimonials />
      <Footer dict={dict.footer} />
    </main>
  );
}
