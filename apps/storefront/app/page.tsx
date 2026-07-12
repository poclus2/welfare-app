import { AnnouncementBar } from "@/components/ui/announcement-bar";
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

export default function BentoPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col w-full overflow-hidden relative">
      <AnnouncementBar />
      <HeroSlider />
      <BrandMarquee />
      <CategoriesBento />
      <BestSellers />
      <SkinCoach />
      <PromotionsBento />
      <LoyaltyProgram />
      <LearningCenter />
      <Testimonials />
      <Footer />
    </main>
  );
}
