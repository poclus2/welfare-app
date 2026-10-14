"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, SpeakerHigh } from "@phosphor-icons/react";
import posthog from "posthog-js";
import { DISPLAY_FONT, SK } from "./theme";

// "Écouter ma routine": the routine read aloud, generated on the first tap only (app/api/skin-coach/audio)
type State = "idle" | "loading" | "ready" | "error";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function RoutineAudioPlayer({ audio, scanId }: { audio: { script: string; sig: string }; scanId?: string }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const estimate = Math.max(30, Math.round(audio.script.length / 15)); // ~15 characters per second

  useEffect(() => () => {
    audioRef.current?.pause();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const load = async () => {
    setState("loading");
    setError("");
    posthog.capture("skin_coach_audio_requested", { scan_id: scanId });
    try {
      const res = await fetch("/api/skin-coach/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(audio),
      });
      if (!res.ok) {
        const code = (await res.json().catch(() => ({}))).error;
        throw new Error(code === "rate" ? "Trop de demandes pour le moment, réessayez dans un moment." : "L'audio n'a pas pu être préparé. Réessayez.");
      }
      const url = URL.createObjectURL(await res.blob());
      urlRef.current = url;
      const el = new Audio(url);
      el.onloadedmetadata = () => setDuration(el.duration || 0);
      el.ontimeupdate = () => setTime(el.currentTime);
      el.onplay = () => setPlaying(true);
      el.onpause = () => setPlaying(false);
      el.onended = () => { setPlaying(false); posthog.capture("skin_coach_audio_finished", { scan_id: scanId }); };
      audioRef.current = el;
      setState("ready");
      await el.play().catch(() => {}); // some browsers want a second tap
    } catch (e: any) {
      setError(e?.message || "L'audio n'a pas pu être préparé. Réessayez.");
      setState("error");
    }
  };

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return load();
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    el.currentTime = Math.min(duration, Math.max(0, ((e.clientX - rect.left) / rect.width) * duration));
  };

  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <div className="rounded-[22px] p-3.5 flex items-center gap-3.5 print:hidden" style={{ background: SK.surface, border: `1px solid ${SK.line}` }}>
      <button
        onClick={state === "loading" ? undefined : toggle}
        aria-label={playing ? "Mettre en pause" : "Écouter ma routine"}
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform"
        style={{ background: SK.accent }}
      >
        {state === "loading" ? (
          <span className="w-5 h-5 rounded-full animate-spin" style={{ border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "#FFFFFF" }} />
        ) : playing ? (
          <Pause className="w-5 h-5 text-white" weight="fill" />
        ) : (
          <Play className="w-5 h-5 text-white" weight="fill" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {state === "ready" ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] font-bold" style={{ color: SK.ink }}>Votre routine, à écouter</span>
              <span className="text-[12px] font-semibold tabular-nums" style={{ color: SK.muted }}>
                {fmt(time)} / {fmt(duration || estimate)}
              </span>
            </div>
            <div
              role="slider"
              aria-label="Position dans l'audio"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(time)}
              tabIndex={0}
              onClick={seek}
              className="h-2 rounded-full cursor-pointer"
              style={{ background: SK.track }}
            >
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${SK.accentLight}, ${SK.accent})` }} />
            </div>
          </>
        ) : (
          <button onClick={state === "loading" ? undefined : load} className="text-left w-full">
            <span className="flex items-center gap-1.5 text-[15px] font-bold" style={{ color: SK.ink, fontFamily: DISPLAY_FONT }}>
              <SpeakerHigh className="w-4 h-4" style={{ color: SK.accent }} />
              {state === "loading" ? "Préparation de l'audio…" : "Écouter ma routine"}
            </span>
            <span className="block text-[13px] mt-0.5" style={{ color: state === "error" ? SK.accent : SK.muted }}>
              {state === "error" ? error : state === "loading" ? "Quelques secondes, votre Skin Coach prend la parole" : `Environ ${Math.max(1, Math.round(estimate / 60))} min · lu par votre Skin Coach`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
