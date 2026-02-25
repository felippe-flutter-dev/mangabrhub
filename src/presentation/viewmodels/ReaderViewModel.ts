import { useState, useEffect, useCallback, useRef } from "react";
import { Chapter } from "../../domain/models/Chapter";
import { Manga } from "../../domain/models/Manga";
import { ChapterRepository } from "../../data/repositories/ChapterRepository";
import { MangaRepository } from "../../data/repositories/MangaRepository";

// --- HELPERS STORAGE ---

const getReadChapters = (): string[] => {
  try {
    const saved = localStorage.getItem('read_chapters');
    return saved ? JSON.parse(saved) : [];
  } catch (e) { return []; }
};

const markChapterAsRead = (id: string) => {
  if (!id) return;
  try {
    const read = getReadChapters();
    if (!read.includes(id)) {
      read.push(id);
      localStorage.setItem('read_chapters', JSON.stringify(read));

      // Limpeza do "Lendo"
      const reading = JSON.parse(localStorage.getItem('currently_reading') || '{}');
      for (const mId in reading) {
        if (reading[mId] === id) {
          delete reading[mId];
          break;
        }
      }
      localStorage.setItem('currently_reading', JSON.stringify(reading));

      // Disparo assíncrono para evitar conflitos com listeners de extensões
      setTimeout(() => {
        window.dispatchEvent(new Event('chapters_updated'));
      }, 0);
    }
  } catch (err) { /* Erro silencioso em prod */ }
};

const markAsCurrentlyReading = (mangaId: string, chapterId: string) => {
  if (!mangaId || !chapterId) return;
  try {
    const read = getReadChapters();
    if (read.includes(chapterId)) return;

    const reading = JSON.parse(localStorage.getItem('currently_reading') || '{}');
    if (reading[mangaId] !== chapterId) {
      reading[mangaId] = chapterId;
      localStorage.setItem('currently_reading', JSON.stringify(reading));

      setTimeout(() => {
        window.dispatchEvent(new Event('chapters_updated'));
      }, 0);
    }
  } catch (e) { /* Erro silencioso em prod */ }
};

// --- VIEW MODEL ---

export function useReaderViewModel(chapterId: string | undefined) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [manga, setManga] = useState<Manga | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [hash, setHash] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'paged' | 'scroll'>(() =>
    (localStorage.getItem('reader_mode') as any) || 'paged'
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [nextChapterId, setNextChapterId] = useState<string | null>(null);

  const hasMarkedAsReadThisSession = useRef(false);

  const chapterRepository = new ChapterRepository();
  const mangaRepository = new MangaRepository();

  const loadChapter = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    hasMarkedAsReadThisSession.current = false;
    try {
      const chapData = await chapterRepository.getChapter(id);
      setChapter(chapData);

      const pageData = await chapterRepository.getChapterPages(id);
      setBaseUrl(pageData.baseUrl);
      setHash(pageData.hash);
      setPages(pageData.pages);
      setCurrentPage(0);

      const response = await fetch(`https://api.mangadex.org/chapter/${id}?includes[]=manga&includes[]=scanlation_group`);
      const json = await response.json();
      const mangaRel = json.data.relationships.find((r: any) => r.type === 'manga');

      if (mangaRel) {
        const mId = mangaRel.id;
        const mangaData = await mangaRepository.getMangaById(mId);
        setManga(mangaData);

        markAsCurrentlyReading(mId, id);

        const feedRes = await fetch(`https://api.mangadex.org/manga/${mId}/feed?translatedLanguage[]=pt-br&translatedLanguage[]=pt&order[chapter]=asc&limit=500&includes[]=scanlation_group`);
        const feedJson = await feedRes.json();
        const allChapters = feedJson.data;
        const currentNum = parseFloat(json.data.attributes.chapter);

        const next = allChapters.find((c: any) => parseFloat(c.attributes.chapter) > currentNum);
        if (next) setNextChapterId(next.id);
      }
    } catch (err) {
      setError("Erro ao carregar.");
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (chapterId) loadChapter(chapterId);
  }, [chapterId, loadChapter]);

  useEffect(() => {
    if (mode === 'paged' && pages.length > 0 && currentPage === pages.length - 1 && !hasMarkedAsReadThisSession.current) {
      if (chapterId) {
        markChapterAsRead(chapterId);
        hasMarkedAsReadThisSession.current = true;
      }
    }
  }, [currentPage, pages.length, mode, chapterId]);

  const handleMarkAsRead = useCallback(() => {
    if (chapterId && !hasMarkedAsReadThisSession.current) {
       markChapterAsRead(chapterId);
       hasMarkedAsReadThisSession.current = true;
    }
  }, [chapterId]);

  return {
    chapter, manga, pages, loading, error, mode, setMode,
    currentPage, setCurrentPage, nextChapterId,
    constructPageUrl: (p: string) => `${baseUrl}/data/${hash}/${p}`,
    markAsRead: handleMarkAsRead
  };
}
