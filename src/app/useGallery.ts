import { useEffect, useRef } from "react";
import { useWalker, distance, viewingPoint } from "../features/space";
import { useCatalog } from "../features/catalog";
import { useNarration } from "../features/narration";
import { useTour, tourTarget, tourReviewStop } from "../features/tours";
import { useCollection } from "../features/collection";
import {
  reduceSample,
  initialRecorder,
} from "../features/collection/lib/recorder";
import {
  resolveViewpoint,
  chronological,
  chapterPoints,
} from "../features/collection/lib/memory";
import { segmentAt } from "../features/narration/lib/timeline";
import { artworkById } from "../shared/catalog";
import type { MemoryPoint, ReviewStop } from "../shared/types";
export function useGallery() {
  const catalog = useCatalog();
  const tour = useTour();
  const collection = useCollection();
  const walker = useWalker(catalog.observe);
  const narration = useNarration(() => {
    if (tour.state.phase === "listening") tour.next();
  });
  const go = (id: string) => {
    const a = artworkById(id);
    if (a) {
      catalog.select(id);
      walker.go(viewingPoint(a.position, a.facing));
      walker.yaw.current = a.facing;
    }
  };
  const target = tourTarget(tour.state);
  const reviewStop = tourReviewStop(tour.state);
  useEffect(() => {
    if (tour.state.phase === "walking" && target) {
      if (reviewStop) {
        catalog.select(reviewStop.artworkId);
        walker.go(reviewStop.point);
        walker.yaw.current = reviewStop.yaw;
      } else {
        go(target);
      }
    }
  }, [tour.state.phase, target]);
  useEffect(() => {
    if (tour.state.phase !== "walking" || !target) return;
    const dest = reviewStop
      ? reviewStop.point
      : (() => {
          const a = artworkById(target);
          return a ? viewingPoint(a.position, a.facing) : null;
        })();
    if (dest && distance(walker.position, dest) < 0.15) {
      tour.arrive();
      if (reviewStop) narration.playSegment(reviewStop.artworkId, reviewStop.segment);
      else narration.play(target);
    }
  }, [walker.position, tour.state.phase, target]);
  const current = useRef({
    nearby: catalog.nearby,
    record: collection.record,
    commit: collection.commitMemory,
    grow: collection.growMemory,
    narration: narration.state,
    memories: collection.document.memories,
  });
  current.current = {
    nearby: catalog.nearby,
    record: collection.record,
    commit: collection.commitMemory,
    grow: collection.growMemory,
    narration: narration.state,
    memories: collection.document.memories,
  };
  const recorder = useRef(initialRecorder);
  useEffect(() => {
    const t = setInterval(() => {
      const c = current.current;
      if (c.nearby) c.record(c.nearby, 0.5);
      const a = artworkById(c.nearby);
      const { state, events } = reduceSample(
        recorder.current,
        {
          position: walker.positionRef.current,
          yaw: walker.yaw.current,
          artworkId: c.nearby,
          segment:
            c.nearby &&
            c.narration.playing &&
            c.narration.artworkId === c.nearby &&
            a
              ? segmentAt(a, c.narration.elapsed)
              : null,
          now: Date.now(),
        },
        c.memories,
        a ? a.position : null,
      );
      recorder.current = state;
      for (const e of events) {
        if (e.type === "commit") c.commit(e.point);
        else c.grow(e.id, e.seconds);
      }
    }, 500);
    return () => clearInterval(t);
  }, []);
  /** 在展馆里重新打开一个记忆点：重建合法观位、恢复朝向、讲解跳到被记住的段落 */
  const openMemory = (id: string) => {
    const m = collection.document.memories.find((x) => x.id === id);
    if (!m) return;
    const r = resolveViewpoint(m);
    if (!r.ok || !r.point) return;
    catalog.select(m.artworkId);
    walker.go(r.point);
    walker.yaw.current = r.yaw;
    narration.playSegment(m.artworkId, m.segment);
  };
  const toStops = (points: MemoryPoint[]): ReviewStop[] =>
    points.flatMap((m) => {
      const r = resolveViewpoint(m);
      return r.ok && r.point
        ? [
            {
              memoryId: m.id,
              artworkId: m.artworkId,
              point: r.point,
              yaw: r.yaw,
              segment: m.segment,
            },
          ]
        : [];
    });
  /** 按真实发生顺序回放全部记忆 */
  const replayAll = () => {
    const stops = toStops(chronological(collection.document.memories));
    if (stops.length) tour.startReview("时间线 · 按真实顺序", stops);
  };
  /** 按策展顺序回放某个章节 */
  const replayChapter = (chapterId: string) => {
    const chapter = collection.document.chapters.find((c) => c.id === chapterId);
    if (!chapter) return;
    const stops = toStops(chapterPoints(chapter, collection.document.memories));
    if (stops.length) tour.startReview(`章节 · ${chapter.title}`, stops);
  };
  return {
    catalog,
    tour,
    collection,
    walker,
    narration,
    go,
    openMemory,
    replayAll,
    replayChapter,
    reviewActive:
      !!tour.state.review &&
      (tour.state.phase === "walking" ||
        tour.state.phase === "listening" ||
        tour.state.phase === "paused"),
    pauseTour: () => {
      tour.pause();
      walker.stop();
      narration.pause();
    },
    stopTour: () => {
      tour.stop();
      walker.stop();
      narration.pause();
    },
    nextTour: () => {
      walker.stop();
      narration.pause();
      tour.next();
    },
  };
}
