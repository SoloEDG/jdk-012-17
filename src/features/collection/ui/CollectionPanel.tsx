import { useState } from "react";
import {
  Heart,
  Download,
  ArrowUpRight,
  MapPin,
  Play,
  ChevronUp,
  ChevronDown,
  X,
  History,
  Layers,
} from "lucide-react";
import type { Chapter, GalleryDocument, MemoryPoint, Point } from "../../../shared/types";
import { artworkById } from "../../../shared/catalog";
import { Map } from "../../space";
import { recapStats, createRecap } from "../lib/recap";
import { downloadRecap } from "../lib/download";
import {
  chapterPoints,
  chaptersOf,
  chronological,
  memoryFlags,
} from "../lib/memory";
const timeOf = (at: number) => {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
};
export function CollectionPanel({
  document,
  position,
  active,
  reviewActive,
  onSelect,
  onNote,
  onToggle,
  onMemoryNote,
  onOpenMemory,
  onReplayAll,
  onReplayChapter,
  onCreateChapter,
  onRenameChapter,
  onDeleteChapter,
  onMergeChapters,
  onAddToChapter,
  onRemoveFromChapter,
  onMoveInChapter,
  onMoveChapter,
}: {
  document: GalleryDocument;
  position: Point;
  active: string | null;
  reviewActive: boolean;
  onSelect: (id: string) => void;
  onNote: (id: string, text: string) => void;
  onToggle: (id: string) => void;
  onMemoryNote: (id: string, text: string) => void;
  onOpenMemory: (id: string) => void;
  onReplayAll: () => void;
  onReplayChapter: (id: string) => void;
  onCreateChapter: (title: string, pointIds: string[]) => void;
  onRenameChapter: (id: string, title: string) => void;
  onDeleteChapter: (id: string) => void;
  onMergeChapters: (targetId: string, sourceId: string) => void;
  onAddToChapter: (chapterId: string, pointId: string) => void;
  onRemoveFromChapter: (chapterId: string, pointId: string) => void;
  onMoveInChapter: (chapterId: string, pointId: string, dir: -1 | 1) => void;
  onMoveChapter: (id: string, dir: -1 | 1) => void;
}) {
  const stats = recapStats(document);
  const [view, setView] = useState<"timeline" | "chapters">("timeline");
  const [newTitle, setNewTitle] = useState("");
  const timeline = chronological(document.memories);
  const playable = (points: MemoryPoint[]) =>
    points.some((m) => memoryFlags(m, document.favorites).ok);
  return (
    <div className="collection-panel">
      <div className="eyebrow">YOUR PERSONAL GALLERY</div>
      <h2>把共鸣，留在这里。</h2>
      <div className="stats">
        <span>
          <strong>{stats.seen}</strong>已观看
        </span>
        <span>
          <strong>{stats.saved}</strong>已收藏
        </span>
        <span>
          <strong>{stats.memories}</strong>记忆点
        </span>
        <span>
          <strong>{Math.floor(stats.seconds / 60)}′</strong>停留时长
        </span>
      </div>

      <section className="memory-map">
        <div className="section-title">
          <MapPin size={16} />
          <span>记忆地图</span>
          <small>MEMORY MAP</small>
        </div>
        {timeline.length > 0 && (
          <div className="memory-canvas">
            <Map
              position={position}
              active={active}
              onSelect={onSelect}
              markers={timeline.map((m, i) => ({
                id: m.id,
                point: memoryFlags(m, document.favorites).point || m.position,
                index: i,
                stale: !memoryFlags(m, document.favorites).ok,
              }))}
              onSelectMarker={onOpenMemory}
            />
            <small>点击标记，在展馆里重新打开那一刻。</small>
          </div>
        )}
        <div className="memory-tabs">
          <button
            className={view === "timeline" ? "active" : ""}
            onClick={() => setView("timeline")}
          >
            <History size={13} /> 时间线 <small>{timeline.length}</small>
          </button>
          <button
            className={view === "chapters" ? "active" : ""}
            onClick={() => setView("chapters")}
          >
            <Layers size={13} /> 章节 <small>{document.chapters.length}</small>
          </button>
        </div>
        {reviewActive && (
          <p className="replay-note">
            回放进行中：章节修改已保存，将在下次回放时生效。
          </p>
        )}
        {view === "timeline" ? (
          <>
            {timeline.length > 0 && (
              <button
                className="primary full replay-all"
                disabled={!playable(timeline)}
                onClick={onReplayAll}
              >
                <Play size={15} />
                按真实顺序回放
              </button>
            )}
            {timeline.length === 0 ? (
              <div className="empty">
                <MapPin size={26} />
                <p>在作品前停留片刻，就会留下一个记忆点。</p>
                <small>路过不会打扰它，只有真正的驻足会被记住。</small>
              </div>
            ) : (
              timeline.map((m, i) => (
                <MemoryCard
                  key={m.id}
                  memory={m}
                  index={i}
                  document={document}
                  onOpen={() => onOpenMemory(m.id)}
                  onNote={onMemoryNote}
                  onAddToChapter={onAddToChapter}
                  onRemoveFromChapter={onRemoveFromChapter}
                />
              ))
            )}
          </>
        ) : (
          <>
            <div className="chapter-new">
              <input
                aria-label="新章节名称"
                placeholder="新章节的名字，如「光与影」…"
                value={newTitle}
                maxLength={30}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTitle.trim()) {
                    onCreateChapter(newTitle, []);
                    setNewTitle("");
                  }
                }}
              />
              <button
                className="text-button"
                disabled={!newTitle.trim()}
                onClick={() => {
                  onCreateChapter(newTitle, []);
                  setNewTitle("");
                }}
              >
                新建章节
              </button>
            </div>
            {document.chapters.length === 0 ? (
              <div className="empty">
                <Layers size={26} />
                <p>把记忆点编成章节，按你的主题重新讲述。</p>
                <small>合并与重排都不会改动真实的参观记录。</small>
              </div>
            ) : (
              document.chapters.map((c, i) => (
                <ChapterCard
                  key={c.id}
                  chapter={c}
                  index={i}
                  total={document.chapters.length}
                  document={document}
                  onReplay={() => onReplayChapter(c.id)}
                  playable={playable(chapterPoints(c, document.memories))}
                  onRename={onRenameChapter}
                  onDelete={onDeleteChapter}
                  onMerge={onMergeChapters}
                  onRemove={onRemoveFromChapter}
                  onMove={onMoveInChapter}
                  onMoveChapter={onMoveChapter}
                />
              ))
            )}
          </>
        )}
      </section>

      <section className="saved-works">
        <div className="section-title">
          <Heart size={16} />
          <span>收藏作品</span>
          <small>FAVORITES</small>
        </div>
        {document.favorites.length === 0 ? (
          <div className="empty">
            <Heart size={28} />
            <p>遇见喜欢的作品，点亮一颗心。</p>
            <small>你的参观故事，将从这里开始。</small>
          </div>
        ) : (
          document.favorites.map((id) => {
            const a = artworkById(id);
            if (!a) return null;
            return (
              <article className="saved-card" key={id}>
                <button className="saved-title" onClick={() => onSelect(id)}>
                  {a.title}
                  <ArrowUpRight size={15} />
                </button>
                <small>
                  {a.artist} · {a.year}
                </small>
                <textarea
                  aria-label={"感想-" + a.title}
                  placeholder="写下此刻的感受…"
                  value={document.notes[id] || ""}
                  onChange={(e) => onNote(id, e.target.value)}
                  maxLength={1000}
                />
                <button className="text-button" onClick={() => onToggle(id)}>
                  移出收藏（感想与记忆保留）
                </button>
              </article>
            );
          })
        )}
      </section>

      <button
        className="primary full"
        disabled={
          !stats.saved &&
          !stats.memories &&
          !Object.values(document.notes).some((t) => t.trim())
        }
        onClick={() => downloadRecap(createRecap(document))}
      >
        <Download size={16} />
        生成个人参观回顾
      </button>
    </div>
  );
}

