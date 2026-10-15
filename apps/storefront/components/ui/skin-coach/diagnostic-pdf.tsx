// The diagnostic as a real A4 PDF, downloaded in one tap (owner's choice, 2026-10-15: printing the web
// page went through the browser's print window and printed the site's header). Loaded only when she
// taps the button (dynamic import), so the PDF library never weighs on the result page.
// No "use client" here: with it, Next treated the module as a client entry and evaluated it while
// rendering the page on the server, which loaded the Node build of react-pdf (missing pdfkit files).

import { Document, Font, Image, Page, Path, Circle, Svg, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { FaceMap, FaceZone } from "@/lib/face-map";

const C = {
  accent: "#E0187C",
  accentLight: "#F7B6D4",
  tint: "#FCEAF3",
  ground: "#FBF8F9",
  line: "#EFDDE5",
  lineSoft: "#F3E7EC",
  track: "#F6ECF0",
  ink: "#2A2424",
  muted: "#6E5F5B",
  green: "#0B6B45",
};

export type PdfLevel = { label: string; level: string; thirds: 1 | 2 | 3; hint: string };
export type PdfStep = { stepName: string; productTitle: string; brand?: string; price?: string; imageUrl?: string; why?: string };
export type PdfMarker = { zone: FaceZone; title: string; text: string };
export type PdfInput = {
  firstName?: string;
  date: Date;
  skinType: string;
  phototype?: string;
  concerns: string[];
  levels: PdfLevel[];
  message: string;
  notices: { kind: string; text: string }[];
  reviewed?: "validated" | "corrected";
  face?: { photo: string; map: FaceMap; markers: PdfMarker[] };
  routine: PdfStep[];
  total?: string;
};

// ─── fonts ───────────────────────────────────────────────────────────────────
let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  const base = `${window.location.origin}/fonts`;
  Font.register({ family: "Urbanist", fonts: [{ src: `${base}/Urbanist-Light.ttf`, fontWeight: 300 }, { src: `${base}/Urbanist-Bold.ttf`, fontWeight: 700 }] });
  Font.register({
    family: "Jakarta",
    fonts: [
      { src: `${base}/PlusJakartaSans-Regular.ttf`, fontWeight: 400 },
      { src: `${base}/PlusJakartaSans-SemiBold.ttf`, fontWeight: 600 },
      { src: `${base}/PlusJakartaSans-Bold.ttf`, fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]); // no hyphenation: French words were cut oddly
  fontsReady = true;
}

// emojis are not in the fonts (they would print as empty boxes)
const noEmoji = (s: string) => (s || "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "").replace(/[ \t]{2,}/g, " ").trim();

// ─── images: everything becomes a PNG/JPEG data URL drawn in the browser ────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function toPng(src: string, maxSide = 320): Promise<string | undefined> {
  try {
    const img = await loadImage(src);
    const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * s);
    canvas.height = Math.round(img.naturalHeight * s);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch {
    return undefined;
  }
}

// product photos come through this site (the API's images can't be read cross-origin)
const viaSite = (url: string) => (url.startsWith("data:") || url.startsWith("/") ? url : `/api/skin-coach/image?src=${encodeURIComponent(url)}`);

// her photo framed on her face, with the dotted mesh and the labelled zones, as on the result page
async function renderFace(face: NonNullable<PdfInput["face"]>): Promise<string | undefined> {
  try {
    const img = await loadImage(face.photo);
    const W = 600, H = 720;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const iw = img.naturalWidth, ih = img.naturalHeight, box = face.map.box;
    const s = Math.max((0.6 * H) / ((box.y1 - box.y0) * ih), W / iw, H / ih);
    const clamp = (v: number, min: number) => Math.min(0, Math.max(min, v));
    const tx = clamp(W / 2 - ((box.x0 + box.x1) / 2) * iw * s, W - iw * s);
    const ty = clamp(H * 0.54 - ((box.y0 + box.y1) / 2) * ih * s, H - ih * s);
    ctx.drawImage(img, tx, ty, iw * s, ih * s);
    const px = ([x, y]: [number, number]) => [tx + x * iw * s, ty + y * ih * s] as const;

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (const p of face.map.mesh) {
      const [x, y] = px(p);
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // corners
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    const k = 44, m = 24;
    for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]] as const) {
      ctx.beginPath();
      ctx.moveTo(x, y + dy * k);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dx * k, y);
      ctx.stroke();
    }
    // zones
    ctx.font = "600 22px sans-serif";
    for (const mk of face.markers) {
      const [x, y] = px(face.map.zones[mk.zone]);
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      const label = `${mk.title} · ${mk.text}`;
      const w = ctx.measureText(label).width + 28;
      const below = mk.zone !== "forehead" && mk.zone !== "nose";
      let lx = below ? x - 60 : x + 18;
      const ly = below ? y + 22 : y - 22;
      if (lx + w > W - 12) lx = below ? W - 12 - w : x - 18 - w;
      lx = Math.max(12, lx);
      ctx.fillStyle = "rgba(255,255,255,0.93)";
      ctx.beginPath();
      ctx.roundRect(lx, ly, w, 44, 16);
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.fillText(label, lx + 14, ly + 30);
    }
    return canvas.toDataURL("image/jpeg", 0.86);
  } catch {
    return undefined;
  }
}

