"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ScanBarcode, ImagePlus, X, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { checkBarcode, normalizeBarcode } from "@/lib/barcode";

// Barcode input for the product form. Three ways in: a USB/Bluetooth scanner (it types into the field
// like a keyboard), the camera ("Scanner"), or a photo of the barcode (when no camera is available).
// Decoding is done in the browser by ZXing: no AI, no server round trip.

export type BarcodeStatus = {
  check: ReturnType<typeof checkBarcode>["kind"];
  duplicates: { variant_id: string; product_id: string; product_title: string }[];
  checking: boolean;
};

async function createReader() {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import("@zxing/browser"),
    import("@zxing/library"),
  ]);
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints);
}

function ScannerModal({ onResult, onClose }: { onResult: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  // The camera is started once: a new onResult on each parent render must not restart it
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    let controls: { stop: () => void } | null = null;
    let done = false;
    (async () => {
      try {
        const reader = await createReader();
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } } },
          videoRef.current!,
          (result) => {
            if (!result || done) return;
            done = true;
            navigator.vibrate?.(80);
            controls?.stop();
            onResultRef.current(result.getText());
          }
        );
        if (done) controls.stop();
      } catch (e: any) {
        const denied = e?.name === "NotAllowedError" || e?.name === "SecurityError";
        const none = e?.name === "NotFoundError" || e?.name === "OverconstrainedError";
        setError(
          denied
            ? "Accès à la caméra refusé. Autorisez la caméra pour ce site dans le navigateur, ou importez une photo du code-barres."
            : none
              ? "Aucune caméra disponible sur cet appareil. Utilisez une douchette ou importez une photo du code-barres."
              : "Impossible de démarrer la caméra."
        );
      }
    })();
    return () => {
      done = true;
      controls?.stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#EDE0E0]">
          <p className="text-sm font-bold text-[#2A2424]">Scanner le code-barres</p>
          <button type="button" onClick={onClose} className="p-1 text-[#2A2424]/50 hover:text-[#2A2424]" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>
        {error ? (
          <p className="p-5 text-sm text-red-600">{error}</p>
        ) : (
          <div className="relative bg-black aspect-[4/3]">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            {/* aiming guide */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-white/80 rounded-lg pointer-events-none" />
            <div className="absolute inset-x-10 top-1/2 h-px bg-red-500/80 pointer-events-none" />
          </div>
        )}
        <p className="px-4 py-3 text-[11px] text-[#2A2424]/50">Placez le code-barres dans le cadre, à 10-15 cm, bien éclairé. La lecture est automatique.</p>
      </div>
    </div>
  );
}

export function BarcodeField({
  value,
  onChange,
  onStatus,
  excludeVariantId,
  label = "Code-barres (EAN)",
  compact = false,
  inputClass,
  labelClass,
}: {
  value: string;
  onChange: (v: string) => void;
  onStatus?: (s: BarcodeStatus) => void;
  excludeVariantId?: string;
  label?: string;
  compact?: boolean;
  inputClass: string;
  labelClass: string;
}) {
  const [scanning, setScanning] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [duplicates, setDuplicates] = useState<BarcodeStatus["duplicates"]>([]);
  const [checking, setChecking] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const code = normalizeBarcode(value);
  const check = checkBarcode(value).kind;

  // Duplicate lookup once the code looks complete
  useEffect(() => {
    setDuplicates([]);
    if (check !== "gtin" && check !== "other") return;
    let cancelled = false;
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ code });
        if (excludeVariantId) qs.set("exclude", excludeVariantId);
        const res = await fetch(`/api/products/barcode-check?${qs}`);
        const data = await res.json();
        if (!cancelled) setDuplicates(Array.isArray(data.matches) ? data.matches : []);
      } catch {
        // The check is a convenience: saving still works if it fails
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
      setChecking(false);
    };
  }, [code, check, excludeVariantId]);

  // Reported only when the status itself changes (an inline onStatus must not re-trigger it)
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;
  useEffect(() => {
    onStatusRef.current?.({ check, duplicates, checking });
  }, [check, duplicates, checking]);

  const decodePhoto = async (file?: File) => {
    if (!file) return;
    setPhotoError("");
    setDecoding(true);
    const url = URL.createObjectURL(file);
    try {
      const reader = await createReader();
      const result = await reader.decodeFromImageUrl(url);
      onChange(result.getText());
    } catch {
      setPhotoError("Aucun code-barres lisible sur cette photo : recadrez au plus près du code, sans reflet.");
    } finally {
      URL.revokeObjectURL(url);
      setDecoding(false);
    }
  };

  const btn =
    "shrink-0 flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-bold border border-[#EDE0E0] bg-white text-[#2A2424] hover:bg-[#F5F0EB] transition-colors";

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          // A USB scanner "types" the code then presses Enter: keep that from submitting the form
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          placeholder="Scannez ou saisissez le code"
          className={inputClass + " font-mono tracking-wider"}
        />
        <button type="button" onClick={() => setScanning(true)} className={btn} title="Scanner avec la caméra">
          <ScanBarcode className="w-4 h-4" />
          {!compact && <span className="hidden sm:inline">Scanner</span>}
        </button>
        <button type="button" onClick={() => photoRef.current?.click()} className={btn} title="Lire le code-barres sur une photo" disabled={decoding}>
          {decoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        </button>
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { decodePhoto(e.target.files?.[0]); e.target.value = ""; }} />
      </div>

      <div className="mt-1 space-y-1 text-[11px]">
        {check === "gtin" && !checking && duplicates.length === 0 && (
          <p className="flex items-center gap-1 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> Code EAN/UPC valide</p>
        )}
        {check === "bad_checksum" && (
          <p className="flex items-center gap-1 text-red-600"><AlertTriangle className="w-3.5 h-3.5" /> Clé de contrôle incorrecte : un chiffre est faux, scannez à nouveau.</p>
        )}
        {check === "other" && (
          <p className="flex items-center gap-1 text-amber-700"><AlertTriangle className="w-3.5 h-3.5" /> Ce n&apos;est pas un code EAN/UPC : vérifiez qu&apos;il est identique dans Odoo.</p>
        )}
        {checking && <p className="flex items-center gap-1 text-[#2A2424]/40"><Loader2 className="w-3 h-3 animate-spin" /> Vérification des doublons…</p>}
        {duplicates.map((d) => (
          <p key={d.variant_id} className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Déjà utilisé par « {d.product_title} » —{" "}
              <Link href={`/dashboard/products/${d.product_id}`} className="underline font-bold" target="_blank">ouvrir la fiche</Link>
            </span>
          </p>
        ))}
        {photoError && <p className="text-red-600">{photoError}</p>}
      </div>

      {scanning && (
        <ScannerModal
          onClose={() => setScanning(false)}
          onResult={(text) => {
            setScanning(false);
            onChange(text);
          }}
        />
      )}
    </div>
  );
}
