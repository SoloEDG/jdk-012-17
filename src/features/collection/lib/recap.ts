import type { GalleryDocument, MemoryPoint } from "../../../shared/types";
import { artworkById } from "../../../shared/catalog";
import { chapterPoints, chronological, memoryFlags } from "./memory";
export function recapStats(d: GalleryDocument) {
  return {
    seen: d.visits.filter((v) => v.seconds >= 2).length,
    seconds: Math.round(d.visits.reduce((n, v) => n + v.seconds, 0)),
    saved: d.favorites.length,
    memories: d.memories.length,
  };
}
const timeOf = (at: number) => {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
};
function flagText(m: MemoryPoint, d: GalleryDocument): string[] {
  const f = memoryFlags(m, d.favorites);
  const flags: string[] = [];
  if (f.removed) flags.push("作品已撤展，仅保留文字");
  else {
    if (f.moved) flags.push("作品位置已调整");
    if (f.reconstructed) flags.push("观位已重建");
  }
  if (f.unfavorited) flags.push("已移出收藏，文字保留");
  return flags;
}
function memoryLines(m: MemoryPoint, d: GalleryDocument, prefix: string) {
  const a = artworkById(m.artworkId);
  const lines = [
    `${prefix}[${timeOf(m.at)}] ${a ? `《${a.title}》/ ${a.artist}` : "（作品已撤展）"}`,
  ];
  const segment = a?.transcript[m.segment];
  lines.push(
    `${prefix}  停留 ${Math.round(m.seconds)} 秒` +
      (segment ? ` · 讲解片段：${segment}` : ""),
  );
  if (m.note.trim()) lines.push(`${prefix}  感想：${m.note.trim()}`);
  const flags = flagText(m, d);
  if (flags.length) lines.push(`${prefix}  ※ ${flags.join("；")}`);
  return lines;
}
/**
 * 文字回顾：时间线永远按真实发生顺序排列；
 * 章节按用户的策展顺序另列。两者都只是视图，不改动证据。
 */
export function createRecap(d: GalleryDocument): string {
  const stats = recapStats(d);
  const out: string[] = [
    "余境 · 我的参观回顾",
    `观看 ${stats.seen} 件作品 · 停留 ${stats.seconds} 秒 · 收藏 ${stats.saved} 件 · 记忆点 ${stats.memories} 个`,
  ];
  const timeline = chronological(d.memories);
  if (timeline.length) {
    out.push("", "—— 时间线（按真实发生顺序） ——");
    timeline.forEach((m) => {
      out.push(...memoryLines(m, d, ""));
    });
  }
  if (d.chapters.length) {
    out.push("", "—— 章节（策展顺序） ——");
    d.chapters.forEach((c, i) => {
      out.push(`章节 ${i + 1} · ${c.title}`);
      const points = chapterPoints(c, d.memories);
      if (!points.length) out.push("  （暂无记忆点）");
      points.forEach((m, j) => out.push(...memoryLines(m, d, `  ${j + 1}.`)));
    });
  }
  const noted = Object.entries(d.notes).filter(([, t]) => t.trim());
  if (noted.length) {
    out.push("", "—— 作品感想 ——");
    noted.forEach(([id, text]) => {
      const a = artworkById(id);
      out.push(
        `${a ? `《${a.title}》/ ${a.artist}` : "（作品已撤展）"}${
          d.favorites.includes(id) ? "" : "（已移出收藏，文字保留）"
        }`,
        `  ${text.trim()}`,
      );
    });
  }
  if (!timeline.length && !noted.length)
    out.push("", "还没有留下足迹。走近一件作品，停留片刻，这里会生长出你的记忆地图。");
  return out.join("\n");
}