function MemoryCard({
  memory: m,
  index,
  document,
  onOpen,
  onNote,
  onAddToChapter,
  onRemoveFromChapter,
}: {
  memory: MemoryPoint;
  index: number;
  document: GalleryDocument;
  onOpen: () => void;
  onNote: (id: string, text: string) => void;
  onAddToChapter: (chapterId: string, pointId: string) => void;
  onRemoveFromChapter: (chapterId: string, pointId: string) => void;
}) {
  const a = artworkById(m.artworkId);
  const flags = memoryFlags(m, document.favorites);
  const mine = chaptersOf(m.id, document.chapters);
  const others = document.chapters.filter((c) => !c.pointIds.includes(m.id));
  return (
    <article className="memory-card">
      <button
        className="memory-title"
        onClick={onOpen}
        disabled={!flags.ok}
        title={flags.ok ? "在展馆里重新打开" : "作品已撤展，仅保留文字"}
      >
        <span className="memory-index">{index + 1}</span>
        {a ? a.title : "（作品已撤展）"}
        {flags.ok && <ArrowUpRight size={14} />}
      </button>
      <small className="memory-meta">
        {timeOf(m.at)} · 停留 {Math.round(m.seconds)} 秒
        {a?.transcript[m.segment] ? ` · 片段 ${m.segment + 1}` : ""}
      </small>
      {a?.transcript[m.segment] && (
        <p className="memory-segment">“{a.transcript[m.segment]}”</p>
      )}
      <div className="memory-flags">
        {flags.removed && <span className="flag stale">已撤展 · 仅留文字</span>}
        {!flags.removed && flags.moved && (
          <span className="flag stale">作品位置已调整</span>
        )}
        {!flags.removed && flags.reconstructed && (
          <span className="flag">观位已重建</span>
        )}
        {flags.unfavorited && <span className="flag">已移出收藏 · 文字保留</span>}
        {mine.map((c) => (
          <span className="flag chapter" key={c.id}>
            {c.title}
            <button
              aria-label={`从章节 ${c.title} 移出`}
              onClick={() => onRemoveFromChapter(c.id, m.id)}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <textarea
        aria-label={"停留感想-" + (a?.title || m.artworkId)}
        placeholder="那一刻的感受…"
        value={m.note}
        onChange={(e) => onNote(m.id, e.target.value)}
        maxLength={1000}
      />
      <div className="memory-actions">
        {flags.ok && (
          <button className="text-button" onClick={onOpen}>
            在展馆打开
          </button>
        )}
        {others.length > 0 && (
          <select
            aria-label="加入章节"
            value=""
            onChange={(e) => {
              if (e.target.value) onAddToChapter(e.target.value, m.id);
            }}
          >
            <option value="">加入章节…</option>
            {others.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
      </div>
    </article>
  );
}

function ChapterCard({
  chapter: c,
  index,
  total,
  document,
  playable,
  onReplay,
  onRename,
  onDelete,
  onMerge,
  onRemove,
  onMove,
  onMoveChapter,
}: {
  chapter: Chapter;
  index: number;
  total: number;
  document: GalleryDocument;
  playable: boolean;
  onReplay: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onMerge: (targetId: string, sourceId: string) => void;
  onRemove: (chapterId: string, pointId: string) => void;
  onMove: (chapterId: string, pointId: string, dir: -1 | 1) => void;
  onMoveChapter: (id: string, dir: -1 | 1) => void;
}) {
  const points = chapterPoints(c, document.memories);
  const others = document.chapters.filter((x) => x.id !== c.id);
  return (
    <article className="chapter-card">
      <div className="chapter-head">
        <input
          aria-label="章节名称"
          className="chapter-title"
          defaultValue={c.title}
          key={c.id + c.title}
          maxLength={30}
          onBlur={(e) => onRename(c.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
        <span className="chapter-order">
          <button
            aria-label="章节上移"
            disabled={index === 0}
            onClick={() => onMoveChapter(c.id, -1)}
          >
            <ChevronUp size={14} />
          </button>
          <button
            aria-label="章节下移"
            disabled={index === total - 1}
            onClick={() => onMoveChapter(c.id, 1)}
          >
            <ChevronDown size={14} />
          </button>
        </span>
      </div>
      <small className="memory-meta">{points.length} 个记忆点 · 策展顺序</small>
      {points.length === 0 ? (
        <p className="chapter-empty">从时间线把记忆点加入这个章节。</p>
      ) : (
        <ol className="chapter-points">
          {points.map((m, i) => {
            const a = artworkById(m.artworkId);
            return (
              <li key={m.id}>
                <span className="chapter-point-title">
                  {i + 1}. {a ? a.title : "（作品已撤展）"}
                  <small>
                    {timeOf(m.at)}
                    {m.note.trim() ? ` · ${m.note.trim().slice(0, 18)}` : ""}
                  </small>
                </span>
                <span className="chapter-point-actions">
                  <button
                    aria-label="上移"
                    disabled={i === 0}
                    onClick={() => onMove(c.id, m.id, -1)}
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    aria-label="下移"
                    disabled={i === points.length - 1}
                    onClick={() => onMove(c.id, m.id, 1)}
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button
                    aria-label="移出章节"
                    onClick={() => onRemove(c.id, m.id)}
                  >
                    <X size={13} />
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <div className="chapter-actions">
        <button
          className="text-button"
          disabled={!playable}
          onClick={onReplay}
        >
          <Play size={13} /> 回放此章节
        </button>
        {others.length > 0 && (
          <select
            aria-label="并入其他章节"
            value=""
            onChange={(e) => {
              if (e.target.value) onMerge(e.target.value, c.id);
            }}
          >
            <option value="">并入…</option>
            {others.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        )}
        <button
          className="text-button danger"
          onClick={() => onDelete(c.id)}
          title="只删除章节，记忆点保留在时间线"
        >
          删除章节
        </button>
      </div>
    </article>
  );
}
