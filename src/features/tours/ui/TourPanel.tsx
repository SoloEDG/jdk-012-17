import { Route, ArrowRight, Pause, Play, X, History } from "lucide-react";
import { routes, artworkById } from "../../../shared/catalog";
import type { TourState } from "../../../shared/types";
import { tourProgress, tourRoute, tourStopCount } from "../lib/routeProgress";
export function TourPanel({
  state,
  onStart,
  onPause,
  onResume,
  onStop,
  onNext,
}: {
  state: TourState;
  onStart: (id: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onNext: () => void;
}) {
  const route = tourRoute(state);
  const isReview = !!state.review;
  const total = tourStopCount(state);
  const currentArtwork = isReview
    ? artworkById(state.review?.[state.step]?.artworkId || null)
    : artworkById(route?.stops[state.step] || null);
  return (
    <section className="tour-panel">
      <div className="section-title">
        {isReview ? <History size={16} /> : <Route size={16} />}
        <span>{isReview ? "记忆回放" : "主题导览"}</span>
        <small>{isReview ? "MEMORY REPLAY" : "CURATED JOURNEYS"}</small>
      </div>
      {(route || isReview) && state.phase !== "idle" ? (
        <div className="current-tour">
          <span className="eyebrow">
            {isReview ? "正在回放 · " : "正在探索 · "}
            {state.phase === "done"
              ? "已完成"
              : `${state.step + 1} / ${total}`}
          </span>
          <h3>{isReview ? state.label : route?.name}</h3>
          <progress value={tourProgress(state)} max="1" />
          <p>
            {state.phase === "done"
              ? isReview
                ? "这段记忆回放已完成，原导览进度将在结束后恢复。"
                : "这段旅程已完成，收藏你的所见。"
              : `${
                  state.phase === "walking"
                    ? "正在前往"
                    : state.phase === "paused"
                      ? "已暂停"
                      : "正在讲解"
                } · ${currentArtwork?.title || ""}`}
          </p>
          {isReview && state.suspended && (
            <p className="resume-hint">结束后恢复原导览进度</p>
          )}
          <div className="tour-controls">
            {state.phase !== "done" && (
              <>
                <button onClick={state.phase === "paused" ? onResume : onPause}>
                  {state.phase === "paused" ? (
                    <Play size={14} />
                  ) : (
                    <Pause size={14} />
                  )}{" "}
                  {state.phase === "paused" ? "继续" : "暂停"}
                </button>
                <button onClick={onNext}>
                  下一站
                  <ArrowRight size={14} />
                </button>
              </>
            )}
            <button aria-label="结束导览" onClick={onStop}>
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        routes.map((r, i) => (
          <button
            className={"route-card route-" + i}
            key={r.id}
            onClick={() => onStart(r.id)}
          >
            <span>
              JOURNEY 0{i + 1} <span>约 {i ? 3 : 2} 分钟 · 3 件作品</span>
            </span>
            <h3>
              {r.name}
              <ArrowUpRightIcon />
            </h3>
            <p>{r.subtitle}</p>
          </button>
        ))
      )}
    </section>
  );
}
function ArrowUpRightIcon() {
  return <span className="round-arrow">↗</span>;
}
