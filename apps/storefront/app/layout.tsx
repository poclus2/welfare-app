import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";
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
  metadataBase: new URL("https://thewelfarecm.com"),
  title: "The Welfare Shop - K-Beauty & Skincare",
  description: "Reveal your natural glow with pure skincare blends.",
  icons: {
    icon: "/icon.webp",
  },
  openGraph: {
    title: "The Welfare Shop - K-Beauty & Skincare",
    description: "Reveal your natural glow with pure skincare blends.",
    images: [{ url: "/opengraph-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/twitter-image.png"],
  },
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
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
      <body className="font-sans bg-background text-foreground antialiased flex flex-col min-h-screen" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        <PostHogProvider>
          <I18nProvider initialLocale={locale} dictionaries={dictionaries}>
            <CartProvider>
              {/* Progress bar wraps useSearchParams */}
              <Suspense fallback={null}>
                <PageProgress />
              </Suspense>
              <CartDrawer />
              <SiteChrome />
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
