import { routes } from "../../../shared/catalog";
import type { ReviewStop, TourState } from "../../../shared/types";
export function tourRoute(t: TourState) {
  return routes.find((r) => r.id === t.routeId);
}
export function tourStopCount(t: TourState): number {
  return t.review ? t.review.length : tourRoute(t)?.stops.length || 0;
}
export function tourTarget(t: TourState): string | null {
  if (t.review) return t.review[t.step]?.artworkId || null;
  return tourRoute(t)?.stops[t.step] || null;
}
/** 回顾模式当前站的完整信息（合法观位、朝向、讲解段落） */
export function tourReviewStop(t: TourState): ReviewStop | null {
  return t.review?.[t.step] || null;
}
export function tourProgress(t: TourState): number {
  const total = tourStopCount(t);
  return total ? (t.phase === "done" ? 1 : t.step / total) : 0;
}
