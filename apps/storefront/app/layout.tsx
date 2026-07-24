import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/navbar";
import { AnnouncementBar } from "@/components/ui/announcement-bar";
import { CartProvider } from "@/lib/cart-context";
import { CartDrawer } from "@/components/cart/CartDrawer";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "The Welfare Shop - K-Beauty & Skincare",
  description: "Reveal your natural glow with pure skincare blends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans bg-background text-foreground antialiased flex flex-col min-h-screen`}>
        <CartProvider>
          <CartDrawer />
          <AnnouncementBar />
          <div className="sticky top-0 z-50">
            <Navbar />
          </div>
          <div className="flex-1 flex flex-col w-full">
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
