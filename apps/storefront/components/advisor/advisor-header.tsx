import Link from "next/link";
import { Headset, SignOut } from "@phosphor-icons/react/dist/ssr";
import { logoutAdvisor } from "@/app/conseillere/actions";
import { SK } from "@/components/ui/skin-coach/theme";

// Top of every page of the advisors' space: who is logged in, and logging out
export function AdvisorHeader({ name }: { name: string }) {
  return (
    <header className="flex items-center justify-between py-4 mb-2">
      <Link href="/conseillere" className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: SK.tint }}>
          <Headset className="w-5 h-5" style={{ color: SK.accent }} />
        </span>
        <span className="leading-tight">
          <span className="block text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: SK.muted }}>Espace conseillère</span>
          <span className="block text-[14px] font-bold">{name}</span>
        </span>
      </Link>
      <form action={logoutAdvisor}>
        <button type="submit" className="h-9 px-3 rounded-full flex items-center gap-1.5 text-[13px] font-bold" style={{ border: `1px solid ${SK.line}`, color: SK.muted }}>
          <SignOut className="w-4 h-4" /> Déconnexion
        </button>
      </form>
    </header>
  );
}
