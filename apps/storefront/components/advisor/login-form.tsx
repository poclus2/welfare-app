"use client";

import { useActionState } from "react";
import { CircleNotch, Headset } from "@phosphor-icons/react";
import { loginAdvisor, type LoginState } from "@/app/conseillere/actions";
import { DISPLAY_FONT, SK } from "@/components/ui/skin-coach/theme";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAdvisor, {});

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-10">
      <form action={action} className="w-full max-w-sm rounded-[26px] p-6 flex flex-col gap-4" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: SK.tint }}>
            <Headset className="w-6 h-6" style={{ color: SK.accent }} />
          </span>
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: SK.muted }}>The Welfare</p>
            <h1 style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.1 }}>Espace conseillère</h1>
          </div>
        </div>
        <input type="hidden" name="next" value={next} />
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold" style={{ color: SK.muted }}>Numéro WhatsApp</span>
          <input name="whatsapp" inputMode="tel" autoComplete="username" required placeholder="6 90 12 34 56" className="h-12 px-4 rounded-2xl text-[16px] outline-none" style={{ border: `1px solid ${SK.line}` }} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold" style={{ color: SK.muted }}>Mot de passe</span>
          <input name="password" type="password" autoComplete="current-password" required className="h-12 px-4 rounded-2xl text-[16px] outline-none" style={{ border: `1px solid ${SK.line}` }} />
        </label>
        {state.error && <p className="text-[14px] font-semibold" style={{ color: "#B42318" }}>{state.error}</p>}
        <button type="submit" disabled={pending} className="h-[52px] rounded-full flex items-center justify-center gap-2 text-[15px] font-bold text-white disabled:opacity-60" style={{ background: SK.accent }}>
          {pending && <CircleNotch className="w-5 h-5 animate-spin" />} Se connecter
        </button>
        <p className="text-[12px] leading-relaxed text-center" style={{ color: SK.muted }}>
          Mot de passe oublié ? Demandez-en un nouveau à la boutique.
        </p>
      </form>
    </div>
  );
}
