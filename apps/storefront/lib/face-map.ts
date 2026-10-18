// Where the face is on the front photo, from the MediaPipe landmarks the capture screen already computes
// (478 points, normalized 0-1 to the video frame). Used only to draw the analysis filter on the result
// page. Saved with the photos (owner's choice, 2026-10-15) and deleted with them by the purge job; the
// privacy page and the consent text say so.

export type FacePoint = [number, number];
export type FaceZone = "forehead" | "nose" | "cheekA" | "cheekB" | "chin";

export type FaceMap = {
  mesh: FacePoint[]; // a third of the face mesh, enough for the dotted filter
  zones: Record<FaceZone, FacePoint>;
  box: { x0: number; y0: number; x1: number; y1: number };
};

// MediaPipe face mesh indices: mid-forehead, nose tip, cheek centers, chin
const ZONE_INDEX: Record<FaceZone, number> = { forehead: 151, nose: 4, cheekA: 205, cheekB: 425, chin: 199 };

export function faceMapFromLandmarks(landmarks: { x: number; y: number }[], mirrored: boolean): FaceMap | null {
  if (landmarks.length < 468) return null;
  // the screenshot of a mirrored webcam is mirrored too: flip x so the points land on the photo
  const at = (i: number): FacePoint => {
    const l = landmarks[i]!;
    return [round(mirrored ? 1 - l.x : l.x), round(l.y)];
  };
  const all = landmarks.slice(0, 468).map((_, i) => at(i));
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const zones = Object.fromEntries(Object.entries(ZONE_INDEX).map(([zone, i]) => [zone, at(i)])) as Record<FaceZone, FacePoint>;
  return {
    mesh: all.filter((_, i) => i % 3 === 0),
    zones,
    box: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) },
  };
}

// Part of the video frame kept for a photo (normalized 0-1, unmirrored): the face plus a margin for the
// hairline, ears and jaw. The analysis then gets the face at the camera's full resolution instead of a
// small face in the middle of the room (scan 2026-10-18: cheek pimples 2-4 px wide, missed).
export type FrameCrop = { x0: number; y0: number; x1: number; y1: number };

export function faceCrop(landmarks: { x: number; y: number }[], frameW: number, frameH: number): FrameCrop {
  const xs = landmarks.map((l) => l.x * frameW);
  const ys = landmarks.map((l) => l.y * frameH);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const w = x1 - x0, h = y1 - y0;
  const clamp = (v: number, max: number) => Math.min(max, Math.max(0, v));
  return {
    x0: clamp(x0 - 0.3 * w, frameW) / frameW,
    x1: clamp(x1 + 0.3 * w, frameW) / frameW,
    y0: clamp(y0 - 0.35 * h, frameH) / frameH,
    y1: clamp(y1 + 0.15 * h, frameH) / frameH,
  };
}

// Landmarks of the frame, moved into the cropped photo's coordinates
export function landmarksInCrop(landmarks: { x: number; y: number }[], crop: FrameCrop) {
  const w = crop.x1 - crop.x0, h = crop.y1 - crop.y0;
  return landmarks.map((l) => ({ x: (l.x - crop.x0) / w, y: (l.y - crop.y0) / h }));
}

const round = (n: number) => Math.round(n * 10000) / 10000;
