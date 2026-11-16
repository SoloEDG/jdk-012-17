export type Point = { x: number; z: number };
export type Artwork = {
  id: string;
  title: string;
  en: string;
  artist: string;
  year: string;
  medium: string;
  color: string;
  position: Point;
  facing: number;
  description: string;
  transcript: string[];
  duration: number;
};
export type Route = {
  id: string;
  name: string;
  subtitle: string;
  stops: string[];
};
export type Visit = { id: string; seconds: number; at: number };
/**
 * 记忆点：一次真实停留的参观证据。
 * 除 note（用户感想）外，所有字段在生成后不可修改；
 * 章节的合并与重排只引用 id，绝不回写这里。
 */
export type MemoryPoint = {
  id: string;
  artworkId: string;
  at: number;
  seconds: number;
  position: Point;
  yaw: number;
  segment: number;
  artworkAt: Point;
  note: string;
};
/** 策展章节：对记忆点的有序引用，可合并、重排、删除而不影响证据。 */
export type Chapter = { id: string; title: string; pointIds: string[] };
export type GalleryDocument = {
  favorites: string[];
  visits: Visit[];
  notes: Record<string, string>;
  memories: MemoryPoint[];
  chapters: Chapter[];
};
/** 回顾路线的一站：已重建好的合法观位与待跳转的讲解段落。 */
export type ReviewStop = {
  memoryId: string;
  artworkId: string;
  point: Point;
  yaw: number;
  segment: number;
};
export type TourState = {
  routeId: string | null;
  step: number;
  phase: "idle" | "walking" | "listening" | "paused" | "done";
  /** 回顾模式的自定义站点；为 null 时走 catalog 里的主题路线 */
  review: ReviewStop[] | null;
  /** 回顾路线名称（时间线 / 章节名） */
  label: string | null;
  /** 被回顾打断的原导览进度，回顾结束后恢复 */
  suspended: TourState | null;
};
export type AudioState = {
  artworkId: string | null;
  elapsed: number;
  playing: boolean;
  rate: number;
};
export type Command =
  { type: "focus"; id: string } | { type: "favorite"; id: string };
