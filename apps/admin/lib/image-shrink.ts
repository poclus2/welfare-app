// Browser-side image shrinking before upload: nginx in front of the admin and the API accepts 1 MB per
// request. Product photos keep their transparency (WebP when the browser can encode it, else JPEG on
// a white background so a transparent PNG does not turn black).

const ALREADY_OK = ["image/jpeg", "image/png", "image/webp"];

async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new window.Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Returns a file of at most `budget` bytes and `maxSide` px on its longest side. */
export async function shrinkImage(file: File, { maxSide = 2000, budget = 900 * 1024 } = {}): Promise<File> {
  if (file.size <= budget && ALREADY_OK.includes(file.type)) return file;

  const img = await loadImage(file);
  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  let side = Math.min(maxSide, Math.max(img.naturalWidth, img.naturalHeight));

  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = side / Math.max(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d")!;

    // WebP keeps transparency; Safari cannot encode it and silently returns PNG instead
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const q of [0.9, 0.8, 0.7]) {
      const webp = await toBlob(canvas, "image/webp", q);
      if (webp && webp.type === "image/webp" && webp.size <= budget) return new File([webp], `${base}.webp`, { type: "image/webp" });
    }

    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const q of [0.9, 0.8, 0.7]) {
      const jpeg = await toBlob(canvas, "image/jpeg", q);
      if (jpeg && jpeg.size <= budget) return new File([jpeg], `${base}.jpg`, { type: "image/jpeg" });
    }
    side = Math.round(side * 0.8);
  }
  throw new Error("Impossible de compresser cette photo");
}
