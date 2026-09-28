"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/ui/navbar";
import { AnnouncementBar } from "@/components/ui/announcement-bar";

// Auth pages get a full-bleed, immersive layout of their own —
// the standard announcement bar / navbar would duplicate their branding.
const CHROME_HIDDEN_ROUTES = ["/account/login", "/account/register"];

export function SiteChrome() {
  const pathname = usePathname();

  if (CHROME_HIDDEN_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    <>
      <AnnouncementBar />
      <div className="sticky top-0 z-[100]">
        <Navbar />
      </div>
    </>
  );
}
