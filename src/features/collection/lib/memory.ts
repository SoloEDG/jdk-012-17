import type { Chapter, MemoryPoint, Point } from "../../../shared/types";
import { artworkById } from "../../../shared/catalog";
import { constrain, distance, viewingPoint } from "../../space/lib/motion";

/** 观位与作品的合理距离区间：太远说明原位置已不适合再看这件作品 */
const MIN_VIEW_M = 0.8;
const MAX_VIEW_M = 4.5;
const EPS = 1e-6;

export type ViewpointResolution = {
  ok: boolean;
  /** 作品已撤展：空间信息整体失效，仅文字可保留 */
  removed: boolean;
  /** 作品位置在记录后被调整过 */
  moved: boolean;
  /** 落点是否为重建出的合法观位（原位置不可用或已不合法） */
  reconstructed: boolean;
  point: Point | null;
  yaw: number;
};

/**
 * 空间模块：为记忆点重建合法观看位置与朝向。
 * 优先复用当年真实站位；若它已走出可行走区域、或作品搬走后离得太远，
 * 则退回作品正前方的标准观位。原始证据字段永不被改写。
 */
export function resolveViewpoint(m: MemoryPoint): ViewpointResolution {
  const a = artworkById(m.artworkId);
  if (!a)
    return {
      ok: false,
      removed: true,
      moved: false,
      reconstructed: false,
      point: null,
      yaw: m.yaw,
    };
  const moved = distance(a.position, m.artworkAt) > EPS;
  const storedLegal =
    distance(constrain(m.position), m.position) < EPS &&
    distance(m.position, a.position) >= MIN_VIEW_M &&
    distance(m.position, a.position) <= MAX_VIEW_M;
  if (storedLegal)
    return {
      ok: true,
      removed: false,
      moved,
      reconstructed: false,
      point: m.position,
      yaw: m.yaw,
    };
  const point = constrain(viewingPoint(a.position, a.facing));
  return {
    ok: true,
    removed: false,
    moved,
    reconstructed: true,
    point,
    yaw: a.facing,
  };
}

/** 回顾中需要明示的失效/可恢复标记 */
export function memoryFlags(
  m: MemoryPoint,
  favorites: string[],
): { unfavorited: boolean } & ViewpointResolution {
  return {
    ...resolveViewpoint(m),
    unfavorited: !favorites.includes(m.artworkId),
  };
}

/** 按真实发生顺序排列（证据本身不带顺序假设，排序只发生在读取时） */
export function chronological(memories: MemoryPoint[]): MemoryPoint[] {
  return [...memories].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
}

/** 章节引用的记忆点（保持章节内的策展顺序，过滤已不存在的引用） */
export function chapterPoints(
  chapter: Chapter,
  memories: MemoryPoint[],
): MemoryPoint[] {
  const byId = new Map(memories.map((m) => [m.id, m]));
  return chapter.pointIds
    .map((id) => byId.get(id))
    .filter((m): m is MemoryPoint => !!m);
}

/** 记忆点当前归属的章节 */
export function chaptersOf(pointId: string, chapters: Chapter[]): Chapter[] {
  return chapters.filter((c) => c.pointIds.includes(pointId));
}