// ─── document ───────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 56, paddingHorizontal: 38, backgroundColor: "#FFFFFF", fontFamily: "Jakarta", fontSize: 10.5, color: C.ink },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  eyebrow: { fontSize: 8.5, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: C.muted },
  title: { fontFamily: "Urbanist", fontSize: 30, lineHeight: 1.08, fontWeight: 300 },
  chip: { paddingVertical: 4, paddingHorizontal: 9, borderRadius: 10, borderWidth: 1, borderColor: C.line, fontSize: 9, fontWeight: 600, marginRight: 5, marginBottom: 5 },
  card: { borderWidth: 1, borderColor: C.lineSoft, borderRadius: 14, padding: 12, backgroundColor: "#FFFFFF" },
  h2: { fontFamily: "Urbanist", fontSize: 21, fontWeight: 300, marginBottom: 10 },
  footer: { position: "absolute", left: 38, right: 38, bottom: 24, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: C.muted },
});

function Ring({ thirds, size = 58 }: { thirds: 1 | 2 | 3; size?: number }) {
  const sw = 6;
  const r = (size - sw) / 2;
  const cx = size / 2, cy = size / 2;
  const f = thirds / 3;
  const a = -Math.PI / 2 + f * Math.PI * 2;
  const ex = cx + r * Math.cos(a), ey = cy + r * Math.sin(a);
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r} stroke={C.track} strokeWidth={sw} fill="none" />
      {f >= 1 ? (
        <Circle cx={cx} cy={cy} r={r} stroke={C.accent} strokeWidth={sw} fill="none" />
      ) : (
        <Path d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${ex} ${ey}`} stroke={C.accent} strokeWidth={sw} fill="none" strokeLinecap="round" />
      )}
    </Svg>
  );
}

function TitleSplit({ light, bold, size = 21 }: { light: string; bold: string; size?: number }) {
  return (
    <Text style={[st.h2, { fontSize: size }]}>
      {light} <Text style={{ fontWeight: 700, color: C.accent }}>{bold}</Text>
    </Text>
  );
}

function DiagnosticDocument({ d, logo, faceImage, images }: { d: PdfInput; logo?: string; faceImage?: string; images: (string | undefined)[] }) {
  const words = d.skinType.trim().split(/\s+/);
  const light = words.length > 2 ? words.slice(0, 2).join(" ") : "";
  const bold = words.length > 2 ? words.slice(2).join(" ") : d.skinType;
  const date = d.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const footer = (
    <View style={st.footer} fixed>
      <Text>The Welfare · thewelfarecm.com</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  );

  return (
    <Document title={`Diagnostic de peau – ${date}`} author="The Welfare" subject="Diagnostic Skin Coach">
      <Page size="A4" style={st.page}>
        <View style={st.header}>
          {logo ? <Image src={logo} style={{ height: 40, width: 40, objectFit: "contain" }} /> : <Text style={{ fontFamily: "Urbanist", fontWeight: 700, fontSize: 16 }}>The Welfare</Text>}
          <View style={{ alignItems: "flex-end" }}>
            <Text style={st.eyebrow}>Diagnostic de peau · Skin Coach</Text>
            <Text style={{ fontSize: 10, marginTop: 3 }}>{date}</Text>
          </View>
        </View>

        {d.firstName ? <Text style={[st.eyebrow, { marginBottom: 6 }]}>Pour {d.firstName}</Text> : null}
        <Text style={st.title}>
          {light ? `${light} ` : ""}
          <Text style={{ fontWeight: 700, color: C.accent }}>{bold}</Text>
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10, marginBottom: 16 }}>
          {d.phototype ? <Text style={st.chip}>Phototype · {d.phototype}</Text> : null}
          {d.concerns.slice(0, 5).map((c) => <Text key={c} style={st.chip}>{c}</Text>)}
        </View>

        <View style={{ flexDirection: "row", marginBottom: 16 }}>
          {faceImage ? (
            <View style={{ width: 196, marginRight: 14 }}>
              <Image src={faceImage} style={{ width: 196, height: 235, borderRadius: 14 }} />
              <Text style={{ fontSize: 7.5, color: C.muted, marginTop: 4 }}>Zones indicatives : la lumière et les ombres peuvent tromper la photo.</Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <TitleSplit light="Ce que montrent" bold="vos photos" size={18} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
              {d.levels.map((l) => (
                <View key={l.label} style={[st.card, { width: faceImage ? "48.5%" : "31.5%", alignItems: "center", marginBottom: 8, paddingVertical: 9 }]} wrap={false}>
                  <Text style={{ fontSize: 8.5, fontWeight: 600, color: C.muted, alignSelf: "flex-start" }}>{l.label}</Text>
                  <View style={{ position: "relative", width: 58, height: 58, marginVertical: 5 }}>
                    <Ring thirds={l.thirds} />
                    <View style={{ position: "absolute", top: 0, left: 0, width: 58, height: 58, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 8, fontWeight: 700, textAlign: "center" }}>{l.level}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 7.5, color: C.muted, textAlign: "center" }}>{l.hint}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {d.reviewed ? (
          <View style={{ backgroundColor: "#EEF6F1", borderRadius: 12, padding: 10, marginBottom: 12 }} wrap={false}>
            <Text style={{ fontSize: 10, fontWeight: 700, color: C.green }}>
              {d.reviewed === "corrected" ? "Routine revue par une conseillère The Welfare" : "Routine validée par une conseillère The Welfare"}
            </Text>
          </View>
        ) : null}

        <View style={{ backgroundColor: C.tint, borderRadius: 16, padding: 16, marginBottom: 12 }} wrap={false}>
          <Text style={{ fontFamily: "Urbanist", fontSize: 28, fontWeight: 700, color: C.accent, lineHeight: 0.8, marginBottom: 2 }}>“</Text>
          <Text style={{ fontFamily: "Urbanist", fontSize: 13.5, lineHeight: 1.45, fontWeight: 300 }}>{noEmoji(d.message)}</Text>
          <Text style={{ fontSize: 9, fontWeight: 600, color: C.muted, marginTop: 8 }}>Votre Skin Coach</Text>
        </View>

        {d.notices.map((n, i) => (
          <View key={i} style={[st.card, { marginBottom: 8, borderColor: n.kind === "referral" ? C.accent : C.lineSoft }]} wrap={false}>
            {n.kind === "referral" ? <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 3 }}>Avis dermatologique recommandé</Text> : null}
            <Text style={{ fontSize: 9.5, lineHeight: 1.45 }}>{noEmoji(n.text)}</Text>
          </View>
        ))}
        {footer}
      </Page>

      <Page size="A4" style={st.page}>
        <TitleSplit light="Votre" bold="routine" size={26} />
        <Text style={{ fontSize: 10, color: C.muted, marginTop: -4, marginBottom: 14 }}>
          {d.routine.length} étape{d.routine.length > 1 ? "s" : ""}, dans l'ordre d'application
        </Text>
        {d.routine.map((s, i) => (
          <View key={i} style={[st.card, { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 }]} wrap={false}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.accent, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
              <Text style={{ color: "#FFFFFF", fontFamily: "Urbanist", fontWeight: 700, fontSize: 13 }}>{i + 1}</Text>
            </View>
            {images[i] ? (
              <View style={{ width: 62, height: 62, borderRadius: 10, backgroundColor: C.tint, marginRight: 12, alignItems: "center", justifyContent: "center" }}>
                <Image src={images[i]!} style={{ width: 56, height: 56, objectFit: "contain" }} />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={st.eyebrow}>{s.stepName}</Text>
              <Text style={{ fontFamily: "Urbanist", fontWeight: 700, fontSize: 13, marginTop: 2 }}>{s.productTitle}</Text>
              {s.brand ? <Text style={{ fontSize: 8.5, color: C.muted, marginTop: 1 }}>{s.brand}</Text> : null}
              {s.why ? <Text style={{ fontSize: 9.5, lineHeight: 1.45, marginTop: 5 }}><Text style={{ fontWeight: 700 }}>Pourquoi pour vous : </Text>{noEmoji(s.why)}</Text> : null}
            </View>
            {s.price ? <Text style={{ fontFamily: "Urbanist", fontWeight: 700, fontSize: 13, marginLeft: 10 }}>{s.price}</Text> : null}
          </View>
        ))}
        {d.total ? (
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.tint, borderRadius: 14, padding: 14, marginTop: 4 }} wrap={false}>
            <Text style={{ fontSize: 11, fontWeight: 700 }}>Total de la routine</Text>
            <Text style={{ fontFamily: "Urbanist", fontWeight: 700, fontSize: 17 }}>{d.total}</Text>
          </View>
        ) : null}
        <Text style={{ fontSize: 9, color: C.muted, marginTop: 10 }}>Retrouvez ces produits sur thewelfarecm.com ou dans nos boutiques.</Text>

        <View style={{ marginTop: 22, borderTopWidth: 1, borderTopColor: C.lineSoft, paddingTop: 12 }} wrap={false}>
          <Text style={{ fontSize: 8, lineHeight: 1.5, color: C.muted }}>
            Ce diagnostic est établi par une intelligence artificielle à partir de vos photos et de vos réponses. Il ne constitue pas un avis médical et ne remplace pas la consultation d'un dermatologue. En cas de lésions, de douleur, d'irritation persistante, de grossesse ou de traitement en cours, demandez conseil à un professionnel de santé avant de commencer une nouvelle routine. Les niveaux affichés sont des estimations visuelles, qui peuvent varier avec la lumière ou la qualité des photos.
          </Text>
        </View>
        {footer}
      </Page>
    </Document>
  );
}

// ─── entry point ────────────────────────────────────────────────────────────
export async function downloadDiagnosticPdf(d: PdfInput): Promise<void> {
  registerFonts();
  const [logo, faceImage, ...images] = await Promise.all([
    toPng("/logo.webp", 160),
    d.face ? renderFace(d.face) : Promise.resolve(undefined),
    ...d.routine.map((s) => (s.imageUrl ? toPng(viaSite(s.imageUrl), 260) : Promise.resolve(undefined))),
  ]);
  const blob = await pdf(<DiagnosticDocument d={d} logo={logo} faceImage={faceImage} images={images} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `diagnostic-peau-the-welfare-${d.date.toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
