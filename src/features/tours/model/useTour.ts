import { useState } from "react";
import type { ReviewStop, TourState } from "../../../shared/types";
import { routes } from "../../../shared/catalog";
const initial: TourState = {
  routeId: null,
  step: 0,
  phase: "idle",
  review: null,
  label: null,
  suspended: null,
};
export function useTour() {
  const [state, setState] = useState<TourState>(initial);
  return {
    state,
    start: (id: string) => {
      if (routes.some((r) => r.id === id))
        setState({ ...initial, routeId: id, phase: "walking" });
    },
    /**
     * 回顾是独立路线：把进行中的导览进度挂起，
     * 回顾结束或停止后原样恢复，绝不覆盖。
     */
    startReview: (label: string, stops: ReviewStop[]) => {
      if (!stops.length) return;
      setState((t) => ({
        routeId: null,
        step: 0,
        phase: "walking",
        review: stops,
        label,
        suspended: t.phase === "idle" ? null : { ...t, suspended: null },
      }));
    },
    arrive: () =>
      setState((t) =>
        t.phase === "walking" ? { ...t, phase: "listening" } : t,
      ),
    next: () =>
      setState((t) => {
        const total = t.review
          ? t.review.length
          : routes.find((r) => r.id === t.routeId)?.stops.length || 0;
        if (!total) return t;
        return t.step + 1 >= total
          ? { ...t, phase: "done" }
          : { ...t, step: t.step + 1, phase: "walking" };
      }),
    pause: () => setState((t) => ({ ...t, phase: "paused" })),
    resume: () => setState((t) => ({ ...t, phase: "walking" })),
    stop: () =>
      setState((t) => {
        const s = t.suspended;
        if (!s) return initial;
        // 恢复时把进行中的状态落为暂停，由用户显式继续
        return {
          ...s,
          phase:
            s.phase === "walking" || s.phase === "listening"
              ? "paused"
              : s.phase,
        };
      }),
  };
}
