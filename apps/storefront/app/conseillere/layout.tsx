import type { Metadata } from "next";
import { SK } from "@/components/ui/skin-coach/theme";

// The skin advisors' space (client request, 2026-10-18): the scans given to each advisor, to read and to
// validate or correct. Separate from the admin; not for search engines.
export const metadata: Metadata = {
  title: "Espace conseillère · The Welfare",
  robots: { index: false, follow: false },
};

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 w-full" style={{ background: SK.ground, color: SK.ink }}>
      {children}
    </div>
  );
}
