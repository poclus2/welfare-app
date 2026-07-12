import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

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
      <body className={`${jakarta.variable} font-sans bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  );
}
