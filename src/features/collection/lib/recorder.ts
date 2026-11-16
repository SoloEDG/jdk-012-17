import type { MemoryPoint, Point } from "../../../shared/types";
import { distance } from "../../space/lib/motion";

/** 停留判定与聚合参数：保证"路过"不产生记忆点，"徘徊"只聚合为一个 */
export const MIN_DWELL_S = 4; // 停留满 4 秒才记为一次有意义的停留
export const DRIFT_RESET_M = 0.9; // 候选期内漂移超过 0.9m 视为路过，重新计时
export const MERGE_RADIUS_M = 2; // 与上一记忆点相距 2m 内
export const MERGE_GAP_MS = 90_000; // 且间隔 90 秒内 → 并入同一次停留

export type RecorderSample = {
  position: Point;
  yaw: number;
  artworkId: string | null;
  /** 正在播放本作品讲解时的语义段落下标；未播放为 null */
  segment: number | null;
  now: number;
};

export type RecorderState = {
  candidate: {
    artworkId: string;
    anchor: Point;
    yaw: number;
    segment: number;
    startedAt: number;
  } | null;
  /** 当前候选已提交/并入的记忆点 id */
  activeId: string | null;
  /** 并入旧点时旧点已有的秒数，增长事件以此为基准累加 */
  baseSeconds: number;
};

export type RecorderEvent =
  | { type: "commit"; point: MemoryPoint }
  | { type: "grow"; id: string; seconds: number };

export const initialRecorder: RecorderState = {
  candidate: null,
  activeId: null,
  baseSeconds: 0,
};

let counter = 0;
const nextId = () =>
  `m${Date.now().toString(36)}${(counter++).toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;

/**
 * 每个采样 tick 推进一次状态机。
 * - 在同一作品附近站稳（漂移 < DRIFT_RESET_M）累计 MIN_DWELL_S 后提交记忆点；
 * - 站稳后继续停留，通过 grow 事件让该点时长持续增长；
 * - 离开后又回来：若与上一点同作品、距离与时间都接近，则并入上一点而非新建，
 *   因此连续路过或来回徘徊都不会刷出大量记忆点。
 */
export function reduceSample(
  state: RecorderState,
  sample: RecorderSample,
  memories: MemoryPoint[],
  artworkAt: Point | null,
): { state: RecorderState; events: RecorderEvent[] } {
  const events: RecorderEvent[] = [];
  let { candidate, activeId, baseSeconds } = state;

  const settled =
    candidate &&
    candidate.artworkId === sample.artworkId &&
    distance(sample.position, candidate.anchor) <= DRIFT_RESET_M;

  if (settled && candidate) {
    candidate = {
      ...candidate,
      yaw: sample.yaw,
      segment: sample.segment ?? candidate.segment,
    };
    const dwellS = (sample.now - candidate.startedAt) / 1000;
    if (!activeId && dwellS >= MIN_DWELL_S && artworkAt) {
      const last = memories[memories.length - 1];
      const mergeable =
        last &&
        last.artworkId === candidate.artworkId &&
        distance(last.position, candidate.anchor) <= MERGE_RADIUS_M &&
        candidate.startedAt - (last.at + last.seconds * 1000) <= MERGE_GAP_MS;
      if (mergeable) {
        activeId = last.id;
        baseSeconds = last.seconds;
      } else {
        const point: MemoryPoint = {
          id: nextId(),
          artworkId: candidate.artworkId,
          at: candidate.startedAt,
          seconds: MIN_DWELL_S,
          position: { ...candidate.anchor },
          yaw: candidate.yaw,
          segment: candidate.segment,
          artworkAt: { ...artworkAt },
          note: "",
        };
        activeId = point.id;
        baseSeconds = 0;
        events.push({ type: "commit", point });
      }
    }
    if (activeId) {
      events.push({
        type: "grow",
        id: activeId,
        seconds: Math.max(MIN_DWELL_S, Math.round(baseSeconds + dwellS)),
      });
    }
    return { state: { candidate, activeId, baseSeconds }, events };
  }

  // 离开当前停留（走远或换作品）：候选结束，按需开启新候选
  candidate = sample.artworkId
    ? {
        artworkId: sample.artworkId,
        anchor: { ...sample.position },
        yaw: sample.yaw,
        segment: sample.segment ?? 0,
        startedAt: sample.now,
      }
    : null;
  return {
    state: { candidate, activeId: null, baseSeconds: 0 },
    events,
  };
}
