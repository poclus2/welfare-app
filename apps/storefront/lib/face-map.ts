// Where the face is on the front photo, from the MediaPipe landmarks the capture screen already computes
// (478 points, normalized 0-1 to the video frame). Used only to draw the analysis filter on the result
// page: it stays in the browser's memory, is never sent to the server nor saved (biometric data).

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

const round = (n: number) => Math.round(n * 10000) / 10000;
