import { useState, useEffect } from "react";
import { loadDocument, saveDocument } from "../../../shared/storage";
import { artworkById } from "../../../shared/catalog";
import type { MemoryPoint } from "../../../shared/types";
let chapterCounter = 0;
const chapterId = () =>
  `c${Date.now().toString(36)}${(chapterCounter++).toString(36)}`;
export function useCollection() {
  const [document, setDocument] = useState(loadDocument);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    setStorageError(!saveDocument(document));
  }, [document]);
  return {
    document,
    storageError,
    toggle: (id: string) =>
      setDocument((d) => ({
        ...d,
        // 只切换收藏标记；记忆点、章节与感想全部保留
        favorites: d.favorites.includes(id)
          ? d.favorites.filter((x) => x !== id)
          : [...d.favorites, id],
      })),
    note: (id: string, text: string) =>
      setDocument((d) => ({ ...d, notes: { ...d.notes, [id]: text } })),
    record: (id: string, seconds: number) => {
      if (!artworkById(id)) return;
      setDocument((d) => {
        const previous = d.visits.find((v) => v.id === id);
        return {
          ...d,
          visits: previous
            ? d.visits.map((v) =>
                v.id === id ? { ...v, seconds: v.seconds + seconds } : v,
              )
            : [...d.visits, { id, seconds, at: Date.now() }],
        };
      });
    },
    /** 记录器提交新记忆点（证据，之后不可改） */
    commitMemory: (point: MemoryPoint) =>
      setDocument((d) => ({ ...d, memories: [...d.memories, point] })),
    /** 记录器让进行中的停留时长增长（只增不减） */
    growMemory: (id: string, seconds: number) =>
      setDocument((d) => ({
        ...d,
        memories: d.memories.map((m) =>
          m.id === id && seconds > m.seconds ? { ...m, seconds } : m,
        ),
      })),
    /** 感想是用户内容，可编辑；其余证据字段不可变 */
    memoryNote: (id: string, text: string) =>
      setDocument((d) => ({
        ...d,
        memories: d.memories.map((m) =>
          m.id === id ? { ...m, note: text } : m,
        ),
      })),
    createChapter: (title: string, pointIds: string[]) =>
      setDocument((d) => ({
        ...d,
        chapters: [
          ...d.chapters,
          {
            id: chapterId(),
            title: title.trim() || `章节 ${d.chapters.length + 1}`,
            pointIds: [...new Set(pointIds)],
          },
        ],
      })),
    renameChapter: (id: string, title: string) =>
      setDocument((d) => ({
        ...d,
        chapters: d.chapters.map((c) =>
          c.id === id ? { ...c, title: title.trim() || c.title } : c,
        ),
      })),
    /** 删除章节只移除引用，记忆点保留在时间线里 */
    deleteChapter: (id: string) =>
      setDocument((d) => ({
        ...d,
        chapters: d.chapters.filter((c) => c.id !== id),
      })),
    /** 把 source 的感受并入 target：合并的是引用列表，证据不变 */
    mergeChapters: (targetId: string, sourceId: string) =>
      setDocument((d) => {
        const target = d.chapters.find((c) => c.id === targetId);
        const source = d.chapters.find((c) => c.id === sourceId);
        if (!target || !source || targetId === sourceId) return d;
        return {
          ...d,
          chapters: d.chapters
            .filter((c) => c.id !== sourceId)
            .map((c) =>
              c.id === targetId
                ? {
                    ...c,
                    pointIds: [
                      ...c.pointIds,
                      ...source.pointIds.filter((p) => !c.pointIds.includes(p)),
                    ],
                  }
                : c,
            ),
        };
      }),
    addToChapter: (chapterId: string, pointId: string) =>
      setDocument((d) => ({
        ...d,
        chapters: d.chapters.map((c) =>
          c.id === chapterId && !c.pointIds.includes(pointId)
            ? { ...c, pointIds: [...c.pointIds, pointId] }
            : c,
        ),
      })),
    removeFromChapter: (chapterId: string, pointId: string) =>
      setDocument((d) => ({
        ...d,
        chapters: d.chapters.map((c) =>
          c.id === chapterId
            ? { ...c, pointIds: c.pointIds.filter((p) => p !== pointId) }
            : c,
        ),
      })),
    /** 章节内重排：只改引用顺序，不改记忆点的真实时间 */
    moveInChapter: (chapterId: string, pointId: string, dir: -1 | 1) =>
      setDocument((d) => ({
        ...d,
        chapters: d.chapters.map((c) => {
          if (c.id !== chapterId) return c;
          const i = c.pointIds.indexOf(pointId);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= c.pointIds.length) return c;
          const pointIds = [...c.pointIds];
          [pointIds[i], pointIds[j]] = [pointIds[j], pointIds[i]];
          return { ...c, pointIds };
        }),
      })),
    moveChapter: (id: string, dir: -1 | 1) =>
      setDocument((d) => {
        const i = d.chapters.findIndex((c) => c.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= d.chapters.length) return d;
        const chapters = [...d.chapters];
        [chapters[i], chapters[j]] = [chapters[j], chapters[i]];
        return { ...d, chapters };
      }),
  };
}
