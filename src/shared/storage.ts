import type { GalleryDocument, MemoryPoint, Chapter } from "./types";
const key = "yujing-gallery-v1";
export const emptyDocument = (): GalleryDocument => ({
  favorites: [],
  visits: [],
  notes: {},
  memories: [],
  chapters: [],
});
function cleanPoint(v: unknown): { x: number; z: number } | null {
  const p = v as { x?: unknown; z?: unknown };
  return typeof p?.x === "number" && typeof p?.z === "number"
    ? { x: p.x, z: p.z }
    : null;
}
function cleanMemory(v: unknown): MemoryPoint | null {
  const m = v as Partial<MemoryPoint>;
  const position = cleanPoint(m?.position);
  const artworkAt = cleanPoint(m?.artworkAt);
  if (
    typeof m?.id !== "string" ||
    typeof m?.artworkId !== "string" ||
    typeof m?.at !== "number" ||
    typeof m?.seconds !== "number" ||
    !position ||
    !artworkAt
  )
    return null;
  return {
    id: m.id,
    artworkId: m.artworkId,
    at: m.at,
    seconds: m.seconds,
    position,
    yaw: typeof m.yaw === "number" ? m.yaw : 0,
    segment: typeof m.segment === "number" ? m.segment : 0,
    artworkAt,
    note: typeof m.note === "string" ? m.note : "",
  };
}
function cleanChapter(v: unknown): Chapter | null {
  const c = v as Partial<Chapter>;
  if (typeof c?.id !== "string" || typeof c?.title !== "string") return null;
  return {
    id: c.id,
    title: c.title,
    pointIds: Array.isArray(c.pointIds)
      ? c.pointIds.filter((p): p is string => typeof p === "string")
      : [],
  };
}
export function loadDocument(): GalleryDocument {
  try {
    const d = JSON.parse(localStorage.getItem(key) || "null");
    if (!d) return emptyDocument();
    return {
      favorites: Array.isArray(d.favorites)
        ? d.favorites.filter((v: unknown) => typeof v === "string")
        : [],
      visits: Array.isArray(d.visits)
        ? d.visits.filter(
            (v: { id?: unknown; seconds?: unknown }) =>
              typeof v.id === "string" && typeof v.seconds === "number",
          )
        : [],
      notes: typeof d.notes === "object" && d.notes ? d.notes : {},
      memories: Array.isArray(d.memories)
        ? d.memories
            .map(cleanMemory)
            .filter((m: MemoryPoint | null): m is MemoryPoint => !!m)
        : [],
      chapters: Array.isArray(d.chapters)
        ? d.chapters
            .map(cleanChapter)
            .filter((c: Chapter | null): c is Chapter => !!c)
        : [],
    };
  } catch {
    return emptyDocument();
  }
}
export function saveDocument(d: GalleryDocument): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}
