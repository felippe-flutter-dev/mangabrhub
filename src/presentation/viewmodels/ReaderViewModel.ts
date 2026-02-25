import { useState, useEffect, useCallback, useRef } from "react";
import { Chapter } from "../../domain/models/Chapter";
import { Manga } from "../../domain/models/Manga";
import { chapterRepository, mangaRepository } from "../../app/di";

// --- HELPERS STORAGE ---

const getReadChapters = (): string[] => {
  try {
    const saved = localStorage.getItem('read_chapters');
    return saved ? JSON.parse(saved) : [];
  } catch (_e) { return []; }
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

      setTimeout(() => {
        window.dispatchEvent(new Event('chapters_updated'));
      }, 0);
    }
  } catch (_err) { /* Erro silencioso */ }
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
  } catch (_e) { /* Erro silencioso */ }
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

  const loadChapter = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    hasMarkedAsReadThisSession.current = false;
    try {
      // 1. Carregar dados do capítulo via Repositório (Usa Proxy na Vercel corretamente)
      const chapData = await chapterRepository.getChapter(id);
      setChapter(chapData);

      // 2. Carregar páginas via Repositório (Usa Proxy na Vercel corretamente)
      const pageData = await chapterRepository.getChapterPages(id);
      setBaseUrl(pageData.baseUrl);
      setHash(pageData.hash);
      setPages(pageData.pages);
      setCurrentPage(0);

      // 3. Buscar metadados do mangá e relacionamentos via Proxy
      const isProd = import.meta.env.PROD;

      // Corrigindo a URL do Proxy: Não passamos '?' dentro do path, mas sim como params normais
      const proxyUrl = isProd
        ? `/api/proxy?path=chapter/${id}&includes[]=manga&includes[]=scanlation_group`
        : `https://api.mangadex.org/chapter/${id}?includes[]=manga&includes[]=scanlation_group`;

      const response = await fetch(proxyUrl);
      const json = await response.json();

      const mangaRel = json.data.relationships.find((r: any) => r.type === 'manga');
      const scanRel = json.data.relationships.find((r: any) => r.type === 'scanlation_group');
      const currentScanName = scanRel?.attributes?.name;

      if (mangaRel) {
        const mId = mangaRel.id;
        const mangaData = await mangaRepository.getMangaById(mId);
        setManga(mangaData);
        markAsCurrentlyReading(mId, id);

        // 4. Buscar próximo capítulo via Proxy
        const feedUrl = isProd
          ? `/api/proxy?path=manga/${mId}/feed&translatedLanguage[]=pt-br&translatedLanguage[]=pt&order[chapter]=asc&limit=500&includes[]=scanlation_group`
          : `https://api.mangadex.org/manga/${mId}/feed?translatedLanguage[]=pt-br&translatedLanguage[]=pt&order[chapter]=asc&limit=500&includes[]=scanlation_group`;

        const feedRes = await fetch(feedUrl);
        const feedJson = await feedRes.json();
        const allChapters = feedJson.data;
        const _currentChapterNum = parseFloat(json.data.attributes.chapter);

        // Lógica de próximo capítulo (mesma lógica do Repository)
        const nextChapters = allChapters.filter((c: any) => parseFloat(c.attributes.chapter) > _currentChapterNum);
        if (nextChapters.length > 0) {
          const minNextNum = Math.min(...nextChapters.map((c: any) => parseFloat(c.attributes.chapter)));
          const candidates = nextChapters.filter((c: any) => parseFloat(c.attributes.chapter) === minNextNum);
          const bestMatch = candidates.find((c: any) =>
            c.relationships.find((r: any) => r.type === 'scanlation_group')?.attributes?.name === currentScanName
          ) || candidates[0];
          setNextChapterId(bestMatch.id);
        }
      }
    } catch (_err) {
      setError("Erro ao carregar o capítulo.");
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
