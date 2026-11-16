import type { Artwork } from "../../../shared/types";
export function captionAt(a: Artwork, elapsed: number): string {
  return a.transcript[segmentAt(a, elapsed)];
}
/** 当前播放进度所在的语义段落下标 */
export function segmentAt(a: Artwork, elapsed: number): number {
  return Math.min(
    a.transcript.length - 1,
    Math.max(0, Math.floor((elapsed / a.duration) * a.transcript.length)),
  );
}
/** 某个语义段落的起始播放位置（秒） */
export function segmentOffset(a: Artwork, segment: number): number {
  const i = Math.min(a.transcript.length - 1, Math.max(0, segment));
  return (i / a.transcript.length) * a.duration;
}
export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}
