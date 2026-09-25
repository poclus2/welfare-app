import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/ui/navbar";
import { AnnouncementBar } from "@/components/ui/announcement-bar";
import { CartProvider } from "@/lib/cart-context";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { PageProgress } from "@/components/ui/page-progress";
import { ChatWidget } from "@/components/ui/chat-widget";
import { PostHogProvider } from "@/providers/PostHogProvider";
import { getLocale } from "@/lib/dictionary";
import frDict from "@/dictionaries/fr.json";
import enDict from "@/dictionaries/en.json";
import { I18nProvider } from "@/lib/i18n-context";

export const metadata: Metadata = {
  title: "The Welfare Shop - K-Beauty & Skincare",
  description: "Reveal your natural glow with pure skincare blends.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dictionaries = { fr: frDict, en: enDict };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans bg-background text-foreground antialiased flex flex-col min-h-screen" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        <PostHogProvider>
          <I18nProvider initialLocale={locale} dictionaries={dictionaries}>
            <CartProvider>
              {/* Progress bar wraps useSearchParams */}
              <Suspense fallback={null}>
                <PageProgress />
              </Suspense>
              <CartDrawer />
              <AnnouncementBar />
              <div className="sticky top-0 z-[100]">
                <Navbar />
              </div>
              <div className="flex-1 flex flex-col w-full">
                {children}
              </div>
              <ChatWidget />
            </CartProvider>
          </I18nProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
