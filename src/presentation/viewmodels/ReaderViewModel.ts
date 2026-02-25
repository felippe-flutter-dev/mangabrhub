import { useState, useEffect, useCallback, useRef } from "react";
import { Chapter } from "../../domain/models/Chapter";
import { Manga } from "../../domain/models/Manga";
import { chapterRepository, mangaRepository } from "../../app/di";

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

      setTimeout(() => {
        window.dispatchEvent(new Event('chapters_updated'));
      }, 0);
    }
  } catch (err) { /* Erro silencioso */ }
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
  } catch (e) { /* Erro silencioso */ }
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
      // 1. Carregar dados do capítulo via Repositório (Usa Proxy)
      const chapData = await chapterRepository.getChapter(id);
      setChapter(chapData);

      // 2. Carregar páginas via Repositório (Usa Proxy)
      const pageData = await chapterRepository.getChapterPages(id);
      setBaseUrl(pageData.baseUrl);
      setHash(pageData.hash);
      setPages(pageData.pages);
      setCurrentPage(0);

      // 3. Buscar ID do mangá para lógica de navegação e metadados
      // Fazemos uma chamada direta ao endpoint de mangá via repositório para evitar CORS
      // Nota: O MangaDex API retorna os relacionamentos na chamada do capítulo.
      // Precisamos pegar o mangaId para buscar o mangá completo.

      // Como o ChapterRepository.getChapter não retorna os relacionamentos brutos,
      // vamos fazer uma busca rápida do mangá se soubermos o ID.
      // Vou buscar o capítulo novamente via Proxy para extrair o mangaId corretamente.

      const isProd = import.meta.env.PROD;
      const proxyUrl = isProd ? `/api/proxy?path=chapter/${id}&includes[]=manga` : `https://api.mangadex.org/chapter/${id}?includes[]=manga`;

      const response = await fetch(proxyUrl);
      const json = await response.json();
      const mangaRel = json.data.relationships.find((r: any) => r.type === 'manga');

      if (mangaRel) {
        const mId = mangaRel.id;
        const mangaData = await mangaRepository.getMangaById(mId);
        setManga(mangaData);
        markAsCurrentlyReading(mId, id);

        // 4. Buscar próximo capítulo via Proxy
        const feedPath = `manga/${mId}/feed`;
        const feedUrl = isProd
          ? `/api/proxy?path=${feedPath}&translatedLanguage[]=pt-br&translatedLanguage[]=pt&order[chapter]=asc&limit=500`
          : `https://api.mangadex.org/${feedPath}?translatedLanguage[]=pt-br&translatedLanguage[]=pt&order[chapter]=asc&limit=500`;

        const feedRes = await fetch(feedUrl);
        const feedJson = await feedRes.json();
        const allChapters = feedJson.data;
        const currentNum = parseFloat(json.data.attributes.chapter);

        const next = allChapters.find((c: any) => parseFloat(c.attributes.chapter) > currentNum);
        if (next) setNextChapterId(next.id);
      }
    } catch (err) {
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
